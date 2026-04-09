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

app = FastAPI(title="E-commerce API")

# Configure CORS so Next.js (usually on port 3000) can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # Update this when deploying
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to the E-commerce Backend API!"}

# --- PRODUCT ROUTES ---

@app.get("/products", response_model=List[models.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    # Fetch all products from the database
    products = db.query(models.ProductDB).all()
    return products


# --- AUTHENTICATION ROUTES (OTP & Login) ---

@app.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: models.EmailRequest, db: Session = Depends(get_db)):
    # 1. Check if user already has an account
    db_user = db.query(models.UserDB).filter(models.UserDB.email == request.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered. Please log in.")
    
    # 2. Generate OTP and calculate expiration (10 minutes from now)
    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)
    
    # 3. Save OTP to database (if they requested one before, overwrite it)
    existing_otp = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.email == request.email).first()
    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration_time.replace(tzinfo=None)
    else:
        new_otp = models.OTPVerificationDB(
            email=request.email, 
            otp_code=otp_code, 
            expires_at=expiration_time.replace(tzinfo=None)
        )
        db.add(new_otp)
    
    db.commit()
    
    # 4. Send the email via Resend!
    auth.send_otp_email(request.email, otp_code)
    
    return {"message": "OTP sent successfully. Please check your email."}


@app.post("/verify-otp-and-signup", response_model=models.UserResponse, status_code=status.HTTP_201_CREATED)
def verify_otp_and_signup(request: models.VerifyOTPRequest, db: Session = Depends(get_db)):
    # 1. Find the OTP record for this email
    otp_record = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.email == request.email).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="No OTP requested for this email.")
        
    # 2. Check if OTP is correct
    if otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP code.")
        
    # 3. Check if OTP is expired (Comparing UTC to UTC)
    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP has expired. Please request a new one.")
        
    # 4. Success! Hash the password and create the user
    hashed_password = auth.get_password_hash(request.password)
    new_user = models.UserDB(email=request.email, hashed_password=hashed_password)
    db.add(new_user)
    
    # 5. Delete the OTP record so it can't be used again
    db.delete(otp_record)
    db.commit()
    db.refresh(new_user)
    
    return new_user


@app.post("/login", response_model=models.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Note: OAuth2 expects the field to be called "username", but we are using emails.
    # So the user will pass their email into the "username" field.
    
    # 1. Find the user by email
    user = db.query(models.UserDB).filter(models.UserDB.email == form_data.username).first()
    
    # 2. Check if user exists and password is correct
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Generate the JWT Token
    access_token = auth.create_access_token(data={"sub": user.email})
    
    return {"access_token": access_token, "token_type": "bearer"}