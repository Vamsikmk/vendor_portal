"""
Patient Management API Endpoints for Vendors
File: patient_management.py

Add this to your main FastAPI application or create a new router file.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import re
# from dbRetrievalWithNewMetrics import get_db


# Import your existing auth functions
from auth import get_current_user, get_password_hash, TokenData

# You'll need to import your database session dependency
# from database import get_db  # Adjust this import based on your setup

router = APIRouter(prefix="/api/vendor", tags=["Vendor Patient Management"])

def get_db_session():
    """Get database session - avoiding circular import"""
    # Import here instead of at module level
    from dbRetrievalWithNewMetrics import get_db
    return get_db

# Use this in Depends()
get_db_dependency = get_db_session()

# ==================== Pydantic Models ====================

class PatientCreateRequest(BaseModel):
    """Request model for creating a new patient"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    
    class Config:
        schema_extra = {
            "example": {
                "username": "johndoe",
                "email": "john.doe@example.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+1-555-123-4567"
            }
        }

class PatientResponse(BaseModel):
    """Response model for patient data"""
    customer_id: int
    user_id: int
    username: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    status: str
    created_at: datetime
    created_by_vendor_id: Optional[str]
    
class PatientListResponse(BaseModel):
    """Response model for list of patients"""
    patients: List[PatientResponse]
    total_count: int
    vendor_id: str

# ==================== Helper Functions ====================

def validate_username(username: str) -> bool:
    """Validate username format"""
    # Only alphanumeric and underscores, 3-50 characters
    pattern = r'^[a-zA-Z0-9_]{3,50}$'
    return bool(re.match(pattern, username))

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    # Remove spaces, dashes, parentheses
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    # Check if it's 10-15 digits (supports international)
    return bool(re.match(r'^\+?[0-9]{10,15}$', cleaned))

