from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import Optional, List
from app.database import get_db
from app.models import Transaction, Asset, User, MemberBorrowed, Room
from app.schemas import TransactionResponse, ReturnRequest
from app.auth import get_current_admin

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/current", response_model=List[TransactionResponse])
def get_current_transactions(
    search: Optional[str] = Query(None, description="Search by Student ID"),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # Find all transactions that have not been returned yet
    query = db.query(Transaction).filter(Transaction.returned_at == None)
    
    if search:
        query = query.filter(Transaction.user_id.ilike(f"%{search}%"))
        
    transactions = query.options(
        joinedload(Transaction.user),
        joinedload(Transaction.asset).joinedload(Asset.room)
    ).all()
    
    now = datetime.utcnow()
    result = []
    
    for t in transactions:
        result.append(TransactionResponse(
            transaction_id=t.transaction_id,
            user_id=t.user_id,
            student_name=f"{t.user.first_name} {t.user.last_name}" if t.user else "Unknown Student",
            student_email=t.user.email if t.user else "",
            assets_id=t.assets_id,
            assets_name=t.asset.assets_name if t.asset else "Unknown Asset",
            borrowed_at=t.borrowed_at,
            return_deadline=t.return_deadline,
            returned_at=t.returned_at,
            condition_status=t.condition_status,
            proceed_type=t.proceed_type,
            is_overdue=now > t.return_deadline if t.return_deadline else False,
            room_name=t.asset.room.room_name if t.asset and t.asset.room else "Unknown Room"
        ))
        
    return result

@router.put("/{transaction_id}/return", response_model=TransactionResponse)
def return_asset_admin(
    transaction_id: int,
    payload: ReturnRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # 1. Get the transaction
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction record not found"
        )
        
    if transaction.returned_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item has already been returned"
        )

    now = datetime.utcnow()
    
    # 2. Update Transaction record
    transaction.returned_at = now
    transaction.condition_status = payload.condition_status # e.g. ปกติ or ชำรุด
    transaction.proceed_type = "return"
    
    # 3. Update Asset table status
    asset = db.query(Asset).filter(Asset.assets_id == transaction.assets_id).first()
    if asset:
        if payload.condition_status == "ชำรุด":
            asset.status = "ชำรุด"
        else:
            asset.status = "ว่าง"
            
    # 4. Remove active record in MemberBorrowed
    member_borrowed = db.query(MemberBorrowed).filter(
        MemberBorrowed.assets_id == transaction.assets_id,
        MemberBorrowed.user_id == transaction.user_id
    ).first()
    if member_borrowed:
        db.delete(member_borrowed)
        
    db.commit()
    db.refresh(transaction)
    
    return TransactionResponse(
        transaction_id=transaction.transaction_id,
        user_id=transaction.user_id,
        student_name=f"{transaction.user.first_name} {transaction.user.last_name}" if transaction.user else "Unknown Student",
        student_email=transaction.user.email if transaction.user else "",
        assets_id=transaction.assets_id,
        assets_name=transaction.asset.assets_name if transaction.asset else "Unknown Asset",
        borrowed_at=transaction.borrowed_at,
        return_deadline=transaction.return_deadline,
        returned_at=transaction.returned_at,
        condition_status=transaction.condition_status,
        proceed_type=transaction.proceed_type,
        is_overdue=transaction.returned_at > transaction.return_deadline if transaction.return_deadline else False,
        room_name=transaction.asset.room.room_name if transaction.asset and transaction.asset.room else "Unknown Room"
    )

@router.get("/history", response_model=List[TransactionResponse])
def get_transaction_history(
    search: Optional[str] = Query(None, description="Search by Student ID"),
    room_id: Optional[int] = Query(None, description="Filter by Room ID"),
    overdue_only: Optional[bool] = Query(None, description="Show late returns/overdue only"),
    status_filter: Optional[str] = Query("All", description="All, Active, Returned, Damaged"),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    query = db.query(Transaction)
    
    # Preload related entities to optimize queries
    query = query.options(
        joinedload(Transaction.user),
        joinedload(Transaction.asset).joinedload(Asset.room)
    )
    
    # 1. Search by Student ID
    if search:
        query = query.filter(Transaction.user_id.ilike(f"%{search}%"))
        
    # 2. Filter by Room ID (via Asset)
    if room_id is not None:
        query = query.join(Asset).filter(Asset.room_id == room_id)
        
    # 3. Status Filters
    if status_filter == "Returned":
        query = query.filter(Transaction.returned_at != None)
    elif status_filter == "Active":
        query = query.filter(Transaction.returned_at == None)
    elif status_filter == "Damaged":
        query = query.filter(Transaction.condition_status == "ชำรุด")
        
    transactions = query.all()
    now = datetime.utcnow()
    result = []
    
    for t in transactions:
        # Determine if it was late/overdue
        is_overdue = False
        if t.returned_at:
            is_overdue = t.returned_at > t.return_deadline
        else:
            is_overdue = now > t.return_deadline
            
        # Apply late/overdue filter
        if overdue_only is not None and overdue_only != is_overdue:
            continue
            
        result.append(TransactionResponse(
            transaction_id=t.transaction_id,
            user_id=t.user_id,
            student_name=f"{t.user.first_name} {t.user.last_name}" if t.user else "Unknown Student",
            student_email=t.user.email if t.user else "",
            assets_id=t.assets_id,
            assets_name=t.asset.assets_name if t.asset else "Unknown Asset",
            borrowed_at=t.borrowed_at,
            return_deadline=t.return_deadline,
            returned_at=t.returned_at,
            condition_status=t.condition_status,
            proceed_type=t.proceed_type,
            is_overdue=is_overdue,
            room_name=t.asset.room.room_name if t.asset and t.asset.room else "Unknown Room"
        ))
        
    return result
