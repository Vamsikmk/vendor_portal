# auth.py
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from typing import Optional
from sqlalchemy import text

# Import configuration from config.py
from config import JWT_SECRET_KEY as SECRET_KEY
from config import JWT_ALGORITHM as ALGORITHM
from config import ACCESS_TOKEN_EXPIRE_MINUTES

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None  # ✅ ADDED user_id field

class User(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: str
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    # Adjust the query to match your database schema - using password_hash instead of password
    query = text("""
        SELECT 
            user_id, 
            username, 
            password_hash as hashed_password, 
            email, 
            first_name, 
            last_name, 
            role,
            CASE WHEN status = 'inactive' THEN true ELSE false END as disabled
        FROM 
            public.user_account
        WHERE 
            username = :username
    """)
    
    result = db.execute(query, {"username": username}).fetchone()
    
    if result:
        user_dict = dict(result._mapping)
        return UserInDB(**user_dict)
    return None

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Base functions that will be enhanced in the main app
def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")  # ✅ FIXED: Extract role from JWT
        user_id: int = payload.get("user_id")  # ✅ FIXED: Extract user_id from JWT
        if username is None:
            raise credentials_exception
        print("🔍 [DEBUG] Decoded JWT payload:", payload)
        token_data = TokenData(username=username, role=role, user_id=user_id)  # ✅ FIXED: Include role and user_id
        return token_data
    except JWTError:
        raise credentials_exception

def get_current_active_user(current_user: User = Depends(get_current_user)):
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Role-based authorization
def get_current_vendor(current_user: User = Depends(get_current_user)):
    if current_user.role != "vendor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Vendor role required."
        )
    return current_user

def get_current_patient(current_user: User = Depends(get_current_user)):
    if current_user.role != "patient":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Patient role required."
        )
    return current_user