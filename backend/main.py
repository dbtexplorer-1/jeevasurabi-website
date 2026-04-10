# backend/main.py
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, timezone

import models
import auth
from database import engine, get_db

# Create the database tables if they don't exist
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JeevaSurabi E-commerce API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the JeevaSurabi API!"}

# --- PRODUCT ROUTES ---

@app.get("/products", response_model=List[models.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.ProductDB).all()


# --- AUTHENTICATION: PHONE OTP ROUTES ---

@app.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: models.PhoneRequest, db: Session = Depends(get_db)):
    # 1. Check if user already exists
    db_user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    
    # 2. Generate OTP
    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # 3. Save/Update OTP in DB
    existing_otp = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration_time.replace(tzinfo=None)
    else:
        new_otp = models.OTPVerificationDB(
            phone_number=request.phone_number, 
            otp_code=otp_code, 
            expires_at=expiration_time.replace(tzinfo=None)
        )
        db.add(new_otp)
    
    db.commit()
    
    # 4. Send SMS (Terminal Mock)
    auth.send_sms_otp(request.phone_number, otp_code)
    
    return {"message": f"OTP sent to {request.phone_number}"}


@app.post("/verify-otp-and-signup") # Returns token for auto-login
def verify_otp_and_signup(request: models.VerifyOTPRequest, db: Session = Depends(get_db)):
    # 1. Verify OTP
    otp_record = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()
    
    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")
        
    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")
        
    # 2. Check if user exists
    db_user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # 3. Create User
    hashed_pw = auth.get_password_hash(request.password) if request.password else None
    new_user = models.UserDB(
        phone_number=request.phone_number,
        full_name=request.full_name,
        hashed_password=hashed_pw
    )
    db.add(new_user)
    db.delete(otp_record)
    db.commit()
    db.refresh(new_user)
    
    # 4. AUTO-LOGIN: Generate token immediately
    access_token = auth.create_access_token(data={"sub": new_user.phone_number})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "full_name": new_user.full_name
    }


# --- AUTHENTICATION: GOOGLE LOGIN ---

@app.post("/google-login")
def google_login(request: models.GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Verify the Google Token
    google_data = auth.verify_google_token(request.token)
    if not google_data:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    email = google_data['email']
    google_id = google_data['sub']
    name = google_data.get('name') # This is the Google Display Name
    picture = google_data.get('picture')

    # 2. Check if user exists
    user = db.query(models.UserDB).filter(
        (models.UserDB.google_id == google_id) | (models.UserDB.email == email)
    ).first()

    if not user:
        user = models.UserDB(
            email=email,
            google_id=google_id,
            full_name=name,
            profile_pic=picture,
            is_active=True
        )
        db.add(user)
    else:
        # Update name/picture if they've changed on Google
        user.google_id = google_id
        user.profile_pic = picture
        user.full_name = name
        
    db.commit()
    db.refresh(user)

    # 3. Create JWT
    access_token = auth.create_access_token(data={"sub": user.email or user.phone_number})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "full_name": user.full_name # Return real name for the UI
    }


# --- STANDARD LOGIN ---

@app.post("/login")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
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
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "full_name": user.full_name
    }