from fastapi import APIRouter
from app.api.v1.endpoints import auth, tasks, health

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
api_router.include_router(health.router, prefix="/health", tags=["Health"])
