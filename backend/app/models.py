# ไฟล์นี้นิยามโครงสร้างตารางทั้ง 9 ตาราง (User, Room, Category, Brand, Asset,
# Transaction, DamagedReport, MemberBorrowed, NotificationLog) ด้วย SQLAlchemy ORM
# ทุกคลาสต้องตรงกับตารางจริงใน PostgreSQL เป๊ะๆ และใช้คุยกับฐานข้อมูลโดยตรง
# (db.query(), db.add(), db.commit()) ต่างจาก schemas.py ที่ใช้คุยกับ frontend

from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(String(50), primary_key=True, index=True) # Student ID or Google ID
    email = Column(String(100), unique=True, index=True, nullable=False)
    first_name = Column(String(100), nullable=True)
    last_name = Column(String(100), nullable=True)
    profile_image = Column(Text, nullable=True)
    role = Column(String(20), default="student") # student, admin
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, default=datetime.utcnow)

    # Relationships
    transactions = relationship("Transaction", back_populates="user")
    damaged_reports = relationship("DamagedReport", back_populates="user")
    borrowed_items = relationship("MemberBorrowed", back_populates="user")

class Room(Base):
    __tablename__ = "rooms"

    room_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    room_name = Column(String(50), nullable=False)

    assets = relationship("Asset", back_populates="room")

class Category(Base):
    __tablename__ = "categories"

    category_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category_name = Column(String(100), nullable=False)

    assets = relationship("Asset", back_populates="category")

class Brand(Base):
    __tablename__ = "brands"

    brand_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    brand_name = Column(String(100), nullable=False)

    assets = relationship("Asset", back_populates="brand")

class Asset(Base):
    __tablename__ = "assets"

    assets_id = Column(String(255), primary_key=True, index=True) # e.g. IT-DELL-01
    assets_name = Column(String(100), nullable=False)
    image_url = Column(Text, nullable=True)
    brand_id = Column(Integer, ForeignKey("brands.brand_id"), nullable=True)
    QRcode = Column(String(255), nullable=True)
    room_id = Column(Integer, ForeignKey("rooms.room_id"), nullable=True)
    category_id = Column(Integer, ForeignKey("categories.category_id"), nullable=True)
    status = Column(String(50), default="ว่าง") # ว่าง, ถูกยืม, ชำรุด

    # Relationships
    brand = relationship("Brand", back_populates="assets")
    room = relationship("Room", back_populates="assets")
    category = relationship("Category", back_populates="assets")
    transactions = relationship("Transaction", back_populates="asset")
    damaged_reports = relationship("DamagedReport", back_populates="asset")
    borrowed_items = relationship("MemberBorrowed", back_populates="asset")

class Transaction(Base):
    __tablename__ = "transactions"

    transaction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(String(50), ForeignKey("users.user_id"), nullable=False)
    assets_id = Column(String(255), ForeignKey("assets.assets_id"), nullable=False)
    borrowed_at = Column(DateTime, default=datetime.utcnow)
    return_deadline = Column(DateTime, nullable=False)
    returned_at = Column(DateTime, nullable=True)
    condition_status = Column(String(50), nullable=True) # ปกติ, ชำรุด (at return)
    proceed_type = Column(String(20), default="borrow") # borrow, return

    # Relationships
    user = relationship("User", back_populates="transactions")
    asset = relationship("Asset", back_populates="transactions")

class DamagedReport(Base):
    __tablename__ = "damaged_reports"

    report_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assets_id = Column(String(255), ForeignKey("assets.assets_id"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.user_id"), nullable=False)
    issue_description = Column(Text, nullable=False)
    reported_at = Column(DateTime, default=datetime.utcnow)
    repair_status = Column(String(50), default="Pending") # Pending, Repairing, Fixed

    # Relationships
    asset = relationship("Asset", back_populates="damaged_reports")
    user = relationship("User", back_populates="damaged_reports")

class MemberBorrowed(Base):
    __tablename__ = "member_borrowed"

    borrow_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    assets_id = Column(String(255), ForeignKey("assets.assets_id"), nullable=False)
    user_id = Column(String(50), ForeignKey("users.user_id"), nullable=False)
    borrowed_at = Column(DateTime, default=datetime.utcnow)
    return_deadline = Column(DateTime, nullable=False)

    # Relationships
    asset = relationship("Asset", back_populates="borrowed_items")
    user = relationship("User", back_populates="borrowed_items")

class NotificationLog(Base):
    __tablename__ = "notification_logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    transaction_id = Column(Integer, ForeignKey("transactions.transaction_id"), nullable=False)
    sent_at = Column(DateTime, nullable=True)

    # Relationships
    transaction = relationship("Transaction")
