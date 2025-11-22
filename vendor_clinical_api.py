"""
Vendor Clinical Trial Management API
File: vendor_clinical_api.py

UPDATED to match actual database tables:
- clinical_trial (not vendor_clinical_trials)
- trial_irb_history (not vendor_irb_history)  
- trial_payment (not vendor_trial_payments)
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from decimal import Decimal
import logging

from database import get_db
from auth import get_current_user, TokenData

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Router setup
router = APIRouter(prefix="/api/vendor/clinical", tags=["Vendor Clinical Trials"])


# ==================== Pydantic Models ====================

class ClinicalTrialCreate(BaseModel):
    """Request model for creating a new clinical trial"""
    trial_name: str = Field(..., min_length=1, max_length=200)
    trial_description: Optional[str] = Field(None, max_length=1000)
    product_name: str = Field(..., min_length=1, max_length=200)
    
    class Config:
        json_schema_extra = {
            "example": {
                "trial_name": "DailyBiotic Pro Phase 1 Safety Study",
                "trial_description": "Phase 1 clinical trial for safety and preliminary efficacy",
                "product_name": "DailyBiotic Pro"
            }
        }


class ClinicalTrialResponse(BaseModel):
    """Response model for clinical trial information"""
    trial_id: int
    vendor_id: str
    trial_name: str
    trial_description: Optional[str]
    product_name: str
    trial_status: str
    irb_status: str
    irb_submission_date: Optional[datetime]
    irb_approval_date: Optional[datetime]
    trial_start_date: Optional[datetime]
    trial_end_date: Optional[datetime]
    created_at: datetime
    updated_at: datetime
    created_by_user_id: Optional[int]
    
    class Config:
        from_attributes = True


class IRBStatusUpdate(BaseModel):
    """Request model for updating IRB status"""
    new_status: str = Field(..., description="New IRB status")
    comments: Optional[str] = Field(None, max_length=500)
    
    @validator('new_status')
    def validate_status(cls, v):
        allowed_statuses = ['preparation', 'submitted', 'under_review', 'changes_requested', 
                          'resubmitted', 'approved', 'rejected']
        if v not in allowed_statuses:
            raise ValueError(f'Status must be one of: {", ".join(allowed_statuses)}')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "new_status": "submitted",
                "comments": "Initial IRB submission completed"
            }
        }


class PaymentCreate(BaseModel):
    """Request model for creating a payment record"""
    installment_number: int = Field(..., ge=1, description="Installment number")
    amount: Decimal = Field(..., ge=0)
    payment_method: str = Field(..., description="Method: credit_card, wire_transfer, check, cash")
    due_date: Optional[date] = Field(None, description="Payment due date")
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('payment_method')
    def validate_payment_method(cls, v):
        allowed_methods = ['credit_card', 'wire_transfer', 'check', 'cash', 'ach']
        if v not in allowed_methods:
            raise ValueError(f'Payment method must be one of: {", ".join(allowed_methods)}')
        return v


class PaymentResponse(BaseModel):
    """Response model for payment information"""
    payment_id: int
    trial_id: int
    installment_number: int
    amount: Decimal
    payment_status: str
    due_date: Optional[date]
    paid_date: Optional[datetime]
    payment_method: Optional[str]  # Can be NULL for pending payments
    transaction_id: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    """Response model for vendor dashboard statistics"""
    total_trials: int
    active_trials: int
    completed_trials: int
    pending_irb: int
    approved_irb: int


# ==================== Helper Functions ====================

def get_vendor_id(db: Session, current_user: TokenData) -> str:
    """Get vendor_id for current user"""
    query = text("""
        SELECT vendor_id 
        FROM public.vendor 
        WHERE user_id = :user_id
    """)
    result = db.execute(query, {"user_id": current_user.user_id}).fetchone()
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vendor record not found for this user"
        )
    
    return result[0]


def check_trial_ownership(db: Session, trial_id: int, vendor_id: str) -> bool:
    """Check if trial belongs to vendor"""
    query = text("""
        SELECT trial_id 
        FROM public.clinical_trial 
        WHERE trial_id = :trial_id AND vendor_id = :vendor_id
    """)
    result = db.execute(query, {"trial_id": trial_id, "vendor_id": vendor_id}).fetchone()
    return result is not None


# ==================== API Endpoints ====================

@router.post("/trials", response_model=ClinicalTrialResponse, status_code=status.HTTP_201_CREATED)
async def create_clinical_trial(
    trial_data: ClinicalTrialCreate,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new clinical trial registration"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can create clinical trials"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check if vendor already has a trial (Phase 1 limitation)
        existing_trial_query = text("""
            SELECT trial_id 
            FROM public.clinical_trial 
            WHERE vendor_id = :vendor_id
        """)
        existing_trial = db.execute(existing_trial_query, {"vendor_id": vendor_id}).fetchone()
        
        if existing_trial:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vendor already has an active trial. Only one trial per vendor allowed in Phase 1."
            )
        
        # Insert new clinical trial
        insert_query = text("""
            INSERT INTO public.clinical_trial (
                vendor_id,
                trial_name,
                trial_description,
                product_name,
                trial_status,
                irb_status,
                created_at,
                updated_at,
                created_by_user_id
            ) VALUES (
                :vendor_id,
                :trial_name,
                :trial_description,
                :product_name,
                'preparing',
                'preparation',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP,
                :user_id
            ) RETURNING trial_id, created_at, updated_at
        """)
        
        result = db.execute(insert_query, {
            "vendor_id": vendor_id,
            "trial_name": trial_data.trial_name,
            "trial_description": trial_data.trial_description,
            "product_name": trial_data.product_name,
            "user_id": current_user.user_id
        }).fetchone()
        
        db.commit()
        
        trial_id = result[0]
        created_at = result[1]
        updated_at = result[2]
        
        logger.info(f"âœ… Clinical trial {trial_id} created for vendor {vendor_id}")
        
        # Return the created trial
        return ClinicalTrialResponse(
            trial_id=trial_id,
            vendor_id=vendor_id,
            trial_name=trial_data.trial_name,
            trial_description=trial_data.trial_description,
            product_name=trial_data.product_name,
            trial_status='preparing',
            irb_status='preparation',
            irb_submission_date=None,
            irb_approval_date=None,
            trial_start_date=None,
            trial_end_date=None,
            created_at=created_at,
            updated_at=updated_at,
            created_by_user_id=current_user.user_id
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"âŒ Error creating clinical trial: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create clinical trial: {str(e)}"
        )


@router.get("/trials", response_model=List[ClinicalTrialResponse])
async def get_vendor_trials(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db),
    trial_status: Optional[str] = Query(None, description="Filter by trial status"),
    irb_status: Optional[str] = Query(None, description="Filter by IRB status")
):
    """Get all clinical trials for the authenticated vendor"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access clinical trials"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Build query with filters - Get latest IRB status from history
        query = """
            SELECT 
                ct.trial_id,
                ct.vendor_id,
                ct.trial_name,
                ct.trial_description,
                ct.product_name,
                ct.trial_status,
                COALESCE(
                    (SELECT new_status 
                     FROM public.trial_irb_history 
                     WHERE trial_id = ct.trial_id 
                     ORDER BY changed_at DESC 
                     LIMIT 1),
                    ct.irb_status
                ) as irb_status,
                ct.irb_submission_date,
                ct.irb_approval_date,
                ct.trial_start_date,
                ct.trial_end_date,
                ct.created_at,
                ct.updated_at,
                ct.created_by_user_id
            FROM public.clinical_trial ct
            WHERE ct.vendor_id = :vendor_id
        """
        
        params = {"vendor_id": vendor_id}
        
        if trial_status:
            query += " AND trial_status = :trial_status"
            params["trial_status"] = trial_status
        
        if irb_status:
            query += " AND irb_status = :irb_status"
            params["irb_status"] = irb_status
        
        query += " ORDER BY created_at DESC"
        
        result = db.execute(text(query), params).fetchall()
        
        # Format response
        trials = []
        for row in result:
            trials.append(ClinicalTrialResponse(
                trial_id=row[0],
                vendor_id=row[1],
                trial_name=row[2],
                trial_description=row[3],
                product_name=row[4],
                trial_status=row[5],
                irb_status=row[6],
                irb_submission_date=row[7],
                irb_approval_date=row[8],
                trial_start_date=row[9],
                trial_end_date=row[10],
                created_at=row[11],
                updated_at=row[12],
                created_by_user_id=row[13]
            ))
        
        return trials
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"âŒ Error fetching clinical trials: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch clinical trials: {str(e)}"
        )


