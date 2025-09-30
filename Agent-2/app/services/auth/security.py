from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
	return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
	return pwd_context.verify(password, hashed)


def create_access_token(subject: Any, expires_minutes: Optional[int] = None) -> str:
	expires_delta = timedelta(minutes=expires_minutes or settings.JWT_EXPIRE_MINUTES)
	exp = datetime.now(timezone.utc) + expires_delta
	to_encode = {"sub": str(subject), "exp": exp}
	return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALG)


def decode_access_token(token: str) -> dict:
	return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG])


