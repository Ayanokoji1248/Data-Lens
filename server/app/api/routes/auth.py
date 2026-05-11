from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.user import UserCreate, UserLogin, UserRead
from app.services.auth_service import authenticate_user, clear_login_cookie, create_login_cookie, create_user

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    return create_user(db=db, payload=payload)


@router.post("/login")
def login(response: Response, payload: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db=db, email=payload.email, password=payload.password)
    create_login_cookie(response=response, user=user)
    return {
        "message": "Login successful.",
        "user": UserRead.model_validate(user),
    }


@router.post("/logout")
def logout(response: Response):
    clear_login_cookie(response=response)
    return {"message": "Logout successful."}
