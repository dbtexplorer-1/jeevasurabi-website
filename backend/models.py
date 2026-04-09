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
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)

class OTPVerificationDB(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
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
class UserCreate(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    email: str
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

# --- OTP Schemas ---
class EmailRequest(BaseModel):
    email: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    password: str