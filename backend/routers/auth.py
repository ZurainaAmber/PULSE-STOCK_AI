from fastapi import APIRouter, Depends, HTTPException, status, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

try:
    from backend.database import get_db
    from backend.models.user import User, UserSession
    from backend.models.store import Store
    from backend.auth import verify_password, create_user_session, get_current_user
except ImportError:
    from database import get_db
    from models.user import User, UserSession
    from models.store import Store
    from auth import verify_password, create_user_session, get_current_user

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

class LoginRequest(BaseModel):
    username: str
    password: str

@router.post("/login")
async def login(payload: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate manager with username and password, returning a secure session token."""
    user = db.query(User).filter(User.username == payload.username.strip()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    store = db.query(Store).filter(Store.store_id == user.store_id).first()
    store_name = store.store_name if store else user.store_id
    token = create_user_session(db, user)

    return {
        "token": token,
        "user": {
            "id": user.id,
            "username": user.username,
            "manager_name": user.manager_name,
            "store_id": user.store_id,
            "store_name": store_name,
            "role": user.role,
        }
    }

@router.get("/me")
async def get_me(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve details of currently authenticated manager."""
    store = db.query(Store).filter(Store.store_id == user.store_id).first()
    store_name = store.store_name if store else user.store_id

    return {
        "user": {
            "id": user.id,
            "username": user.username,
            "manager_name": user.manager_name,
            "store_id": user.store_id,
            "store_name": store_name,
            "role": user.role,
        }
    }

@router.post("/logout")
async def logout(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """Invalidate current session token."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        session = db.query(UserSession).filter(UserSession.token == token).first()
        if session:
            db.delete(session)
            db.commit()
    return {"status": "ok", "message": "Logged out successfully."}

@router.get("/demo-accounts")
async def get_demo_accounts(db: Session = Depends(get_db)):
    """Provide demo manager accounts for convenient reviewer login."""
    accounts = [
        {"username": "mgr_store7", "manager_name": "Koramangala Manager", "store_id": "STORE_007", "store_name": "Store 7 - Koramangala Tech Park"},
        {"username": "mgr_store3", "manager_name": "Indiranagar Manager", "store_id": "STORE_003", "store_name": "Store 3 - Domlur Hub"},
        {"username": "mgr_store12", "manager_name": "HSR Layout Manager", "store_id": "STORE_012", "store_name": "Store 12 - Marathahalli Bridge"},
    ]
    return {"accounts": accounts}
