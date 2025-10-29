"""
Patient Management API Endpoints for Vendors
File: patient_management.py

FINAL VERSION with:
- Status filtering support
- customer_id in response for proper Patient ID display
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
import re

# Import your existing auth functions and database session
from auth import get_current_user, get_password_hash, TokenData
from database import get_db

router = APIRouter(prefix="/api/vendor", tags=["Vendor Patient Management"])

# ==================== Pydantic Models ====================

class PatientCreateRequest(BaseModel):
    """Request model for creating a new patient"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=8)
    first_name: str
    last_name: str
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "username": "jane_doe",
                "email": "jane.doe@example.com",
                "password": "SecurePassword123",
                "first_name": "Jane",
                "last_name": "Doe",
                "phone": "+1-555-0123",
                "age": 30,
                "gender": "female"
            }
        }

class PatientUpdateRequest(BaseModel):
    """Request model for updating patient information"""
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    status: Optional[str] = None

class PatientResponse(BaseModel):
    """Response model for patient information"""
    user_id: int
    customer_id: Optional[int] = None  # ✅ ADDED for Patient ID display
    username: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    age: Optional[int]
    gender: Optional[str]
    role: str
    status: str
    created_at: datetime
    
    class Config:
        orm_mode = True

class PatientsListResponse(BaseModel):
    """Response model for list of patients"""
    total: int
    patients: List[PatientResponse]

# ==================== Helper Functions ====================

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    if not phone:
        return True  # Optional field
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    return bool(re.match(r'^\+?[0-9]{10,15}$', cleaned))

def validate_username(username: str) -> bool:
    """Validate username format"""
    return bool(re.match(r'^[a-zA-Z0-9_]{3,50}$', username))

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
    db: Session = Depends(get_db)
):
    """
    Create a new patient account (vendor only)
    
    ✨ AUTOMATIC CUSTOMER CREATION ✨
    The database trigger automatically creates the customer record!
    
    - **username**: Unique username (3-50 chars, alphanumeric + underscore)
    - **email**: Valid email address
    - **password**: Password (min 8 characters)
    - **first_name**: Patient's first name
    - **last_name**: Patient's last name
    - **phone**: Phone number (optional)
    - **age**: Patient age (optional)
    - **gender**: Patient gender (optional)
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
        
        if patient_data.phone and not validate_phone(patient_data.phone):
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
        # ✨ The trigger will automatically create the customer record! ✨
        insert_user_query = text("""
            INSERT INTO public.user_account 
            (username, password_hash, email, first_name, last_name, role, 
             phone, age, gender, status, created_by_vendor_id, created_at)
            VALUES 
            (:username, :password_hash, :email, :first_name, :last_name, 'patient', 
             :phone, :age, :gender, 'active', :vendor_id, CURRENT_TIMESTAMP)
            RETURNING user_id, username, email, first_name, last_name, phone, age, gender, role, status, created_at
        """)
        
        user_result = db.execute(insert_user_query, {
            "username": patient_data.username,
            "password_hash": hashed_password,
            "email": patient_data.email,
            "first_name": patient_data.first_name,
            "last_name": patient_data.last_name,
            "phone": patient_data.phone,
            "age": patient_data.age,
            "gender": patient_data.gender,
            "vendor_id": vendor_id  # ✨ This triggers automatic customer creation
        }).fetchone()
        
        db.commit()
        
        new_user_id = user_result[0]
        print(f"✅ Created patient user_id: {new_user_id} (customer auto-created by trigger)")
        
        # ✅ Get the customer_id for the response
        customer_query = text("""
            SELECT customer_id FROM customers.customer WHERE user_id = :user_id
        """)
        customer_result = db.execute(customer_query, {"user_id": new_user_id}).fetchone()
        customer_id = customer_result[0] if customer_result else None
        
        return PatientResponse(
            user_id=user_result[0],
            customer_id=customer_id,  # ✅ Include customer_id
            username=user_result[1],
            email=user_result[2],
            first_name=user_result[3],
            last_name=user_result[4],
            phone=user_result[5],
            age=user_result[6],
            gender=user_result[7],
            role=user_result[8],
            status=user_result[9],
            created_at=user_result[10]
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create patient: {str(e)}"
        )

@router.get("/patients", response_model=PatientsListResponse)
async def list_patients(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    status_filter: Optional[str] = None,  # ✅ ADDED status filtering
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a list of all patients for the current vendor.
    
    - **skip**: Number of records to skip (for pagination)
    - **limit**: Maximum number of records to return
    - **search**: Optional search term to filter by name, username, or email
    - **status_filter**: Optional status filter ('active', 'inactive', or 'all')
    """
    
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
            detail="Only vendors can list patients"
        )
    
    vendor_user_id = user_result[0]
    
    # Step 2: Get vendor_id for this user
    vendor_id = get_vendor_id_from_user(db, vendor_user_id)
    if not vendor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found for this user"
        )
    
    # Build base WHERE clause
    where_conditions = [
        "ua.created_by_vendor_id = :vendor_id",
        "ua.role = 'patient'"
    ]
    
    # ✅ Add status filter if provided
    if status_filter and status_filter != 'all':
        where_conditions.append("ua.status = :status_filter")
    
    # ✅ Add search filter if provided
    if search:
        where_conditions.append("""
            (ua.username ILIKE :search 
             OR ua.email ILIKE :search 
             OR CONCAT(ua.first_name, ' ', ua.last_name) ILIKE :search)
        """)
    
    where_clause = " AND ".join(where_conditions)
    
    # Build queries with customer_id
    count_query = text(f"""
        SELECT COUNT(DISTINCT ua.user_id) as total
        FROM public.user_account ua
        WHERE {where_clause}
    """)
    
    select_query = text(f"""
        SELECT 
            ua.user_id, 
            ua.username, 
            ua.email, 
            ua.first_name, 
            ua.last_name, 
            ua.phone, 
            ua.age, 
            ua.gender, 
            ua.role, 
            ua.status, 
            ua.created_at,
            c.customer_id
        FROM public.user_account ua
        LEFT JOIN customers.customer c ON c.user_id = ua.user_id
        WHERE {where_clause}
        ORDER BY ua.created_at DESC
        LIMIT :limit OFFSET :skip
    """)
    
    # Build parameters
    params = {
        "vendor_id": vendor_id,
        "limit": limit,
        "skip": skip
    }
    
    if status_filter and status_filter != 'all':
        params["status_filter"] = status_filter
    
    if search:
        params["search"] = f"%{search}%"
    
    # Execute queries
    total_result = db.execute(count_query, params)
    patients_result = db.execute(select_query, params)
    
    total = total_result.fetchone()[0]
    patients = patients_result.fetchall()
    
    patient_list = [
        PatientResponse(
            user_id=p[0],
            username=p[1],
            email=p[2],
            first_name=p[3],
            last_name=p[4],
            phone=p[5],
            age=p[6],
            gender=p[7],
            role=p[8],
            status=p[9],
            created_at=p[10],
            customer_id=p[11]  # ✅ Include customer_id
        )
        for p in patients
    ]
    
    return PatientsListResponse(
        total=total,
        patients=patient_list
    )

