# Module 4 (หลัก): 8 endpoints จัดการรายการยืม-คืนอุปกรณ์
# GET /current, /available-assets, /search-students, /history - อ่านข้อมูลต่างๆ
# POST /borrow - สร้างรายการยืมแทนนักศึกษา (Autocomplete ค้นหานักศึกษา)
# PATCH /{id}/deadline, /{id}/condition - แก้ไขกำหนดคืน/สภาพอุปกรณ์
# PUT /{id}/return - บันทึกการคืนของ (อัปเดต 3 ตาราง: transactions, assets, member_borrowed)

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone
from typing import Optional, List
from app.database import get_db
from app.models import Transaction, Asset, User, MemberBorrowed, Room, DamagedReport
from app.schemas import TransactionResponse, ReturnRequest, ManualBorrowRequest, AvailableAssetSchema, StudentSearchResult, UpdateDeadlineRequest, UpdateConditionRequest
from app.auth import get_current_admin

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("/current", response_model=List[TransactionResponse])
def get_current_transactions(
    search: Optional[str] = Query(None, description="Search by Student ID"),  # Query Parameter: ไม่บังคับ (None = ไม่กรอง)
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # Find all transactions that have not been returned yet
    query = db.query(Transaction).filter(Transaction.returned_at == None)   # returned_at ว่าง = ยังไม่คืน

    if search:
        # .ilike() = ค้นแบบไม่สนตัวพิมพ์เล็ก-ใหญ่ + % ครอบไว้ = หาเจอแม้พิมพ์แค่บางส่วนของรหัส
        query = query.filter(Transaction.user_id.ilike(f"%{search}%"))   # ต้อง reassign เพราะ .filter() ไม่แก้ query เดิม สร้างใหม่คืนมา
        
    transactions = query.options(
        joinedload(Transaction.user),                              # ดึงข้อมูล user มาด้วยในเที่ยวเดียว
        joinedload(Transaction.asset).joinedload(Asset.room)        # กัน N+1 query (ไม่ต้องวิ่งไปถามทีละแถว)
    ).all()   # .all() = เอาทุกแถวที่เจอ (ต่าง .first() ที่เอาแค่แถวแรก)

    now = datetime.utcnow()
    result = []

    for t in transactions:   # วนประกอบ Schema ขาออกทีละแถว เพราะ field ต้องผสมจากหลายตาราง (user, asset, room)
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

@router.get("/available-assets", response_model=List[AvailableAssetSchema])
def get_available_assets(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    # ไม่มี Path/Query param เลย เพราะไม่ต้องรู้ว่าดูของรายการไหน แค่ขอ "ทั้งหมดที่ว่าง"
    # Assets currently free to be lent out (used to populate the manual borrow dropdown)
    # return ตรงๆ ได้เพราะชื่อ field ใน AvailableAssetSchema ตรงกับ Asset model เป๊ะ (from_attributes=True)
    return db.query(Asset).filter(Asset.status == "ว่าง").all()

@router.get("/search-students", response_model=List[StudentSearchResult])
def search_students(
    q: str = Query(..., min_length=1),   # "..." = บังคับต้องมี ห้ามว่าง (ต่างจาก Query(None, ...) ของ /current)
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # Search-as-you-type lookup for the manual borrow dialog, since a student's
    # user_id is derived from their real email prefix and can't be guessed/typed reliably
    return db.query(User).filter(
        User.role == "student",            # กันไม่ให้แอดมินโผล่มาเป็นตัวเลือก (AND กับเงื่อนไขถัดไป)
        User.user_id.ilike(f"%{q}%")
    ).limit(10).all()   # จำกัดแค่ 10 คนแรก กัน dropdown ยาวเกินไป

@router.post("/borrow", response_model=TransactionResponse)
def create_manual_borrow(
    payload: ManualBorrowRequest,   # Schema ขาเข้า: user_id, assets_id, return_deadline (ตรวจชนิดอัตโนมัติ)
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # For when a student walks up and borrows in person but forgot to scan the QR code
    # เช็คว่า "คนมีจริงไหม" ก่อน (อ่านอย่างเดียว คนละตารางกับที่จะสร้างแถวใหม่)
    user = db.query(User).filter(User.user_id == payload.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบรหัสนักศึกษานี้ในระบบ (นักศึกษาต้องเคยล็อกอินเข้าระบบอย่างน้อยหนึ่งครั้ง)"
        )

    asset = db.query(Asset).filter(Asset.assets_id == payload.assets_id).first()
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบรหัสอุปกรณ์นี้ในระบบ"
        )

    if asset.status != "ว่าง":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"อุปกรณ์นี้ไม่สามารถให้ยืมได้ในขณะนี้ (สถานะปัจจุบัน: {asset.status})"
        )

    now = datetime.utcnow()
    return_deadline = payload.return_deadline
    if return_deadline.tzinfo is not None:
        # Browsers send Date.toISOString() (UTC, offset-aware); the rest of this
        # codebase stores naive UTC timestamps, so normalize before comparing/storing.
        return_deadline = return_deadline.astimezone(timezone.utc).replace(tzinfo=None)

    if return_deadline <= now:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="กำหนดส่งคืนต้องเป็นเวลาในอนาคต"
        )

    # CREATE: สร้างแถวใหม่ในตาราง transactions (ประวัติถาวร)
    transaction = Transaction(
        user_id=payload.user_id,
        assets_id=payload.assets_id,
        borrowed_at=now,
        return_deadline=return_deadline,
        proceed_type="borrow"
    )
    db.add(transaction)   # วางบนโต๊ะ ยังไม่บันทึกจริง

    asset.status = "ถูกยืม"   # UPDATE: แก้สถานะอุปกรณ์ในตาราง assets

    # CREATE: สร้างแถวคู่กันในตาราง member_borrowed ("กระจก" บอกว่าใครกำลังยืมอะไรอยู่ตอนนี้)
    db.add(MemberBorrowed(
        user_id=payload.user_id,
        assets_id=payload.assets_id,
        borrowed_at=now,
        return_deadline=return_deadline
    ))

    db.commit()        # ประทับตรา บันทึกทั้ง 3 ตารางพร้อมกันแบบถาวร
    db.refresh(transaction)   # อ่านค่าล่าสุดจาก DB กลับมาใส่ตัวแปร ก่อนเอาไปสร้าง response

    return TransactionResponse(
        transaction_id=transaction.transaction_id,
        user_id=transaction.user_id,
        student_name=f"{user.first_name} {user.last_name}",
        student_email=user.email,
        assets_id=transaction.assets_id,
        assets_name=asset.assets_name,
        borrowed_at=transaction.borrowed_at,
        return_deadline=transaction.return_deadline,
        returned_at=transaction.returned_at,
        condition_status=transaction.condition_status,
        proceed_type=transaction.proceed_type,
        is_overdue=False,
        room_name=asset.room.room_name if asset.room else "Unknown Room"
    )

@router.patch("/{transaction_id}/deadline", response_model=TransactionResponse)
def update_deadline(
    transaction_id: int,              # Path Parameter: มาจาก {transaction_id} ใน URL
    payload: UpdateDeadlineRequest,   # Request Body: { return_deadline: ... }
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # For when a student asks to extend their return deadline

    # ขั้นที่ 1: ไปที่ตาราง transactions "หยิบแถว" ที่ id ตรงกันออกมา
    # ตัวแปร transaction ตอนนี้ = ตัวแทนของแถวจริงในฐานข้อมูล (ไม่ใช่สำเนา)
    transaction = db.query(Transaction).options(
        joinedload(Transaction.user),
        joinedload(Transaction.asset).joinedload(Asset.room)
    ).filter(Transaction.transaction_id == transaction_id).first()

    # ขั้นที่ 2: เช็คก่อนว่า "มีแถวนี้จริงไหม" ต้องเช็คอันนี้ก่อน ไม่งั้นบรรทัดถัดไปที่เปิดดู
    # transaction.returned_at จะพังทันทีถ้า transaction เป็น None
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ไม่พบรายการยืมนี้")

    # ขั้นที่ 3: เช็ค business rule - ถ้าคืนไปแล้ว ห้ามแก้ไขกำหนดคืนอีก (ไม่มีความหมายแล้ว)
    if transaction.returned_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ไม่สามารถแก้ไขกำหนดส่งคืนของรายการที่คืนแล้ว"
        )

    # ขั้นที่ 4: ถอดป้าย timezone ออกจากค่าที่ frontend ส่งมา (เป็น UTC ที่มีป้ายติด)
    # ให้กลายเป็น naive datetime เหมือน transaction.borrowed_at (สร้างจาก datetime.utcnow())
    # ถ้าไม่ถอดป้ายก่อน เทียบกันตรงๆ ด้วย <= จะ error ทันที (ห้ามเทียบ aware กับ naive)
    new_deadline = payload.return_deadline
    if new_deadline.tzinfo is not None:
        new_deadline = new_deadline.astimezone(timezone.utc).replace(tzinfo=None)

    # ขั้นที่ 5: เช็ค business rule อีกข้อ - วันคืนใหม่ต้องอยู่หลังวันที่ยืมเสมอ
    if new_deadline <= transaction.borrowed_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="กำหนดส่งคืนใหม่ต้องมากกว่าวันที่ยืม"
        )

    # ขั้นที่ 6: แก้ไขค่า "ในความจำ" เท่านั้น ยังไม่บันทึกลงฐานข้อมูลจริง
    # เหมือนหยิบกล่องออกมาจากตู้ แล้วขีดฆ่าเขียนทับกระดาษในกล่อง แต่ยังไม่เอากลับเข้าตู้
    # ไม่ต้อง db.add() เพราะแถวนี้มีอยู่แล้วในฐานข้อมูล (ต่างจากตอนสร้างแถวใหม่ที่ต้อง db.add() เสมอ)
    transaction.return_deadline = new_deadline

    # ขั้นที่ 7: ตาราง member_borrowed เก็บ return_deadline ซ้ำไว้อีกชุด (คนละแถวกับ transactions)
    # เพราะไม่มี transaction_id เก็บอยู่ในตารางนี้ ต้องค้นด้วยคู่ assets_id + user_id แทน
    member_borrowed = db.query(MemberBorrowed).filter(
        MemberBorrowed.assets_id == transaction.assets_id,
        MemberBorrowed.user_id == transaction.user_id
    ).first()
    if member_borrowed:
        # แก้ "ในความจำ" อีกตัวหนึ่ง เพื่อให้ sync กับ transaction ที่เพิ่งแก้ไป
        # กันไม่ให้ 2 ตารางมีค่า return_deadline ไม่ตรงกัน
        member_borrowed.return_deadline = new_deadline

    # ขั้นที่ 8: ตรงนี้แหละที่ "เอากล่องทั้งสองใบกลับเข้าตู้" บันทึกถาวรลง PostgreSQL จริง
    # ทั้ง transaction และ member_borrowed ถูกบันทึกพร้อมกันในทีเดียว (all-or-nothing)
    db.commit()
    # อ่านค่าล่าสุดจาก DB กลับมาใส่ตัวแปร transaction อีกที ก่อนเอาไปสร้าง response ขั้นถัดไป
    db.refresh(transaction)

    now = datetime.utcnow()
    return TransactionResponse(   # Schema ขาออก: ประกอบเองทีละ field เพราะผสมข้อมูลจากหลายตาราง
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
        is_overdue=now > transaction.return_deadline if transaction.return_deadline else False,
        room_name=transaction.asset.room.room_name if transaction.asset and transaction.asset.room else "Unknown Room"
    )

