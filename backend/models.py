# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime
from database import Base
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# ==========================================
# SQLAlchemy Models (Database Tables)
# ==========================================

class ProductDB(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    size = Column(String)
    price = Column(Float)
    img = Column(String) 
    description = Column(Text, nullable=True)
    stock_quantity = Column(Integer, default=50)

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    # Fields for Phone/Email Login
    full_name = Column(String, nullable=True)
    email = Column(String, unique=True, index=True, nullable=True)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    hashed_password = Column(String, nullable=True) # Nullable for Google-only users
    
    # Fields for Google Login
    google_id = Column(String, unique=True, index=True, nullable=True)
    profile_pic = Column(String, nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

class OTPVerificationDB(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String, index=True) # Switched from email to phone
    otp_code = Column(String)
    expires_at = Column(DateTime)


# ==========================================
# Pydantic Schemas (API Data Formats)
# ==========================================

# --- Product Schemas ---
class ProductResponse(BaseModel):
    id: int
    name: str
    category: str
    size: str
    price: float
    img: str
    description: Optional[str] = None
    stock_quantity: int

    class Config:
        from_attributes = True

# --- User & Auth Schemas ---
class UserResponse(BaseModel):
    id: int
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- OTP Schemas (Mobile Focused) ---
class PhoneRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str
    full_name: str
    password: Optional[str] = None # Optional if they just want OTP login

# --- Google Login Schema ---
class GoogleLoginRequest(BaseModel):
    token: str # The credential token sent by the Google frontend button