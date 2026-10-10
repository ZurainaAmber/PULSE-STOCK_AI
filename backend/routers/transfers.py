from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

try:
    from backend.database import get_db
    from backend.models.transfer import StockTransferRequest
    from backend.models.user import User
    from backend.models.store import Store
    from backend.models.sku import SKU
    from backend.models.inventory import StoreInventory
    from backend.models.action_log import ActionLog
    from backend.auth import get_current_user
except ImportError:
    from database import get_db
    from models.transfer import StockTransferRequest
    from models.user import User
    from models.store import Store
    from models.sku import SKU
    from models.inventory import StoreInventory
    from models.action_log import ActionLog
    from auth import get_current_user

router = APIRouter(prefix="/api/v1/transfers", tags=["Stock Transfers"])

class CreateTransferPayload(BaseModel):
    to_store_id: str = Field(..., description="Donor store ID fulfilling the transfer")
    sku_id: str = Field(..., description="SKU ID to request")
    requested_quantity: int = Field(..., gt=0, description="Number of units requested")
    notes: Optional[str] = None

class RespondTransferPayload(BaseModel):
    action: str = Field(..., description="ACCEPT_ALL, ACCEPT_PARTIAL, or REJECT")
    approved_quantity: Optional[int] = None
    rejection_reason: Optional[str] = None
    notes: Optional[str] = None

def serialize_transfer(trf: StockTransferRequest, db: Session):
    """Enrich transfer record with store names, product details, and donor stock."""
    from_store = db.query(Store).filter(Store.store_id == trf.from_store_id).first()
    to_store = db.query(Store).filter(Store.store_id == trf.to_store_id).first()
    sku = db.query(SKU).filter(SKU.sku_id == trf.sku_id).first()

    donor_inv = db.query(StoreInventory).filter(
        StoreInventory.store_id == trf.to_store_id,
        StoreInventory.sku_id == trf.sku_id
    ).first()

    dest_inv = db.query(StoreInventory).filter(
        StoreInventory.store_id == trf.from_store_id,
        StoreInventory.sku_id == trf.sku_id
    ).first()

    return {
        "transfer_id": trf.transfer_id,
        "from_store_id": trf.from_store_id,
        "from_store_name": from_store.store_name if from_store else trf.from_store_id,
        "to_store_id": trf.to_store_id,
        "to_store_name": to_store.store_name if to_store else trf.to_store_id,
        "sku_id": trf.sku_id,
        "sku_name": sku.sku_name if sku else trf.sku_id,
        "category": sku.category if sku else "General",
        "unit_selling_price_inr": sku.unit_selling_price_inr if sku else 0.0,
        "requested_quantity": trf.requested_quantity,
        "approved_quantity": trf.approved_quantity,
        "status": trf.status,
        "rejection_reason": trf.rejection_reason,
        "notes": trf.notes,
        "requester_manager_id": trf.requester_manager_id,
        "responder_manager_id": trf.responder_manager_id,
        "eta_minutes": trf.eta_minutes,
        "donor_current_stock": donor_inv.total_stock_units if donor_inv else 0,
        "dest_current_stock": dest_inv.total_stock_units if dest_inv else 0,
        "dispatched_at": trf.dispatched_at.isoformat() if trf.dispatched_at else None,
        "delivered_at": trf.delivered_at.isoformat() if trf.delivered_at else None,
        "created_at": trf.created_at.isoformat() if trf.created_at else None,
        "updated_at": trf.updated_at.isoformat() if trf.updated_at else None,
    }

