# ไฟล์นี้คือศูนย์กลางการเชื่อมต่อฐานข้อมูล: สร้าง engine (ท่อเชื่อม PostgreSQL),
# SessionLocal (โรงงานสร้าง session ใหม่ทุก request), Base (คลาสแม่ของทุกตารางใน models.py)
# และ get_db() ที่ทุก router เรียกผ่าน Depends() เพื่อยืม session มาใช้แล้วปิดทิ้งอัตโนมัติ

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Adjust engine parameters based on database type (e.g. SQLite requires special connect args)
connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(          # "ท่อเชื่อม" ไปหา PostgreSQL จริง ตาม DATABASE_URL จาก .env
    settings.DATABASE_URL, connect_args=connect_args
)
# "โรงงานสร้าง session ใหม่": เรียก SessionLocal() ทีไร ได้ session ใหม่ 1 อัน
# autocommit=False -> ต้องสั่ง db.commit() เองเสมอ ไม่บันทึกอัตโนมัติ
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()  # คลาสแม่ที่ทุกตารางใน models.py ต้องสืบทอด (class User(Base): ...)

def get_db():
    db = SessionLocal()   # หยิบ session ใหม่มาใช้ (เฉพาะ request นี้เท่านั้น)
    try:
        yield db          # ส่ง session ให้ endpoint ที่เรียกผ่าน Depends(get_db) ไปใช้งาน
    finally:
        db.close()        # ปิด session ทิ้งเสมอ ไม่ว่า endpoint จะสำเร็จหรือ error
