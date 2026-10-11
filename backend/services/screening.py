from functools import lru_cache

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from sentence_transformers import SentenceTransformer


# ==========================================
# LOAD AI MODEL
# Model is loaded only once
# ==========================================

@lru_cache(maxsize=1)
def get_ai_model():

    model = SentenceTransformer(
        "all-MiniLM-L6-v2"
    )

    return model


# ==========================================
# CACHE JOB DESCRIPTION EMBEDDING
# Same JD is encoded only once
# ==========================================

@lru_cache(maxsize=100)
def get_job_embedding(
    job_description
):

    model = get_ai_model()

    embedding = model.encode(
        job_description,
        normalize_embeddings=True,
        show_progress_bar=False
    )

    return embedding


# ==========================================
# OLD TF-IDF TEXT SIMILARITY
# Used for Match Score
# ==========================================

def calculate_text_similarity(
    resume_text,
    job_description
):

    try:

        vectorizer = TfidfVectorizer(
            stop_words="english"
        )

        vectors = vectorizer.fit_transform(
            [
                resume_text,
                job_description
            ]
        )

        similarity = cosine_similarity(
            vectors[0:1],
            vectors[1:2]
        )[0][0]

        return round(
            float(similarity) * 100,
            2
        )

    except ValueError:

        return 0.0


# ==========================================
# AI SEMANTIC SIMILARITY
# Optimized version
# ==========================================

def calculate_ai_similarity(
    resume_text,
    job_description
):

    if (
        not resume_text.strip()
        or not job_description.strip()
    ):

        return 0.0

    try:

        model = get_ai_model()

        # Job Description embedding is cached
        job_embedding = get_job_embedding(
            job_description
        )

        # Only resume is encoded each time
        resume_embedding = model.encode(
            resume_text,
            normalize_embeddings=True,
            show_progress_bar=False
        )

        similarity = float(
            job_embedding
            @
            resume_embedding
        )

        similarity = max(
            0.0,
            min(
                similarity,
                1.0
            )
        )

        return round(
            similarity * 100,
            2
        )

    except Exception as error:

        print(
            "AI similarity error:",
            error
        )

        # Fallback
        return calculate_text_similarity(
            resume_text,
            job_description
        )


# ==========================================
# SKILL MATCH
# ==========================================

def calculate_skill_match(
    resume_skills,
    job_skills
):

    if not job_skills:

        return (
            0.0,
            [],
            []
        )

    resume_set = set(
        resume_skills
    )

    job_set = set(
        job_skills
    )

    matched_skills = sorted(
        resume_set.intersection(
            job_set
        )
    )

    missing_skills = sorted(
        job_set.difference(
            resume_set
        )
    )

    score = (
        len(matched_skills)
        /
        len(job_set)
    ) * 100

    return (
        round(score, 2),
        matched_skills,
        missing_skills
    )


# ==========================================
# RESUME SECTION SCORE
# Maximum contribution = 10 points
# ==========================================

def calculate_section_score(
    resume_text
):

    text = resume_text.lower()

    sections = [

        [
            "skills",
            "technical skills"
        ],

        [
            "education",
            "qualification",
            "academic"
        ],

        [
            "experience",
            "work experience",
            "internship"
        ],

        [
            "projects",
            "project"
        ]

    ]

    found_sections = 0

    for section_names in sections:

        if any(
            name in text
            for name in section_names
        ):

            found_sections += 1

    # 4 sections = 10 marks
    return (
        found_sections
        /
        len(sections)
    ) * 10


# ==========================================
# CONTACT SCORE
# Maximum contribution = 5 points
# ==========================================

def calculate_contact_score(
    candidate
):

    score = 0.0

    if candidate.get("email"):

        score += 2.5

    if candidate.get("phone"):

        score += 2.5

    return score


# ==========================================
# READABILITY SCORE
# Maximum contribution = 5 points
# ==========================================

def calculate_readability_score(
    resume_text
):

    word_count = len(
        resume_text.split()
    )

    if 250 <= word_count <= 1200:

        return 5.0

    if 150 <= word_count < 250:

        return 4.0

    if 80 <= word_count < 150:

        return 2.5

    if word_count > 1200:

        return 3.0

    return 1.0


# ==========================================
# HYBRID AI ATS SCORE
# ==========================================

def calculate_ats_score(
    resume_text,
    candidate,
    job_description,
    skill_match_score
):

    # --------------------------------------
    # 1. AI Semantic Job Match
    # Weight = 50%
    # --------------------------------------

    ai_score = calculate_ai_similarity(
        resume_text,
        job_description
    )

    ai_contribution = (
        ai_score * 0.50
    )

    # --------------------------------------
    # 2. Required Skill Match
    # Weight = 30%
    # --------------------------------------

    skill_contribution = (
        skill_match_score * 0.30
    )

    # --------------------------------------
    # 3. Resume Sections
    # Maximum = 10
    # --------------------------------------

    section_contribution = (
        calculate_section_score(
            resume_text
        )
    )

    # --------------------------------------
    # 4. Contact Information
    # Maximum = 5
    # --------------------------------------

    contact_contribution = (
        calculate_contact_score(
            candidate
        )
    )

    # --------------------------------------
    # 5. Readability
    # Maximum = 5
    # --------------------------------------

    readability_contribution = (
        calculate_readability_score(
            resume_text
        )
    )

    final_ats_score = (

        ai_contribution

        + skill_contribution

        + section_contribution

        + contact_contribution

        + readability_contribution

    )

    final_ats_score = max(
        0,
        min(
            final_ats_score,
            100
        )
    )

    return (
        round(
            final_ats_score,
            2
        ),
        ai_score
    )


# ==========================================
# RECOMMENDATION
# ==========================================

def get_recommendation(
    score
):

    if score >= 75:

        return "Strong Match"

    elif score >= 50:

        return "Good Match"

    elif score >= 30:

        return "Partial Match"

    else:

        return "Low Match"


# ==========================================
# SCREEN CANDIDATE
# ==========================================

def screen_candidate(
    resume_text,
    candidate,
    job_description,
    job_skills
):

    resume_skills = (
        candidate["skills"]
    )

    (
        skill_score,
        matched_skills,
        missing_skills
    ) = calculate_skill_match(
        resume_skills,
        job_skills
    )

    text_score = calculate_text_similarity(
        resume_text,
        job_description
    )

    # ======================================
    # MATCH SCORE
    # ======================================

    if job_skills:

        final_match_score = (

            skill_score * 0.70

            +

            text_score * 0.30

        )

    else:

        final_match_score = (
            text_score
        )

    final_match_score = round(
        final_match_score,
        2
    )

    # ======================================
    # AI ATS SCORE
    # ======================================

    (
        ats_score,
        ai_semantic_score
    ) = calculate_ats_score(

        resume_text,

        candidate,

        job_description,

        skill_score

    )

    recommendation = (
        get_recommendation(
            final_match_score
        )
    )

    return {

        "final_match_score":
            final_match_score,

        "ats_score":
            ats_score,

        "ai_semantic_score":
            ai_semantic_score,

        "skill_match_score":
            skill_score,

        "text_similarity_score":
            text_score,

        "matched_skills":
            matched_skills,

        "missing_skills":
            missing_skills,

        "recommendation":
            recommendation

    }