def get_vendor_id_from_user(db: Session, user_id: int) -> Optional[str]:
    """Get vendor_id from user_id"""
    query = text("""
        SELECT vendor_id 
        FROM public.vendor 
        WHERE user_id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).fetchone()
    return result[0] if result else None

# ==================== API Endpoints ====================

@router.post("/patients", status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreateRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db_dependency)  # Replace with your actual DB dependency
):
    """
    Create a new patient account (vendor only)
    
    - **username**: Unique username (3-50 chars, alphanumeric + underscore)
    - **email**: Valid email address
    - **password**: Password (min 6 characters)
    - **first_name**: Patient's first name
    - **last_name**: Patient's last name
    - **phone**: Phone number
    """
    try:
        # Step 1: Verify the current user is a vendor
        user_query = text("""
            SELECT user_id, role 
            FROM public.user_account 
            WHERE username = :username
        """)
        user_result = db.execute(user_query, {"username": current_user.username}).fetchone()
        
        if not user_result or user_result[1] != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can create patient accounts"
            )
        
        vendor_user_id = user_result[0]
        
        # Step 2: Get vendor_id for this user
        vendor_id = get_vendor_id_from_user(db, vendor_user_id)
        if not vendor_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor profile not found for this user"
            )
        
        # Step 3: Validate input
        if not validate_username(patient_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid username format. Use 3-50 alphanumeric characters or underscores"
            )
        
        if not validate_phone(patient_data.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format"
            )
        
        # Step 4: Check if username already exists
        username_check = text("""
            SELECT username FROM public.user_account WHERE username = :username
        """)
        if db.execute(username_check, {"username": patient_data.username}).fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )
        
        # Step 5: Check if email already exists
        email_check = text("""
            SELECT email FROM public.user_account WHERE email = :email
        """)
        if db.execute(email_check, {"email": patient_data.email}).fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        
        # Step 6: Hash password
        hashed_password = get_password_hash(patient_data.password)
        
        # Step 7: Insert into user_account table
        insert_user_query = text("""
            INSERT INTO public.user_account 
            (username, password_hash, email, first_name, last_name, role, phone, status, created_at)
            VALUES 
            (:username, :password_hash, :email, :first_name, :last_name, 'patient', :phone, 'active', CURRENT_TIMESTAMP)
            RETURNING user_id
        """)
        
        user_result = db.execute(insert_user_query, {
            "username": patient_data.username,
            "password_hash": hashed_password,
            "email": patient_data.email,
            "first_name": patient_data.first_name,
            "last_name": patient_data.last_name,
            "phone": patient_data.phone
        }).fetchone()
        
        new_user_id = user_result[0]
        
        # Step 8: Insert into customers.customer table with vendor tracking
        insert_customer_query = text("""
            INSERT INTO customers.customer 
            (user_id, phone, created_by_vendor_id, created_at, updated_at)
            VALUES 
            (:user_id, :phone, :vendor_id, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING customer_id
        """)
        
        customer_result = db.execute(insert_customer_query, {
            "user_id": new_user_id,
            "phone": patient_data.phone,
            "vendor_id": vendor_id
        }).fetchone()
        
        new_customer_id = customer_result[0]
        
        # Step 9: Commit transaction
        db.commit()
        
        # Step 10: Return success response
        return {
            "message": "Patient account created successfully",
            "customer_id": new_customer_id,
            "user_id": new_user_id,
            "username": patient_data.username,
            "email": patient_data.email,
            "created_by_vendor": vendor_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create patient: {str(e)}"
        )


@router.get("/patients", response_model=PatientListResponse)
async def get_vendor_patients(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db_dependency),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Get all patients created by the current vendor
    
    - **search**: Optional search term (username, name, email)
    - **status_filter**: Filter by status (active/inactive)
    - **limit**: Number of results to return
    - **offset**: Pagination offset
    """
    try:
        # Step 1: Verify vendor
        user_query = text("""
            SELECT user_id, role 
            FROM public.user_account 
            WHERE username = :username
        """)
        user_result = db.execute(user_query, {"username": current_user.username}).fetchone()
        
        if not user_result or user_result[1] != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access patient data"
            )
        
        vendor_user_id = user_result[0]
        vendor_id = get_vendor_id_from_user(db, vendor_user_id)
        
        # Step 2: Build query with filters
        query_params = {"vendor_id": vendor_id}
        
        base_query = """
            SELECT 
                c.customer_id,
                c.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                u.status,
                u.created_at,
                c.created_by_vendor_id
            FROM customers.customer c
            JOIN public.user_account u ON c.user_id = u.user_id
            WHERE c.created_by_vendor_id = :vendor_id
        """
        
        # Add search filter
        if search:
            base_query += """
                AND (
                    u.username ILIKE :search 
                    OR u.first_name ILIKE :search 
                    OR u.last_name ILIKE :search 
                    OR u.email ILIKE :search
                )
            """
            query_params["search"] = f"%{search}%"
        
        # Add status filter
        if status_filter:
            base_query += " AND u.status = :status"
            query_params["status"] = status_filter
        
        # Add ordering and pagination
        base_query += " ORDER BY u.created_at DESC LIMIT :limit OFFSET :offset"
        query_params["limit"] = limit
        query_params["offset"] = offset
        
        # Step 3: Execute query
        result = db.execute(text(base_query), query_params).fetchall()
        
        # Step 4: Get total count
        count_query = """
            SELECT COUNT(*) 
            FROM customers.customer c
            JOIN public.user_account u ON c.user_id = u.user_id
            WHERE c.created_by_vendor_id = :vendor_id
        """
        if search:
            count_query += """
                AND (
                    u.username ILIKE :search 
                    OR u.first_name ILIKE :search 
                    OR u.last_name ILIKE :search 
                    OR u.email ILIKE :search
                )
            """
        if status_filter:
            count_query += " AND u.status = :status"
            
        total_count = db.execute(text(count_query), query_params).scalar()
        
        # Step 5: Format response
        patients = [
            PatientResponse(
                customer_id=row[0],
                user_id=row[1],
                username=row[2],
                email=row[3],
                first_name=row[4],
                last_name=row[5],
                phone=row[6],
                status=row[7],
                created_at=row[8],
                created_by_vendor_id=row[9]
            )
            for row in result
        ]
        
        return PatientListResponse(
            patients=patients,
            total_count=total_count,
            vendor_id=vendor_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch patients: {str(e)}"
        )


@router.get("/patients/{patient_id}")
async def get_patient_details(
    patient_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db_dependency)
):
    """
    Get detailed information about a specific patient
    """
    try:
        # Verify vendor
        user_query = text("""
            SELECT user_id, role FROM public.user_account WHERE username = :username
        """)
        user_result = db.execute(user_query, {"username": current_user.username}).fetchone()
        
        if not user_result or user_result[1] != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access patient data"
            )
        
        vendor_id = get_vendor_id_from_user(db, user_result[0])
        
        # Get patient details
        query = text("""
            SELECT 
                c.customer_id,
                c.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                u.status,
                u.created_at,
                c.created_by_vendor_id,
                c.date_of_birth,
                c.gender,
                c.address,
                c.city,
                c.state,
                c.postal_code,
                c.country
            FROM customers.customer c
            JOIN public.user_account u ON c.user_id = u.user_id
            WHERE c.customer_id = :customer_id 
            AND c.created_by_vendor_id = :vendor_id
        """)
        
        result = db.execute(query, {
            "customer_id": patient_id,
            "vendor_id": vendor_id
        }).fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or you don't have permission to access this patient"
            )
        
        return {
            "customer_id": result[0],
            "user_id": result[1],
            "username": result[2],
            "email": result[3],
            "first_name": result[4],
            "last_name": result[5],
            "phone": result[6],
            "status": result[7],
            "created_at": result[8],
            "created_by_vendor_id": result[9],
            "date_of_birth": result[10],
            "gender": result[11],
            "address": result[12],
            "city": result[13],
            "state": result[14],
            "postal_code": result[15],
            "country": result[16]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch patient details: {str(e)}"
        )


@router.delete("/patients/{patient_id}")
async def deactivate_patient(
    patient_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db_dependency)
):
    """
    Deactivate a patient account (soft delete)
    """
    try:
        # Verify vendor
        user_query = text("""
            SELECT user_id, role FROM public.user_account WHERE username = :username
        """)
        user_result = db.execute(user_query, {"username": current_user.username}).fetchone()
        
        if not user_result or user_result[1] != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can deactivate patient accounts"
            )
        
        vendor_id = get_vendor_id_from_user(db, user_result[0])
        
        # Verify patient belongs to this vendor
        check_query = text("""
            SELECT c.user_id 
            FROM customers.customer c
            WHERE c.customer_id = :customer_id 
            AND c.created_by_vendor_id = :vendor_id
        """)
        
        patient_result = db.execute(check_query, {
            "customer_id": patient_id,
            "vendor_id": vendor_id
        }).fetchone()
        
        if not patient_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or you don't have permission"
            )
        
        # Deactivate user account
        deactivate_query = text("""
            UPDATE public.user_account 
            SET status = 'inactive', updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id
        """)
        
        db.execute(deactivate_query, {"user_id": patient_result[0]})
        db.commit()
        
        return {
            "message": "Patient account deactivated successfully",
            "customer_id": patient_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to deactivate patient: {str(e)}"
        )


# ==================== Register Router ====================
# Add this to your main FastAPI app:
# app.include_router(router)