from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Float,
    DateTime,
    ForeignKey,
    Boolean
)

from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from database import Base


# ==========================================
# USER
# ==========================================

class User(Base):

    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    name = Column(
        String(255),
        nullable=False
    )

    email = Column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash = Column(
        String(255),
        nullable=False
    )

    # PROFILE PHONE NUMBER
    phone = Column(
        String(20),
        nullable=True
    )

    # PROFILE IMAGE PATH
    profile_image = Column(
        String(500),
        nullable=True
    )

    # light / dark
    appearance = Column(
        String(20),
        nullable=False,
        default="light"
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    jobs = relationship(
        "Job",
        back_populates="user",
        cascade="all, delete-orphan"
    )


# ==========================================
# JOB
# ==========================================

class Job(Base):

    __tablename__ = "jobs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    title = Column(
        String(255),
        nullable=False
    )

    description = Column(
        Text,
        nullable=False
    )

    required_skills = Column(
        Text,
        nullable=True
    )

    top_candidates_limit = Column(
        Integer,
        nullable=True
    )

    ranking_basis = Column(
        String(30),
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    user = relationship(
        "User",
        back_populates="jobs"
    )

    candidates = relationship(
        "Candidate",
        back_populates="job",
        cascade="all, delete-orphan"
    )


# ==========================================
# CANDIDATE
# ==========================================

class Candidate(Base):

    __tablename__ = "candidates"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    job_id = Column(
        Integer,
        ForeignKey(
            "jobs.id",
            ondelete="CASCADE"
        ),
        nullable=False
    )

    name = Column(
        String(255),
        nullable=True
    )

    email = Column(
        String(255),
        nullable=True
    )

    phone = Column(
        String(50),
        nullable=True
    )

    filename = Column(
        String(255),
        nullable=False
    )

    resume_path = Column(
        String(500),
        nullable=True
    )

    is_favorite = Column(
        Boolean,
        nullable=False,
        default=False
    )

    skills = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    job = relationship(
        "Job",
        back_populates="candidates"
    )

    screening_result = relationship(
        "ScreeningResult",
        back_populates="candidate",
        uselist=False,
        cascade="all, delete-orphan"
    )


# ==========================================
# SCREENING RESULT
# ==========================================

class ScreeningResult(Base):

    __tablename__ = "screening_results"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    candidate_id = Column(
        Integer,
        ForeignKey(
            "candidates.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        unique=True
    )

    final_match_score = Column(
        Float,
        nullable=False
    )

    ats_score = Column(
        Float,
        nullable=True
    )

    skill_match_score = Column(
        Float,
        nullable=False
    )

    text_similarity_score = Column(
        Float,
        nullable=False
    )

    recommendation = Column(
        String(100),
        nullable=True
    )

    matched_skills = Column(
        Text,
        nullable=True
    )

    missing_skills = Column(
        Text,
        nullable=True
    )

    created_at = Column(
        DateTime,
        server_default=func.now()
    )

    candidate = relationship(
        "Candidate",
        back_populates="screening_result"
    )