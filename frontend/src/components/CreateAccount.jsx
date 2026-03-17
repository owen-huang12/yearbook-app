import { useState } from "react"
import spartanLogo from "../assets/spartan-logo.png"

export default function CreateAccount({ onBackToLogin, onRegisterSuccess }) {
  const [email, setEmail] = useState("")
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleCreateAccount = async (event) => {
    event.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await fetch("http://localhost:3002/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, password }),
      })

      const data = await result.json()

      if (!result.ok) {
        throw new Error(data.error || "Account creation failed")
      }

      onRegisterSuccess(data.token)
    } catch (err) {
      setError(err.message || "Account creation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="portal-wrapper">
      <div className="portal-card">
        <img src={spartanLogo} alt="Logo" className="portal-logo" />
        <h1 className="portal-title">YEARBOOK DISTRIBUTION PORTAL</h1>

        <form className="portal-form" onSubmit={handleCreateAccount}>
          <label className="portal-label">Enter email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="portal-input"
            autoComplete="email"
            required
          />

          <label className="portal-label">Enter username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="portal-input"
            autoComplete="username"
            required
          />

          <label className="portal-label">Enter password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="portal-input"
            autoComplete="new-password"
            required
          />

          <button type="submit" className="portal-button" disabled={loading}>
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>

          {error && <p className="portal-error">{error}</p>}
        </form>

        <p className="portal-switch">
          Already have an account?{" "}
          <button type="button" className="portal-link" onClick={onBackToLogin}>
            Sign in
          </button>
        </p>
      </div>
    </div>
  )
}
