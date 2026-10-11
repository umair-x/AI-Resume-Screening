from pathlib import Path

from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from fastapi.responses import FileResponse

from sqlalchemy.orm import Session

from database import get_db

from models import (
    User,
    Job,
    Candidate
)

from auth import get_current_user


router = APIRouter()


# ==========================================
# CHECK CANDIDATE OWNERSHIP
# ==========================================

def get_owned_candidate(
    candidate_id: int,
    current_user: User,
    db: Session
):

    candidate = (
        db.query(Candidate)
        .join(
            Job,
            Candidate.job_id == Job.id
        )
        .filter(
            Candidate.id == candidate_id,
            Job.user_id == current_user.id
        )
        .first()
    )


    if not candidate:

        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )


    return candidate


# ==========================================
# TOGGLE FAVORITE
# ==========================================

@router.patch(
    "/candidates/{candidate_id}/favorite"
)
def toggle_favorite(

    candidate_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    candidate = get_owned_candidate(
        candidate_id,
        current_user,
        db
    )


    candidate.is_favorite = (
        not candidate.is_favorite
    )


    db.commit()

    db.refresh(
        candidate
    )


    return {

        "status":
            "success",

        "candidate_id":
            candidate.id,

        "is_favorite":
            bool(
                candidate.is_favorite
            )

    }


# ==========================================
# OPEN RESUME PDF
# ==========================================

@router.get(
    "/candidates/{candidate_id}/resume"
)
def open_resume(

    candidate_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    candidate = get_owned_candidate(
        candidate_id,
        current_user,
        db
    )


    if not candidate.resume_path:

        raise HTTPException(
            status_code=404,
            detail=(
                "PDF path is not available "
                "for this old candidate"
            )
        )


    file_path = Path(
        candidate.resume_path
    )


    if not file_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Resume PDF file not found"
        )


    return FileResponse(

        path=str(
            file_path
        ),

        media_type=
            "application/pdf",

        filename=
            candidate.filename,

        content_disposition_type=
            "inline"

    )


# ==========================================
# DELETE CANDIDATE
# ==========================================

@router.delete(
    "/candidates/{candidate_id}"
)
def delete_candidate(

    candidate_id: int,

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    candidate = get_owned_candidate(
        candidate_id,
        current_user,
        db
    )


    resume_path = (
        candidate.resume_path
    )


    candidate_name = (
        candidate.name
        or "Candidate"
    )


    db.delete(
        candidate
    )

    db.commit()


    # Delete PDF from uploads folder
    if resume_path:

        file_path = Path(
            resume_path
        )


        if file_path.exists():

            try:

                file_path.unlink()

            except Exception:

                pass


    return {

        "status":
            "success",

        "message":
            f"{candidate_name} deleted successfully"

    }