@router.put("/{transaction_id}/return", response_model=TransactionResponse)   # PUT เพราะเป็นการแก้ไขรายการที่มีอยู่แล้วทั้งก้อน
def return_asset_admin(
    transaction_id: int,
    payload: ReturnRequest,   # Schema ขาเข้า มีแค่ field เดียว: condition_status
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # 1. Get the transaction
    transaction = db.query(Transaction).filter(Transaction.transaction_id == transaction_id).first()
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ไม่พบรายการยืมนี้"
        )

    if transaction.returned_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="อุปกรณ์นี้ถูกคืนไปแล้ว"
        )

    # ถ้าคืนมาแบบชำรุด บังคับต้องระบุสาเหตุด้วยเสมอ
    if payload.condition_status == "ชำรุด" and not (payload.issue_description and payload.issue_description.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="กรุณาระบุสาเหตุความเสียหายเมื่อคืนอุปกรณ์ในสภาพชำรุด"
        )

    now = datetime.utcnow()

    # 2. Update Transaction record (UPDATE)
    transaction.returned_at = now
    transaction.condition_status = payload.condition_status # e.g. ปกติ or ชำรุด
    transaction.proceed_type = "return"

    # 3. Update Asset table status (UPDATE อีกตารางหนึ่ง)
    asset = db.query(Asset).filter(Asset.assets_id == transaction.assets_id).first()
    if asset:
        if payload.condition_status == "ชำรุด":
            asset.status = "ชำรุด"
        else:
            asset.status = "ว่าง"

    # 3b. Log damage report (CREATE - เก็บสาเหตุความเสียหายไว้เป็นประวัติแยกจาก transactions)
    if payload.condition_status == "ชำรุด":
        db.add(DamagedReport(
            assets_id=transaction.assets_id,
            user_id=transaction.user_id,
            issue_description=payload.issue_description.strip(),
            reported_at=now
        ))

    # 4. Remove active record in MemberBorrowed (DELETE - คืนแล้วไม่ต้องนับว่า "กำลังยืม" อีกต่อไป)
    member_borrowed = db.query(MemberBorrowed).filter(
        MemberBorrowed.assets_id == transaction.assets_id,
        MemberBorrowed.user_id == transaction.user_id
    ).first()
    if member_borrowed:
        db.delete(member_borrowed)

    db.commit()        # บันทึกการเปลี่ยนแปลงทั้ง 3 ตาราง (U, U, D) พร้อมกันในทีเดียว
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

