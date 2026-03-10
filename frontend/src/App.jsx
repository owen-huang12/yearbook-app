import { useState, useEffect } from "react"
import Profile from "./components/Profile.jsx"

const API_URL = "http://localhost:3002"
const TOKEN_KEY = "yearbook-auth-token"

function LoginForm({ username, password, onUsernameChange, onPasswordChange, onSubmit, error, loading }) {
  return (
    <div className="auth-wrapper">
      <h1>Yearbook distribution app</h1>
      <form className="auth-form" onSubmit={onSubmit}>
        <h3>Authorized Sign In</h3>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(event) => onUsernameChange(event.target.value)}
          autoComplete="username"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          autoComplete="current-password"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
        {error ? <p className="auth-error">{error}</p> : null}
      </form>
    </div>
  )
}

export default function App() {
  const [studentIDsearch, setStudentIDsearch] = useState("")
  const [response, setResponse] = useState("")
  const [studentDisplayInformation, setStudentDisplayInformation] = useState()

  const [authToken, setAuthToken] = useState(localStorage.getItem(TOKEN_KEY) || "")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")
  const [isAuthenticating, setIsAuthenticating] = useState(false)

  const clearAuth = () => {
    setAuthToken("")
    localStorage.removeItem(TOKEN_KEY)
    setStudentDisplayInformation([])
    setResponse("")
  }

  const authorizedFetch = async (path, options = {}) => {
    const headers = {
      ...(options.headers || {}),
      Authorization: `Bearer ${authToken}`,
    }

    const result = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    })

    if (result.status === 401) {
      clearAuth()
      throw new Error("Session expired. Please sign in again.")
    }

    return result
  }

  const fetchAllStudents = async () => {
    try {
      const result = await authorizedFetch("/api/get")
      const data = await result.json()
      setStudentDisplayInformation(data.data || [])
    } catch (error) {
      setResponse(error.message || "Could not load students")
    }
  }

  useEffect(() => {
    if (authToken) {
      fetchAllStudents()
    }
  }, [authToken])

  const updateStudentStatus = async (studentID, newStatus) => {
    setStudentDisplayInformation((prev = []) => {
      return prev.map((student) => {
        return student.studentID.toString() === studentID.toString()
          ? { ...student, status: newStatus }
          : student
      })
    })

    setResponse(`Student ${studentID} marked as ${newStatus}`)

    try {
      await authorizedFetch("/api/edit-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentID, status: newStatus }),
      })
    } catch (error) {
      setResponse(error.message || "Error saving status")
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const idToUpdate = studentIDsearch

    updateStudentStatus(idToUpdate, "claimed")
    setStudentIDsearch("")
  }

  const handleLogin = async (event) => {
    event.preventDefault()
    setAuthError("")
    setIsAuthenticating(true)

    try {
      const result = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await result.json()

      if (!result.ok) {
        throw new Error(data.error || "Sign in failed")
      }

      localStorage.setItem(TOKEN_KEY, data.token)
      setAuthToken(data.token)
      setUsername("")
      setPassword("")
      setResponse("")
    } catch (error) {
      setAuthError(error.message || "Sign in failed")
    } finally {
      setIsAuthenticating(false)
    }
  }

  const handleLogout = async () => {
    try {
      await authorizedFetch("/api/logout", { method: "POST" })
    } catch {
      // Clear local session even if server call fails.
    }

    clearAuth()
  }

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
    )
  }

  return (
    <>
      <header>
        <h1>Yearbook distribution app</h1>
        <button className="logout-button" onClick={handleLogout}>Log out</button>
      </header>
      <div className="handout-information-wrapper">
        <h3>HANDOUT YEARBOOK</h3>
        <form onSubmit={handleSubmit}>
          <div className="center-container">
            <input
              type="text"
              id="student-id-field"
              onChange={(event) => {
                setStudentIDsearch(event.target.value)
              }}
              value={studentIDsearch}
              autoComplete="off"
            />
          </div>
        </form>
        <p style={{ textAlign: "center" }}>
          Enter the student ID of the student you are handing out the yearbook for either by
          scanning their ID bar with the scanner, or entering it manually.
        </p>
      </div>
      <div className="display-information-wrapper">
        <h3>DISTRIBUTION INFORMATION</h3>
        <div className="results-info">
          <p style={{ textAlign: "center" }}>{response}</p>
        </div>
        {studentDisplayInformation?.map((student) => (
          <Profile key={student.studentID} {...student} update={updateStudentStatus} />
        ))}
      </div>
    </>
  )
}