@router.get("")
async def list_transfers(
    direction: Optional[str] = Query(None, description="incoming, outgoing, or all"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """List transfers relevant to the authenticated manager's assigned store."""
    query = db.query(StockTransferRequest)

    if direction == "incoming":
        query = query.filter(StockTransferRequest.to_store_id == user.store_id)
    elif direction == "outgoing":
        query = query.filter(StockTransferRequest.from_store_id == user.store_id)
    else:
        query = query.filter(
            (StockTransferRequest.from_store_id == user.store_id) |
            (StockTransferRequest.to_store_id == user.store_id)
        )

    records = query.order_by(StockTransferRequest.created_at.desc()).all()
    serialized = [serialize_transfer(r, db) for r in records]

    # Calculate pending incoming requests count for header notifications
    pending_incoming_count = db.query(StockTransferRequest).filter(
        StockTransferRequest.to_store_id == user.store_id,
        StockTransferRequest.status == "PENDING"
    ).count()

    return {
        "manager_store_id": user.store_id,
        "pending_incoming_count": pending_incoming_count,
        "total_transfers": len(serialized),
        "transfers": serialized
    }

@router.get("/donors-for-sku")
async def get_donors_for_sku(
    sku_id: str = Query(..., description="SKU to find donor stores for"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Find other stores with stock available for this SKU."""
    inv_records = db.query(StoreInventory, Store)\
        .join(Store, StoreInventory.store_id == Store.store_id)\
        .filter(
            StoreInventory.sku_id == sku_id,
            StoreInventory.store_id != user.store_id,
            StoreInventory.total_stock_units > 0
        )\
        .order_by(StoreInventory.total_stock_units.desc())\
        .limit(10)\
        .all()

    donors = []
    for inv, store in inv_records:
        donors.append({
            "store_id": store.store_id,
            "store_name": store.store_name,
            "location_zone": store.location_zone,
            "stadium_proximity_km": store.stadium_proximity_km,
            "available_stock_units": inv.total_stock_units,
            "shelf_stock_units": inv.shelf_stock_units,
            "backroom_stock_units": inv.backroom_stock_units
        })

    return {"sku_id": sku_id, "donor_stores": donors}

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_transfer_request(
    payload: CreateTransferPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manager A creates a stock transfer request to Manager B."""
    from_store_id = user.store_id  # Enforce server-side authorization

    if payload.to_store_id == from_store_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot request a stock transfer from your own store."
        )

    # Validate target store exists
    to_store = db.query(Store).filter(Store.store_id == payload.to_store_id).first()
    if not to_store:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Target donor store '{payload.to_store_id}' not found."
        )

    # Validate SKU exists
    sku = db.query(SKU).filter(SKU.sku_id == payload.sku_id).first()
    if not sku:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product SKU '{payload.sku_id}' not found."
        )

    # Check donor inventory availability
    donor_inv = db.query(StoreInventory).filter(
        StoreInventory.store_id == payload.to_store_id,
        StoreInventory.sku_id == payload.sku_id
    ).first()

    if not donor_inv or donor_inv.total_stock_units <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Target store {to_store.store_name} currently has 0 units of {sku.sku_name}."
        )

    import uuid
    transfer_id = f"TRF_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}_{user.store_id[-3:]}"

    trf = StockTransferRequest(
        transfer_id=transfer_id,
        from_store_id=from_store_id,
        to_store_id=payload.to_store_id,
        sku_id=payload.sku_id,
        requested_quantity=payload.requested_quantity,
        status="PENDING",
        notes=payload.notes,
        requester_manager_id=user.username,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
    db.add(trf)
    db.commit()
    db.refresh(trf)

    return serialize_transfer(trf, db)

@router.post("/{transfer_id}/respond")
async def respond_to_transfer(
    transfer_id: str,
    payload: RespondTransferPayload,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Manager B accepts, partially accepts, or rejects an incoming transfer request."""
    trf = db.query(StockTransferRequest).filter(StockTransferRequest.transfer_id == transfer_id).first()
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer request not found.")

    # Authorization Check: only the donor store manager can decide
    if trf.to_store_id != user.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized: You are manager of {user.store_id}. Only the manager of donor store {trf.to_store_id} can decide on this request."
        )

    if trf.status != "PENDING":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This transfer request has already been resolved with status '{trf.status}'."
        )

    donor_inv = db.query(StoreInventory).filter(
        StoreInventory.store_id == trf.to_store_id,
        StoreInventory.sku_id == trf.sku_id
    ).first()
    current_stock = donor_inv.total_stock_units if donor_inv else 0

    action = payload.action.upper()

    if action == "ACCEPT_ALL":
        if trf.requested_quantity > current_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot accept full quantity ({trf.requested_quantity} units). Your current available stock is only {current_stock} units."
            )
        trf.status = "ACCEPTED"
        trf.approved_quantity = trf.requested_quantity
        trf.eta_minutes = 28
        trf.responder_manager_id = user.username
        if payload.notes:
            trf.notes = f"{trf.notes or ''} | Manager notes: {payload.notes}".strip(" |")

    elif action == "ACCEPT_PARTIAL":
        if not payload.approved_quantity or payload.approved_quantity <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Approved quantity must be greater than 0 for partial acceptance."
            )
        if payload.approved_quantity > trf.requested_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approved quantity ({payload.approved_quantity}) cannot exceed requested quantity ({trf.requested_quantity})."
            )
        if payload.approved_quantity > current_stock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Approved quantity ({payload.approved_quantity}) exceeds your available stock ({current_stock})."
            )
        trf.status = "ACCEPTED"
        trf.approved_quantity = payload.approved_quantity
        trf.eta_minutes = 28
        trf.responder_manager_id = user.username
        if payload.notes:
            trf.notes = f"{trf.notes or ''} | Partial approved: {payload.notes}".strip(" |")

    elif action == "REJECT":
        if not payload.rejection_reason or not payload.rejection_reason.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A mandatory rejection reason must be provided."
            )
        trf.status = "REJECTED"
        trf.rejection_reason = payload.rejection_reason.strip()
        trf.approved_quantity = 0
        trf.responder_manager_id = user.username
        if payload.notes:
            trf.notes = f"{trf.notes or ''} | Rejection notes: {payload.notes}".strip(" |")
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid action. Must be ACCEPT_ALL, ACCEPT_PARTIAL, or REJECT."
        )

    trf.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(trf)

    return serialize_transfer(trf, db)

@router.post("/{transfer_id}/dispatch")
async def dispatch_transfer(
    transfer_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark an accepted transfer as dispatched / in-transit with hyper-local rider."""
    trf = db.query(StockTransferRequest).filter(StockTransferRequest.transfer_id == transfer_id).first()
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    if trf.to_store_id != user.store_id and trf.from_store_id != user.store_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    if trf.status != "ACCEPTED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Transfer cannot be dispatched because its status is '{trf.status}' (expected 'ACCEPTED')."
        )

    trf.status = "IN_TRANSIT"
    trf.dispatched_at = datetime.utcnow()
    trf.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(trf)

    return serialize_transfer(trf, db)

@router.post("/{transfer_id}/receive")
async def receive_transfer(
    transfer_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Manager A confirms physical delivery of in-transit transfer.
    Atomically updates both donor and destination store inventories in SQLite,
    and logs to ActionLog.
    """
    trf = db.query(StockTransferRequest).filter(StockTransferRequest.transfer_id == transfer_id).first()
    if not trf:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transfer not found.")

    # Authorization Check: only the receiving destination store manager can confirm receipt
    if trf.from_store_id != user.store_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized: Only the receiving store manager ({trf.from_store_id}) can confirm delivery."
        )

    if trf.status != "IN_TRANSIT":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot confirm receipt: transfer status is '{trf.status}' (expected 'IN_TRANSIT')."
        )

    qty = trf.approved_quantity or 0
    if qty <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Transfer has 0 approved quantity to receive."
        )

    # 1. Update donor inventory (decrement stock)
    donor_inv = db.query(StoreInventory).filter(
        StoreInventory.store_id == trf.to_store_id,
        StoreInventory.sku_id == trf.sku_id
    ).first()
    if donor_inv:
        donor_inv.total_stock_units = max(0, donor_inv.total_stock_units - qty)
        if donor_inv.backroom_stock_units >= qty:
            donor_inv.backroom_stock_units -= qty
        else:
            remaining = qty - donor_inv.backroom_stock_units
            donor_inv.backroom_stock_units = 0
            donor_inv.shelf_stock_units = max(0, donor_inv.shelf_stock_units - remaining)
        donor_inv.updated_at = datetime.utcnow()

    # 2. Update destination inventory (increment stock)
    dest_inv = db.query(StoreInventory).filter(
        StoreInventory.store_id == trf.from_store_id,
        StoreInventory.sku_id == trf.sku_id
    ).first()
    if dest_inv:
        dest_inv.total_stock_units += qty
        dest_inv.backroom_stock_units += qty
        dest_inv.updated_at = datetime.utcnow()

    # 3. Mark transfer DELIVERED
    trf.status = "DELIVERED"
    trf.delivered_at = datetime.utcnow()
    trf.updated_at = datetime.utcnow()

    # 4. Record in ActionLog audit trail
    import uuid
    action_id = f"ACT_TRF_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:6].upper()}"
    sku = db.query(SKU).filter(SKU.sku_id == trf.sku_id).first()
    price = sku.unit_selling_price_inr if sku else 50.0
    action = ActionLog(
        action_id=action_id,
        alert_id=f"ALT_TRF_{trf.transfer_id[-6:]}",
        recommendation_id=trf.transfer_id,
        store_id=trf.from_store_id,
        sku_id=trf.sku_id,
        action_type="TRANSFER",
        status="EXECUTED",
        manager_id=user.username,
        notes=f"Completed inter-store transfer of {qty} units from {trf.to_store_id}.",
        cost_inr=150.0
    )
    db.add(action)

    db.commit()
    db.refresh(trf)

    return serialize_transfer(trf, db)
