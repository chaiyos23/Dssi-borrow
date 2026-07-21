from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app.models import Asset, Room
from app.schemas import OverviewStats
from app.auth import get_current_admin

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview", response_model=OverviewStats)
def get_overview_stats(
    room_id: Optional[int] = Query(None, description="Filter statistics by room ID"),
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_admin)
):
    # Query assets
    query = db.query(Asset)
    if room_id is not None:
        query = query.filter(Asset.room_id == room_id)
        
    assets = query.all()
    
    total_assets = len(assets)
    available_assets = sum(1 for a in assets if a.status == "ว่าง")
    borrowed_assets = sum(1 for a in assets if a.status == "ถูกยืม")
    damaged_assets = sum(1 for a in assets if a.status == "ชำรุด")
    
    return OverviewStats(
        total_assets=total_assets,
        available_assets=available_assets,
        borrowed_assets=borrowed_assets,
        damaged_assets=damaged_assets
    )

@router.get("/rooms")
def get_rooms(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    """Helper endpoint to list rooms for filtering dropdowns in Admin Panel."""
    rooms = db.query(Room).all()
    return [{"room_id": r.room_id, "room_name": r.room_name} for r in rooms]
