import spartanLogo from "../assets/spartan-logo.png";

export default function LoginForm({
  username,
  password,
  onUsernameChange,
  onPasswordChange,
  onSubmit,
  error,
  loading,
}) {
  return (
    <div className="portal-wrapper">
      <div className="portal-card">
        <img src={spartanLogo} alt="Logo" className="portal-logo" />
        <h1 className="portal-title">YEARBOOK DISTRIBUTION PORTAL</h1>

        <form className="portal-form" onSubmit={onSubmit}>
          <label className="portal-label">Enter username</label>
          <input
            type="text"
            value={username}
            onChange={(event) => onUsernameChange(event.target.value)}
            className="portal-input"
            autoComplete="username"
          />

          <label className="portal-label">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="portal-input"
            autoComplete="current-password"
          />

          <button type="submit" className="portal-button" disabled={loading}>
            {loading ? "SIGNING IN..." : "SIGN IN"}
          </button>

          {error ? <p className="portal-error">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
