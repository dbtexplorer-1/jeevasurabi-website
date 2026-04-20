# backend/models.py
from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# ==========================================
# SQLAlchemy Models (Database Tables)
# ==========================================

class ProductDB(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    category = Column(String(100), index=True)
    size = Column(String(50))
    price = Column(Float)
    img = Column(String(500)) 
    description = Column(Text, nullable=True)
    stock_quantity = Column(Integer, default=50)

class UserDB(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(150), nullable=True)
    email = Column(String(255), unique=True, index=True, nullable=True)
    phone_number = Column(String(20), unique=True, index=True, nullable=True)
    hashed_password = Column(String(255), nullable=True) 
    
    google_id = Column(String(255), unique=True, index=True, nullable=True)
    profile_pic = Column(String(500), nullable=True)
    
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Relationship to Orders
    orders = relationship("OrderDB", back_populates="owner")

class OTPVerificationDB(Base):
    __tablename__ = "otp_codes"

    id = Column(Integer, primary_key=True, index=True)
    phone_number = Column(String(20), index=True) 
    otp_code = Column(String(10))
    expires_at = Column(DateTime)

# --- NEW: ORDER MODELS ---

class OrderDB(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float)
    status = Column(String(50), default="Pending") # Pending, Processing, Shipped, Delivered, Cancelled
    shipping_address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    owner = relationship("UserDB", back_populates="orders")
    items = relationship("OrderItemDB", back_populates="order", cascade="all, delete-orphan")

class OrderItemDB(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price_at_purchase = Column(Float) # Saved in case product price changes later
    
    order = relationship("OrderDB", back_populates="items")
    product = relationship("ProductDB")

# --- NEW: SITE CONTENT / CMS MODEL ---

class SiteContentDB(Base):
    __tablename__ = "site_content"
    
    id = Column(Integer, primary_key=True, index=True)
    section_key = Column(String(100), unique=True, index=True) # e.g., "home_banner", "shop_header"
    image_url = Column(String(500), nullable=True)
    text_content = Column(Text, nullable=True)


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

class PhoneRequest(BaseModel):
    phone_number: str

class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str
    full_name: str
    password: Optional[str] = None

class GoogleLoginRequest(BaseModel):
    token: str 

# --- NEW: ORDER SCHEMAS ---

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    shipping_address: str
    items: List[OrderItemCreate]

class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_at_purchase: float
    product: ProductResponse

    class Config:
        from_attributes = True

class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: str
    created_at: datetime
    items: List[OrderItemResponse]

    class Config:
        from_attributes = True

class OrderStatusUpdate(BaseModel):
    status: str

# --- NEW: SITE CONTENT SCHEMAS ---

class SiteContentUpdate(BaseModel):
    image_url: Optional[str] = None
    text_content: Optional[str] = None

class SiteContentResponse(BaseModel):
    id: int
    section_key: str
    image_url: Optional[str]
    text_content: Optional[str]

    class Config:
        from_attributes = True