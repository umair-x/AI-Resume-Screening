from fastapi import (
    FastAPI,
    UploadFile,
    File,
    Form,
    HTTPException,
    Depends,
    status
)

from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from pathlib import Path
import shutil
import uuid
import json

from database import (
    get_db,
    Base,
    engine
)

from models import (
    User,
    Job,
    Candidate,
    ScreeningResult
)

from schemas import (
    RegisterRequest,
    LoginRequest
)

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user
)

from services.resume_parser import (
    extract_pdf_text,
    extract_candidate_details,
    extract_skills
)

from services.screening import (
    screen_candidate
)

from candidate_actions import (
    router as candidate_actions_router
)

from dashboard_stats import (
    router as dashboard_stats_router
)

from settings_api import (
    router as settings_router
)


# ==================================================
# DATABASE
# ==================================================

Base.metadata.create_all(
    bind=engine
)


# ==================================================
# APP
# ==================================================

app = FastAPI(
    title="AI Resume Screening System",
    description=(
        "AI Resume Screening with ATS Score, "
        "Top-N Shortlisting, Favourite List, "
        "Dashboard Stats, Profile Settings "
        "and Multi User Support"
    ),
    version="8.4.0"
)


# ==================================================
# CORS
# ==================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://ai-resume-screening-gules-mu.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================================================
# EXTRA ROUTERS
# ==================================================

app.include_router(
    candidate_actions_router
)

app.include_router(
    dashboard_stats_router
)

app.include_router(
    settings_router
)


# ==================================================
# UPLOAD FOLDER
# ==================================================

UPLOAD_FOLDER = Path("uploads")

UPLOAD_FOLDER.mkdir(
    exist_ok=True
)


# ==================================================
# SAVE RESUME
# ==================================================

def save_resume(file: UploadFile):

    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail="Resume filename is missing"
        )

    if not file.filename.lower().endswith(".pdf"):

        raise HTTPException(
            status_code=400,
            detail="Only PDF resumes are allowed"
        )

    safe_filename = Path(
        file.filename
    ).name

    unique_filename = (
        f"{uuid.uuid4()}_{safe_filename}"
    )

    file_path = (
        UPLOAD_FOLDER /
        unique_filename
    )

    with open(
        file_path,
        "wb"
    ) as buffer:

        shutil.copyfileobj(
            file.file,
            buffer
        )

    return file_path


# ==================================================
# PROCESS RESUME
# ==================================================

def process_resume(
    file,
    job_description,
    job_skills
):

    file_path = save_resume(
        file
    )

    resume_text = extract_pdf_text(
        file_path
    )

    candidate = extract_candidate_details(
        resume_text
    )

    screening_result = screen_candidate(
        resume_text,
        candidate,
        job_description,
        job_skills
    )

    return {
        "filename":
            file.filename,

        "resume_path":
            str(file_path),

        "candidate":
            candidate,

        "screening_result":
            screening_result
    }


# ==================================================
# COMBINED SCORE
# ==================================================

def calculate_combined_score(
    match_score,
    ats_score
):

    match_score = float(
        match_score or 0
    )

    ats_score = float(
        ats_score or 0
    )

    combined_score = (
        match_score * 0.70
        +
        ats_score * 0.30
    )

    return round(
        combined_score,
        2
    )


# ==================================================
# RANKING VALUE
# ==================================================

def get_ranking_value(
    item,
    ranking_basis
):

    screening = item[
        "screening_result"
    ]

    if ranking_basis == "ats_score":

        return float(
            screening.get(
                "ats_score",
                0
            )
            or 0
        )

    if ranking_basis == "combined":

        return float(
            item.get(
                "combined_score",
                0
            )
            or 0
        )

    return float(
        screening.get(
            "final_match_score",
            0
        )
        or 0
    )


# ==================================================
# HOME
# ==================================================

@app.get("/")
def home():

    return {
        "status":
            "success",

        "message":
            "AI Resume Screening System is running",

        "version":
            "8.4.0"
    }


# ==================================================
# REGISTER
# ==================================================

