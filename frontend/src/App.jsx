import { useState, useEffect, useRef } from "react";
import Profile from "./components/Profile.jsx";
import LoginForm from "./components/LoginForm.jsx";
import spartanLogo from "./assets/spartan-logo.png";
import PopUp from "./components/PopUp.jsx";
import ErrorPopUp from "./components/ErrorPopUp.jsx";
import scanSound from "./sounds/scan.mp3";
import errorSound from "./sounds/error.mp3";

const VITE_API_URL = import.meta.env.VITE_API_URL; // need to deploy the backend and connect that to vercel
const TOKEN_KEY = "yearbook -auth-token"; // figure out if this is a thing that we need to have in the .env
const PAGE_SIZE = 20;

export default function App() {
    const scanAudioRef = useRef(null);
    const errorAudioRef = useRef(null);
    const [studentIDsearch, setStudentIDsearch] = useState("");
    const [studentDisplayInformation, setStudentDisplayInformation] = useState(
        [],
    );
    const [search, setSearch] = useState("");
    const [studentsOffset, setStudentsOffset] = useState(0);
    const [hasMoreStudents, setHasMoreStudents] = useState(true);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [popUpData, setPopUpData] = useState(null);
    const [errorPopUpData, setErrorPopUpData] = useState(null);

    const [authToken, setAuthToken] = useState(
        localStorage.getItem(TOKEN_KEY) || "",
    );
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const eventSourceRef = useRef(null);

    const clearAuth = () => {
        setAuthToken("");
        localStorage.removeItem(TOKEN_KEY);
        setStudentDisplayInformation([]);
        setStudentsOffset(0);
        setHasMoreStudents(true);
    };

    const authorizedFetch = async (path, options = {}) => {
        const headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${authToken}`,
        };

        const result = await fetch(`${VITE_API_URL}${path}`, {
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
            // if there was an error in the studens being shown -- need to set a paragraph in the search results to be "Could not load students" error
            console.log(error.message || "Could not load students");
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
            console.log(error.message || "Could not search students");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    useEffect(() => {}, [authToken]);

    useEffect(() => {
        if (!authToken) {
            const es = new EventSource(
                `${VITE_API_URL}/api/events?token=${authToken}`,
            );

            es.onmessage = (event) => {
                const updated = JSON.parse(event.data);
                setStudentDisplayInformation((prev) =>
                    prev.map((student) =>
                        student.studentID.toString() ===
                        updated.studentID.toString()
                            ? { ...student, status: updated.status }
                            : student,
                    ),
                );
            };

            eventSourceRef.current = es;

            return () => {
                es.close();
            };
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

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const scanAudio = new Audio(scanSound);
        scanAudio.preload = "auto";
        scanAudio.volume = 0.5;
        scanAudioRef.current = scanAudio;

        const errorAudio = new Audio(errorSound);
        errorAudio.preload = "auto";
        errorAudio.volume = 0.5;
        errorAudioRef.current = errorAudio;

        return () => {
            scanAudio.pause();
            errorAudio.pause();
            scanAudioRef.current = null;
            errorAudioRef.current = null;
        };
    }, []);

    const playScanSound = () => {
        const audio = scanAudioRef.current;

        if (!audio) {
            return;
        }

        audio.currentTime = 0;
        audio.play().catch(() => {});
    };

    const playErrorSound = () => {
        const audio = errorAudioRef.current;

        if (!audio) {
            return;
        }

        audio.currentTime = 0;
        audio.play().catch(() => {});
    };

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
            return data;
        } catch (error) {
            setStudentDisplayInformation(previous);
            console.log(error.message);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const idToUpdate = studentIDsearch;

        try {
            const studentResult = await authorizedFetch(
                `/api/get/${idToUpdate}`,
            );
            const studentData = await studentResult.json();

            if (studentData.is_handed_out) {
                setPopUpData({
                    name: studentData.name,
                    studentId: studentData.student_id,
                    status: "error",
                    message: "It has already been handed out",
                });
                playErrorSound();
                setStudentIDsearch("");
                return;
            }
        } catch (error) {
            setErrorPopUpData({ studentId: idToUpdate, error });
            playErrorSound();
            setStudentIDsearch("");
            return;
        }

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
            playScanSound();
        }
        setStudentIDsearch("");
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setAuthError("");
        setIsAuthenticating(true);

        try {
            const result = await fetch(`${VITE_API_URL}/api/login`, {
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
            // I do not really know if we really need this part of the project
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
        return (
            <LoginForm
                username={username}
                password={password}
                onUsernameChange={setUsername}
                onPasswordChange={setPassword}
                onSubmit={handleLogin}
                error={authError}
                loading={isAuthenticating}
            />
        );
    }

    return (
        <>
            <div className="main-layout">
                <div className="handout-information-wrapper">
                    <img
                        src={spartanLogo}
                        alt="Logo"
                        className="handout-logo"
                    />
                    <h1 className="handout-title">
                        YEARBOOK DISTRIBUTION PORTAL
                    </h1>

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

                        <div
                            className="profiles-scroll"
                            onScroll={handleProfilesScroll}
                        >
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
                        message={popUpData.message}
                        onClose={() => setPopUpData(null)}
                    />
                )}

                {errorPopUpData && (
                    <ErrorPopUp
                        studentId={errorPopUpData.studentId}
                        error={errorPopUpData.error}
                        onClose={() => setErrorPopUpData(null)}
                    />
                )}
            </div>
        </>
    );
}
