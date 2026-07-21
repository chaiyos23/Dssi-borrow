from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.header import Header
from typing import List
from app.database import get_db
from app.models import Transaction, NotificationLog, User, Asset
from app.schemas import OverdueItem, NotificationLogResponse, WarnRequest
from app.config import settings
from app.auth import get_current_admin

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("/overdue", response_model=List[OverdueItem])
def get_overdue_transactions(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    now = datetime.utcnow()
    # Query transactions that have not been returned and the deadline has passed
    overdue_txs = db.query(Transaction).filter(
        Transaction.returned_at == None,
        Transaction.return_deadline < now
    ).options(
        joinedload(Transaction.user),
        joinedload(Transaction.asset)
    ).all()

    result = []
    for tx in overdue_txs:
        days_overdue = (now - tx.return_deadline).days
        result.append(OverdueItem(
            transaction_id=tx.transaction_id,
            user_id=tx.user_id,
            student_name=f"{tx.user.first_name} {tx.user.last_name}" if tx.user else "Unknown Student",
            student_email=tx.user.email if tx.user else "",
            assets_id=tx.assets_id,
            assets_name=tx.asset.assets_name if tx.asset else "Unknown Asset",
            borrowed_at=tx.borrowed_at,
            return_deadline=tx.return_deadline,
            days_overdue=max(1, days_overdue) # Ensure at least 1 day shown if it just passed
        ))
    return result

@router.post("/warn")
def send_overdue_warning(payload: WarnRequest, db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    tx = db.query(Transaction).filter(Transaction.transaction_id == payload.transaction_id).first()
    if not tx:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction record not found"
        )
    
    if tx.returned_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item has already been returned. No notification needed."
        )

    student = tx.user
    asset = tx.asset
    
    if not student or not student.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Student email is not registered. Cannot send email."
        )

    # Compose email
    subject = "แจ้งเตือนเกินกำหนดเวลาการยืมอุปกรณ์ IT DSSI"
    body = f"""เรียน คุณ {student.first_name} {student.last_name},

ระบบยืม-คืนอุปกรณ์ IT DSSI ขอแจ้งเตือนว่าอุปกรณ์ที่คุณยืมได้เกินกำหนดส่งคืนเรียบร้อยแล้ว:

- รายการอุปกรณ์: {asset.assets_name if asset else tx.assets_id} (รหัส: {tx.assets_id})
- วันที่ยืม: {tx.borrowed_at.strftime('%Y-%m-%d %H:%M:%S')}
- กำหนดส่งคืน: {tx.return_deadline.strftime('%Y-%m-%d %H:%M:%S')}

กรุณานำอุปกรณ์ดังกล่าวมาส่งคืนที่ห้องเก็บอุปกรณ์โดยเร็วที่สุด เพื่อหลีกเลี่ยงการถูกปรับหรือระงับสิทธิ์ในการยืมครั้งถัดไป

ขอแสดงความนับถือ,
ผู้ดูแลระบบยืม-คืนอุปกรณ์ IT DSSI
"""

    # Check if SMTP config is available
    email_sent_successfully = False
    if settings.SMTP_HOST and settings.SMTP_USERNAME and settings.SMTP_PASSWORD:
        try:
            msg = MIMEText(body, 'plain', 'utf-8')
            msg['Subject'] = Header(subject, 'utf-8')
            msg['From'] = settings.SMTP_FROM_EMAIL
            msg['To'] = student.email

            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT)
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_FROM_EMAIL, [student.email], msg.as_string())
            server.quit()
            email_sent_successfully = True
            print(f"[SMTP] Warning email successfully sent to {student.email}")
        except Exception as e:
            print(f"[SMTP ERROR] Failed to send email via SMTP server: {str(e)}")
            # Fall back to logging it in terminal console
    
    if not email_sent_successfully:
        # Development Mock Print to Console log
        print("="*60)
        print(f"[MOCK EMAIL ALERT LOGGED] To: {student.email}")
        print(f"Subject: {subject}")
        print(f"Message Body:\n{body}")
        print("="*60)

    # Log the action in database
    log = NotificationLog(
        transaction_id=tx.transaction_id,
        sent_at=datetime.utcnow()
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    return {
        "status": "success",
        "detail": f"Warning sent to {student.email} successfully.",
        "simulated": not email_sent_successfully,
        "log_id": log.log_id
    }

@router.get("/logs", response_model=List[NotificationLogResponse])
def get_notification_logs(db: Session = Depends(get_db), admin: dict = Depends(get_current_admin)):
    logs = db.query(NotificationLog).options(
        joinedload(NotificationLog.transaction).joinedload(Transaction.user),
        joinedload(NotificationLog.transaction).joinedload(Transaction.asset)
    ).order_by(NotificationLog.sent_at.desc()).all()

    result = []
    for l in logs:
        tx = l.transaction
        result.append(NotificationLogResponse(
            log_id=l.log_id,
            transaction_id=l.transaction_id,
            student_id=tx.user_id if tx else "Unknown",
            student_name=f"{tx.user.first_name} {tx.user.last_name}" if tx and tx.user else "Unknown",
            assets_id=tx.assets_id if tx else "Unknown",
            assets_name=tx.asset.assets_name if tx and tx.asset else "Unknown",
            sent_at=l.sent_at
        ))
    return result
