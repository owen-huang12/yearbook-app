export default function LoginForm({ username, password, onUsernameChange, onPasswordChange, onSubmit, error, loading }) {
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