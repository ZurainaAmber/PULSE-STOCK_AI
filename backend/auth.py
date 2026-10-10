import hashlib
import hmac
import secrets
from datetime import datetime, timedelta
from typing import Optional
from fastapi import Header, HTTPException, Depends, status
from sqlalchemy.orm import Session

try:
    from backend.database import get_db, SessionLocal
    from backend.models.user import User, UserSession
except ImportError:
    from database import get_db, SessionLocal
    from models.user import User, UserSession

# Security parameters
SALT_LENGTH = 16
ITERATIONS = 100_000
SESSION_EXPIRY_DAYS = 7

def hash_password(password: str) -> str:
    """Generate salted PBKDF2-HMAC-SHA256 password hash."""
    salt = secrets.token_hex(SALT_LENGTH)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), ITERATIONS)
    return f"{salt}${key.hex()}"

def verify_password(plain_password: str, stored_hash: str) -> bool:
    """Verify password against stored salt and hash using timing-safe comparison."""
    if not stored_hash or "$" not in stored_hash:
        return False
    try:
        salt, expected_hex = stored_hash.split("$", 1)
        actual_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt.encode("utf-8"), ITERATIONS)
        return hmac.compare_digest(actual_key.hex(), expected_hex)
    except Exception:
        return False

def create_user_session(db: Session, user: User) -> str:
    """Generate a cryptographically secure token and persist active session."""
    token = secrets.token_urlsafe(32)
    session = UserSession(
        token=token,
        user_id=user.id,
        username=user.username,
        store_id=user.store_id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=SESSION_EXPIRY_DAYS)
    )
    db.add(session)
    db.commit()
    return token

def seed_demo_users_if_needed():
    """Ensure demo manager accounts are created with hashed passwords."""
    db = SessionLocal()
    try:
        demo_accounts = [
            {"username": "mgr_store7", "password": "password123", "manager_name": "Koramangala Manager", "store_id": "STORE_007"},
            {"username": "mgr_store3", "password": "password123", "manager_name": "Indiranagar Manager", "store_id": "STORE_003"},
            {"username": "mgr_store12", "password": "password123", "manager_name": "HSR Layout Manager", "store_id": "STORE_012"},
        ]
        for acc in demo_accounts:
            existing = db.query(User).filter(User.username == acc["username"]).first()
            if not existing:
                u = User(
                    username=acc["username"],
                    password_hash=hash_password(acc["password"]),
                    manager_name=acc["manager_name"],
                    store_id=acc["store_id"],
                    role="STORE_MANAGER"
                )
                db.add(u)
        db.commit()
    finally:
        db.close()

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
) -> User:
    """
    FastAPI dependency to authenticate request from Bearer token.
    Raises HTTP 401 if missing, invalid, or expired.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header. Please log in."
        )
    token = authorization.split(" ", 1)[1].strip()
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please log in again."
        )
    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired. Please log in again."
        )
    
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User associated with this session no longer exists."
        )
    return user
