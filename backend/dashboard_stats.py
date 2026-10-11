from fastapi import (
    APIRouter,
    Depends
)

from sqlalchemy.orm import Session

from database import get_db

from models import (
    User,
    Job
)

from auth import get_current_user


router = APIRouter()


# ==========================================
# COMBINED SCORE
# ==========================================

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

    return round(
        (
            match_score * 0.70
            +
            ats_score * 0.30
        ),
        2
    )


# ==========================================
# DASHBOARD STATS
# ==========================================

@router.get("/dashboard-stats")
def get_dashboard_stats(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    # ------------------------------------------
    # CURRENT USER JOBS ONLY
    # ------------------------------------------

    jobs = (
        db.query(Job)
        .filter(
            Job.user_id ==
            current_user.id
        )
        .all()
    )


    total_uploaded_resumes = 0

    shortlisted_candidates = []


    # ------------------------------------------
    # PROCESS EACH JOB
    # ------------------------------------------

    for job in jobs:

        job_candidates = []


        for candidate in job.candidates:

            total_uploaded_resumes += 1


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

                "match_score":
                    match_score,

                "ats_score":
                    ats_score,

                "combined_score":
                    combined_score

            }


            job_candidates.append(
                candidate_item
            )


        # --------------------------------------
        # SORT BY JOB RANKING BASIS
        # --------------------------------------

        ranking_basis = (
            job.ranking_basis
            or "match_score"
        )


        if ranking_basis == "ats_score":

            job_candidates.sort(
                key=lambda item:
                    item["ats_score"],
                reverse=True
            )


        elif ranking_basis == "combined":

            job_candidates.sort(
                key=lambda item:
                    item["combined_score"],
                reverse=True
            )


        else:

            job_candidates.sort(
                key=lambda item:
                    item["match_score"],
                reverse=True
            )


        # --------------------------------------
        # TOP N
        # --------------------------------------

        if (
            job.top_candidates_limit
            and
            job.top_candidates_limit > 0
        ):

            limit = min(
                job.top_candidates_limit,
                len(job_candidates)
            )


        else:

            limit = len(
                job_candidates
            )


        shortlisted_candidates.extend(
            job_candidates[:limit]
        )


    # ==========================================
    # FINAL STATS
    # ==========================================

    total_shortlisted = len(
        shortlisted_candidates
    )


    strong_matches = len([

        candidate

        for candidate
        in shortlisted_candidates

        if candidate["match_score"] >= 75

    ])


    if shortlisted_candidates:

        best_ats_score = max(

            candidate["ats_score"]

            for candidate
            in shortlisted_candidates

        )

    else:

        best_ats_score = 0


    return {

        "status":
            "success",

        "shortlisted":
            total_shortlisted,

        "strong_matches":
            strong_matches,

        "uploaded_resumes":
            total_uploaded_resumes,

        "best_ats_score":
            round(
                best_ats_score,
                2
            )

    }