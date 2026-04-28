from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from fastapi.staticfiles import StaticFiles 
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from pydantic import BaseModel
import shutil 
import os 
import uuid 

import models
import auth
from database import engine, get_db

# ==========================================
# 1. SETUP & MIDDLEWARE
# ==========================================

# Create DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="JeevaSurabi E-commerce API")

# Setup absolute uploads directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

# Mount the uploads folder
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):3000",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 2. DEPENDENCIES (Auth & Security)
# ==========================================

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# Modified to optionally return None if token is missing/invalid, used for public routes
def get_current_user_optional(
    token: str = Depends(OAuth2PasswordBearer(tokenUrl="login", auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[models.UserDB]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        subject: str = payload.get("sub")
        if subject is None:
            return None
    except JWTError:
        return None

    user = db.query(models.UserDB).filter(
        (models.UserDB.email == subject) |
        (models.UserDB.phone_number == subject)
    ).first()
    return user

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

def verify_admin_network(request: Request, current_user: models.UserDB = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized. Admin access required.")
    
    client_ip = request.client.host
    if not (client_ip in ["127.0.0.1", "::1", "localhost"] or client_ip.startswith("192.168.")):
        raise HTTPException(status_code=403, detail="Admin access denied from external networks.")
        
    return current_user


# ==========================================
# 3. PYDANTIC SCHEMAS
# ==========================================

class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None  # FIXED: Now matches the underscore formatting
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

class ProductCreateUpdate(BaseModel):
    name: str
    category: str
    size: str
    price: float
    img: str
    stock_quantity: int
    description: Optional[str] = None


# ==========================================
# 4. PUBLIC ROUTES
# ==========================================

@app.get("/")
def read_root():
    return {"message": "Welcome to the JeevaSurabi API!"}

@app.get("/products", response_model=List[models.ProductResponse])
def get_products(db: Session = Depends(get_db)):
    return db.query(models.ProductDB).all()

@app.get("/site-content", response_model=List[models.SiteContentResponse])
def get_site_content(db: Session = Depends(get_db)):
    return db.query(models.SiteContentDB).all()

# NEW: Submit Inquiry
@app.post("/inquiries", response_model=models.InquiryResponse)
def submit_inquiry(
    req: models.InquiryCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[models.UserDB] = Depends(get_current_user_optional)
):
    new_inquiry = models.InquiryDB(
        name=req.name,
        email=req.email,
        message=req.message,
        user_id=current_user.id if current_user else None
    )
    db.add(new_inquiry)
    db.commit()
    db.refresh(new_inquiry)
    return new_inquiry


# ==========================================
# 5. USER PROFILE & UPLOADS ROUTES
# ==========================================

@app.post("/upload-profile-pic")
async def upload_profile_pic(
    request: Request,
    file: UploadFile = File(...),
    current_user: models.UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    host_url = str(request.base_url).rstrip('/')
    image_url = f"{host_url}/uploads/{unique_filename}"

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

    if request.full_name is not None: current_user.full_name = request.full_name
    if request.email is not None: current_user.email = request.email
    if request.phone_number is not None: current_user.phone_number = request.phone_number
    if request.profile_pic is not None: current_user.profile_pic = request.profile_pic

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
# 6. ORDER PROCESSING ROUTES
# ==========================================

@app.post("/orders", response_model=models.OrderResponse)
def create_order(
    order_req: models.OrderCreate, 
    current_user: models.UserDB = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    new_order = models.OrderDB(
        user_id=current_user.id, 
        shipping_address=order_req.shipping_address,
        total_amount=0.0
    )
    db.add(new_order)
    db.flush() 
    
    total_amount = 0.0
    
    for item in order_req.items:
        product = db.query(models.ProductDB).filter(models.ProductDB.id == item.product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item.product_id} not found")
        
        if product.stock_quantity < item.quantity:
            raise HTTPException(status_code=400, detail=f"Not enough stock for {product.name}. Only {product.stock_quantity} left.")
        
        product.stock_quantity -= item.quantity
        total_amount += (product.price * item.quantity)
        
        order_item = models.OrderItemDB(
            order_id=new_order.id,
            product_id=product.id,
            quantity=item.quantity,
            price_at_purchase=product.price
        )
        db.add(order_item)
        
    new_order.total_amount = total_amount
    db.commit()
    db.refresh(new_order)
    return new_order

@app.get("/my-orders", response_model=List[models.OrderResponse])
def get_my_orders(current_user: models.UserDB = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(models.OrderDB).filter(models.OrderDB.user_id == current_user.id).order_by(models.OrderDB.created_at.desc()).all()


# ==========================================
# 7. ADMIN ROUTES (Secured)
# ==========================================

@app.get("/admin/orders", response_model=List[models.OrderResponse])
def admin_get_all_orders(admin_user: models.UserDB = Depends(verify_admin_network), db: Session = Depends(get_db)):
    return db.query(models.OrderDB).order_by(models.OrderDB.created_at.desc()).all()

@app.put("/admin/orders/{order_id}/status")
def admin_update_order_status(
    order_id: int, 
    req: models.OrderStatusUpdate, 
    admin_user: models.UserDB = Depends(verify_admin_network), 
    db: Session = Depends(get_db)
):
    order = db.query(models.OrderDB).filter(models.OrderDB.id == order_id).first()
    if not order: 
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = req.status
    db.commit()
    return {"message": "Order status updated successfully", "new_status": order.status}

@app.put("/admin/site-content/{section_key}", response_model=models.SiteContentResponse)
def admin_update_site_content(
    section_key: str, 
    req: models.SiteContentUpdate, 
    admin_user: models.UserDB = Depends(verify_admin_network), 
    db: Session = Depends(get_db)
):
    content = db.query(models.SiteContentDB).filter(models.SiteContentDB.section_key == section_key).first()
    
    if not content:
        content = models.SiteContentDB(section_key=section_key)
        db.add(content)
        
    if req.image_url is not None: 
        content.image_url = req.image_url
    if req.text_content is not None: 
        content.text_content = req.text_content
        
    db.commit()
    db.refresh(content)
    return content

@app.post("/admin/products", response_model=models.ProductResponse)
def admin_create_product(
    req: ProductCreateUpdate, 
    admin_user: models.UserDB = Depends(verify_admin_network), 
    db: Session = Depends(get_db)
):
    new_product = models.ProductDB(**req.dict())
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/admin/products/{product_id}", response_model=models.ProductResponse)
def admin_update_product(
    product_id: int, 
    req: ProductCreateUpdate, 
    admin_user: models.UserDB = Depends(verify_admin_network), 
    db: Session = Depends(get_db)
):
    product = db.query(models.ProductDB).filter(models.ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    for key, value in req.dict().items():
        setattr(product, key, value)
        
    db.commit()
    db.refresh(product)
    return product

@app.delete("/admin/products/{product_id}")
def admin_delete_product(
    product_id: int, 
    admin_user: models.UserDB = Depends(verify_admin_network), 
    db: Session = Depends(get_db)
):
    product = db.query(models.ProductDB).filter(models.ProductDB.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    db.delete(product)
    db.commit()
    return {"message": "Product deleted successfully"}

# NEW: Admin GET Inquiries
@app.get("/admin/inquiries", response_model=List[models.InquiryResponse])
def admin_get_inquiries(admin_user: models.UserDB = Depends(verify_admin_network), db: Session = Depends(get_db)):
    return db.query(models.InquiryDB).order_by(models.InquiryDB.created_at.desc()).all()

# NEW: Admin PUT Inquiry Status
@app.put("/admin/inquiries/{inquiry_id}/status")
def admin_update_inquiry_status(
    inquiry_id: int,
    req: models.InquiryStatusUpdate,
    admin_user: models.UserDB = Depends(verify_admin_network),
    db: Session = Depends(get_db)
):
    inquiry = db.query(models.InquiryDB).filter(models.InquiryDB.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    
    inquiry.status = req.status
    db.commit()
    return {"message": "Inquiry status updated successfully", "new_status": inquiry.status}


# ==========================================
# 8. AUTHENTICATION ROUTES
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
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "full_name": new_user.full_name, 
        "email": new_user.email,
        "phone_number": new_user.phone_number,
        "profile_pic": new_user.profile_pic, 
        "is_admin": new_user.is_admin
    }

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
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "full_name": user.full_name, 
        "email": user.email,
        "phone_number": user.phone_number,
        "profile_pic": user.profile_pic, 
        "is_admin": user.is_admin
    }

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
        )

    access_token = auth.create_access_token(data={"sub": form_data.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "full_name": user.full_name, 
        "email": user.email,
        "phone_number": user.phone_number,
        "profile_pic": user.profile_pic, 
        "is_admin": user.is_admin
    }

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
        user.profile_pic = picture 
        user.full_name = name

    db.commit()
    db.refresh(user)

    access_token = auth.create_access_token(data={"sub": user.email or user.phone_number})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "full_name": user.full_name, 
        "email": user.email,
        "phone_number": user.phone_number,
        "profile_pic": user.profile_pic, 
        "is_admin": user.is_admin
    }

    # NEW: Admin Image Upload for Products
@app.post("/admin/upload-image")
async def admin_upload_image(
    request: Request,
    file: UploadFile = File(...),
    admin_user: models.UserDB = Depends(verify_admin_network)
):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"product_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    host_url = str(request.base_url).rstrip('/')
    image_url = f"{host_url}/uploads/{unique_filename}"

    return {"image_url": image_url}