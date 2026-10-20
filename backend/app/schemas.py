# ไฟล์นี้เป็นด่านตรวจข้อมูลเข้า-ออกทุก endpoint ด้วย Pydantic (BaseModel)
# "Schema ขาเข้า" ตรวจ Request Body ก่อนให้โค้ด backend รัน (เช่น ManualBorrowRequest)
# "Schema ขาออก" กรองว่าส่งอะไรกลับไปหา frontend ได้บ้าง (เช่น TransactionResponse)
# คนละเรื่องกับ models.py ที่นิยามตารางจริงในฐานข้อมูล

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

# User Schemas
class UserBase(BaseModel):
    user_id: str
    email: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_image: Optional[str] = None
    role: str

class UserCreate(UserBase):
    pass

class UserResponse(UserBase):
    created_at: datetime
    last_login: datetime

    class Config:
        from_attributes = True

# Token Schemas
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str
    name: str

class GoogleLoginRequest(BaseModel):
    token: str  # Google ID token or dummy/mock token for testing

# Supporting structures
class RoomSchema(BaseModel):
    room_id: int
    room_name: str
    class Config:
        from_attributes = True

class CategorySchema(BaseModel):
    category_id: int
    category_name: str
    class Config:
        from_attributes = True

class BrandSchema(BaseModel):
    brand_id: int
    brand_name: str
    class Config:
        from_attributes = True

class AssetSchema(BaseModel):
    assets_id: str
    assets_name: str
    image_url: Optional[str] = None
    brand_name: Optional[str] = None
    QRcode: Optional[str] = None
    room_name: Optional[str] = None
    category_name: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

# Transaction Schemas
class TransactionResponse(BaseModel):
    transaction_id: int
    user_id: str
    student_name: str
    student_email: str
    assets_id: str
    assets_name: str
    borrowed_at: datetime
    return_deadline: datetime
    returned_at: Optional[datetime] = None
    condition_status: Optional[str] = None
    proceed_type: str
    is_overdue: bool
    room_name: Optional[str] = None

    class Config:
        from_attributes = True

class ReturnRequest(BaseModel):
    condition_status: str # ปกติ, ชำรุด
    issue_description: Optional[str] = None # บังคับกรอกถ้า condition_status เป็น "ชำรุด"

class ManualBorrowRequest(BaseModel):
    user_id: str
    assets_id: str
    return_deadline: datetime

class UpdateDeadlineRequest(BaseModel):
    return_deadline: datetime

class UpdateConditionRequest(BaseModel):
    condition_status: str # ปกติ, ชำรุด
    issue_description: Optional[str] = None # บังคับกรอกถ้า condition_status เป็น "ชำรุด"

class AvailableAssetSchema(BaseModel):
    assets_id: str
    assets_name: str

    class Config:
        from_attributes = True

class StudentSearchResult(BaseModel):
    user_id: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: str

    class Config:
        from_attributes = True

# Overview Analytics
class OverviewStats(BaseModel):
    total_assets: int
    available_assets: int
    borrowed_assets: int
    damaged_assets: int

# Module 5: Overdue Notifications
class OverdueItem(BaseModel):
    transaction_id: int
    user_id: str
    student_name: str
    student_email: str
    assets_id: str
    assets_name: str
    borrowed_at: datetime
    return_deadline: datetime
    days_overdue: int

    class Config:
        from_attributes = True

class WarnRequest(BaseModel):
    transaction_id: int

class NotificationLogResponse(BaseModel):
    log_id: int
    transaction_id: int
    student_id: str
    student_name: str
    assets_id: str
    assets_name: str
    sent_at: Optional[datetime] = None

    class Config:
        from_attributes = True