@router.patch("/{transaction_id}/condition", response_model=TransactionResponse)
def update_condition(
    transaction_id: int,
    payload: UpdateConditionRequest,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # For when an admin misjudged the equipment's condition at return time
    if payload.condition_status not in ("ปกติ", "ชำรุด"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="condition_status ต้องเป็น 'ปกติ' หรือ 'ชำรุด' เท่านั้น"
        )

    transaction = db.query(Transaction).options(
        joinedload(Transaction.user),
        joinedload(Transaction.asset).joinedload(Asset.room)
    ).filter(Transaction.transaction_id == transaction_id).first()

    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ไม่พบรายการยืมนี้")

    if transaction.returned_at is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="แก้ไขสภาพการใช้งานได้เฉพาะรายการที่คืนแล้วเท่านั้น"
        )

    # ถ้าแก้เป็นชำรุด บังคับต้องระบุสาเหตุด้วยเสมอ
    if payload.condition_status == "ชำรุด" and not (payload.issue_description and payload.issue_description.strip()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="กรุณาระบุสาเหตุความเสียหายเมื่อตั้งสถานะเป็นชำรุด"
        )

    asset = transaction.asset

    if payload.condition_status == "ปกติ":
        # Only free the asset up if it isn't currently out on a different, still-active loan
        # เช็คก่อนแก้ กันเคสแอดมินเผลอทำอุปกรณ์ที่กำลังถูกยืมอยู่ (รายการอื่น) กลายเป็น "ว่าง" ผิดๆ
        active_elsewhere = db.query(Transaction).filter(
            Transaction.assets_id == transaction.assets_id,
            Transaction.returned_at == None,
            Transaction.transaction_id != transaction.transaction_id
        ).first()
        if active_elsewhere:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="ไม่สามารถเปลี่ยนสถานะอุปกรณ์เป็นว่างได้ เพราะอุปกรณ์นี้กำลังถูกยืมอยู่ในรายการอื่น"
            )

    transaction.condition_status = payload.condition_status
    if asset:
        asset.status = "ชำรุด" if payload.condition_status == "ชำรุด" else "ว่าง"

    # Log damage report (CREATE - เก็บสาเหตุความเสียหายไว้เป็นประวัติแยกจาก transactions)
    if payload.condition_status == "ชำรุด":
        db.add(DamagedReport(
            assets_id=transaction.assets_id,
            user_id=transaction.user_id,
            issue_description=payload.issue_description.strip(),
            reported_at=datetime.utcnow()
        ))

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
    # ทั้ง 4 ตัวนี้เป็น Query Parameter ทั้งหมด ไม่บังคับ (filter ได้หลายอย่างพร้อมกัน)
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
