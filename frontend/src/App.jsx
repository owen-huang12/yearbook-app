import { useState, useEffect } from "react";
import Profile from "./components/Profile.jsx";
import LoginForm from "./components/LoginForm.jsx";
import CreateAccount from "./components/CreateAccount.jsx";
import spartanLogo from "./assets/spartan-logo.png";
import PopUp from "./components/PopUp.jsx";

const API_URL = "http://localhost:3002";
const TOKEN_KEY = "yearbook-auth-token";
const PAGE_SIZE = 20;

export default function App() {
  const [studentIDsearch, setStudentIDsearch] = useState("");
  const [response, setResponse] = useState("");
  const [studentDisplayInformation, setStudentDisplayInformation] = useState(
    [],
  );
  const [search, setSearch] = useState("");
  const [studentsOffset, setStudentsOffset] = useState(0);
  const [hasMoreStudents, setHasMoreStudents] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [popUpData, setPopUpData] = useState(null);

  const [authToken, setAuthToken] = useState(
    localStorage.getItem(TOKEN_KEY) || "",
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [page, setPage] = useState("login"); // "login" or "create-account"

  const clearAuth = () => {
    setAuthToken("");
    localStorage.removeItem(TOKEN_KEY);
    setStudentDisplayInformation([]);
    setStudentsOffset(0);
    setHasMoreStudents(true);
    setResponse("");
  };

  const authorizedFetch = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${authToken}`,
    };

    const result = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });

    if (result.status === 401) {
      clearAuth();
      throw new Error("Session expired. Please sign in again.");
    }

    if (!result.ok) {
      throw new Error(`Request failed (${result.status})`);
    }

    return result;
  };

  const fetchStudentsPage = async ({ offset = 0, append = false } = {}) => {
    setIsLoadingStudents(true);

    try {
      const result = await authorizedFetch(
        `/api/get?limit=${PAGE_SIZE}&offset=${offset}`,
      );
      const data = await result.json();
      const students = data.data || [];
      const nextOffset = offset + students.length;

      setStudentDisplayInformation((prev) => {
        if (!append) {
          return students;
        }

        return [...prev, ...students];
      });
      setStudentsOffset(nextOffset);
      setHasMoreStudents(Boolean(data.pagination?.hasMore));
    } catch (error) {
      setResponse(error.message || "Could not load students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const fetchStudentsByName = async (searchTerm) => {
    setIsLoadingStudents(true);

    try {
      const result = await authorizedFetch(
        `/api/get/namesearch?q=${encodeURIComponent(searchTerm)}`,
      );
      const data = await result.json();

      setStudentDisplayInformation(data.data || []);
      setStudentsOffset(0);
      setHasMoreStudents(false);
    } catch (error) {
      setResponse(error.message || "Could not search students");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (!authToken) {
      return;
    }

    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      setIsSearching(false);
      setStudentDisplayInformation([]);
      setStudentsOffset(0);
      setHasMoreStudents(true);
      fetchStudentsPage();
      return;
    }

    setIsSearching(true);

    const timeoutId = window.setTimeout(() => {
      fetchStudentsByName(trimmedSearch);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [authToken, search]);

  const updateStudentStatus = async (studentID, newStatus) => {
    const previous = studentDisplayInformation;

    setStudentDisplayInformation((prev) =>
      prev.map((student) =>
        student.studentID.toString() === studentID.toString()
          ? { ...student, status: newStatus }
          : student,
      ),
    );

    try {
      const result = await authorizedFetch("/api/edit-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentID, status: newStatus }),
      });
      const data = await result.json();
      setResponse(`Student ${studentID} marked as ${newStatus}`);
      return data;
    } catch (error) {
      setStudentDisplayInformation(previous);
      setResponse(error.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const idToUpdate = studentIDsearch;

    const data = await updateStudentStatus(idToUpdate, "claimed");
    if (data) {
      setPopUpData({
        name: data.name,
        studentId: data.student_id,
        status: data.is_handed_out
          ? "claimed"
          : data.is_purchased
            ? "purchased"
            : "not purchased",
      });
    }
    setStudentIDsearch("");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError("");
    setIsAuthenticating(true);

    try {
      const result = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.error || "Sign in failed");
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      setAuthToken(data.token);
      setUsername("");
      setPassword("");
      setResponse("");
    } catch (error) {
      setAuthError(error.message || "Sign in failed");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authorizedFetch("/api/logout", { method: "POST" });
    } catch {
      // Clear local session even if server call fails.
    }

    clearAuth();
  };

  const handleLoadMore = () => {
    if (isSearching || isLoadingStudents || !hasMoreStudents) {
      return;
    }

    fetchStudentsPage({ offset: studentsOffset, append: true });
  };

  const handleProfilesScroll = (event) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;

    if (distanceFromBottom <= 80) {
      handleLoadMore();
    }
  };

  if (!authToken) {
    if (page === "create-account") {
      return (
        <CreateAccount
          onBackToLogin={() => setPage("login")}
          onRegisterSuccess={(token) => {
            localStorage.setItem(TOKEN_KEY, token);
            setAuthToken(token);
          }}
        />
      );
    }

    return (
      <LoginForm
        username={username}
        password={password}
        onUsernameChange={setUsername}
        onPasswordChange={setPassword}
        onSubmit={handleLogin}
        error={authError}
        loading={isAuthenticating}
        onCreateAccount={() => setPage("create-account")}
      />
    );
  }

  return (
    <>
      <div className="main-layout">
        <div className="handout-information-wrapper">
          <img src={spartanLogo} alt="Logo" className="handout-logo" />
          <h1 className="handout-title">YEARBOOK DISTRIBUTION PORTAL</h1>

          <form onSubmit={handleSubmit} className="handout-form">
            <label className="handout-label">Student ID</label>
            <input
              type="text"
              id="student-id-field"
              className="handout-input"
              onChange={(event) => {
                setStudentIDsearch(event.target.value);
              }}
              value={studentIDsearch}
              autoComplete="off"
            />
          </form>

          <button className="logout-button" onClick={handleLogout}>
            LOG OUT
          </button>
        </div>

        <div className="display-information-wrapper">
          <div className="display-information-panel">
            <h3>DISTRIBUTION INFORMATION</h3>

            <input
              type="text"
              id="name-search-input"
              className="handout-input"
              placeholder="Enter student name"
              onChange={(event) => {
                setSearch(event.target.value);
              }}
              value={search}
              autoComplete="off"
            />

            <div className="profiles-scroll" onScroll={handleProfilesScroll}>
              {studentDisplayInformation?.map((student) => (
                <Profile
                  key={student.studentID}
                  {...student}
                  update={updateStudentStatus}
                />
              ))}
            </div>
            {isLoadingStudents ? (
              <p className="loading-more">Loading...</p>
            ) : null}
          </div>
        </div>

        {popUpData && (
          <PopUp
            name={popUpData.name}
            studentId={popUpData.studentId}
            status={popUpData.status}
            onClose={() => setPopUpData(null)}
          />
        )}
      </div>
    </>
  );
}