@router.get("/trials/{trial_id}", response_model=ClinicalTrialResponse)
async def get_trial_details(
    trial_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed information about a specific clinical trial"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access clinical trials"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check trial ownership
        if not check_trial_ownership(db, trial_id, vendor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found or access denied"
            )
        
        # Get trial details - with latest IRB status from history
        query = text("""
            SELECT 
                ct.trial_id,
                ct.vendor_id,
                ct.trial_name,
                ct.trial_description,
                ct.product_name,
                ct.trial_status,
                COALESCE(
                    (SELECT new_status 
                     FROM public.trial_irb_history 
                     WHERE trial_id = ct.trial_id 
                     ORDER BY changed_at DESC 
                     LIMIT 1),
                    ct.irb_status
                ) as irb_status,
                ct.irb_submission_date,
                ct.irb_approval_date,
                ct.trial_start_date,
                ct.trial_end_date,
                ct.created_at,
                ct.updated_at,
                ct.created_by_user_id
            FROM public.clinical_trial ct
            WHERE ct.trial_id = :trial_id
        """)
        
        result = db.execute(query, {"trial_id": trial_id}).fetchone()
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found"
            )
        
        return ClinicalTrialResponse(
            trial_id=result[0],
            vendor_id=result[1],
            trial_name=result[2],
            trial_description=result[3],
            product_name=result[4],
            trial_status=result[5],
            irb_status=result[6],
            irb_submission_date=result[7],
            irb_approval_date=result[8],
            trial_start_date=result[9],
            trial_end_date=result[10],
            created_at=result[11],
            updated_at=result[12],
            created_by_user_id=result[13]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"âŒ Error fetching trial details: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch trial details: {str(e)}"
        )


