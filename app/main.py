from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1.router import api_router
from app.core.config import settings
from app.core.errors import register_exception_handlers

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A secure, production-style task management and productivity API.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
register_exception_handlers(app)
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Meta"])
def root():
    return {"name": settings.PROJECT_NAME, "docs": "/docs", "health": f"{settings.API_V1_PREFIX}/health"}

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