@app.post("/register")
def register_user(

    data: RegisterRequest,

    db: Session = Depends(
        get_db
    )

):

    name = data.name.strip()

    email = (
        data.email
        .strip()
        .lower()
    )

    password = data.password


    if len(name) < 2:

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid name"
        )


    if (
        "@" not in email
        or "." not in email
    ):

        raise HTTPException(
            status_code=400,
            detail="Please enter a valid email"
        )


    if len(password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )


    existing_user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="An account with this email already exists"
        )


    new_user = User(
        name=name,

        email=email,

        password_hash=
            hash_password(
                password
            ),

        appearance="light"
    )


    db.add(
        new_user
    )

    db.commit()

    db.refresh(
        new_user
    )


    access_token = create_access_token(
        user_id=
            new_user.id,

        email=
            new_user.email
    )


    return {
        "status":
            "success",

        "message":
            "Recruiter account created successfully",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user": {
            "id":
                new_user.id,

            "name":
                new_user.name,

            "email":
                new_user.email
        }
    }


# ==================================================
# LOGIN
# ==================================================

@app.post("/login")
def login_user(

    data: LoginRequest,

    db: Session = Depends(
        get_db
    )

):

    email = (
        data.email
        .strip()
        .lower()
    )


    user = (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


    if not user:

        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,

            detail=
                "Invalid email or password"
        )


    if not verify_password(
        data.password,
        user.password_hash
    ):

        raise HTTPException(
            status_code=
                status.HTTP_401_UNAUTHORIZED,

            detail=
                "Invalid email or password"
        )


    access_token = create_access_token(
        user_id=
            user.id,

        email=
            user.email
    )


    return {
        "status":
            "success",

        "message":
            "Login successful",

        "access_token":
            access_token,

        "token_type":
            "bearer",

        "user": {
            "id":
                user.id,

            "name":
                user.name,

            "email":
                user.email
        }
    }


# ==================================================
# CURRENT USER
# ==================================================

@app.get("/me")
def get_me(

    current_user: User = Depends(
        get_current_user
    )

):

    return {
        "status":
            "success",

        "user": {
            "id":
                current_user.id,

            "name":
                current_user.name,

            "email":
                current_user.email,

            "phone":
                current_user.phone,

            "appearance":
                current_user.appearance
                or "light",

            "has_profile_image":
                bool(
                    current_user.profile_image
                ),

            "created_at":
                current_user.created_at
        }
    }


# ==================================================
# UPLOAD SINGLE RESUME
# ==================================================

@app.post("/upload-resume")
async def upload_resume(

    file: UploadFile = File(...),

    current_user: User = Depends(
        get_current_user
    )

):

    file_path = save_resume(
        file
    )

    resume_text = extract_pdf_text(
        file_path
    )

    candidate = extract_candidate_details(
        resume_text
    )


    return {
        "status":
            "success",

        "filename":
            file.filename,

        "candidate":
            candidate,

        "resume_text":
            resume_text
    }


# ==================================================
# SINGLE RESUME SCREENING
# ==================================================

@app.post("/screen-resume")
async def screen_resume(

    job_description: str = Form(...),

    file: UploadFile = File(...),

    current_user: User = Depends(
        get_current_user
    )

):

    if not job_description.strip():

        raise HTTPException(
            status_code=400,
            detail="Job description is required"
        )


    job_skills = extract_skills(
        job_description
    )


    result = process_resume(
        file,
        job_description,
        job_skills
    )


    return {
        "status":
            "success",

        "job_skills":
            job_skills,

        "candidate":
            result["candidate"],

        "screening_result":
            result["screening_result"]
    }


# ==================================================
# MULTIPLE RESUME SCREENING
# ==================================================

