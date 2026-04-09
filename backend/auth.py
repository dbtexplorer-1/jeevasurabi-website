# backend/auth.py
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import random
import resend

# ==========================================
# 1. SECURITY CONFIGURATION (JWT & Passwords)
# ==========================================
# In a real production app, this SECRET_KEY should be hidden in a .env file!
SECRET_KEY = "jeevasurabi_super_secret_key_change_this_later" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # Token stays valid for 7 days

# Setup the Password Hashing Context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ==========================================
# 2. EMAIL CONFIGURATION (Resend OTP)
# ==========================================
# Replace this with your actual Resend API Key
resend.api_key = "re_McZRQ7Hw_NnLbG3GB6GuTZMkTnxhG2nkK"


# ==========================================
# 3. AUTHENTICATION UTILITIES
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Takes a plain password, hashes it, and compares it to the database hash."""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Hashes a plain text password for safe database storage."""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a JWT token containing the user's data (like their email/id)."""
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        # Default to 7 days if no specific delta is provided
        expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
    to_encode.update({"exp": expire})
    
    # Generate the actual token string using the secret key
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# ==========================================
# 4. OTP UTILITIES
# ==========================================

def generate_otp() -> str:
    """Generates a random 6-digit code"""
    return str(random.randint(100000, 999999))

def send_otp_email(receiver_email: str, otp: str):
    """Sends the OTP using the Resend API"""
    
    # We use Resend's free testing domain as the sender
    params = {
        "from": "JeevaSurabi <onboarding@resend.dev>",
        "to": [receiver_email],
        "subject": "Your JeevaSurabi Verification Code",
        "html": f"""
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h2 style="color: #14532d; margin-bottom: 20px;">Welcome to JeevaSurabi!</h2>
            <p style="color: #374151; font-size: 16px;">We are excited to have you. Please use the verification code below to complete your sign-up:</p>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1f2937;">{otp}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code will expire in 10 minutes. If you didn't request this code, you can safely ignore this email.</p>
        </div>
        """
    }
    
    try:
        email_response = resend.Emails.send(params)
        print(f"OTP sent successfully via Resend to {receiver_email}")
        return email_response
    except Exception as e:
        print(f"Failed to send email: {e}")