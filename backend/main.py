from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

import models
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

@app.get("/products", response_model=List[models.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    # Fetch all products from the database
    products = db.query(models.ProductDB).all()
    return products