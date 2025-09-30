from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.db import get_db
from app.models.user import User
from app.services.auth.security import hash_password, verify_password, create_access_token, decode_access_token


router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)


class SignupRequest(BaseModel):
	email: EmailStr
	password: str
	full_name: Optional[str] = None


class LoginRequest(BaseModel):
	email: EmailStr
	password: str


class TokenResponse(BaseModel):
	access_token: str
	token_type: str = "bearer"


class UserOut(BaseModel):
	id: int
	email: EmailStr
	full_name: Optional[str] = None
	is_admin: bool


@router.post("/signup", response_model=UserOut)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
	res = await db.execute(select(User).where(User.email == body.email))
	if res.scalars().first():
		raise HTTPException(status_code=400, detail="Email already registered")
	user = User(email=body.email, password_hash=hash_password(body.password), full_name=body.full_name)
	db.add(user)
	await db.commit()
	await db.refresh(user)
	return UserOut(id=user.id, email=user.email, full_name=user.full_name, is_admin=user.is_admin)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
	res = await db.execute(select(User).where(User.email == body.email))
	user = res.scalars().first()
	if not user or not verify_password(body.password, user.password_hash):
		raise HTTPException(status_code=401, detail="Invalid credentials")
	access = create_access_token(subject=user.id)
	return TokenResponse(access_token=access)


def get_current_user(
	creds: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
	db: AsyncSession = Depends(get_db),
):
	if not creds:
		raise HTTPException(status_code=401, detail="Not authenticated")
	try:
		payload = decode_access_token(creds.credentials)
	except Exception:
		raise HTTPException(status_code=401, detail="Invalid token")
	user_id = int(payload.get("sub"))
	return db.get(User, user_id)


@router.get("/me", response_model=UserOut)
async def me(user: User = Depends(get_current_user)):
	if not user:
		raise HTTPException(status_code=401, detail="Not authenticated")
	return UserOut(id=user.id, email=user.email, full_name=user.full_name, is_admin=user.is_admin)