@router.put("/trials/{trial_id}/irb-status")
async def update_irb_status(
    trial_id: int,
    status_update: IRBStatusUpdate,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update IRB status for a clinical trial"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can update IRB status"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check trial ownership
        if not check_trial_ownership(db, trial_id, vendor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found or access denied"
            )
        
        # Get current IRB status
        current_status_query = text("""
            SELECT irb_status 
            FROM public.clinical_trial 
            WHERE trial_id = :trial_id
        """)
        current_status_result = db.execute(current_status_query, {"trial_id": trial_id}).fetchone()
        old_status = current_status_result[0] if current_status_result else None
        
        # Update IRB status in clinical trials table
        update_query = text("""
            UPDATE public.clinical_trial
            SET irb_status = :new_status,
                updated_at = CURRENT_TIMESTAMP
            WHERE trial_id = :trial_id
        """)
        
        db.execute(update_query, {
            "trial_id": trial_id,
            "new_status": status_update.new_status
        })
        
        # Insert IRB history record
        history_query = text("""
            INSERT INTO public.trial_irb_history (
                trial_id,
                old_status,
                new_status,
                changed_by_user_id,
                comments,
                changed_at
            ) VALUES (
                :trial_id,
                :old_status,
                :new_status,
                :user_id,
                :comments,
                CURRENT_TIMESTAMP
            )
        """)
        
        db.execute(history_query, {
            "trial_id": trial_id,
            "old_status": old_status,
            "new_status": status_update.new_status,
            "user_id": current_user.user_id,
            "comments": status_update.comments
        })
        
        db.commit()
        
        logger.info(f"âœ… IRB status updated for trial {trial_id}: {old_status} -> {status_update.new_status}")
        
        return {
            "success": True,
            "message": "IRB status updated successfully",
            "trial_id": trial_id,
            "old_status": old_status,
            "new_status": status_update.new_status
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"âŒ Error updating IRB status: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update IRB status: {str(e)}"
        )


@router.get("/trials/{trial_id}/irb-history")
async def get_irb_history(
    trial_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get IRB status change history for a clinical trial"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access IRB history"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check trial ownership
        if not check_trial_ownership(db, trial_id, vendor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found or access denied"
            )
        
        # Get IRB history
        query = text("""
            SELECT 
                history_id,
                trial_id,
                old_status,
                new_status,
                changed_by_user_id,
                comments,
                changed_at,
                u.username as changed_by_username
            FROM public.trial_irb_history h
            LEFT JOIN public.user_account u ON h.changed_by_user_id = u.user_id
            WHERE trial_id = :trial_id
            ORDER BY changed_at DESC
        """)
        
        result = db.execute(query, {"trial_id": trial_id}).fetchall()
        
        history = []
        for row in result:
            history.append({
                "history_id": row[0],
                "trial_id": row[1],
                "old_status": row[2],
                "new_status": row[3],
                "changed_by_user_id": row[4],
                "comments": row[5],
                "changed_at": row[6].isoformat() if row[6] else None,
                "changed_by_username": row[7]
            })
        
        return {
            "success": True,
            "trial_id": trial_id,
            "history_count": len(history),
            "history": history
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"âŒ Error fetching IRB history: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch IRB history: {str(e)}"
        )


@router.post("/trials/{trial_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    trial_id: int,
    payment_data: PaymentCreate,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Record a payment for a clinical trial"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can record payments"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check trial ownership
        if not check_trial_ownership(db, trial_id, vendor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found or access denied"
            )
        
        # Insert payment record
        insert_query = text("""
            INSERT INTO public.trial_payment (
                trial_id,
                installment_number,
                amount,
                payment_method,
                payment_status,
                due_date,
                paid_date,
                notes,
                created_at,
                updated_at
            ) VALUES (
                :trial_id,
                :installment_number,
                :amount,
                :payment_method,
                'completed',
                :due_date,
                CURRENT_TIMESTAMP,
                :notes,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING payment_id, paid_date, created_at, updated_at
        """)
        
        result = db.execute(insert_query, {
            "trial_id": trial_id,
            "installment_number": payment_data.installment_number,
            "amount": float(payment_data.amount),
            "payment_method": payment_data.payment_method,
            "due_date": payment_data.due_date,
            "notes": payment_data.notes
        }).fetchone()
        
        db.commit()
        
        payment_id = result[0]
        paid_date = result[1]
        created_at = result[2]
        updated_at = result[3]
        
        logger.info(f"âœ… Payment {payment_id} created for trial {trial_id}, amount: ${payment_data.amount}")
        
        return PaymentResponse(
            payment_id=payment_id,
            trial_id=trial_id,
            installment_number=payment_data.installment_number,
            amount=payment_data.amount,
            payment_status='completed',
            due_date=payment_data.due_date,
            paid_date=paid_date,
            payment_method=payment_data.payment_method,
            transaction_id=None,
            notes=payment_data.notes,
            created_at=created_at,
            updated_at=updated_at
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"âŒ Error creating payment: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create payment: {str(e)}"
        )


@router.get("/trials/{trial_id}/payments", response_model=List[PaymentResponse])
async def get_trial_payments(
    trial_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all payments for a clinical trial"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access payment information"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check trial ownership
        if not check_trial_ownership(db, trial_id, vendor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found or access denied"
            )
        
        # Get payments
        query = text("""
            SELECT 
                payment_id,
                trial_id,
                installment_number,
                amount,
                payment_status,
                due_date,
                paid_date,
                payment_method,
                transaction_id,
                notes,
                created_at,
                updated_at
            FROM public.trial_payment
            WHERE trial_id = :trial_id
            ORDER BY installment_number ASC
        """)
        
        result = db.execute(query, {"trial_id": trial_id}).fetchall()
        
        payments = []
        for row in result:
            payments.append(PaymentResponse(
                payment_id=row[0],
                trial_id=row[1],
                installment_number=row[2],
                amount=Decimal(str(row[3])),
                payment_status=row[4],
                due_date=row[5],
                paid_date=row[6],
                payment_method=row[7],
                transaction_id=row[8],
                notes=row[9],
                created_at=row[10],
                updated_at=row[11]
            ))
        
        return payments
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"âŒ Error fetching payments: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch payments: {str(e)}"
        )


@router.get("/dashboard", response_model=DashboardStats)
async def get_vendor_dashboard(
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for vendor"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access dashboard"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Get trial statistics
        trial_stats_query = text("""
            SELECT 
                COUNT(*) as total_trials,
                COUNT(CASE WHEN trial_status IN ('preparing', 'active') THEN 1 END) as active_trials,
                COUNT(CASE WHEN trial_status = 'completed' THEN 1 END) as completed_trials,
                COUNT(CASE WHEN irb_status IN ('preparation', 'submitted', 'under_review') THEN 1 END) as pending_irb,
                COUNT(CASE WHEN irb_status = 'approved' THEN 1 END) as approved_irb
            FROM public.clinical_trial
            WHERE vendor_id = :vendor_id
        """)
        
        trial_stats = db.execute(trial_stats_query, {"vendor_id": vendor_id}).fetchone()
        
        return DashboardStats(
            total_trials=trial_stats[0] or 0,
            active_trials=trial_stats[1] or 0,
            completed_trials=trial_stats[2] or 0,
            pending_irb=trial_stats[3] or 0,
            approved_irb=trial_stats[4] or 0
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"âŒ Error fetching dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch dashboard statistics: {str(e)}"
        )


@router.get("/trials/{trial_id}/documents")
async def get_trial_documents(
    trial_id: int,
    current_user: TokenData = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get document information for a clinical trial"""
    try:
        # Verify user is a vendor
        if current_user.role != 'vendor':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only vendors can access documents"
            )
        
        # Get vendor_id
        vendor_id = get_vendor_id(db, current_user)
        
        # Check trial ownership
        if not check_trial_ownership(db, trial_id, vendor_id):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clinical trial not found or access denied"
            )
        
        # Fetch documents from database
        query = text("""
            SELECT 
                document_id,
                trial_id,
                document_type,
                document_name,
                s3_key,
                s3_url,
                file_size,
                mime_type,
                uploaded_by_user_id,
                uploaded_at,
                version,
                notes
            FROM public.trial_document
            WHERE trial_id = :trial_id
            ORDER BY uploaded_at DESC
        """)
        
        result = db.execute(query, {"trial_id": trial_id}).fetchall()
        
        documents = []
        for row in result:
            documents.append({
                "document_id": row[0],
                "trial_id": row[1],
                "document_type": row[2],
                "document_name": row[3],
                "s3_key": row[4],
                "s3_url": row[5],
                "file_size": row[6],
                "mime_type": row[7],
                "uploaded_by_user_id": row[8],
                "uploaded_at": row[9].isoformat() if row[9] else None,
                "version": row[10],
                "notes": row[11]
            })
        
        return documents
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error fetching documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch documents: {str(e)}"
        )


# ==================== Health Check ====================

@router.get("/health")
async def health_check():
    """Health check endpoint for vendor clinical API"""
    return {
        "status": "healthy",
        "service": "Vendor Clinical Trial API",
        "timestamp": datetime.now().isoformat()
    }