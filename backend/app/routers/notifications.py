# Module 5 (Overdue Notifications): 4 endpoints
# GET /overdue - รายการที่เกินกำหนดคืน (returned_at ว่าง + เลย deadline)
# POST /warn - ส่งอีเมลทวง (mock-print ลง console ถ้ายังไม่ตั้งค่า SMTP จริง) + บันทึก log
# GET /logs - ดูประวัติการแจ้งเตือนที่เคยส่งไปแล้ว
# DELETE /logs/{id} - ลบ log ที่ผิดพลาด/ซ้ำ

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
from typing import List
import smtplib
from email.mime.text import MIMEText
from email.header import Header

from app.database import get_db
from app.models import Transaction, NotificationLog, User, Asset
from app.schemas import OverdueItem, NotificationLogResponse, WarnRequest
from app.config import settings
from app.auth import get_current_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/overdue", response_model=List[OverdueItem])
def get_overdue_transactions(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    now = datetime.utcnow()
    transactions = db.query(Transaction).filter(
        Transaction.returned_at == None,       # ยังไม่คืน
        Transaction.return_deadline < now      # และเลยกำหนดแล้ว (2 เงื่อนไข AND)
    ).options(
        joinedload(Transaction.user),
        joinedload(Transaction.asset)
    ).all()

    result = []
    for t in transactions:
        days_overdue = max(1, (now - t.return_deadline).days)   # คำนวณสดๆ ไม่มีคอลัมน์นี้ใน DB เลย
        result.append(OverdueItem(
            transaction_id=t.transaction_id,
            user_id=t.user_id,
            student_name=f"{t.user.first_name} {t.user.last_name}" if t.user else "Unknown Student",
            student_email=t.user.email if t.user else "",
            assets_id=t.assets_id,
            assets_name=t.asset.assets_name if t.asset else "Unknown Asset",
            borrowed_at=t.borrowed_at,
            return_deadline=t.return_deadline,
            days_overdue=days_overdue
        ))
    return result

@router.post("/warn")
def send_overdue_warning(payload: WarnRequest, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    transaction = db.query(Transaction).filter(Transaction.transaction_id == payload.transaction_id).first()
    if not transaction:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ไม่พบรายการยืมนี้")

    if transaction.returned_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="อุปกรณ์นี้ถูกคืนไปแล้ว ไม่จำเป็นต้องแจ้งเตือน")

    student = db.query(User).filter(User.user_id == transaction.user_id).first()
    if not student or not student.email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="นักศึกษาคนนี้ไม่มีอีเมลในระบบ ไม่สามารถส่งแจ้งเตือนได้")

    asset = db.query(Asset).filter(Asset.assets_id == transaction.assets_id).first()
    assets_name = asset.assets_name if asset else "Unknown Asset"

    subject = "แจ้งเตือนเกินกำหนดเวลาการยืมอุปกรณ์ IT DSSI"
    body = f"""เรียน คุณ {student.first_name} {student.last_name},

ระบบยืม-คืนอุปกรณ์ IT DSSI ขอแจ้งเตือนว่าอุปกรณ์ที่คุณยืมได้เกินกำหนดส่งคืนเรียบร้อยแล้ว:

- รายการอุปกรณ์: {assets_name} (รหัส: {transaction.assets_id})
- วันที่ยืม: {transaction.borrowed_at.strftime('%Y-%m-%d %H:%M:%S')}
- กำหนดส่งคืน: {transaction.return_deadline.strftime('%Y-%m-%d %H:%M:%S')}

กรุณานำอุปกรณ์ดังกล่าวมาส่งคืนที่ห้องเก็บอุปกรณ์โดยเร็วที่สุด เพื่อหลีกเลี่ยงการถูกปรับหรือระงับสิทธิ์ในการยืมครั้งถัดไป

ขอแสดงความนับถือ,
ผู้ดูแลระบบยืม-คืนอุปกรณ์ IT DSSI"""

    email_sent_successfully = False
    if settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:   # เช็คว่าตั้งค่า SMTP ครบจริงไหมก่อนลองส่งจริง
        try:
            msg = MIMEText(body, "plain", "utf-8")
            msg["Subject"] = Header(subject, "utf-8")
            msg["From"] = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
            msg["To"] = student.email

            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()
                server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
                server.sendmail(msg["From"], [student.email], msg.as_string())
            email_sent_successfully = True
        except Exception as e:
            print(f"[SMTP ERROR] Failed to send email via SMTP server: {e}")

    if not email_sent_successfully:   # SMTP ไม่ครบ หรือส่งจริงพลาด -> mock-print ลง console แทน
        print("=" * 60)
        print("[MOCK EMAIL ALERT LOGGED]")
        print(f"To: {student.email}")
        print(f"Subject: {subject}")
        print("Message Body:")
        print(body)
        print("=" * 60)

    # บันทึก log ไม่ว่าจะส่งจริงหรือ mock ก็ตาม เพื่อให้มีประวัติว่า "เคยแจ้งเตือนไปแล้ว"
    log = NotificationLog(transaction_id=transaction.transaction_id, sent_at=datetime.utcnow())
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "status": "success",
        "detail": f"ส่งการแจ้งเตือนไปยัง {student.email} เรียบร้อยแล้ว",
        "simulated": not email_sent_successfully,   # true = เป็นแค่ mock ไม่ได้ส่งอีเมลจริง
        "log_id": log.log_id
    }

@router.get("/logs", response_model=List[NotificationLogResponse])
def get_notification_logs(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    logs = db.query(NotificationLog).options(
        joinedload(NotificationLog.transaction).joinedload(Transaction.user),
        joinedload(NotificationLog.transaction).joinedload(Transaction.asset)
    ).order_by(NotificationLog.sent_at.desc()).all()   # ล่าสุดขึ้นก่อน

    result = []
    for log in logs:
        t = log.transaction
        result.append(NotificationLogResponse(
            log_id=log.log_id,
            transaction_id=log.transaction_id,
            student_id=t.user_id if t else "",
            student_name=f"{t.user.first_name} {t.user.last_name}" if t and t.user else "Unknown Student",
            assets_id=t.assets_id if t else "",
            assets_name=t.asset.assets_name if t and t.asset else "Unknown Asset",
            sent_at=log.sent_at
        ))
    return result

@router.delete("/logs/{log_id}")   # DELETE endpoint ตรงๆ ตัวเดียวในระบบ (ที่เหลือ delete เป็น side-effect ของ endpoint อื่น)
def delete_notification_log(log_id: int, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    log = db.query(NotificationLog).filter(NotificationLog.log_id == log_id).first()
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="ไม่พบประวัติการแจ้งเตือนนี้")

    db.delete(log)   # ลบจริงจากฐานข้อมูล ถาวร กู้คืนไม่ได้
    db.commit()

    return {"status": "success", "detail": "ลบประวัติการแจ้งเตือนเรียบร้อยแล้ว"}
