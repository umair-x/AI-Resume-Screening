import {
  cloneElement,
  isValidElement,
  useEffect,
  useState
} from "react";

import "./AuthGate.css";


const API_URL = "https://ai-resume-screening-production-96a5.up.railway.app";


function AuthGate({ children }) {

  const [mode, setMode] =
    useState("login");

  const [name, setName] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [user, setUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // CHECK SAVED LOGIN
  // ==========================================

  useEffect(() => {

    checkLogin();

  }, []);


  const checkLogin = async () => {

    const token =
      localStorage.getItem(
        "resumeai_token"
      );


    if (!token) {

      setLoading(false);

      return;

    }


    try {

      const response = await fetch(
        `${API_URL}/me`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`
          }
        }
      );


      if (!response.ok) {

        localStorage.removeItem(
          "resumeai_token"
        );

        setLoading(false);

        return;

      }


      const data =
        await response.json();


      setUser(
        data.user
      );

    }

    catch {

      localStorage.removeItem(
        "resumeai_token"
      );

    }

    finally {

      setLoading(false);

    }

  };


  // ==========================================
  // LOGIN / REGISTER
  // ==========================================

  const handleSubmit = async (event) => {

    event.preventDefault();

    setError("");


    if (
      mode === "register" &&
      !name.trim()
    ) {

      setError(
        "Please enter your name."
      );

      return;

    }


    if (!email.trim()) {

      setError(
        "Please enter your email."
      );

      return;

    }


    if (!password) {

      setError(
        "Please enter your password."
      );

      return;

    }


    setSubmitting(true);


    try {

      const endpoint =
        mode === "login"
          ? "/login"
          : "/register";


      const body =
        mode === "login"
          ? {
              email:
                email.trim(),

              password:
                password
            }
          : {
              name:
                name.trim(),

              email:
                email.trim(),

              password:
                password
            };


      const response = await fetch(
        `${API_URL}${endpoint}`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body:
            JSON.stringify(
              body
            )
        }
      );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Authentication failed."
        );

      }


      localStorage.setItem(
        "resumeai_token",
        data.access_token
      );


      setUser(
        data.user
      );


      setPassword("");

    }

    catch (err) {

      setError(
        err.message ||
        "Authentication failed."
      );

    }

    finally {

      setSubmitting(false);

    }

  };


  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {

    localStorage.removeItem(
      "resumeai_token"
    );


    setUser(null);

    setName("");

    setEmail("");

    setPassword("");

    setMode("login");

    setError("");

  };


  // ==========================================
  // USER UPDATE
  // ==========================================

  const handleUserUpdated = (
    updatedUser
  ) => {

    setUser(
      (oldUser) => ({
        ...oldUser,
        ...updatedUser
      })
    );

  };


  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {

    return (

      <div className="authLoading">

        <div className="authLoader">
          AI
        </div>

        <p>
          Loading ResumeAI...
        </p>

      </div>

    );

  }


  // ==========================================
  // LOGGED IN
  // ==========================================

  if (user) {

    if (
      isValidElement(children)
    ) {

      return cloneElement(
        children,
        {
          currentUser: user,
          onLogout: handleLogout,
          onUserUpdated:
            handleUserUpdated
        }
      );

    }


    return children;

  }


  // ==========================================
  // AUTH PAGE
  // ==========================================

  return (

    <div className="authPage">


      {/* ======================================
          LEFT SIDE
      ====================================== */}

      <div className="authLeft">


        <div className="authBrand">

          <div className="authLogo">
            AI
          </div>

          <div>

            <h1>
              ResumeAI
            </h1>

            <p>
              AI Resume Screening System
            </p>

          </div>

        </div>


        <div className="authHero">

          <span>
            MAJOR PROJECT
          </span>

          <h2>
            Intelligent Resume Screening
          </h2>

          <p>
            Screen, analyze and rank candidate
            resumes using AI and NLP.
          </p>


          <div className="authFeatures">

            <div>
              ✓ Automatic Resume Parsing
            </div>

            <div>
              ✓ AI Candidate Ranking
            </div>

            <div>
              ✓ Skill Gap Analysis
            </div>

            <div>
              ✓ MySQL Candidate Database
            </div>

          </div>

        </div>

      </div>


      {/* ======================================
          RIGHT SIDE
      ====================================== */}

      <div className="authRight">


        <div className="authCard">


          <div className="authCardHeader">

            <span className="authBadge">
              RECRUITER ACCESS
            </span>


            <h2>

              {
                mode === "login"
                  ? "Welcome Back"
                  : "Create Account"
              }

            </h2>


            <p>

              {
                mode === "login"
                  ? "Login to continue to your recruitment dashboard."
                  : "Register as a recruiter to start screening candidates."
              }

            </p>

          </div>


          {/* ==================================
              TABS
          ================================== */}

          <div className="authTabs">

            <button
              type="button"
              className={
                mode === "login"
                  ? "authTab active"
                  : "authTab"
              }
              onClick={() => {

                setMode("login");

                setError("");

              }}
            >
              Login
            </button>


            <button
              type="button"
              className={
                mode === "register"
                  ? "authTab active"
                  : "authTab"
              }
              onClick={() => {

                setMode("register");

                setError("");

              }}
            >
              Register
            </button>

          </div>


          {/* ==================================
              FORM
          ================================== */}

          <form
            onSubmit={
              handleSubmit
            }
          >


            {
              mode === "register" && (

                <div className="authField">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    placeholder="Enter recruiter name"
                    value={name}
                    onChange={(event) =>
                      setName(
                        event.target.value
                      )
                    }
                  />

                </div>

              )
            }


            <div className="authField">

              <label>
                Email Address
              </label>

              <input
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />

            </div>


            <div className="authField">

              <label>
                Password
              </label>

              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

            </div>


            {
              error && (

                <div className="authError">
                  {error}
                </div>

              )
            }


            <button
              type="submit"
              className="authSubmit"
              disabled={
                submitting
              }
            >

              {
                submitting
                  ? "Please wait..."
                  : mode === "login"
                    ? "Login to Dashboard"
                    : "Create Recruiter Account"
              }

            </button>

          </form>


          <p className="authFooter">

            {
              mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"
            }


            <button
              type="button"
              onClick={() => {

                setMode(
                  mode === "login"
                    ? "register"
                    : "login"
                );

                setError("");

              }}
            >

              {
                mode === "login"
                  ? " Register"
                  : " Login"
              }

            </button>

          </p>


        </div>

      </div>

    </div>

  );

}


export default AuthGate;
