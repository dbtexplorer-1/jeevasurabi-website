# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from pydantic import BaseModel

import models
import auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JeevaSurabi E-commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# JWT / PROTECTED ROUTE DEPENDENCY
# ==========================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.UserDB:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        subject: str = payload.get("sub")
        if subject is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.UserDB).filter(
        (models.UserDB.email == subject) |
        (models.UserDB.phone_number == subject)
    ).first()

    if user is None:
        raise credentials_exception
    return user


# ==========================================
# PYDANTIC SCHEMAS
# ==========================================

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class LoginOTPRequest(BaseModel):
    phone_number: str

class VerifyLoginOTPRequest(BaseModel):
    phone_number: str
    otp_code: str

class ForgotPasswordSendOTPRequest(BaseModel):
    phone_number: str

class ForgotPasswordResetRequest(BaseModel):
    phone_number: str
    otp_code: str
    new_password: str


# ==========================================
# ROOT
# ==========================================

@app.get("/")
def read_root():
    return {"message": "Welcome to the JeevaSurabi API!"}


# ==========================================
# PRODUCT ROUTES
# ==========================================

@app.get("/products", response_model=List[models.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.ProductDB).all()


# ==========================================
# PROFILE ROUTES (protected)
# ==========================================

@app.get("/me", response_model=models.UserResponse)
def get_me(current_user: models.UserDB = Depends(get_current_user)):
    return current_user


@app.put("/profile", response_model=models.UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: models.UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.email and request.email != current_user.email:
        if db.query(models.UserDB).filter(models.UserDB.email == request.email).first():
            raise HTTPException(status_code=400, detail="Email is already in use by another account")

    if request.phone_number and request.phone_number != current_user.phone_number:
        if db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first():
            raise HTTPException(status_code=400, detail="Phone number is already in use by another account")

    if request.full_name is not None:
        current_user.full_name = request.full_name
    if request.email is not None:
        current_user.email = request.email
    if request.phone_number is not None:
        current_user.phone_number = request.phone_number
    if request.profile_pic is not None:
        current_user.profile_pic = request.profile_pic

    db.commit()
    db.refresh(current_user)
    return current_user


@app.post("/change-password", status_code=status.HTTP_200_OK)
def change_password(
    request: ChangePasswordRequest,
    current_user: models.UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not current_user.hashed_password:
        raise HTTPException(status_code=400, detail="This account uses Google Sign-In and does not have a password")

    if not auth.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters")

    current_user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ==========================================
# AUTH — SIGN UP (new user: phone + OTP + password)
# ==========================================

@app.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: models.PhoneRequest, db: Session = Depends(get_db)):
    """Send OTP for SIGN-UP. Phone must NOT already be registered."""
    existing_user = db.query(models.UserDB).filter(
        models.UserDB.phone_number == request.phone_number
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone number is already registered. Please sign in instead.")

    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    existing_otp = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration_time.replace(tzinfo=None)
    else:
        db.add(models.OTPVerificationDB(
            phone_number=request.phone_number,
            otp_code=otp_code,
            expires_at=expiration_time.replace(tzinfo=None),
        ))

    db.commit()
    auth.send_sms_otp(request.phone_number, otp_code)
    return {"message": f"OTP sent to {request.phone_number}"}


@app.post("/verify-otp-and-signup")
def verify_otp_and_signup(request: models.VerifyOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()

    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    if db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first():
        raise HTTPException(status_code=400, detail="Phone number already registered")

    hashed_pw = auth.get_password_hash(request.password) if request.password else None
    new_user = models.UserDB(
        phone_number=request.phone_number,
        full_name=request.full_name,
        hashed_password=hashed_pw,
    )
    db.add(new_user)
    db.delete(otp_record)
    db.commit()
    db.refresh(new_user)

    access_token = auth.create_access_token(data={"sub": new_user.phone_number})
    return {"access_token": access_token, "token_type": "bearer", "full_name": new_user.full_name}


# ==========================================
# AUTH — SIGN IN WITH OTP (existing user)
# ==========================================

@app.post("/send-login-otp", status_code=status.HTTP_200_OK)
def send_login_otp(request: LoginOTPRequest, db: Session = Depends(get_db)):
    """Send OTP for LOGIN. Phone MUST already be registered."""
    existing_user = db.query(models.UserDB).filter(
        models.UserDB.phone_number == request.phone_number
    ).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="No account found with this phone number. Please sign up first.")

    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    existing_otp = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration_time.replace(tzinfo=None)
    else:
        db.add(models.OTPVerificationDB(
            phone_number=request.phone_number,
            otp_code=otp_code,
            expires_at=expiration_time.replace(tzinfo=None),
        ))

    db.commit()
    auth.send_sms_otp(request.phone_number, otp_code)
    return {"message": f"OTP sent to {request.phone_number}"}


@app.post("/verify-login-otp")
def verify_login_otp(request: VerifyLoginOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()

    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    user = db.query(models.UserDB).filter(
        models.UserDB.phone_number == request.phone_number
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(otp_record)
    db.commit()

    access_token = auth.create_access_token(data={"sub": user.phone_number})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name}


# ==========================================
# AUTH — FORGOT PASSWORD (no auth required)
# ==========================================

@app.post("/forgot-password/send-otp", status_code=status.HTTP_200_OK)
def forgot_password_send_otp(request: ForgotPasswordSendOTPRequest, db: Session = Depends(get_db)):
    """
    Step 1: User provides their phone number.
    - Must be a registered phone account (not Google-only).
    - Sends an OTP to verify identity before allowing password reset.
    """
    user = db.query(models.UserDB).filter(
        models.UserDB.phone_number == request.phone_number
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="No account found with this phone number.")

    if not user.hashed_password and user.google_id:
        raise HTTPException(
            status_code=400,
            detail="This account uses Google Sign-In. Password reset is not available."
        )

    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    existing_otp = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration_time.replace(tzinfo=None)
    else:
        db.add(models.OTPVerificationDB(
            phone_number=request.phone_number,
            otp_code=otp_code,
            expires_at=expiration_time.replace(tzinfo=None),
        ))

    db.commit()
    auth.send_sms_otp(request.phone_number, otp_code)
    return {"message": f"OTP sent to {request.phone_number}"}


@app.post("/forgot-password/reset", status_code=status.HTTP_200_OK)
def forgot_password_reset(request: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    """
    Step 2: Verify OTP and set a new password.
    - No JWT required — identity is proven by OTP.
    """
    otp_record = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()

    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    user = db.query(models.UserDB).filter(
        models.UserDB.phone_number == request.phone_number
    ).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = auth.get_password_hash(request.new_password)
    db.delete(otp_record)
    db.commit()

    return {"message": "Password reset successfully. You can now sign in with your new password."}


# ==========================================
# AUTH — SIGN IN WITH PASSWORD
# ==========================================

@app.post("/login")
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = db.query(models.UserDB).filter(
        (models.UserDB.phone_number == form_data.username) |
        (models.UserDB.email == form_data.username)
    ).first()

    if not user or not user.hashed_password or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name}


# ==========================================
# AUTH — GOOGLE LOGIN
# ==========================================

@app.post("/google-login")
def google_login(request: models.GoogleLoginRequest, db: Session = Depends(get_db)):
    google_data = auth.verify_google_token(request.token)
    if not google_data:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    email = google_data["email"]
    google_id = google_data["sub"]
    name = google_data.get("name")
    picture = google_data.get("picture")

    user = db.query(models.UserDB).filter(
        (models.UserDB.google_id == google_id) | (models.UserDB.email == email)
    ).first()

    if not user:
        user = models.UserDB(email=email, google_id=google_id, full_name=name, profile_pic=picture, is_active=True)
        db.add(user)
    else:
        user.google_id = google_id
        user.profile_pic = picture
        user.full_name = name

    db.commit()
    db.refresh(user)

    access_token = auth.create_access_token(data={"sub": user.email or user.phone_number})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name}