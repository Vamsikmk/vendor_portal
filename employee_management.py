"""
Employee Management API Endpoints for Vendors
File: employee_management.py

This module provides complete employee management functionality with role-based access control:
- Vendors (Admin) can: Create, Read, Update, Delete employees
- Managers can: Create, Read, Update, Deactivate employees
- Editors can: Read employees (limited)
- Viewers can: Read employees (limited)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Literal
from datetime import datetime
import re
from database import get_db 

# Import existing auth functions
from auth import get_current_user, get_password_hash, TokenData

# Router setup
router = APIRouter(prefix="/api/vendor", tags=["Vendor Employee Management"])


# ==================== Pydantic Models ====================

class EmployeeCreateRequest(BaseModel):
    """Request model for creating a new employee"""
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: str = Field(..., min_length=10, max_length=20)
    employee_role: Literal['viewer', 'editor', 'manager'] = Field(default='viewer')
    department: Optional[str] = Field(None, max_length=100)
    
    class Config:
        schema_extra = {
            "example": {
                "username": "john_smith",
                "email": "john.smith@company.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Smith",
                "phone": "555-0123",
                "employee_role": "editor",
                "department": "Sales"
            }
        }

class EmployeeUpdateRequest(BaseModel):
    """Request model for updating an employee"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, min_length=10, max_length=20)
    email: Optional[EmailStr] = None
    employee_role: Optional[Literal['viewer', 'editor', 'manager']] = None
    department: Optional[str] = Field(None, max_length=100)

class EmployeeResponse(BaseModel):
    """Response model for employee data"""
    employee_id: int
    user_id: int
    username: str
    email: str
    first_name: str
    last_name: str
    phone: Optional[str]
    employee_role: str
    department: Optional[str]
    status: str
    created_at: datetime
    created_by_username: Optional[str]
    vendor_id: str
    vendor_company_name: str
    
class EmployeeListResponse(BaseModel):
    """Response model for list of employees"""
    employees: List[EmployeeResponse]
    total_count: int
    vendor_id: str

class UserPermissions(BaseModel):
    """User permission information"""
    user_id: int
    vendor_id: str
    user_type: Literal['vendor_admin', 'manager', 'editor', 'viewer']
    can_create_employees: bool
    can_edit_employees: bool
    can_delete_employees: bool
    can_deactivate_employees: bool

# ==================== Helper Functions ====================

def validate_username(username: str) -> bool:
    """Validate username format (alphanumeric and underscores, 3-50 chars)"""
    pattern = r'^[a-zA-Z0-9_]{3,50}$'
    return bool(re.match(pattern, username))

def validate_phone(phone: str) -> bool:
    """Validate phone number format"""
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    return bool(re.match(r'^\+?[0-9]{10,15}$', cleaned))

def get_vendor_id_from_user(db: Session, user_id: int) -> Optional[str]:
    """Get vendor_id from user_id (for vendor owners)"""
    query = text("""
        SELECT vendor_id 
        FROM public.vendor 
        WHERE user_id = :user_id
    """)
    result = db.execute(query, {"user_id": user_id}).fetchone()
    return result[0] if result else None

def get_employee_info(db: Session, user_id: int) -> Optional[dict]:
    """Get employee information from vendor_employee table"""
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
            "employee_id": result[0],
            "vendor_id": result[1],
            "employee_role": result[2],
            "status": result[3]
        }
    return None

