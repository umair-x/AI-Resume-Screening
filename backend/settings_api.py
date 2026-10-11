from pathlib import Path
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
    Form
)

from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from database import get_db
from models import User
from auth import get_current_user


router = APIRouter()


# ==========================================
# PROFILE IMAGE FOLDER
# ==========================================

PROFILE_IMAGE_FOLDER = Path(
    "profile_images"
)

PROFILE_IMAGE_FOLDER.mkdir(
    exist_ok=True
)


# ==========================================
# GET PROFILE
# ==========================================

@router.get("/profile")
def get_profile(

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
                )

        }

    }


# ==========================================
# UPDATE PROFILE
# ==========================================

@router.put("/profile")
async def update_profile(

    name: str = Form(...),

    email: str = Form(...),

    phone: str = Form(""),

    appearance: str = Form("light"),

    profile_image: UploadFile | None = File(
        None
    ),

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    name = name.strip()

    email = (
        email
        .strip()
        .lower()
    )

    phone = phone.strip()

    appearance = (
        appearance
        .strip()
        .lower()
    )


    # ======================================
    # VALIDATION
    # ======================================

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


    if appearance not in [
        "light",
        "dark"
    ]:

        raise HTTPException(
            status_code=400,
            detail="Invalid appearance option"
        )


    # ======================================
    # CHECK EMAIL
    # ======================================

    existing_user = (
        db.query(User)
        .filter(
            User.email == email,
            User.id != current_user.id
        )
        .first()
    )


    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="This email is already being used"
        )


    # ======================================
    # PROFILE IMAGE
    # ======================================

    if (
        profile_image
        and
        profile_image.filename
    ):

        allowed_extensions = [
            ".jpg",
            ".jpeg",
            ".png",
            ".webp"
        ]


        extension = Path(
            profile_image.filename
        ).suffix.lower()


        if extension not in allowed_extensions:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Profile image must be "
                    "JPG, JPEG, PNG or WEBP"
                )
            )


        image_bytes = await profile_image.read()


        # Maximum 5 MB
        if len(image_bytes) > 5 * 1024 * 1024:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Profile image must be "
                    "smaller than 5 MB"
                )
            )


        unique_filename = (
            f"user_{current_user.id}_"
            f"{uuid.uuid4()}"
            f"{extension}"
        )


        new_image_path = (
            PROFILE_IMAGE_FOLDER /
            unique_filename
        )


        with open(
            new_image_path,
            "wb"
        ) as image_file:

            image_file.write(
                image_bytes
            )


        # Delete old profile photo
        if current_user.profile_image:

            old_image_path = Path(
                current_user.profile_image
            )


            if old_image_path.exists():

                try:

                    old_image_path.unlink()

                except Exception:

                    pass


        current_user.profile_image = (
            str(
                new_image_path
            )
        )


    # ======================================
    # SAVE PROFILE
    # ======================================

    current_user.name = name

    current_user.email = email

    current_user.phone = (
        phone
        if phone
        else None
    )

    current_user.appearance = (
        appearance
    )


    db.commit()

    db.refresh(
        current_user
    )


    return {

        "status":
            "success",

        "message":
            "Profile updated successfully",

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
                current_user.appearance,

            "has_profile_image":
                bool(
                    current_user.profile_image
                )

        }

    }


# ==========================================
# GET PROFILE IMAGE
# ==========================================

@router.get("/profile-image")
def get_profile_image(

    current_user: User = Depends(
        get_current_user
    )

):

    if not current_user.profile_image:

        raise HTTPException(
            status_code=404,
            detail="Profile image not found"
        )


    image_path = Path(
        current_user.profile_image
    )


    if not image_path.exists():

        raise HTTPException(
            status_code=404,
            detail="Profile image file not found"
        )


    return FileResponse(
        path=str(
            image_path
        )
    )


# ==========================================
# REMOVE PROFILE IMAGE
# ==========================================

@router.delete("/profile-image")
def remove_profile_image(

    current_user: User = Depends(
        get_current_user
    ),

    db: Session = Depends(
        get_db
    )

):

    if current_user.profile_image:

        image_path = Path(
            current_user.profile_image
        )


        if image_path.exists():

            try:

                image_path.unlink()

            except Exception:

                pass


    current_user.profile_image = None


    db.commit()


    return {

        "status":
            "success",

        "message":
            "Profile image removed"

    }