@router.get("/patients/{patient_id}", response_model=PatientResponse)
async def get_patient(
    patient_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get details of a specific patient by ID.
    
    - **patient_id**: The ID of the patient (user_id)
    """
    
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
            detail="Only vendors can view patient details"
        )
    
    vendor_user_id = user_result[0]
    
    # Step 2: Get vendor_id for this user
    vendor_id = get_vendor_id_from_user(db, vendor_user_id)
    if not vendor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found for this user"
        )
    
    # ✅ Include customer_id in the query
    query = text("""
        SELECT 
            ua.user_id, 
            ua.username, 
            ua.email, 
            ua.first_name, 
            ua.last_name,
            ua.phone, 
            ua.age, 
            ua.gender, 
            ua.role, 
            ua.status, 
            ua.created_at,
            c.customer_id
        FROM public.user_account ua
        LEFT JOIN customers.customer c ON c.user_id = ua.user_id
        WHERE ua.user_id = :patient_id 
        AND ua.created_by_vendor_id = :vendor_id 
        AND ua.role = 'patient'
    """)
    
    result = db.execute(query, {
        "patient_id": patient_id,
        "vendor_id": vendor_id
    })
    
    patient = result.fetchone()
    
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or does not belong to this vendor"
        )
    
    return PatientResponse(
        user_id=patient[0],
        username=patient[1],
        email=patient[2],
        first_name=patient[3],
        last_name=patient[4],
        phone=patient[5],
        age=patient[6],
        gender=patient[7],
        role=patient[8],
        status=patient[9],
        created_at=patient[10],
        customer_id=patient[11]  # ✅ Include customer_id
    )

@router.put("/patients/{patient_id}", response_model=PatientResponse)
async def update_patient(
    patient_id: int,
    patient_update: PatientUpdateRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a patient's information.
    
    - **patient_id**: The ID of the patient to update (user_id)
    - Only provided fields will be updated
    """
    
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
            detail="Only vendors can update patients"
        )
    
    vendor_user_id = user_result[0]
    
    # Step 2: Get vendor_id for this user
    vendor_id = get_vendor_id_from_user(db, vendor_user_id)
    if not vendor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found for this user"
        )
    
    # Check if patient exists and belongs to this vendor
    check_query = text("""
        SELECT ua.user_id 
        FROM public.user_account ua
        WHERE ua.user_id = :patient_id 
        AND ua.created_by_vendor_id = :vendor_id 
        AND ua.role = 'patient'
    """)
    
    existing_patient = db.execute(check_query, {
        "patient_id": patient_id,
        "vendor_id": vendor_id
    }).fetchone()
    
    if not existing_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or does not belong to this vendor"
        )
    
    # Validate phone if provided
    if patient_update.phone and not validate_phone(patient_update.phone):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )
    
    # Build update query dynamically based on provided fields
    update_fields = []
    params = {"patient_id": patient_id}
    
    if patient_update.email is not None:
        update_fields.append("email = :email")
        params["email"] = patient_update.email
    
    if patient_update.first_name is not None:
        update_fields.append("first_name = :first_name")
        params["first_name"] = patient_update.first_name
    
    if patient_update.last_name is not None:
        update_fields.append("last_name = :last_name")
        params["last_name"] = patient_update.last_name
    
    if patient_update.phone is not None:
        update_fields.append("phone = :phone")
        params["phone"] = patient_update.phone
    
    if patient_update.age is not None:
        update_fields.append("age = :age")
        params["age"] = patient_update.age
    
    if patient_update.gender is not None:
        update_fields.append("gender = :gender")
        params["gender"] = patient_update.gender
    
    if patient_update.status is not None:
        update_fields.append("status = :status")
        params["status"] = patient_update.status
    
    if not update_fields:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields to update"
        )
    
    update_query = text(f"""
        UPDATE public.user_account
        SET {', '.join(update_fields)}
        WHERE user_id = :patient_id
        RETURNING user_id, username, email, first_name, last_name, phone, age, gender, role, status, created_at
    """)
    
    result = db.execute(update_query, params)
    db.commit()
    
    updated_patient = result.fetchone()
    
    # Get customer_id
    customer_query = text("""
        SELECT customer_id FROM customers.customer WHERE user_id = :user_id
    """)
    customer_result = db.execute(customer_query, {"user_id": updated_patient[0]}).fetchone()
    customer_id = customer_result[0] if customer_result else None
    
    return PatientResponse(
        user_id=updated_patient[0],
        username=updated_patient[1],
        email=updated_patient[2],
        first_name=updated_patient[3],
        last_name=updated_patient[4],
        phone=updated_patient[5],
        age=updated_patient[6],
        gender=updated_patient[7],
        role=updated_patient[8],
        status=updated_patient[9],
        created_at=updated_patient[10],
        customer_id=customer_id  # ✅ Include customer_id
    )

