"""
Patient Management API Endpoints for Vendors AND Employees
File: patient_management.py

UPDATED VERSION with:
- Role-based access control for employees (manager, editor, viewer)
- Proper permission checking for all roles
- Status filtering support
- Customer_id in response for proper Patient ID display

Permission Matrix:
- Vendor Admin: Full access (create, view, edit, deactivate)
- Manager: Can view, edit, deactivate patients
- Editor: Can view and edit patients
- Viewer: Can only view patients
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime
import re

# Import your existing auth functions and database session
from auth import get_current_user, get_password_hash, TokenData

router = APIRouter(prefix="/api/vendor", tags=["Vendor Patient Management"])

# Database dependency - imported at function call time to avoid circular import
def get_db():  # ✅ Just use get_db as the function name
    from dbRetrievalWithNewMetrics import SessionLocal  # Import INSIDE function
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    """Request model for updating a patient"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    email: Optional[EmailStr] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None

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
    age: Optional[int] = None
    gender: Optional[str] = None
    
class PatientListResponse(BaseModel):
    """Response model for list of patients"""
    patients: List[PatientResponse]
    total_count: int
    vendor_id: str

class UserPermissions(BaseModel):
    """User permission information for patient management"""
    user_id: int
    vendor_id: str
    user_type: Literal['vendor_admin', 'manager', 'editor', 'viewer']
    can_create_patients: bool
    can_view_patients: bool
    can_edit_patients: bool
    can_deactivate_patients: bool

# ==================== Helper Functions ====================

def validate_username(username: str) -> bool:
    """Validate username format"""
    pattern = r'^[a-zA-Z0-9_]{3,50}$'
    return bool(re.match(pattern, username))

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    if not phone:
        return True  # Phone is optional
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
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

