from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

import models
from auth import create_access_token, hash_password, verify_password
from database import Base, engine, get_db
from models import SalesLead, User
from routes import projects, pieces, loose_materials
from schemas import LoginRequest, RegisterRequest, SalesLeadCreate, SalesLeadResponse, TokenResponse, UserResponse
from auth import get_current_user

# Create all tables on startup
Base.metadata.create_all(bind=engine)

with engine.begin() as conn:
    conn.execute(text("ALTER TABLE pieces ADD COLUMN IF NOT EXISTS qty INTEGER NOT NULL DEFAULT 1"))

app = FastAPI(title="FieldFab API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "capacitor://localhost",
        "http://localhost",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router)
app.include_router(pieces.router)
app.include_router(loose_materials.router)


# ── Auth endpoints ─────────────────────────────────────────────────────────────

@app.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(body: RegisterRequest, db: Annotated[Session, Depends(get_db)]):
    existing = db.query(User).filter(User.email == body.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with that email already exists.",
        )

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        company_name=body.company_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Annotated[Session, Depends(get_db)]):
    user = db.query(User).filter(User.email == body.email).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return TokenResponse(access_token=create_access_token(user.id))


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/me", response_model=UserResponse)
def me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user


@app.post("/sales-leads", response_model=SalesLeadResponse, status_code=status.HTTP_201_CREATED)
def create_sales_lead(body: SalesLeadCreate, db: Annotated[Session, Depends(get_db)]):
    lead = SalesLead(**body.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead
