from fastapi import APIRouter, Depends

from app.schemas.user import UserRead
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserRead)
def read_current_user(current_user=Depends(get_current_user)):
    return current_user


@router.get("/protected")
def protected_route(current_user=Depends(get_current_user)):
    return {
        "message": "You are authenticated.",
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "fullName": current_user.full_name,
            "role": current_user.role,
        },
    }
