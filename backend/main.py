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

# ==========================================
# JWT / PROTECTED ROUTE DEPENDENCY
# ==========================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.UserDB:
    """
    Decodes the Bearer JWT from Authorization header and returns the DB user.
    Raises 401 if token is missing, invalid, or user not found.
    """
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

    # subject can be email or phone_number depending on how the token was created
    user = db.query(models.UserDB).filter(
        (models.UserDB.email == subject) |
        (models.UserDB.phone_number == subject)
    ).first()

    if user is None:
        raise credentials_exception
    return user


# ==========================================
# PYDANTIC SCHEMAS (request bodies for new endpoints)
# ==========================================

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone_number: Optional[str] = None
    profile_pic: Optional[str] = None   # base64 data-URL or a hosted URL


class ChangePasswordRequest(BaseModel):
    current_password: str
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
# PROFILE ROUTES  (protected — require JWT)
# ==========================================

@app.get("/me", response_model=models.UserResponse)
def get_me(current_user: models.UserDB = Depends(get_current_user)):
    """Return the currently logged-in user's profile data."""
    return current_user


@app.put("/profile", response_model=models.UserResponse)
def update_profile(
    request: UpdateProfileRequest,
    current_user: models.UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update the current user's editable profile fields.
    Only fields explicitly provided in the request body are updated.
    """
    # Check uniqueness constraints before applying changes
    if request.email and request.email != current_user.email:
        existing = db.query(models.UserDB).filter(
            models.UserDB.email == request.email
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already in use by another account",
            )

    if request.phone_number and request.phone_number != current_user.phone_number:
        existing = db.query(models.UserDB).filter(
            models.UserDB.phone_number == request.phone_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number is already in use by another account",
            )

    # Apply updates — only overwrite fields that were actually sent
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
    """
    Change the current user's password.
    - Google-only accounts (no hashed_password) cannot use this endpoint.
    - Verifies the current password before setting the new one.
    """
    # Google-only users have no password set
    if not current_user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This account uses Google Sign-In and does not have a password",
        )

    # Verify the current password is correct
    if not auth.verify_password(request.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    # Enforce a minimum length (same rule the frontend uses)
    if len(request.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters",
        )

    current_user.hashed_password = auth.get_password_hash(request.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ==========================================
# AUTHENTICATION: PHONE OTP ROUTES
# ==========================================

@app.post("/send-otp", status_code=status.HTTP_200_OK)
def send_otp(request: models.PhoneRequest, db: Session = Depends(get_db)):
    # 1. Generate OTP
    otp_code = auth.generate_otp()
    expiration_time = datetime.now(timezone.utc) + timedelta(minutes=10)

    # 2. Save/Update OTP in DB
    existing_otp = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()

    if existing_otp:
        existing_otp.otp_code = otp_code
        existing_otp.expires_at = expiration_time.replace(tzinfo=None)
    else:
        new_otp = models.OTPVerificationDB(
            phone_number=request.phone_number,
            otp_code=otp_code,
            expires_at=expiration_time.replace(tzinfo=None),
        )
        db.add(new_otp)

    db.commit()

    # 3. Send SMS (Terminal Mock — swap for Twilio/Fast2SMS in production)
    auth.send_sms_otp(request.phone_number, otp_code)

    return {"message": f"OTP sent to {request.phone_number}"}


@app.post("/verify-otp-and-signup")
def verify_otp_and_signup(request: models.VerifyOTPRequest, db: Session = Depends(get_db)):
    # 1. Verify OTP
    otp_record = db.query(models.OTPVerificationDB).filter(
        models.OTPVerificationDB.phone_number == request.phone_number
    ).first()

    if not otp_record or otp_record.otp_code != request.otp_code:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    if datetime.now(timezone.utc).replace(tzinfo=None) > otp_record.expires_at:
        raise HTTPException(status_code=400, detail="OTP expired")

    # 2. Ensure phone number isn't already registered
    db_user = db.query(models.UserDB).filter(
        models.UserDB.phone_number == request.phone_number
    ).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Phone number already registered")

    # 3. Create User
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

    # 4. Auto-login: return token immediately
    access_token = auth.create_access_token(data={"sub": new_user.phone_number})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "full_name": new_user.full_name,
    }


# ==========================================
# AUTHENTICATION: GOOGLE LOGIN
# ==========================================

@app.post("/google-login")
def google_login(request: models.GoogleLoginRequest, db: Session = Depends(get_db)):
    # 1. Verify the Google Token
    google_data = auth.verify_google_token(request.token)
    if not google_data:
        raise HTTPException(status_code=400, detail="Invalid Google token")

    email = google_data["email"]
    google_id = google_data["sub"]
    name = google_data.get("name")
    picture = google_data.get("picture")

    # 2. Find or create the user
    user = db.query(models.UserDB).filter(
        (models.UserDB.google_id == google_id) | (models.UserDB.email == email)
    ).first()

    if not user:
        user = models.UserDB(
            email=email,
            google_id=google_id,
            full_name=name,
            profile_pic=picture,
            is_active=True,
        )
        db.add(user)
    else:
        # Keep Google profile data in sync
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
        "full_name": user.full_name,
    }


# ==========================================
# AUTHENTICATION: STANDARD LOGIN
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

    if not user or not user.hashed_password or not auth.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect phone/email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = auth.create_access_token(data={"sub": form_data.username})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "full_name": user.full_name,
    }