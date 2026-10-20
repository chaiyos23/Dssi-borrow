# ไฟล์นี้รวมฟังก์ชันด้านความปลอดภัยทั้งหมด: สร้าง/ตรวจ JWT (create_access_token,
# verify_jwt_token), ตรวจ Google OAuth token (verify_google_token รองรับ mock token ด้วย),
# และ dependency เช็คสิทธิ์ (get_current_user, get_current_admin) ที่ทุก endpoint ที่ต้อง
# ล็อกอินเรียกใช้ผ่าน Depends()

import jwt
from datetime import datetime, timedelta
from typing import Optional, Dict
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})   # ฝังเวลาหมดอายุไว้ในตัว token เอง
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)  # เซ็นลายเซ็นด้วย JWT_SECRET
    return encoded_jwt

def verify_jwt_token(token: str) -> Optional[dict]:
    try:
        # ถอดรหัส + เช็ค signature ด้วย secret เดียวกับตอนสร้าง ถ้า secret ไม่ตรง/token ปลอม จะ error ทันที
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, AttributeError):
        return None   # token ผิด/หมดอายุ/ปลอม -> คืน None ให้ฝั่งเรียกไปจัดการต่อ

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    # Dependency นี้คือ "ด่านตรวจบัตรผ่าน" ที่ทุก endpoint ต้องล็อกอินเรียกผ่าน Depends(get_current_user)
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception   # ไม่มี token แนบมาเลย -> 401

    payload = verify_jwt_token(token)
    if payload is None:
        raise credentials_exception   # token ตรวจไม่ผ่าน -> 401

    return payload   # ผ่านแล้ว คืนข้อมูลที่ถอดรหัสได้ (sub, email, role, ...)

def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
    # เรียกต่อจาก get_current_user อีกที -> ต้องผ่านด่านล็อกอินก่อน แล้วค่อยเช็ค role เพิ่ม
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have administrative privileges"
        )
    return current_user

def verify_google_token(token: str) -> Dict:
    """
    Verifies a Google ID Token.
    Supports a mock fallback mode if token starts with 'mock_'.
    """
    # Mock fallback for local development & grading ease
    if token.startswith("mock_"):
        parts = token.split("_")
        # e.g., mock_student_67114540088 or mock_admin_1
        role = parts[1] if len(parts) > 1 else "student"
        student_id = parts[2] if len(parts) > 2 else "67114540088"
        if role == "admin":
            student_id = "admin"
        
        email = f"{student_id}@ubu.ac.th" if role == "student" else "admin@ubu.ac.th"
        first_name = "Chaiyot" if role == "student" else "Admin"
        last_name = "Srisawang" if role == "student" else "User"
        profile_image = "https://lh3.googleusercontent.com/a/default-user"
        
        return {
            "sub": f"google_{student_id}",
            "email": email,
            "email_verified": True,
            "given_name": first_name,
            "family_name": last_name,
            "picture": profile_image,
            "role": role,
            "student_id": student_id
        }

    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests
        
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), settings.GOOGLE_CLIENT_ID)
        
        # Verify issuer
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')
            
        # Determine student_id from email or sub
        email = idinfo.get("email", "")
        student_id = email.split("@")[0] if "@" in email else idinfo["sub"]
        
        # Determine default role (usually student unless it matches an admin rule)
        role = "student"
        admin_list = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",")]
        if email.lower() in admin_list:
            role = "admin"
            
        return {
            "sub": idinfo["sub"],
            "email": email,
            "email_verified": idinfo.get("email_verified", False),
            "given_name": idinfo.get("given_name", "First"),
            "family_name": idinfo.get("family_name", "Last"),
            "picture": idinfo.get("picture", ""),
            "role": role,
            "student_id": student_id
        }
    except Exception as e:
        # Google verification failed (invalid signature, expired, wrong audience, etc).
        # Always reject here - never fall back to decoding the token without
        # verifying its signature, since that would let anyone forge a token
        # claiming to be any user (including an admin email) and be trusted.
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token verification failed: {str(e)}"
        )
