from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
try:
    from backend.database import Base
except ImportError:
    from database import Base

class StockTransferRequest(Base):
    __tablename__ = "stock_transfer_requests"

    transfer_id = Column(String, primary_key=True, index=True)
    from_store_id = Column(String, ForeignKey("stores.store_id"), nullable=False, index=True)
    to_store_id = Column(String, ForeignKey("stores.store_id"), nullable=False, index=True)
    sku_id = Column(String, ForeignKey("skus.sku_id"), nullable=False, index=True)
    requested_quantity = Column(Integer, nullable=False)
    approved_quantity = Column(Integer, nullable=True)
    status = Column(String, nullable=False, default="PENDING")  # PENDING, ACCEPTED, IN_TRANSIT, DELIVERED, REJECTED
    rejection_reason = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    requester_manager_id = Column(String, nullable=True)
    responder_manager_id = Column(String, nullable=True)
    eta_minutes = Column(Integer, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