@router.delete("/patients/{patient_id}")
async def delete_patient(
    patient_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a patient (soft delete by setting status to inactive).
    
    - **patient_id**: The ID of the patient to delete (user_id)
    """
    
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
            detail="Only vendors can delete patients"
        )
    
    vendor_user_id = user_result[0]
    
    # Step 2: Get vendor_id for this user
    vendor_id = get_vendor_id_from_user(db, vendor_user_id)
    if not vendor_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor profile not found for this user"
        )
    
    # Check if patient exists and belongs to this vendor
    check_query = text("""
        SELECT ua.user_id 
        FROM public.user_account ua
        WHERE ua.user_id = :patient_id 
        AND ua.created_by_vendor_id = :vendor_id 
        AND ua.role = 'patient'
    """)
    
    existing_patient = db.execute(check_query, {
        "patient_id": patient_id,
        "vendor_id": vendor_id
    }).fetchone()
    
    if not existing_patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Patient not found or does not belong to this vendor"
        )
    
    # Soft delete - set status to inactive
    delete_query = text("""
        UPDATE public.user_account
        SET status = 'inactive'
        WHERE user_id = :patient_id
    """)
    
    db.execute(delete_query, {"patient_id": patient_id})
    db.commit()
    
    return {
        "message": "Patient account deactivated successfully",
        "patient_id": patient_id
    }