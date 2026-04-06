import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./App.css";
import { authApi } from "./api";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify({ id: data.id, name: data.name, email: data.email }));
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">⚙️</div>
          <div className="auth-logo-text">DL<span>O</span></div>
        </div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in to your Digital Life Organizer</div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="auth-link" style={{ marginTop: 12 }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <div className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