@app.post("/rank-resumes")
async def rank_resumes(

    job_title: str = Form(
        "Untitled Job"
    ),

    job_description: str = Form(...),

    top_candidates_limit: int = Form(...),

    ranking_basis: str = Form(...),

    files: list[UploadFile] = File(...),

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    if not job_description.strip():

        raise HTTPException(
            status_code=400,
            detail="Job description is required"
        )


    if len(files) < 1:

        raise HTTPException(
            status_code=400,
            detail="Please upload at least one resume"
        )


    if top_candidates_limit < 1:

        raise HTTPException(
            status_code=400,
            detail="Top candidates must be at least 1"
        )


    allowed_ranking_basis = [
        "match_score",
        "ats_score",
        "combined"
    ]


    if ranking_basis not in allowed_ranking_basis:

        raise HTTPException(
            status_code=400,
            detail="Invalid ranking basis"
        )


    for file in files:

        if not file.filename:

            raise HTTPException(
                status_code=400,
                detail="Invalid resume file"
            )


        if not file.filename.lower().endswith(
            ".pdf"
        ):

            raise HTTPException(
                status_code=400,
                detail=(
                    f"{file.filename}: "
                    "Only PDF resumes are allowed"
                )
            )


    job_skills = extract_skills(
        job_description
    )


    try:

        new_job = Job(
            user_id=
                current_user.id,

            title=(
                job_title.strip()
                if job_title.strip()
                else "Untitled Job"
            ),

            description=
                job_description,

            required_skills=
                json.dumps(
                    job_skills
                ),

            top_candidates_limit=
                top_candidates_limit,

            ranking_basis=
                ranking_basis
        )


        db.add(
            new_job
        )

        db.flush()


        analyzed_candidates = []


        for file in files:

            result = process_resume(
                file,
                job_description,
                job_skills
            )


            candidate_data = (
                result["candidate"]
            )

            screening_data = (
                result[
                    "screening_result"
                ]
            )


            match_score = float(
                screening_data.get(
                    "final_match_score",
                    0
                )
                or 0
            )


            ats_score = float(
                screening_data.get(
                    "ats_score",
                    0
                )
                or 0
            )


            combined_score = (
                calculate_combined_score(
                    match_score,
                    ats_score
                )
            )


            result[
                "combined_score"
            ] = combined_score


            new_candidate = Candidate(
                job_id=
                    new_job.id,

                name=
                    candidate_data.get(
                        "name"
                    ),

                email=
                    candidate_data.get(
                        "email"
                    ),

                phone=
                    candidate_data.get(
                        "phone"
                    ),

                filename=
                    result["filename"],

                resume_path=
                    result["resume_path"],

                is_favorite=
                    False,

                skills=
                    json.dumps(
                        candidate_data.get(
                            "skills",
                            []
                        )
                    )
            )


            db.add(
                new_candidate
            )

            db.flush()


            new_screening_result = ScreeningResult(
                candidate_id=
                    new_candidate.id,

                final_match_score=
                    match_score,

                ats_score=
                    ats_score,

                skill_match_score=
                    screening_data.get(
                        "skill_match_score",
                        0
                    ),

                text_similarity_score=
                    screening_data.get(
                        "text_similarity_score",
                        0
                    ),

                recommendation=
                    screening_data.get(
                        "recommendation"
                    ),

                matched_skills=
                    json.dumps(
                        screening_data.get(
                            "matched_skills",
                            []
                        )
                    ),

                missing_skills=
                    json.dumps(
                        screening_data.get(
                            "missing_skills",
                            []
                        )
                    )
            )


            db.add(
                new_screening_result
            )


            analyzed_candidates.append(
                result
            )


        analyzed_candidates.sort(
            key=lambda item:
                get_ranking_value(
                    item,
                    ranking_basis
                ),

            reverse=True
        )


        for index, candidate in enumerate(
            analyzed_candidates,
            start=1
        ):

            candidate[
                "rank"
            ] = index


        actual_limit = min(
            top_candidates_limit,
            len(
                analyzed_candidates
            )
        )


        shortlisted_candidates = (
            analyzed_candidates[
                :actual_limit
            ]
        )


        db.commit()


        return {
            "status":
                "success",

            "message":
                "Resume screening and shortlisting completed",

            "job_id":
                new_job.id,

            "job_title":
                new_job.title,

            "ranking_basis":
                ranking_basis,

            "requested_top_candidates":
                top_candidates_limit,

            "total_resumes_analyzed":
                len(
                    analyzed_candidates
                ),

            "total_shortlisted":
                len(
                    shortlisted_candidates
                ),

            "job_skills":
                job_skills,

            "ranked_candidates":
                shortlisted_candidates
        }


    except HTTPException:

        db.rollback()

        raise


    except Exception as error:

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=(
                "Database save failed: "
                f"{str(error)}"
            )
        )


