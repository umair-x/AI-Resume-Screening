import { useEffect, useState } from "react";

import "./App.css";
import SettingsPage from "./SettingsPage";



const API_URL = "https://ai-resume-screening-production-96a5.up.railway.app";



const JOB_ROLES = [

   "Full Stack Developer",

   "Frontend Developer",

   "Backend Developer",

   "Python Developer",

   "Java Developer",

   "React Developer",

   "Node.js Developer",

   "Software Engineer",

   "Android Developer",

   "Data Analyst",

   "Data Scientist",

   "Machine Learning Engineer",

   "AI Engineer",

   "DevOps Engineer",

   "Cloud Engineer",

   "Cyber Security Analyst"

];





function App({ currentUser, onLogout, onUserUpdated }) {



   const [currentPage, setCurrentPage] = useState("dashboard");



   const [jobRole, setJobRole] = useState("");

   const [customJobTitle, setCustomJobTitle] = useState("");

   const [jobDescription, setJobDescription] = useState("");

   const [files, setFiles] = useState([]);

   const [topCandidatesLimit, setTopCandidatesLimit] = useState("");

   const [rankingBasis, setRankingBasis] = useState("");



   const [results, setResults] = useState([]);

   const [jobSkills, setJobSkills] = useState([]);



   const [loading, setLoading] = useState(false);

   const [error, setError] = useState("");

   const [successMessage, setSuccessMessage] = useState("");



   const [candidates, setCandidates] = useState([]);

   const [candidatesLoading, setCandidatesLoading] = useState(false);

   const [candidatesError, setCandidatesError] = useState("");



   const [jobs, setJobs] = useState([]);

   const [jobsLoading, setJobsLoading] = useState(false);

   const [jobsError, setJobsError] = useState("");



   const [openMenuId, setOpenMenuId] = useState(null);

   const [appearance, setAppearance] = useState(
      currentUser?.appearance || "light"
   );

   const [sidebarProfileImageUrl, setSidebarProfileImageUrl] =
      useState("");







   // ==========================================
   // APPEARANCE
   // ==========================================

   useEffect(() => {

      setAppearance(
         currentUser?.appearance || "light"
      );

   }, [currentUser?.appearance]);


   useEffect(() => {

      document.body.style.backgroundColor =
         appearance === "dark"
            ? "#0f172a"
            : "#f8fafc";

      return () => {
         document.body.style.backgroundColor = "";
      };

   }, [appearance]);


   const handleAppearanceChange = (value) => {

      setAppearance(value);

   };


   // ==========================================
   // SIDEBAR PROFILE PHOTO
   // ==========================================

   const loadSidebarProfileImage = async () => {

      if (!currentUser?.has_profile_image) {

         setSidebarProfileImageUrl(
            (oldUrl) => {

               if (
                  oldUrl &&
                  oldUrl.startsWith("blob:")
               ) {
                  URL.revokeObjectURL(oldUrl);
               }

               return "";

            }
         );

         return;

      }


      try {

         const response = await fetch(
            `${API_URL}/profile-image`,
            {
               headers: getAuthHeaders()
            }
         );


         if (response.status === 401) {

            handleUnauthorized();

            return;

         }


         if (!response.ok) {

            setSidebarProfileImageUrl("");

            return;

         }


         const blob = await response.blob();

         const imageUrl =
            URL.createObjectURL(blob);


         setSidebarProfileImageUrl(
            (oldUrl) => {

               if (
                  oldUrl &&
                  oldUrl.startsWith("blob:")
               ) {
                  URL.revokeObjectURL(oldUrl);
               }

               return imageUrl;

            }
         );

      }

      catch (err) {

         console.error(
            "Profile image load error:",
            err
         );

      }

   };


   useEffect(() => {

      loadSidebarProfileImage();

   }, [currentUser, currentPage]);


   // ==========================================

   // DASHBOARD STATS

   // ==========================================



   const [dashboardStats, setDashboardStats] = useState({

      shortlisted: 0,

      strong_matches: 0,

      uploaded_resumes: 0,

      best_ats_score: 0

   });



   const [dashboardLoading, setDashboardLoading] =

      useState(false);





   // ==========================================

   // SELECTED JOB TITLE

   // ==========================================



   const selectedJobTitle =

      jobRole === "custom"

         ? customJobTitle.trim()

         : jobRole;





   // ==========================================

   // AUTH

   // ==========================================



   const getToken = () => {

      return localStorage.getItem("resumeai_token");

   };





   const getAuthHeaders = () => {

      return {

         Authorization: `Bearer ${getToken()}`

      };

   };





   const handleUnauthorized = () => {

      if (onLogout) {

         onLogout();

         return;

      }

      localStorage.removeItem("resumeai_token");

      window.location.reload();

   };





   // ==========================================

   // LOAD DASHBOARD STATS

   // ==========================================



   const loadDashboardStats = async () => {



      setDashboardLoading(true);



      try {



         const response = await fetch(

            `${API_URL}/dashboard-stats`,

            {

               headers: getAuthHeaders()

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         const data = await response.json();





         if (!response.ok) {



            throw new Error(

               data.detail ||

               "Unable to load dashboard stats."

            );



         }





         setDashboardStats({

            shortlisted:

               data.shortlisted || 0,



            strong_matches:

               data.strong_matches || 0,



            uploaded_resumes:

               data.uploaded_resumes || 0,



            best_ats_score:

               data.best_ats_score || 0

         });



      }



      catch (err) {



         console.error(

            "Dashboard stats error:",

            err

         );



      }



      finally {



         setDashboardLoading(false);



      }



   };





   // ==========================================

   // LOAD CANDIDATES

   // ==========================================



   const loadCandidates = async () => {



      setCandidatesLoading(true);

      setCandidatesError("");



      try {



         const response = await fetch(

            `${API_URL}/candidates`,

            {

               headers: getAuthHeaders()

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         const data = await response.json();





         if (!response.ok) {



            throw new Error(

               data.detail ||

               "Unable to load candidates."

            );



         }





         setCandidates(

            data.candidates || []

         );



      }



      catch (err) {



         setCandidatesError(

            err.message ||

            "Backend connection failed."

         );



      }



      finally {



         setCandidatesLoading(false);



      }



   };





   // ==========================================

   // LOAD JOBS

   // ==========================================



   const loadJobs = async () => {



      setJobsLoading(true);

      setJobsError("");



      try {



         const response = await fetch(

            `${API_URL}/jobs`,

            {

               headers: getAuthHeaders()

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         const data = await response.json();





         if (!response.ok) {



            throw new Error(

               data.detail ||

               "Unable to load jobs."

            );



         }





         setJobs(

            data.jobs || []

         );



      }



      catch (err) {



         setJobsError(

            err.message ||

            "Backend connection failed."

         );



      }



      finally {



         setJobsLoading(false);



      }



   };





   // ==========================================

   // PAGE LOAD

   // ==========================================



   useEffect(() => {



      if (currentPage === "dashboard") {

         loadDashboardStats();

      }





      if (

         currentPage === "candidates" ||

         currentPage === "favorites"

      ) {

         loadCandidates();

      }





      if (currentPage === "jobs") {

         loadJobs();

      }



   }, [currentPage]);





   // ==========================================

   // ADD / REMOVE FAVOURITE

   // ==========================================



   const toggleFavorite = async (candidateId) => {



      try {



         const response = await fetch(

            `${API_URL}/candidates/${candidateId}/favorite`,

            {

               method: "PATCH",

               headers: getAuthHeaders()

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         const data = await response.json();





         if (!response.ok) {



            throw new Error(

               data.detail ||

               "Unable to update Favourite List."

            );



         }





         setCandidates(

            (oldCandidates) =>

               oldCandidates.map(

                  (candidate) =>

                     candidate.id === candidateId

                        ? {

                              ...candidate,

                              is_favorite:

                                 data.is_favorite

                           }

                        : candidate

               )

         );



      }



      catch (err) {



         alert(

            err.message ||

            "Favourite update failed."

         );



      }



   };





   // ==========================================

   // OPEN PDF

   // ==========================================



   const openResumePdf = async (candidateId) => {



      setOpenMenuId(null);



      try {



         const response = await fetch(

            `${API_URL}/candidates/${candidateId}/resume`,

            {

               headers: getAuthHeaders()

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         if (!response.ok) {



            let message =

               "Unable to open resume PDF.";



            try {



               const data =

                  await response.json();



               message =

                  data.detail || message;



            }



            catch {

               // ignore

            }





            throw new Error(message);



         }





         const blob =

            await response.blob();





         const pdfUrl =

            URL.createObjectURL(blob);





         window.open(

            pdfUrl,

            "_blank"

         );





         setTimeout(

            () => {

               URL.revokeObjectURL(pdfUrl);

            },

            60000

         );



      }



      catch (err) {



         alert(err.message);



      }



   };





   // ==========================================

   // DELETE CANDIDATE

   // ==========================================



   const deleteCandidate = async (candidate) => {



      setOpenMenuId(null);





      const confirmed =

         window.confirm(

            `Delete ${candidate.name || "this candidate"}?`

         );





      if (!confirmed) {

         return;

      }





      try {



         const response = await fetch(

            `${API_URL}/candidates/${candidate.id}`,

            {

               method: "DELETE",

               headers: getAuthHeaders()

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         const data =

            await response.json();





         if (!response.ok) {



            throw new Error(

               data.detail ||

               "Unable to delete candidate."

            );



         }





         setCandidates(

            (oldCandidates) =>

               oldCandidates.filter(

                  (item) =>

                     item.id !== candidate.id

               )

         );





         alert(

            data.message ||

            "Candidate deleted successfully."

         );



      }



      catch (err) {



         alert(

            err.message ||

            "Delete failed."

         );



      }



   };





   // ==========================================

   // CANDIDATE ACTIONS

   // ==========================================



   const renderCandidateActions = (candidate) => {



      return (



         <div

            style={{

               position: "relative",

               display: "flex",

               alignItems: "center",

               justifyContent: "flex-end",

               gap: "7px"

            }}

         >



            <button

               type="button"

               title={

                  candidate.is_favorite

                     ? "Remove from Favourite List"

                     : "Add to Favourite List"

               }

               onClick={() =>

                  toggleFavorite(candidate.id)

               }

               style={{

                  width: "36px",

                  height: "36px",

                  borderRadius: "9px",

                  border:

                     candidate.is_favorite

                        ? "1px solid #16a34a"

                        : "1px solid #e2e8f0",

                  background:

                     candidate.is_favorite

                        ? "#f0fdf4"

                        : "white",

                  cursor: "pointer",

                  fontSize:

                     candidate.is_favorite

                        ? "18px"

                        : "25px",

                  fontWeight: "700",

                  display: "flex",

                  alignItems: "center",

                  justifyContent: "center",

                  color:

                     candidate.is_favorite

                        ? "#16a34a"

                        : "#475569"

               }}

            >



               {

                  candidate.is_favorite

                     ? "✓"

                     : "+"

               }



            </button>





            <button

               type="button"

               onClick={() =>

                  setOpenMenuId(

                     openMenuId === candidate.id

                        ? null

                        : candidate.id

                  )

               }

               style={{

                  width: "36px",

                  height: "36px",

                  borderRadius: "9px",

                  border:

                     "1px solid #e2e8f0",

                  background: "white",

                  cursor: "pointer",

                  fontSize: "22px",

                  color: "#475569"

               }}

            >

               ⋮

            </button>





            {

               openMenuId === candidate.id && (



                  <div

                     style={{

                        position: "absolute",

                        right: "0",

                        top: "42px",

                        width: "155px",

                        background: "white",

                        border:

                           "1px solid #e2e8f0",

                        borderRadius: "10px",

                        boxShadow:

                           "0 10px 30px rgba(15,23,42,0.15)",

                        padding: "6px",

                        zIndex: 100

                     }}

                  >



                     <button

                        type="button"

                        onClick={() =>

                           openResumePdf(

                              candidate.id

                           )

                        }

                        style={{

                           width: "100%",

                           border: "none",

                           background: "white",

                           padding: "10px",

                           textAlign: "left",

                           cursor: "pointer",

                           borderRadius: "7px",

                           fontSize: "13px"

                        }}

                     >

                        📄 Open PDF

                     </button>





                     <button

                        type="button"

                        onClick={() =>

                           deleteCandidate(candidate)

                        }

                        style={{

                           width: "100%",

                           border: "none",

                           background: "white",

                           padding: "10px",

                           textAlign: "left",

                           cursor: "pointer",

                           borderRadius: "7px",

                           color: "#dc2626",

                           fontSize: "13px"

                        }}

                     >

                        🗑 Delete

                     </button>



                  </div>



               )

            }



         </div>



      );



   };





   // ==========================================

   // FILE SELECTION

   // ==========================================



   const handleFileChange = (event) => {



      const selectedFiles =

         Array.from(

            event.target.files

         );





      const invalidFile =

         selectedFiles.find(

            (file) =>

               !file.name

                  .toLowerCase()

                  .endsWith(".pdf")

         );





      if (invalidFile) {



         setError(

            "Please select PDF resumes only."

         );



         setFiles([]);



         event.target.value = "";



         return;



      }





      setFiles(selectedFiles);

      setError("");



   };





   const validTopN =

      Number(topCandidatesLimit) >= 1;





   // ==========================================

   // RUN SCREENING

   // ==========================================



   const handleScreening = async () => {



      setError("");

      setSuccessMessage("");





      if (!jobRole) {



         setError(

            "Please select a job title."

         );



         return;



      }





      if (

         jobRole === "custom" &&

         !customJobTitle.trim()

      ) {



         setError(

            "Please enter custom job title."

         );



         return;



      }





      if (!jobDescription.trim()) {



         setError(

            "Please enter a job description."

         );



         return;



      }





      if (files.length < 1) {



         setError(

            "Please select at least one PDF resume."

         );



         return;



      }





      const topN =

         Number(topCandidatesLimit);





      if (

         !Number.isInteger(topN) ||

         topN < 1

      ) {



         setError(

            "Please enter how many top candidates you want."

         );



         return;



      }





      if (!rankingBasis) {



         setError(

            "Please select ranking basis."

         );



         return;



      }





      setLoading(true);

      setResults([]);

      setJobSkills([]);





      try {



         const formData =

            new FormData();





         formData.append(

            "job_title",

            selectedJobTitle

         );





         formData.append(

            "job_description",

            jobDescription

         );





         formData.append(

            "top_candidates_limit",

            topN

         );





         formData.append(

            "ranking_basis",

            rankingBasis

         );





         files.forEach((file) => {



            formData.append(

               "files",

               file

            );



         });





         const response = await fetch(

            `${API_URL}/rank-resumes`,

            {

               method: "POST",

               headers: getAuthHeaders(),

               body: formData

            }

         );





         if (response.status === 401) {



            handleUnauthorized();



            return;



         }





         const data =

            await response.json();





         if (!response.ok) {



            throw new Error(

               data.detail ||

               "Resume screening failed."

            );



         }





         setResults(

            data.ranked_candidates || []

         );





         setJobSkills(

            data.job_skills || []

         );





         const basisText =

            data.ranking_basis ===

               "ats_score"

               ? "ATS Score"

               : data.ranking_basis ===

                  "combined"

                  ? "Combined Score"

                  : "Match Score";





         setSuccessMessage(

            `${data.total_resumes_analyzed} resumes analyzed. Top ${data.total_shortlisted} shortlisted by ${basisText}.`

         );





         // REFRESH PERMANENT DASHBOARD DATA

         await loadDashboardStats();



      }



      catch (err) {



         setError(

            err.message ||

            "Unable to connect to backend."

         );



      }



      finally {



         setLoading(false);



      }



   };





   // ==========================================

   // HELPERS

   // ==========================================



   const getRankingBasisLabel = (basis) => {



      if (basis === "ats_score") {

         return "ATS Score";

      }



      if (basis === "combined") {

         return "Combined Score";

      }



      return "Match Score";



   };





   const selectStyle = {

      width: "100%",

      padding: "13px",

      borderRadius: "9px",

      border: "1px solid #d1d5db",

      background: "white",

      marginBottom: "18px",

      fontSize: "14px",

      outline: "none"

   };





   // ==========================================

   // DASHBOARD

   // ==========================================



   const renderDashboardPage = () => (



      <>



         <header>



            <div>



               <p className="welcome">

                  AI RECRUITMENT PLATFORM

               </p>



               <h1>

                  Resume Screening Dashboard

               </h1>



               <p className="subtitle">

                  Analyze, score and shortlist candidates using AI.

               </p>



            </div>



         </header>





         <section className="stats">



            <div className="statCard">



               <span>

                  Shortlisted

               </span>



               <h2>

                  {

                     dashboardLoading

                        ? "..."

                        : dashboardStats.shortlisted

                  }

               </h2>



               <p>

                  Saved shortlist

               </p>



            </div>





            <div className="statCard">



               <span>

                  Strong Matches

               </span>



               <h2>

                  {

                     dashboardLoading

                        ? "..."

                        : dashboardStats.strong_matches

                  }

               </h2>



               <p>

                  75% and above

               </p>



            </div>





            <div className="statCard">



               <span>

                  Uploaded Resumes

               </span>



               <h2>

                  {

                     dashboardLoading

                        ? "..."

                        : dashboardStats.uploaded_resumes

                  }

               </h2>



               <p>

                  Total database resumes

               </p>



            </div>





            <div className="statCard">



               <span>

                  Best ATS Score

               </span>



               <h2>

                  {

                     dashboardLoading

                        ? "..."

                        : `${dashboardStats.best_ats_score}%`

                  }

               </h2>



               <p>

                  Best shortlisted ATS

               </p>



            </div>



         </section>





         <section

            className="screeningSection"

            id="screening"

         >



            <div className="sectionHeading">



               <span className="badge">

                  AI SCREENING

               </span>



               <h2>

                  Screen Candidates

               </h2>



               <p>

                  Select job role, upload resumes and choose ranking method.

               </p>



            </div>





            <div className="screeningGrid">



               <div className="formCard">



                  <label>

                     Job Title

                  </label>





                  <select

                     value={jobRole}

                     onChange={(e) => {



                        const value =

                           e.target.value;



                        setJobRole(value);





                        if (value !== "custom") {

                           setCustomJobTitle("");

                        }



                     }}

                     style={selectStyle}

                  >



                     <option value="">

                        Select Job Role

                     </option>





                     {

                        JOB_ROLES.map(

                           (role) => (



                              <option

                                 key={role}

                                 value={role}

                              >

                                 {role}

                              </option>



                           )

                        )

                     }





                     <option value="custom">

                        Other / Custom Job Title

                     </option>



                  </select>





                  {

                     jobRole === "custom" && (



                        <>



                           <label>

                              Custom Job Title

                           </label>



                           <input

                              type="text"

                              placeholder="e.g. Blockchain Developer"

                              value={customJobTitle}

                              onChange={(e) =>

                                 setCustomJobTitle(

                                    e.target.value

                                 )

                              }

                           />



                        </>



                     )

                  }





                  <label>

                     Job Description

                  </label>





                  <textarea

                     rows="7"

                     placeholder="Enter required skills, technologies and job requirements..."

                     value={jobDescription}

                     onChange={(e) =>

                        setJobDescription(

                           e.target.value

                        )

                     }

                  />





                  <label>

                     How many best candidates do you want?

                  </label>





                  <input

                     type="number"

                     min="1"

                     step="1"

                     placeholder="e.g. 10"

                     value={topCandidatesLimit}

                     onChange={(e) => {



                        setTopCandidatesLimit(

                           e.target.value

                        );





                        if (

                           Number(e.target.value) < 1

                        ) {

                           setRankingBasis("");

                        }



                     }}

                  />





                  <label>

                     Ranking Basis

                  </label>





                  <select

                     value={rankingBasis}

                     disabled={!validTopN}

                     onChange={(e) =>

                        setRankingBasis(

                           e.target.value

                        )

                     }

                     style={{

                        ...selectStyle,

                        background:

                           validTopN

                              ? "white"

                              : "#f1f5f9"

                     }}

                  >



                     <option value="">



                        {

                           validTopN

                              ? "Select Ranking Basis"

                              : "Enter Top Candidates First"

                        }



                     </option>



                     <option value="match_score">

                        Match Score

                     </option>



                     <option value="ats_score">

                        ATS Score

                     </option>



                     <option value="combined">

                        Combined Score

                     </option>



                  </select>





                  {

                     rankingBasis === "combined" && (



                        <p

                           style={{

                              fontSize: "12px",

                              color: "#64748b"

                           }}

                        >

                           Combined = 70% Match + 30% ATS

                        </p>



                     )

                  }



               </div>





               <div className="uploadCard">



                  <div className="uploadIcon">

                     ↑

                  </div>



                  <h3>

                     Upload Resumes

                  </h3>



                  <p>

                     Select as many PDF resumes as required

                  </p>





                  <input

                     type="file"

                     accept=".pdf,application/pdf"

                     multiple

                     onChange={handleFileChange}

                  />





                  <span className="fileInfo">



                     {

                        files.length === 0

                           ? "No resumes selected"

                           : `${files.length} resume(s) selected`

                     }



                  </span>





                  {

                     files.length > 0 && (



                        <div className="selectedFiles">



                           {

                              files.map(

                                 (file, index) => (



                                    <div

                                       className="selectedFile"

                                       key={`${file.name}-${index}`}

                                    >

                                       {index + 1}. {file.name}

                                    </div>



                                 )

                              )

                           }



                        </div>



                     )

                  }



               </div>



            </div>





            {

               error && (

                  <div className="errorMessage">

                     {error}

                  </div>

               )

            }





            {

               successMessage && (



                  <div

                     style={{

                        marginTop: "18px",

                        padding: "12px",

                        borderRadius: "8px",

                        background: "#ecfdf5",

                        color: "#047857"

                     }}

                  >

                     {successMessage}

                  </div>



               )

            }





            <button

               className="screenButton"

               onClick={handleScreening}

               disabled={loading}

            >



               {

                  loading

                     ? `Analyzing ${files.length} Resume(s)...`

                     : "Run AI Screening"

               }



            </button>



         </section>





         {

            jobSkills.length > 0 && (



               <section className="jobSkillsSection">



                  <h3>

                     Detected Job Skills

                  </h3>



                  <div className="skillList">



                     {

                        jobSkills.map(

                           (skill, index) => (



                              <span

                                 className="skillTag"

                                 key={index}

                              >

                                 {skill}

                              </span>



                           )

                        )

                     }



                  </div>



               </section>



            )

         }





         <section className="results">



            <div className="resultsHeader">



               <div>



                  <h2>

                     Shortlisted Candidates

                  </h2>



                  <p>

                     Best candidates from current screening.

                  </p>



               </div>



            </div>





            {

               results.length === 0

                  ? (



                     <div className="emptyState">



                        <div className="emptyIcon">

                           AI

                        </div>



                        <h3>

                           No candidates shortlisted in this current run

                        </h3>



                     </div>



                  )

                  : (



                     <div className="tableWrapper">



                        <table>



                           <thead>



                              <tr>

                                 <th>Rank</th>

                                 <th>Candidate</th>

                                 <th>Match</th>

                                 <th>ATS</th>

                                 <th>Skill Match</th>

                              </tr>



                           </thead>





                           <tbody>



                              {

                                 results.map(

                                    (item, index) => (



                                       <tr key={index}>



                                          <td>

                                             #{item.rank}

                                          </td>



                                          <td>



                                             <div className="candidateName">

                                                {item.candidate.name}

                                             </div>



                                             <div className="candidateEmail">

                                                {

                                                   item.candidate.email ||

                                                   "No email"

                                                }

                                             </div>



                                          </td>



                                          <td>

                                             {

                                                item.screening_result

                                                   .final_match_score

                                             }%

                                          </td>



                                          <td>

                                             {

                                                item.screening_result

                                                   .ats_score

                                             }%

                                          </td>



                                          <td>

                                             {

                                                item.screening_result

                                                   .skill_match_score

                                             }%

                                          </td>



                                       </tr>



                                    )

                                 )

                              }



                           </tbody>



                        </table>



                     </div>



                  )

            }



         </section>



      </>



   );





   // ==========================================

   // CANDIDATE LIST

   // ==========================================



   const renderCandidateList = (

      list,

      title,

      emptyMessage

   ) => (



      <>



         <section className="results">



            <div className="resultsHeader">



               <div>



                  <h2>

                     {title}

                  </h2>



                  <p>

                     Manage shortlisted candidates.

                  </p>



               </div>



            </div>





            {

               list.length === 0

                  ? (



                     <div className="emptyState">



                        <div className="emptyIcon">

                           +

                        </div>



                        <h3>

                           {emptyMessage}

                        </h3>



                     </div>



                  )

                  : (



                     <div className="tableWrapper">



                        <table>



                           <thead>



                              <tr>

                                 <th>Rank</th>

                                 <th>Candidate</th>

                                 <th>Job</th>

                                 <th>Match</th>

                                 <th>ATS</th>

                                 <th>Actions</th>

                              </tr>



                           </thead>





                           <tbody>



                              {

                                 list.map(

                                    (candidate) => (



                                       <tr key={candidate.id}>



                                          <td>

                                             #{candidate.rank}

                                          </td>





                                          <td>



                                             <div className="candidateName">



                                                {

                                                   candidate.name ||

                                                   "Unknown Candidate"

                                                }



                                             </div>



                                             <div className="candidateEmail">



                                                {

                                                   candidate.email ||

                                                   "No email"

                                                }



                                             </div>



                                          </td>





                                          <td>

                                             {candidate.job_title}

                                          </td>





                                          <td>



                                             <strong className="score">

                                                {candidate.final_match_score}%

                                             </strong>



                                          </td>





                                          <td>



                                             <strong className="score">

                                                {candidate.ats_score}%

                                             </strong>



                                          </td>





                                          <td>

                                             {

                                                renderCandidateActions(

                                                   candidate

                                                )

                                             }

                                          </td>



                                       </tr>



                                    )

                                 )

                              }



                           </tbody>



                        </table>



                     </div>



                  )

            }



         </section>





         {

            list.length > 0 && (



               <section className="candidateDetails">



                  <h2>

                     Candidate Skills

                  </h2>





                  <div className="candidateGrid">



                     {

                        list.map(

                           (candidate) => (



                              <div

                                 className="candidateCard"

                                 key={candidate.id}

                              >



                                 <div className="candidateCardTop">



                                    <div>



                                       <span className="rankLabel">

                                          RANK #{candidate.rank}

                                       </span>



                                       <h3>



                                          {

                                             candidate.name ||

                                             "Unknown Candidate"

                                          }



                                       </h3>



                                       <p>

                                          {candidate.filename}

                                       </p>



                                    </div>





                                    <div>



                                       {

                                          renderCandidateActions(

                                             candidate

                                          )

                                       }



                                    </div>



                                 </div>





                                 <div className="analysisBlock">



                                    <h4>

                                       Resume Skills

                                    </h4>



                                    <div className="skillList">



                                       {

                                          candidate.skills?.length > 0

                                             ? candidate.skills.map(

                                                   (skill, index) => (



                                                      <span

                                                         className="skillTag"

                                                         key={index}

                                                      >

                                                         {skill}

                                                      </span>



                                                   )

                                                )

                                             : (

                                                <span className="muted">

                                                   No skills found

                                                </span>

                                             )

                                       }



                                    </div>



                                 </div>





                                 <div className="analysisBlock">



                                    <h4>

                                       Matched Skills

                                    </h4>



                                    <div className="skillList">



                                       {

                                          candidate.matched_skills?.map(

                                             (skill, index) => (



                                                <span

                                                   className="skillTag matched"

                                                   key={index}

                                                >

                                                   {skill}

                                                </span>



                                             )

                                          )

                                       }



                                    </div>



                                 </div>





                                 <div className="analysisBlock">



                                    <h4>

                                       Missing Skills

                                    </h4>



                                    <div className="skillList">



                                       {

                                          candidate.missing_skills?.map(

                                             (skill, index) => (



                                                <span

                                                   className="skillTag missing"

                                                   key={index}

                                                >

                                                   {skill}

                                                </span>



                                             )

                                          )

                                       }



                                    </div>



                                 </div>



                              </div>



                           )

                        )

                     }



                  </div>



               </section>



            )

         }



      </>



   );





   // ==========================================

   // CANDIDATES

   // ==========================================



   const renderCandidatesPage = () => (



      <>



         <header>



            <div>



               <p className="welcome">

                  SHORTLISTED CANDIDATES

               </p>



               <h1>

                  Candidates

               </h1>



               <p className="subtitle">

                  Use + to add candidates to your Favourite List.

               </p>



            </div>



         </header>





         {

            candidatesError && (

               <div className="errorMessage">

                  {candidatesError}

               </div>

            )

         }





         {

            candidatesLoading

               ? (

                  <div className="emptyState">

                     Loading candidates...

                  </div>

               )

               : renderCandidateList(

                     candidates,

                     "Best Candidates",

                     "No candidates found"

                  )

         }



      </>



   );





   // ==========================================

   // FAVOURITE LIST

   // ==========================================



   const favoriteCandidates =

      candidates.filter(

         (candidate) =>

            candidate.is_favorite

      );





   const renderFavoritesPage = () => (



      <>



         <header>



            <div>



               <p className="welcome">

                  SAVED CANDIDATES

               </p>



               <h1>

                  Favourite List

               </h1>



               <p className="subtitle">

                  Candidates you selected using the + button.

               </p>



            </div>



         </header>





         {

            candidatesError && (

               <div className="errorMessage">

                  {candidatesError}

               </div>

            )

         }





         {

            candidatesLoading

               ? (

                  <div className="emptyState">

                     Loading Favourite List...

                  </div>

               )

               : renderCandidateList(

                     favoriteCandidates,

                     "Favourite List",

                     "No candidates added to Favourite List"

                  )

         }



      </>



   );





   // ==========================================

   // JOBS

   // ==========================================



   const renderJobsPage = () => (



      <>



         <header>



            <div>



               <p className="welcome">

                  JOB DATABASE

               </p>



               <h1>

                  Jobs

               </h1>



               <p className="subtitle">

                  View your screening jobs.

               </p>



            </div>



         </header>





         {

            jobsError && (

               <div className="errorMessage">

                  {jobsError}

               </div>

            )

         }





         <section className="results">



            <div className="resultsHeader">



               <div>

                  <h2>

                     Saved Jobs

                  </h2>

               </div>



            </div>





            {

               jobsLoading

                  ? (

                     <div className="emptyState">

                        Loading jobs...

                     </div>

                  )

                  : jobs.length === 0

                     ? (

                        <div className="emptyState">

                           No jobs found.

                        </div>

                     )

                     : (



                        <div className="tableWrapper">



                           <table>



                              <thead>



                                 <tr>

                                    <th>Job</th>

                                    <th>Total Resumes</th>

                                    <th>Top N</th>

                                    <th>Ranking Basis</th>

                                 </tr>



                              </thead>





                              <tbody>



                                 {

                                    jobs.map(

                                       (job) => (



                                          <tr key={job.id}>



                                             <td>

                                                {job.title}

                                             </td>



                                             <td>

                                                {job.total_candidates}

                                             </td>



                                             <td>

                                                {

                                                   job.top_candidates_limit ??

                                                   "All"

                                                }

                                             </td>



                                             <td>

                                                {

                                                   getRankingBasisLabel(

                                                      job.ranking_basis

                                                   )

                                                }

                                             </td>



                                          </tr>



                                       )

                                    )

                                 }



                              </tbody>



                           </table>



                        </div>



                     )

            }



         </section>



      </>



   );





   // ==========================================

   // MAIN UI

   // ==========================================



   return (



      <div className={`app ${appearance === "dark" ? "darkTheme" : ""}`}>
         <style>{`
            .darkTheme .main {
               background: #0f172a !important;
               color: #e2e8f0 !important;
            }

            .darkTheme header h1,
            .darkTheme header h2,
            .darkTheme .sectionHeading h2,
            .darkTheme .results h2,
            .darkTheme .candidateDetails h2,
            .darkTheme .candidateCard h3,
            .darkTheme .candidateCard h4,
            .darkTheme .jobSkillsSection h3,
            .darkTheme .statCard h2 {
               color: #f8fafc !important;
            }

            .darkTheme .subtitle,
            .darkTheme .results p,
            .darkTheme .candidateCard p,
            .darkTheme .muted,
            .darkTheme .statCard span {
               color: #94a3b8 !important;
            }

            .darkTheme .statCard p {
               color: #cbd5e1 !important;
            }

            .darkTheme .statCard,
            .darkTheme .screeningSection,
            .darkTheme .formCard,
            .darkTheme .uploadCard,
            .darkTheme .results,
            .darkTheme .jobSkillsSection,
            .darkTheme .candidateCard,
            .darkTheme .tableWrapper,
            .darkTheme .main > div {
               background: #111827 !important;
               color: #e5e7eb !important;
               border-color: #334155 !important;
            }

            .darkTheme table,
            .darkTheme thead,
            .darkTheme tbody,
            .darkTheme tr,
            .darkTheme th,
            .darkTheme td {
               background: #111827 !important;
               color: #e5e7eb !important;
               border-color: #334155 !important;
            }

            .darkTheme input,
            .darkTheme textarea,
            .darkTheme select {
               background: #1e293b !important;
               color: #f8fafc !important;
               border-color: #475569 !important;
            }

            .darkTheme input::placeholder,
            .darkTheme textarea::placeholder {
               color: #94a3b8 !important;
            }

            .darkTheme .selectedFile {
               background: #1e293b !important;
               color: #e2e8f0 !important;
            }

            .darkTheme button[style*="background: white"],
            .darkTheme button[style*="background: rgb(255, 255, 255)"] {
               background: #1e293b !important;
               color: #e2e8f0 !important;
               border-color: #475569 !important;
            }
         `}</style>




         <aside className="sidebar">



            <div className="logo">



               <div className="logoIcon">

                  AI

               </div>



               <div>



                  <h2>

                     ResumeAI

                  </h2>



                  <span>

                     Screening System

                  </span>



               </div>



            </div>





            <nav>



               <button

                  className={

                     currentPage === "dashboard"

                        ? "navItem active"

                        : "navItem"

                  }

                  onClick={() =>

                     setCurrentPage("dashboard")

                  }

               >

                  Dashboard

               </button>





               <button

                  className="navItem"

                  onClick={() => {



                     setCurrentPage("dashboard");



                     setTimeout(

                        () =>

                           document

                              .getElementById("screening")

                              ?.scrollIntoView({

                                 behavior: "smooth"

                              }),

                        100

                     );



                  }}

               >

                  Screen Resumes

               </button>





               <button

                  className={

                     currentPage === "candidates"

                        ? "navItem active"

                        : "navItem"

                  }

                  onClick={() =>

                     setCurrentPage("candidates")

                  }

               >

                  Candidates

               </button>





               <button

                  className={

                     currentPage === "favorites"

                        ? "navItem active"

                        : "navItem"

                  }

                  onClick={() =>

                     setCurrentPage("favorites")

                  }

               >

                  + Favourite List

               </button>





               <button

                  className={

                     currentPage === "jobs"

                        ? "navItem active"

                        : "navItem"

                  }

                  onClick={() =>

                     setCurrentPage("jobs")

                  }

               >

                  Jobs

               </button>



            </nav>





            <div className="sidebarBottom">

               <div
                  style={{
                     display: "flex",
                     alignItems: "center",
                     gap: "10px",
                     marginBottom: "12px"
                  }}
               >

                  <div
                     style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "50%",
                        background: "#334155",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "700",
                        color: "white",
                        flexShrink: 0,
                        overflow: "hidden"
                     }}
                  >

                     {
                        sidebarProfileImageUrl

                           ? (
                              <img
                                 src={sidebarProfileImageUrl}
                                 alt="Profile"
                                 style={{
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover"
                                 }}
                              />
                           )

                           : (
                              currentUser?.name
                                 ?.charAt(0)
                                 ?.toUpperCase() || "U"
                           )
                     }

                  </div>

                  <div
                     style={{
                        minWidth: 0
                     }}
                  >

                     <p
                        style={{
                           margin: 0,
                           color: "white",
                           fontWeight: "600",
                           whiteSpace: "nowrap",
                           overflow: "hidden",
                           textOverflow: "ellipsis"
                        }}
                     >
                        {currentUser?.name || "Recruiter"}
                     </p>

                     <span
                        style={{
                           display: "block",
                           fontSize: "11px",
                           color: "#94a3b8",
                           whiteSpace: "nowrap",
                           overflow: "hidden",
                           textOverflow: "ellipsis"
                        }}
                     >
                        {currentUser?.email || ""}
                     </span>

                  </div>

               </div>


               <button
                  type="button"
                  className={
                     currentPage === "settings"
                        ? "navItem active"
                        : "navItem"
                  }
                  onClick={() =>
                     setCurrentPage("settings")
                  }
                  style={{
                     width: "100%"
                  }}
               >
                  ⚙ Settings
               </button>

            </div>



         </aside>





         <main className="main">



            {

               currentPage === "dashboard" &&

               renderDashboardPage()

            }





            {

               currentPage === "candidates" &&

               renderCandidatesPage()

            }





            {

               currentPage === "favorites" &&

               renderFavoritesPage()

            }





            {

               currentPage === "jobs" &&

               renderJobsPage()

            }


            {

               currentPage === "settings" && (

                  <SettingsPage
                     currentUser={currentUser}
                     onLogout={onLogout}
                     onUserUpdated={onUserUpdated}
                     onAppearanceChange={handleAppearanceChange}
                  />

               )

            }



         </main>



      </div>



   );



}





export default App;
