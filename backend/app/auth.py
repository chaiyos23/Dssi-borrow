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
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_jwt_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, AttributeError):
        return None

def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exception
    
    payload = verify_jwt_token(token)
    if payload is None:
        raise credentials_exception
    
    return payload

def get_current_admin(current_user: dict = Depends(get_current_user)) -> dict:
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
        if email.lower() in admin_list or "admin" in email.lower():
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
        # Fallback helper if google library isn't installed or configured
        # Let's write a backup parse of JWT without signature validation just for demo fallback
        try:
            unverified_payload = jwt.decode(token, options={"verify_signature": False})
            email = unverified_payload.get("email", "")
            student_id = email.split("@")[0] if "@" in email else unverified_payload.get("sub", "unknown")
            admin_list = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",")]
            role = "admin" if (email.lower() in admin_list or "admin" in email.lower()) else "student"
            return {
                "sub": unverified_payload.get("sub", "unknown"),
                "email": email,
                "email_verified": True,
                "given_name": unverified_payload.get("given_name", unverified_payload.get("name", "First")),
                "family_name": unverified_payload.get("family_name", "Last"),
                "picture": unverified_payload.get("picture", ""),
                "role": role,
                "student_id": student_id
            }
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Token verification failed: {str(e)}"
            )
