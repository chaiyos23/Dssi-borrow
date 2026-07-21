from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import User
from app.schemas import GoogleLoginRequest, Token, UserResponse
from app.auth import verify_google_token, create_access_token, get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/google-login", response_model=Token)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Verify Google token (or mock)
    try:
        user_info = verify_google_token(payload.token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google Authentication failed: {str(e)}"
        )

    email = user_info.get("email", "")
    print(f"[GOOGLE LOGIN DEBUG] User Info: {user_info}")
    
    # 2. Enforce school domain: ubu.ac.th (Required in specification)
    admin_list = [e.strip().lower() for e in settings.ADMIN_EMAILS.split(",")]
    is_admin_email = email.lower() in admin_list
    
    if not email.endswith("@ubu.ac.th") and not is_admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only university accounts (@ubu.ac.th) are allowed to access this system."
        )

    # 3. Check if user exists, else create (Module 1 requirement: First login creates user)
    user_id = user_info.get("student_id")
    user = db.query(User).filter(User.user_id == user_id).first()
    
    current_time = datetime.utcnow()
    
    if not user:
        # Determine role: students are 'student', others can be configured
        role = user_info.get("role", "student")
        
        user = User(
            user_id=user_id,
            email=email,
            first_name=user_info.get("given_name"),
            last_name=user_info.get("family_name"),
            profile_image=user_info.get("picture"),
            role=role,
            created_at=current_time,
            last_login=current_time
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Update last login time
        user.last_login = current_time
        # Sync profile image and names if they changed
        user.first_name = user_info.get("given_name") or user.first_name
        user.last_name = user_info.get("family_name") or user.last_name
        user.profile_image = user_info.get("picture") or user.profile_image
        db.commit()

    # 4. Generate JWT Access Token
    token_data = {
        "sub": user.user_id,
        "email": user.email,
        "role": user.role,
        "name": f"{user.first_name} {user.last_name}"
    }
    access_token = create_access_token(data=token_data)

    return Token(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.user_id,
        name=f"{user.first_name} {user.last_name}"
    )

@router.get("/me", response_model=UserResponse)
def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.user_id == current_user["sub"]).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user
