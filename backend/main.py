from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles # NEW: For serving images
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from pydantic import BaseModel
import shutil # NEW: For saving files
import os # NEW: For directory handling
import uuid # NEW: For unique filenames

import models
import auth
from database import engine, get_db

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JeevaSurabi E-commerce API")

# --- SETUP UPLOADS DIRECTORY ---
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# NEW: Mount the uploads folder so it's accessible via URL
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.add_middleware(
    CORSMiddleware,
    # Updated origins to include your local network IP and localhost
    allow_origins=["http://localhost:3000", "http://192.168.0.101:3000"], 
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

class ForgotPasswordVerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str

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
# PROFILE & UPLOAD ROUTES (protected)
# ==========================================

@app.get("/me", response_model=models.UserResponse)
def get_me(current_user: models.UserDB = Depends(get_current_user)):
    return current_user

# NEW: Dedicated endpoint for uploading profile picture files
@app.post("/upload-profile-pic")
async def upload_profile_pic(
    file: UploadFile = File(...),
    current_user: models.UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # 2. Create a unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    # 3. Save file to local 'uploads' folder
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # 4. Generate URL (Adjust IP if testing on mobile)
    # Using relative path is safer, or hardcode your current dev IP
    image_url = f"http://192.168.0.101:8000/uploads/{unique_filename}"

    # 5. Update Database
    current_user.profile_pic = image_url
    db.commit()
    db.refresh(current_user)

    return {"info": "Profile picture uploaded", "profile_pic": image_url}


@app.put("/profile", response_model=models.UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: models.UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if request.email and request.email != current_user.email:
        if db.query(models.UserDB).filter(models.UserDB.email == request.email).first():
            raise HTTPException(status_code=400, detail="Email is already in use")

    if request.phone_number and request.phone_number != current_user.phone_number:
        if db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first():
            raise HTTPException(status_code=400, detail="Phone number is already in use")

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
        raise HTTPException(status_code=400, detail="Google accounts do not have passwords")

    if not auth.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password incorrect")

    current_user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ==========================================
# AUTH — SIGN UP
# ==========================================

@app.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: models.PhoneRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Phone already registered")

    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    existing_otp = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()
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
    otp_record = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()

    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

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
    return {"access_token": access_token, "token_type": "bearer", "full_name": new_user.full_name, "profile_pic": new_user.profile_pic}


# ==========================================
# AUTH — SIGN IN WITH OTP
# ==========================================

@app.post("/send-login-otp", status_code=status.HTTP_200_OK)
def send_login_otp(request: LoginOTPRequest, db: Session = Depends(get_db)):
    existing_user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    if not existing_user:
        raise HTTPException(status_code=404, detail="Account not found")

    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    existing_otp = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()
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
    return {"message": "OTP sent"}


@app.post("/verify-login-otp")
def verify_login_otp(request: VerifyLoginOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()

    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    
    db.delete(otp_record)
    db.commit()

    access_token = auth.create_access_token(data={"sub": user.phone_number})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name, "profile_pic": user.profile_pic}


# ==========================================
# AUTH — FORGOT PASSWORD
# ==========================================

@app.post("/forgot-password/send-otp")
def forgot_password_send_otp(request: ForgotPasswordSendOTPRequest, db: Session = Depends(get_db)):
    user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")

    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    db.add(models.OTPVerificationDB(
        phone_number=request.phone_number,
        otp_code=otp_code,
        expires_at=expiration_time.replace(tzinfo=None),
    ))
    db.commit()
    auth.send_sms_otp(request.phone_number, otp_code)
    return {"message": "OTP sent"}

@app.post("/forgot-password/verify-otp")
def forgot_password_verify_otp(request: ForgotPasswordVerifyOTPRequest, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()
    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"message": "OTP verified"}

@app.post("/forgot-password/reset")
def forgot_password_reset(request: ForgotPasswordResetRequest, db: Session = Depends(get_db)):
    otp_record = db.query(models.OTPVerificationDB).filter(models.OTPVerificationDB.phone_number == request.phone_number).first()
    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    user = db.query(models.UserDB).filter(models.UserDB.phone_number == request.phone_number).first()
    user.hashed_password = auth.get_password_hash(request.new_password)
    db.delete(otp_record)
    db.commit()
    return {"message": "Password reset success"}


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
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": form_data.username})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name, "profile_pic": user.profile_pic}


# ==========================================
# AUTH — GOOGLE LOGIN
# ==========================================

@app.post("/google-login")
def google_login(request: models.GoogleLoginRequest, db: Session = Depends(get_db)):
    google_data = auth.verify_google_token(request.token)
    if not google_data:
        raise HTTPException(status_code=400, detail="Invalid token")

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
        user.profile_pic = picture # Update Google pic if it changed
        user.full_name = name

    db.commit()
    db.refresh(user)

    access_token = auth.create_access_token(data={"sub": user.email or user.phone_number})
    return {"access_token": access_token, "token_type": "bearer", "full_name": user.full_name, "profile_pic": user.profile_pic}