def get_employee_info(db: Session, user_id: int) -> Optional[dict]:
    """Get employee information including role and vendor_id"""
    query = text("""
        SELECT 
            ve.employee_id,
            ve.vendor_id,
            ve.employee_role,
            ve.status
        FROM public.vendor_employee ve
        WHERE ve.user_id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).fetchone()
    
    if result:
        return {
            'employee_id': result[0],
            'vendor_id': result[1],
            'employee_role': result[2],
            'status': result[3]
        }
    return None

def get_user_permissions(db: Session, current_user: TokenData) -> UserPermissions:
    """
    Get user permissions for patient management based on role
    
    Permission Matrix:
    - Vendor Admin: Full access
    - Manager: Can view, edit, deactivate patients
    - Editor: Can view and edit patients  
    - Viewer: Can only view patients
    """
    # Get user info
    user_query = text("""
        SELECT user_id, role 
        FROM public.user_account 
        WHERE username = :username
    """)
    user_result = db.execute(user_query, {"username": current_user.username}).fetchone()
    
    if not user_result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    user_id = user_result[0]
    role = user_result[1]
    
    # Check if user is vendor (admin)
    if role == 'vendor':
        vendor_id = get_vendor_id_from_user(db, user_id)
        if not vendor_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor profile not found"
            )
        
        return UserPermissions(
            user_id=user_id,
            vendor_id=vendor_id,
            user_type='vendor_admin',
            can_create_patients=True,
            can_view_patients=True,
            can_edit_patients=True,
            can_deactivate_patients=True
        )
    
    # Check if user is employee
    elif role == 'employee':
        employee_info = get_employee_info(db, user_id)
        if not employee_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee profile not found"
            )
        
        if employee_info['status'] != 'active':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Employee account is inactive"
            )
        
        employee_role = employee_info['employee_role']
        vendor_id = employee_info['vendor_id']
        
        # Set permissions based on employee role
        if employee_role == 'manager':
            return UserPermissions(
                user_id=user_id,
                vendor_id=vendor_id,
                user_type='manager',
                can_create_patients=True,
                can_view_patients=True,
                can_edit_patients=True,
                can_deactivate_patients=True
            )
        elif employee_role == 'editor':
            return UserPermissions(
                user_id=user_id,
                vendor_id=vendor_id,
                user_type='editor',
                can_create_patients=True,
                can_view_patients=True,
                can_edit_patients=True,
                can_deactivate_patients=False
            )
        else:  # viewer
            return UserPermissions(
                user_id=user_id,
                vendor_id=vendor_id,
                user_type='viewer',
                can_create_patients=False,
                can_view_patients=True,
                can_edit_patients=False,
                can_deactivate_patients=False
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and employees can access patient management"
        )

# ==================== API Endpoints ====================

@router.post("/patients", status_code=status.HTTP_201_CREATED)
async def create_patient(
    patient_data: PatientCreateRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new patient account
    
    **Permissions:** Vendor Admin, Manager, Editor
    """
    try:
        # Step 1: Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_create_patients:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to create patients"
            )
        
        # Step 2: Validate input
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
        
        # Step 3: Check if username already exists
        username_check = text("""
            SELECT username FROM public.user_account WHERE username = :username
        """)
        if db.execute(username_check, {"username": patient_data.username}).fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )
        
        # Step 4: Check if email already exists
        email_check = text("""
            SELECT email FROM public.user_account WHERE email = :email
        """)
        if db.execute(email_check, {"email": patient_data.email}).fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        
        # Step 5: Hash password
        hashed_password = get_password_hash(patient_data.password)
        
        # Step 6: Insert into user_account table
        insert_user_query = text("""
            INSERT INTO public.user_account 
            (username, password_hash, email, first_name, last_name, role, phone, age, gender, status, created_at)
            VALUES 
            (:username, :password_hash, :email, :first_name, :last_name, 'patient', :phone, :age, :gender, 'active', CURRENT_TIMESTAMP)
            RETURNING user_id
        """)

        user_result = db.execute(insert_user_query, {
            "username": patient_data.username,
            "password_hash": hashed_password,
            "email": patient_data.email,
            "first_name": patient_data.first_name,
            "last_name": patient_data.last_name,
            "phone": patient_data.phone,
            "age": patient_data.age,          # ✅ Added
            "gender": patient_data.gender      # ✅ Added
        }).fetchone()
        
        new_user_id = user_result[0]
        
        # Step 7: Insert into customers.customer table with vendor tracking
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
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        new_customer_id = customer_result[0]
        
        # Step 8: Commit transaction
        db.commit()
        
        # Step 9: Return success response
        return {
            "message": "Patient account created successfully",
            "customer_id": new_customer_id,
            "user_id": new_user_id,
            "username": patient_data.username,
            "email": patient_data.email,
            "created_by_vendor": permissions.vendor_id,
            "created_by_user_type": permissions.user_type
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
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Get all patients for the current vendor
    
    **Permissions:** All (vendor admin, manager, editor, viewer)
    
    **Query Parameters:**
    - search: Search by username, name, or email
    - status_filter: Filter by status (active/inactive)
    - limit: Number of results (default 100)
    - offset: Pagination offset (default 0)
    """
    try:
        # Step 1: Check permissions and get vendor_id
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_view_patients:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view patients"
            )
        
        vendor_id = permissions.vendor_id
        
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
                c.created_by_vendor_id,
                u.age,
                u.gender
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
                created_by_vendor_id=row[9],
                age=row[10],
                gender=row[11]
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
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific patient
    
    **Permissions:** All (vendor admin, manager, editor, viewer)
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_view_patients:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to view patients"
            )
        
        vendor_id = permissions.vendor_id
        
        # Query patient details
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
                c.age,
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
            "age": result[10],
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


@router.put("/patients/{patient_id}")
async def update_patient(
    patient_id: int,
    patient_data: PatientUpdateRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update patient information
    
    **Permissions:** Vendor Admin, Manager, Editor
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_edit_patients:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to edit patients"
            )
        
        # Verify patient belongs to this vendor
        check_query = text("""
            SELECT c.user_id 
            FROM customers.customer c
            WHERE c.customer_id = :customer_id 
            AND c.created_by_vendor_id = :vendor_id
        """)
        
        patient_result = db.execute(check_query, {
            "customer_id": patient_id,
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        if not patient_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or you don't have permission"
            )
        
        patient_user_id = patient_result[0]
        
        # Build update queries
        user_updates = []
        user_params = {"user_id": patient_user_id}
        
        if patient_data.first_name:
            user_updates.append("first_name = :first_name")
            user_params["first_name"] = patient_data.first_name
        
        if patient_data.last_name:
            user_updates.append("last_name = :last_name")
            user_params["last_name"] = patient_data.last_name
        
        if patient_data.email:
            # Check if email already exists for another user
            email_check = text("""
                SELECT user_id FROM public.user_account 
                WHERE email = :email AND user_id != :user_id
            """)
            if db.execute(email_check, {"email": patient_data.email, "user_id": patient_user_id}).fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists"
                )
            user_updates.append("email = :email")
            user_params["email"] = patient_data.email
        
        if patient_data.phone:
            if not validate_phone(patient_data.phone):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            user_updates.append("phone = :phone")
            user_params["phone"] = patient_data.phone
        
        # Update user_account if there are changes
        if user_updates:
            user_updates.append("updated_at = CURRENT_TIMESTAMP")
            update_user_query = f"""
                UPDATE public.user_account 
                SET {', '.join(user_updates)}
                WHERE user_id = :user_id
            """
            db.execute(text(update_user_query), user_params)
        
        # Update customer table
        customer_updates = []
        customer_params = {"customer_id": patient_id}
        
        if patient_data.age is not None:
            customer_updates.append("age = :age")
            customer_params["age"] = patient_data.age
        
        if patient_data.gender:
            customer_updates.append("gender = :gender")
            customer_params["gender"] = patient_data.gender
        
        if patient_data.phone:
            customer_updates.append("phone = :phone")
            customer_params["phone"] = patient_data.phone
        
        if customer_updates:
            customer_updates.append("updated_at = CURRENT_TIMESTAMP")
            update_customer_query = f"""
                UPDATE customers.customer 
                SET {', '.join(customer_updates)}
                WHERE customer_id = :customer_id
            """
            db.execute(text(update_customer_query), customer_params)
        
        db.commit()
        
        return {
            "message": "Patient updated successfully",
            "customer_id": patient_id,
            "updated_by_user_type": permissions.user_type
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update patient: {str(e)}"
        )


@router.delete("/patients/{patient_id}")
async def deactivate_patient(
    patient_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deactivate a patient account (soft delete)
    
    **Permissions:** Vendor Admin, Manager
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_deactivate_patients:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to deactivate patients"
            )
        
        # Verify patient belongs to this vendor
        check_query = text("""
            SELECT c.user_id 
            FROM customers.customer c
            WHERE c.customer_id = :customer_id 
            AND c.created_by_vendor_id = :vendor_id
        """)
        
        patient_result = db.execute(check_query, {
            "customer_id": patient_id,
            "vendor_id": permissions.vendor_id
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
            "customer_id": patient_id,
            "deactivated_by_user_type": permissions.user_type
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


@router.post("/patients/{patient_id}/activate")
async def activate_patient(
    patient_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate a patient account
    
    **Permissions:** Vendor Admin, Manager
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_deactivate_patients:  # Same permission as deactivate
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to activate patients"
            )
        
        # Verify patient belongs to this vendor
        check_query = text("""
            SELECT c.user_id 
            FROM customers.customer c
            WHERE c.customer_id = :customer_id 
            AND c.created_by_vendor_id = :vendor_id
        """)
        
        patient_result = db.execute(check_query, {
            "customer_id": patient_id,
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        if not patient_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Patient not found or you don't have permission"
            )
        
        # Activate user account
        activate_query = text("""
            UPDATE public.user_account 
            SET status = 'active', updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id
        """)
        
        db.execute(activate_query, {"user_id": patient_result[0]})
        db.commit()
        
        return {
            "message": "Patient account activated successfully",
            "customer_id": patient_id,
            "activated_by_user_type": permissions.user_type
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to activate patient: {str(e)}"
        )