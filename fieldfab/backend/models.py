from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, func
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    plan_type = Column(String, nullable=False, default="free")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner", cascade="all, delete-orphan")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    company_name = Column(String, nullable=True)
    street_number = Column(String, nullable=True)
    street_name = Column(String, nullable=True)
    city = Column(String, nullable=True)
    zipcode = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User", back_populates="projects")
    pieces = relationship(
        "Piece",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="Piece.order_index",
    )
    loose_materials = relationship(
        "LooseMaterial",
        back_populates="project",
        cascade="all, delete-orphan",
        order_by="LooseMaterial.order_index",
    )


class Piece(Base):
    __tablename__ = "pieces"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    qty = Column(Integer, nullable=False, default=1)
    feet = Column(String, nullable=False, default="")
    inches = Column(String, nullable=False, default="")
    pipe_type = Column(String, nullable=False, default="")
    pipe_tag = Column(String, nullable=False, default="")
    diameter = Column(String, nullable=False, default="")
    fittings_end1 = Column(String, nullable=False, default="")
    fittings_end2 = Column(String, nullable=False, default="")
    outlets = Column(JSON, nullable=False, default=list)

    project = relationship("Project", back_populates="pieces")


class LooseMaterial(Base):
    __tablename__ = "loose_materials"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    order_index = Column(Integer, nullable=False, default=0)
    qty = Column(Integer, nullable=False, default=1)
    part = Column(String, nullable=False, default="")
    size = Column(String, nullable=False, default="")
    description = Column(String, nullable=False, default="")
    mat_type = Column(String, nullable=False, default="")
    options = Column(JSON, nullable=False, default=list)
    sizes = Column(JSON, nullable=False, default=list)

    project = relationship("Project", back_populates="loose_materials")


class SalesLead(Base):
    __tablename__ = "sales_leads"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, nullable=False, index=True)
    company_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    company_size = Column(String, nullable=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