def get_user_permissions(db: Session, current_user: TokenData) -> UserPermissions:
    """
    Determine user permissions based on their role
    Returns UserPermissions object with access control flags
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
    
    # Check if user is vendor admin (owner)
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
            can_create_employees=True,
            can_edit_employees=True,
            can_delete_employees=True,
            can_deactivate_employees=True
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
                can_create_employees=True,
                can_edit_employees=True,
                can_delete_employees=False,  # Only vendor admin can delete
                can_deactivate_employees=True
            )
        elif employee_role == 'editor':
            return UserPermissions(
                user_id=user_id,
                vendor_id=vendor_id,
                user_type='editor',
                can_create_employees=False,
                can_edit_employees=False,
                can_delete_employees=False,
                can_deactivate_employees=False
            )
        else:  # viewer
            return UserPermissions(
                user_id=user_id,
                vendor_id=vendor_id,
                user_type='viewer',
                can_create_employees=False,
                can_edit_employees=False,
                can_delete_employees=False,
                can_deactivate_employees=False
            )
    
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only vendors and employees can access this endpoint"
        )

# ==================== API Endpoints ====================

@router.post("/employees", status_code=status.HTTP_201_CREATED)
async def create_employee(
    employee_data: EmployeeCreateRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new employee account
    
    **Permissions:** Vendor Admin, Manager
    
    **Request Body:**
    - username: Unique username (3-50 chars, alphanumeric + underscore)
    - email: Valid email address
    - password: Password (min 6 characters)
    - first_name: Employee's first name
    - last_name: Employee's last name
    - phone: Phone number
    - employee_role: viewer | editor | manager
    - department: Optional department name
    """
    try:
        # Step 1: Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_create_employees:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to create employees"
            )
        
        # Step 2: Validate input
        if not validate_username(employee_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid username format. Use 3-50 alphanumeric characters or underscores"
            )
        
        if not validate_phone(employee_data.phone):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid phone number format"
            )
        
        # Step 3: Check if username already exists
        username_check = text("""
            SELECT username FROM public.user_account WHERE username = :username
        """)
        if db.execute(username_check, {"username": employee_data.username}).fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already exists"
            )
        
        # Step 4: Check if email already exists
        email_check = text("""
            SELECT email FROM public.user_account WHERE email = :email
        """)
        if db.execute(email_check, {"email": employee_data.email}).fetchone():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already exists"
            )
        
        # Step 5: Hash password
        hashed_password = get_password_hash(employee_data.password)
        
        # Step 6: Insert into user_account table with role='employee'
        insert_user_query = text("""
            INSERT INTO public.user_account 
            (username, password_hash, email, first_name, last_name, role, phone, status, created_at)
            VALUES 
            (:username, :password_hash, :email, :first_name, :last_name, 'employee', :phone, 'active', CURRENT_TIMESTAMP)
            RETURNING user_id
        """)
        
        user_result = db.execute(insert_user_query, {
            "username": employee_data.username,
            "password_hash": hashed_password,
            "email": employee_data.email,
            "first_name": employee_data.first_name,
            "last_name": employee_data.last_name,
            "phone": employee_data.phone
        }).fetchone()
        
        new_user_id = user_result[0]
        
        # Step 7: Insert into vendor_employee table
        insert_employee_query = text("""
            INSERT INTO public.vendor_employee 
            (user_id, vendor_id, employee_role, department, created_by_user_id, status, created_at, updated_at)
            VALUES 
            (:user_id, :vendor_id, :employee_role, :department, :created_by_user_id, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            RETURNING employee_id
        """)
        
        employee_result = db.execute(insert_employee_query, {
            "user_id": new_user_id,
            "vendor_id": permissions.vendor_id,
            "employee_role": employee_data.employee_role,
            "department": employee_data.department,
            "created_by_user_id": permissions.user_id
        }).fetchone()
        
        new_employee_id = employee_result[0]
        
        # Step 8: Commit transaction
        db.commit()
        
        # Step 9: Return success response
        return {
            "message": "Employee account created successfully",
            "employee_id": new_employee_id,
            "user_id": new_user_id,
            "username": employee_data.username,
            "email": employee_data.email,
            "employee_role": employee_data.employee_role,
            "vendor_id": permissions.vendor_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}"
        )


@router.get("/employees", response_model=EmployeeListResponse)
async def get_employees(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    role_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
):
    """
    Get all employees for the current vendor
    
    **Permissions:** All (vendor admin, manager, editor, viewer)
    
    **Query Parameters:**
    - search: Search by username, name, or email
    - role_filter: Filter by employee role (viewer/editor/manager)
    - status_filter: Filter by status (active/inactive)
    - limit: Number of results (default 100)
    - offset: Pagination offset (default 0)
    """
    try:
        # Step 1: Check permissions and get vendor_id
        permissions = get_user_permissions(db, current_user)
        vendor_id = permissions.vendor_id
        
        # Step 2: Build query
        query_params = {"vendor_id": vendor_id}
        
        base_query = """
            SELECT 
                ve.employee_id,
                ve.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                ve.employee_role,
                ve.department,
                ve.status,
                ve.created_at,
                creator.username as created_by_username,
                v.vendor_id,
                v.company_name as vendor_company_name
            FROM public.vendor_employee ve
            JOIN public.user_account u ON ve.user_id = u.user_id
            JOIN public.vendor v ON ve.vendor_id = v.vendor_id
            LEFT JOIN public.user_account creator ON ve.created_by_user_id = creator.user_id
            WHERE ve.vendor_id = :vendor_id
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
        
        # Add role filter
        if role_filter and role_filter in ['viewer', 'editor', 'manager']:
            base_query += " AND ve.employee_role = :role"
            query_params["role"] = role_filter
        
        # Add status filter
        if status_filter and status_filter in ['active', 'inactive']:
            base_query += " AND ve.status = :status"
            query_params["status"] = status_filter
        
        # Add ordering and pagination
        base_query += " ORDER BY ve.created_at DESC LIMIT :limit OFFSET :offset"
        query_params["limit"] = limit
        query_params["offset"] = offset
        
        # Step 3: Execute query
        result = db.execute(text(base_query), query_params).fetchall()
        
        # Step 4: Get total count
        count_query = """
            SELECT COUNT(*) 
            FROM public.vendor_employee ve
            JOIN public.user_account u ON ve.user_id = u.user_id
            WHERE ve.vendor_id = :vendor_id
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
        if role_filter:
            count_query += " AND ve.employee_role = :role"
        if status_filter:
            count_query += " AND ve.status = :status"
            
        total_count = db.execute(text(count_query), query_params).scalar()
        
        # Step 5: Format response
        employees = [
            EmployeeResponse(
                employee_id=row[0],
                user_id=row[1],
                username=row[2],
                email=row[3],
                first_name=row[4],
                last_name=row[5],
                phone=row[6],
                employee_role=row[7],
                department=row[8],
                status=row[9],
                created_at=row[10],
                created_by_username=row[11],
                vendor_id=row[12],
                vendor_company_name=row[13]
            )
            for row in result
        ]
        
        return EmployeeListResponse(
            employees=employees,
            total_count=total_count,
            vendor_id=vendor_id
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employees: {str(e)}"
        )


@router.get("/employees/{employee_id}")
async def get_employee_details(
    employee_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific employee
    
    **Permissions:** All (vendor admin, manager, editor, viewer)
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        # Get employee details
        query = text("""
            SELECT 
                ve.employee_id,
                ve.user_id,
                u.username,
                u.email,
                u.first_name,
                u.last_name,
                u.phone,
                ve.employee_role,
                ve.department,
                ve.status,
                ve.created_at,
                ve.updated_at,
                creator.username as created_by_username,
                creator.first_name || ' ' || creator.last_name as created_by_name,
                v.vendor_id,
                v.company_name as vendor_company_name
            FROM public.vendor_employee ve
            JOIN public.user_account u ON ve.user_id = u.user_id
            JOIN public.vendor v ON ve.vendor_id = v.vendor_id
            LEFT JOIN public.user_account creator ON ve.created_by_user_id = creator.user_id
            WHERE ve.employee_id = :employee_id 
            AND ve.vendor_id = :vendor_id
        """)
        
        result = db.execute(query, {
            "employee_id": employee_id,
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found or you don't have permission to view"
            )
        
        return {
            "employee_id": result[0],
            "user_id": result[1],
            "username": result[2],
            "email": result[3],
            "first_name": result[4],
            "last_name": result[5],
            "phone": result[6],
            "employee_role": result[7],
            "department": result[8],
            "status": result[9],
            "created_at": result[10],
            "updated_at": result[11],
            "created_by_username": result[12],
            "created_by_name": result[13],
            "vendor_id": result[14],
            "vendor_company_name": result[15]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch employee details: {str(e)}"
        )


@router.put("/employees/{employee_id}")
async def update_employee(
    employee_id: int,
    employee_data: EmployeeUpdateRequest,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update employee information
    
    **Permissions:** Vendor Admin, Manager
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_edit_employees:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to edit employees"
            )
        
        # Verify employee belongs to this vendor
        check_query = text("""
            SELECT ve.user_id, ve.employee_role
            FROM public.vendor_employee ve
            WHERE ve.employee_id = :employee_id 
            AND ve.vendor_id = :vendor_id
        """)
        
        employee_result = db.execute(check_query, {
            "employee_id": employee_id,
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        if not employee_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found or you don't have permission"
            )
        
        employee_user_id = employee_result[0]
        
        # Build update queries
        user_updates = []
        user_params = {"user_id": employee_user_id}
        
        if employee_data.first_name:
            user_updates.append("first_name = :first_name")
            user_params["first_name"] = employee_data.first_name
        
        if employee_data.last_name:
            user_updates.append("last_name = :last_name")
            user_params["last_name"] = employee_data.last_name
        
        if employee_data.email:
            # Check if email already exists for another user
            email_check = text("""
                SELECT user_id FROM public.user_account 
                WHERE email = :email AND user_id != :user_id
            """)
            if db.execute(email_check, {"email": employee_data.email, "user_id": employee_user_id}).fetchone():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already exists"
                )
            user_updates.append("email = :email")
            user_params["email"] = employee_data.email
        
        if employee_data.phone:
            if not validate_phone(employee_data.phone):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid phone number format"
                )
            user_updates.append("phone = :phone")
            user_params["phone"] = employee_data.phone
        
        # Update user_account if there are changes
        if user_updates:
            user_updates.append("updated_at = CURRENT_TIMESTAMP")
            update_user_query = f"""
                UPDATE public.user_account 
                SET {', '.join(user_updates)}
                WHERE user_id = :user_id
            """
            db.execute(text(update_user_query), user_params)
        
        # Update vendor_employee table
        employee_updates = []
        employee_params = {
            "employee_id": employee_id,
            "updated_by_user_id": permissions.user_id
        }
        
        if employee_data.employee_role:
            employee_updates.append("employee_role = :employee_role")
            employee_params["employee_role"] = employee_data.employee_role
        
        if employee_data.department is not None:  # Allow setting to NULL
            employee_updates.append("department = :department")
            employee_params["department"] = employee_data.department
        
        if employee_updates:
            employee_updates.append("updated_by_user_id = :updated_by_user_id")
            employee_updates.append("updated_at = CURRENT_TIMESTAMP")
            update_employee_query = f"""
                UPDATE public.vendor_employee 
                SET {', '.join(employee_updates)}
                WHERE employee_id = :employee_id
            """
            db.execute(text(update_employee_query), employee_params)
        
        db.commit()
        
        return {
            "message": "Employee updated successfully",
            "employee_id": employee_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee: {str(e)}"
        )


@router.put("/employees/{employee_id}/status")
async def update_employee_status(
    employee_id: int,
    status: Literal['active', 'inactive'],
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Activate or deactivate an employee account
    
    **Permissions:** Vendor Admin, Manager
    """
    try:
        # Check permissions
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_deactivate_employees:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to change employee status"
            )
        
        # Verify employee belongs to this vendor
        check_query = text("""
            SELECT ve.user_id
            FROM public.vendor_employee ve
            WHERE ve.employee_id = :employee_id 
            AND ve.vendor_id = :vendor_id
        """)
        
        employee_result = db.execute(check_query, {
            "employee_id": employee_id,
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        if not employee_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found or you don't have permission"
            )
        
        # Update status in vendor_employee table
        update_query = text("""
            UPDATE public.vendor_employee 
            SET status = :status, 
                updated_by_user_id = :updated_by_user_id,
                updated_at = CURRENT_TIMESTAMP
            WHERE employee_id = :employee_id
        """)
        
        db.execute(update_query, {
            "status": status,
            "employee_id": employee_id,
            "updated_by_user_id": permissions.user_id
        })
        
        # Also update user_account status
        update_user_query = text("""
            UPDATE public.user_account 
            SET status = :status, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = :user_id
        """)
        
        db.execute(update_user_query, {
            "status": status,
            "user_id": employee_result[0]
        })
        
        db.commit()
        
        action = "activated" if status == "active" else "deactivated"
        return {
            "message": f"Employee {action} successfully",
            "employee_id": employee_id,
            "status": status
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee status: {str(e)}"
        )


@router.delete("/employees/{employee_id}")
async def delete_employee(
    employee_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Permanently delete an employee (hard delete)
    
    **Permissions:** ONLY Vendor Admin (Owner)
    
    ⚠️ WARNING: This permanently deletes the employee and their user account
    """
    try:
        # Check permissions - ONLY vendor admin can delete
        permissions = get_user_permissions(db, current_user)
        
        if not permissions.can_delete_employees:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendor administrators can permanently delete employees"
            )
        
        # Verify employee belongs to this vendor
        check_query = text("""
            SELECT ve.user_id
            FROM public.vendor_employee ve
            WHERE ve.employee_id = :employee_id 
            AND ve.vendor_id = :vendor_id
        """)
        
        employee_result = db.execute(check_query, {
            "employee_id": employee_id,
            "vendor_id": permissions.vendor_id
        }).fetchone()
        
        if not employee_result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found or you don't have permission"
            )
        
        employee_user_id = employee_result[0]
        
        # Delete from vendor_employee (will cascade to user_account if FK is set with CASCADE)
        # Or delete manually from both tables
        delete_employee_query = text("""
            DELETE FROM public.vendor_employee 
            WHERE employee_id = :employee_id
        """)
        db.execute(delete_employee_query, {"employee_id": employee_id})
        
        # Delete from user_account
        delete_user_query = text("""
            DELETE FROM public.user_account 
            WHERE user_id = :user_id
        """)
        db.execute(delete_user_query, {"user_id": employee_user_id})
        
        db.commit()
        
        return {
            "message": "Employee deleted permanently",
            "employee_id": employee_id
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete employee: {str(e)}"
        )


@router.get("/employees/me/permissions")
async def get_my_permissions(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get current user's permissions and role information
    
    Useful for frontend to determine what UI elements to show
    """
    try:
        permissions = get_user_permissions(db, current_user)
        return permissions
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get permissions: {str(e)}"
        )


# ==================== Register Router ====================
# Add this to your main FastAPI app in dbRetrievalWithNewMetrics.py:
# 
# from employee_management import router as employee_router
# app.include_router(employee_router)