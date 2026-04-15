# backend/auth.py
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from google.oauth2 import id_token
from google.auth.transport import requests
import random
import resend

# ==========================================
# 0. LOGGING CONFIGURATION
# ==========================================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ==========================================
# 1. SECURITY CONFIGURATION
# ==========================================
SECRET_KEY = "jeevasurabi_super_secret_key_change_this_later" 
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 

# GOOGLE CONFIGURATION
# You will get this ID from the Google Cloud Console later
GOOGLE_CLIENT_ID = "886676518253-p11r15ftrr291kkb77t5mdd3aus0hhlv.apps.googleusercontent.com"

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ==========================================
# 2. PASSWORD & JWT UTILITIES
# ==========================================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ==========================================
# 3. GOOGLE AUTH UTILITY
# ==========================================

def verify_google_token(token: str):
    """Verifies the Google JWT token sent from the Next.js frontend."""
    try:
        # Verify the token against Google's servers
        idinfo = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        
        # ID token is valid. Return the user info (email, name, sub/id, picture)
        return idinfo
    except ValueError:
        # Invalid token
        return None

# ==========================================
# 4. OTP & COMMUNICATION UTILITIES
# ==========================================

def generate_otp() -> str:
    """Generates a random 6-digit code"""
    return str(random.randint(100000, 999999))

def send_sms_otp(phone_number: str, otp: str):
    """
    Simulates sending an SMS. 
    In production, you would use Twilio, Fast2SMS, or Firebase here.
    """
    logger.warning("\n" + "="*40)
    logger.warning(f"📱 SMS SENT TO: {phone_number}")
    logger.warning(f"🔢 YOUR OTP CODE: {otp}")
    logger.warning("="*40 + "\n")
    return True

def send_otp_email(receiver_email: str, otp: str):
    """(Optional) Utility if you still want to send emails via Resend"""
    resend.api_key = "re_McZRQ7Hw_NnLbG3GB6GuTZMkTnxhG2nkK"
    params = {
        "from": "JeevaSurabi <onboarding@resend.dev>",
        "to": [receiver_email],
        "subject": "Verification Code",
        "html": f"<h2>Your code is: {otp}</h2>"
    }
    try:
        return resend.Emails.send(params)
    except Exception as e:
        # Also updated this to use the logger instead of print
        logger.error(f"Email failed: {e}")