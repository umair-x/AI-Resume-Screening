import { useEffect, useState } from "react";

const API_URL = "https://ai-resume-screening-production-96a5.up.railway.app";


function SettingsPage({
  currentUser,
  onLogout,
  onUserUpdated,
  onAppearanceChange
}) {

  const [name, setName] = useState(
    currentUser?.name || ""
  );

  const [email, setEmail] = useState(
    currentUser?.email || ""
  );

  const [phone, setPhone] = useState("");

  const [appearance, setAppearance] =
    useState("light");

  const [profileFile, setProfileFile] =
    useState(null);

  const [profileImageUrl, setProfileImageUrl] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");


  // ==========================================
  // TOKEN
  // ==========================================

  const getToken = () => {
    return localStorage.getItem(
      "resumeai_token"
    );
  };


  // ==========================================
  // LOAD PROFILE
  // ==========================================

  const loadProfile = async () => {

    setLoading(true);
    setError("");

    try {

      const response = await fetch(
        `${API_URL}/profile`,
        {
          headers: {
            Authorization:
              `Bearer ${getToken()}`
          }
        }
      );


      if (response.status === 401) {

        onLogout?.();

        return;

      }


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to load profile."
        );

      }


      setName(
        data.user.name || ""
      );

      setEmail(
        data.user.email || ""
      );

      setPhone(
        data.user.phone || ""
      );

      setAppearance(
        data.user.appearance || "light"
      );


      onAppearanceChange?.(
        data.user.appearance || "light"
      );


      if (data.user.has_profile_image) {

        await loadProfileImage();

      }

    }

    catch (err) {

      setError(
        err.message ||
        "Unable to load profile."
      );

    }

    finally {

      setLoading(false);

    }

  };


  // ==========================================
  // LOAD PROFILE IMAGE
  // ==========================================

  const loadProfileImage = async () => {

    try {

      const response = await fetch(
        `${API_URL}/profile-image`,
        {
          headers: {
            Authorization:
              `Bearer ${getToken()}`
          }
        }
      );


      if (!response.ok) {
        return;
      }


      const blob =
        await response.blob();


      const imageUrl =
        URL.createObjectURL(blob);


      setProfileImageUrl(
        (oldUrl) => {

          if (
            oldUrl &&
            oldUrl.startsWith("blob:")
          ) {

            URL.revokeObjectURL(
              oldUrl
            );

          }

          return imageUrl;

        }
      );

    }

    catch {

      // No profile image

    }

  };


  // ==========================================
  // FIRST LOAD
  // ==========================================

  useEffect(() => {

    loadProfile();

  }, []);


  // ==========================================
  // SELECT IMAGE
  // ==========================================

  const handleImageChange = (event) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      setError(
        "Please select JPG, PNG or WEBP image."
      );

      return;

    }


    if (
      file.size >
      5 * 1024 * 1024
    ) {

      setError(
        "Profile photo must be smaller than 5 MB."
      );

      return;

    }


    setError("");

    setProfileFile(file);


    const previewUrl =
      URL.createObjectURL(file);


    setProfileImageUrl(
      (oldUrl) => {

        if (
          oldUrl &&
          oldUrl.startsWith("blob:")
        ) {

          URL.revokeObjectURL(
            oldUrl
          );

        }

        return previewUrl;

      }
    );

  };


  // ==========================================
  // SAVE PROFILE
  // ==========================================

  const saveProfile = async () => {

    setError("");
    setMessage("");


    if (
      name.trim().length < 2
    ) {

      setError(
        "Please enter a valid name."
      );

      return;

    }


    if (
      !email.includes("@") ||
      !email.includes(".")
    ) {

      setError(
        "Please enter a valid email."
      );

      return;

    }


    setSaving(true);


    try {

      const formData =
        new FormData();


      formData.append(
        "name",
        name.trim()
      );

      formData.append(
        "email",
        email.trim()
      );

      formData.append(
        "phone",
        phone.trim()
      );

      formData.append(
        "appearance",
        appearance
      );


      if (profileFile) {

        formData.append(
          "profile_image",
          profileFile
        );

      }


      const response = await fetch(
        `${API_URL}/profile`,
        {
          method: "PUT",

          headers: {
            Authorization:
              `Bearer ${getToken()}`
          },

          body:
            formData
        }
      );


      if (response.status === 401) {

        onLogout?.();

        return;

      }


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to save profile."
        );

      }


      setProfileFile(null);


      setMessage(
        "Profile updated successfully."
      );


      onUserUpdated?.(
        data.user
      );


      onAppearanceChange?.(
        data.user.appearance
      );


      if (
        data.user.has_profile_image
      ) {

        await loadProfileImage();

      }

    }

    catch (err) {

      setError(
        err.message ||
        "Profile update failed."
      );

    }

    finally {

      setSaving(false);

    }

  };


  // ==========================================
  // REMOVE PHOTO
  // ==========================================

  const removeProfilePhoto = async () => {

    const confirmed =
      window.confirm(
        "Remove your profile photo?"
      );


    if (!confirmed) {
      return;
    }


    try {

      const response = await fetch(
        `${API_URL}/profile-image`,
        {
          method: "DELETE",

          headers: {
            Authorization:
              `Bearer ${getToken()}`
          }
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Unable to remove photo."
        );

      }


      if (
        profileImageUrl &&
        profileImageUrl.startsWith(
          "blob:"
        )
      ) {

        URL.revokeObjectURL(
          profileImageUrl
        );

      }


      setProfileImageUrl("");

      setProfileFile(null);

      setMessage(
        "Profile photo removed."
      );

    }

    catch (err) {

      setError(
        err.message ||
        "Unable to remove photo."
      );

    }

  };


  // ==========================================
  // APPEARANCE
  // ==========================================

  const handleAppearanceChange = (
    value
  ) => {

    setAppearance(value);

    onAppearanceChange?.(
      value
    );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div
        style={{
          padding: "40px"
        }}
      >
        Loading Settings...
      </div>

    );

  }


  // ==========================================
  // UI
  // ==========================================

  return (

    <>

      <header>

        <div>

          <p className="welcome">
            ACCOUNT SETTINGS
          </p>

          <h1>
            Settings
          </h1>

          <p className="subtitle">
            Manage your profile and appearance.
          </p>

        </div>

      </header>


      <div
        style={{
          maxWidth: "850px",
          background: "white",
          borderRadius: "16px",
          padding: "30px",
          boxShadow:
            "0 4px 20px rgba(15, 23, 42, 0.08)"
        }}
      >


        {/* PROFILE PHOTO */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
            paddingBottom: "25px",
            marginBottom: "25px",
            borderBottom:
              "1px solid #e2e8f0"
          }}
        >

          <div
            style={{
              width: "95px",
              height: "95px",
              borderRadius: "50%",
              overflow: "hidden",
              background: "#e2e8f0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
              fontWeight: "700",
              color: "#475569"
            }}
          >

            {
              profileImageUrl

                ? (
                  <img
                    src={profileImageUrl}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }}
                  />
                )

                : (
                  name
                    ?.charAt(0)
                    ?.toUpperCase() ||
                  "U"
                )
            }

          </div>


          <div>

            <h3
              style={{
                marginTop: 0,
                marginBottom: "8px"
              }}
            >
              Profile Photo
            </h3>


            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={
                handleImageChange
              }
            />


            {
              profileImageUrl && (

                <button
                  type="button"
                  onClick={
                    removeProfilePhoto
                  }
                  style={{
                    display: "block",
                    marginTop: "10px",
                    border: "none",
                    background: "transparent",
                    color: "#dc2626",
                    cursor: "pointer",
                    padding: 0
                  }}
                >
                  Remove Photo
                </button>

              )
            }

          </div>

        </div>


        {/* NAME */}

        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label>
            Full Name
          </label>

          <input
            type="text"
            value={name}
            onChange={(event) =>
              setName(
                event.target.value
              )
            }
            style={{
              width: "100%",
              padding: "13px",
              border:
                "1px solid #d1d5db",
              borderRadius: "9px",
              marginTop: "8px",
              boxSizing: "border-box"
            }}
          />

        </div>


        {/* EMAIL */}

        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label>
            Email / Gmail
          </label>

          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(
                event.target.value
              )
            }
            style={{
              width: "100%",
              padding: "13px",
              border:
                "1px solid #d1d5db",
              borderRadius: "9px",
              marginTop: "8px",
              boxSizing: "border-box"
            }}
          />

        </div>


        {/* PHONE */}

        <div
          style={{
            marginBottom: "20px"
          }}
        >

          <label>
            Mobile Number
          </label>

          <input
            type="tel"
            placeholder="Enter mobile number"
            value={phone}
            onChange={(event) =>
              setPhone(
                event.target.value
              )
            }
            style={{
              width: "100%",
              padding: "13px",
              border:
                "1px solid #d1d5db",
              borderRadius: "9px",
              marginTop: "8px",
              boxSizing: "border-box"
            }}
          />

        </div>


        {/* APPEARANCE */}

        <div
          style={{
            marginBottom: "25px"
          }}
        >

          <label>
            Appearance
          </label>


          <select
            value={appearance}
            onChange={(event) =>
              handleAppearanceChange(
                event.target.value
              )
            }
            style={{
              width: "100%",
              padding: "13px",
              border:
                "1px solid #d1d5db",
              borderRadius: "9px",
              marginTop: "8px",
              background: "white"
            }}
          >

            <option value="light">
              ☀ Light Mode
            </option>

            <option value="dark">
              🌙 Dark Mode
            </option>

          </select>

        </div>


        {
          error && (

            <div
              style={{
                padding: "12px",
                background: "#fef2f2",
                color: "#dc2626",
                borderRadius: "8px",
                marginBottom: "15px"
              }}
            >
              {error}
            </div>

          )
        }


        {
          message && (

            <div
              style={{
                padding: "12px",
                background: "#ecfdf5",
                color: "#047857",
                borderRadius: "8px",
                marginBottom: "15px"
              }}
            >
              {message}
            </div>

          )
        }


        {/* SAVE */}

        <button
          type="button"
          onClick={
            saveProfile
          }
          disabled={saving}
          style={{
            width: "100%",
            padding: "14px",
            border: "none",
            borderRadius: "9px",
            background: "#2563eb",
            color: "white",
            fontWeight: "600",
            cursor: "pointer",
            fontSize: "15px"
          }}
        >

          {
            saving
              ? "Saving..."
              : "Save Changes"
          }

        </button>


        {/* LOGOUT AREA */}

        <div
          style={{
            marginTop: "30px",
            paddingTop: "25px",
            borderTop:
              "1px solid #e2e8f0"
          }}
        >

          <h3>
            Account
          </h3>

          <p
            style={{
              color: "#64748b",
              fontSize: "14px"
            }}
          >
            Logout from your ResumeAI account.
          </p>


          <button
            type="button"
            onClick={
              onLogout
            }
            style={{
              padding: "12px 22px",
              border:
                "1px solid #dc2626",
              borderRadius: "9px",
              background: "#fff",
              color: "#dc2626",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            Logout
          </button>

        </div>

      </div>

    </>

  );

}


export default SettingsPage;
