from sqlalchemy import Column, Integer, String, Float, Text
from database import Base
from pydantic import BaseModel
from typing import Optional

# --- SQLAlchemy Model (Database Table) ---
class ProductDB(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    size = Column(String)
    price = Column(Float)
    img = Column(String)
    description = Column(Text, nullable=True)

# --- Pydantic Schema (API Data Format) ---
class ProductResponse(BaseModel):
    id: int
    name: string
    category: string
    size: string
    price: float
    img: string
    description: Optional[str] = None

    class Config:
        from_attributes = True