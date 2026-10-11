import re
import fitz

from fastapi import HTTPException
from data.skills import SKILLS


# -----------------------------------------
# SKILLS EXTRACTION
# -----------------------------------------

def extract_skills(text):

    text_lower = text.lower()

    detected_skills = []

    for skill in SKILLS:

        pattern = (
            r"(?<!\w)"
            + re.escape(skill.lower())
            + r"(?!\w)"
        )

        if re.search(pattern, text_lower):

            detected_skills.append(skill)

    return list(dict.fromkeys(detected_skills))


# -----------------------------------------
# CANDIDATE DETAILS EXTRACTION
# -----------------------------------------

def extract_candidate_details(text):

    # Email
    email_match = re.search(
        r"[\w\.-]+@[\w\.-]+\.\w+",
        text
    )

    email = (
        email_match.group(0)
        if email_match
        else None
    )


    # Phone Number
    phone_match = re.search(
        r"(?:\+91[\s-]?)?[6-9]\d{9}",
        text.replace(" ", "")
    )

    phone = (
        phone_match.group(0)
        if phone_match
        else None
    )


    # Name
    lines = [
        line.strip()
        for line in text.splitlines()
        if line.strip()
    ]

    name = (
        lines[0]
        if lines
        else "Unknown Candidate"
    )


    # Skills
    skills = extract_skills(text)


    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills
    }


# -----------------------------------------
# PDF TEXT EXTRACTION
# -----------------------------------------

def extract_pdf_text(file_path):

    try:

        document = fitz.open(file_path)

        text = ""

        for page in document:

            text += page.get_text()

        document.close()

        return text


    except Exception as error:

        raise HTTPException(
            status_code=500,
            detail=f"Unable to read PDF: {str(error)}"
        )