# ==================================================
# GET JOBS
# ==================================================

@app.get("/jobs")
def get_jobs(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    jobs = (
        db.query(Job)
        .filter(
            Job.user_id ==
            current_user.id
        )
        .order_by(
            Job.id.desc()
        )
        .all()
    )


    job_list = []


    for job in jobs:

        job_list.append({
            "id":
                job.id,

            "title":
                job.title,

            "description":
                job.description,

            "required_skills":
                json.loads(
                    job.required_skills
                )
                if job.required_skills
                else [],

            "top_candidates_limit":
                job.top_candidates_limit,

            "ranking_basis":
                job.ranking_basis,

            "total_candidates":
                len(
                    job.candidates
                ),

            "created_at":
                job.created_at
        })


    return {
        "status":
            "success",

        "total_jobs":
            len(
                job_list
            ),

        "jobs":
            job_list
    }


# ==================================================
# GET CANDIDATES
# ==================================================

@app.get("/candidates")
def get_candidates(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    jobs = (
        db.query(Job)
        .filter(
            Job.user_id ==
            current_user.id
        )
        .order_by(
            Job.id.desc()
        )
        .all()
    )


    shortlisted_candidate_list = []


    for job in jobs:

        job_candidates = []


        for candidate in job.candidates:

            result = (
                candidate.screening_result
            )


            if not result:

                continue


            match_score = float(
                result.final_match_score
                or 0
            )


            ats_score = float(
                result.ats_score
                or 0
            )


            combined_score = (
                calculate_combined_score(
                    match_score,
                    ats_score
                )
            )


            candidate_item = {
                "id":
                    candidate.id,

                "job_id":
                    candidate.job_id,

                "job_title":
                    job.title,

                "name":
                    candidate.name,

                "email":
                    candidate.email,

                "phone":
                    candidate.phone,

                "filename":
                    candidate.filename,

                "is_favorite":
                    bool(
                        candidate.is_favorite
                    ),

                "skills":
                    json.loads(
                        candidate.skills
                    )
                    if candidate.skills
                    else [],

                "final_match_score":
                    match_score,

                "ats_score":
                    ats_score,

                "combined_score":
                    combined_score,

                "skill_match_score":
                    result.skill_match_score,

                "text_similarity_score":
                    result.text_similarity_score,

                "recommendation":
                    result.recommendation,

                "matched_skills":
                    json.loads(
                        result.matched_skills
                    )
                    if result.matched_skills
                    else [],

                "missing_skills":
                    json.loads(
                        result.missing_skills
                    )
                    if result.missing_skills
                    else [],

                "ranking_basis":
                    job.ranking_basis
                    or "match_score",

                "created_at":
                    candidate.created_at,

                "screening_result": {
                    "final_match_score":
                        match_score,

                    "ats_score":
                        ats_score
                }
            }


            job_candidates.append(
                candidate_item
            )


        ranking_basis = (
            job.ranking_basis
            or "match_score"
        )


        job_candidates.sort(
            key=lambda item:
                get_ranking_value(
                    item,
                    ranking_basis
                ),

            reverse=True
        )


        if (
            job.top_candidates_limit
            and
            job.top_candidates_limit > 0
        ):

            limit = min(
                job.top_candidates_limit,
                len(
                    job_candidates
                )
            )

        else:

            limit = len(
                job_candidates
            )


        shortlisted = (
            job_candidates[
                :limit
            ]
        )


        for index, item in enumerate(
            shortlisted,
            start=1
        ):

            item[
                "rank"
            ] = index

            item.pop(
                "screening_result",
                None
            )


        shortlisted_candidate_list.extend(
            shortlisted
        )


    return {
        "status":
            "success",

        "total_candidates":
            len(
                shortlisted_candidate_list
            ),

        "candidates":
            shortlisted_candidate_list
    }
