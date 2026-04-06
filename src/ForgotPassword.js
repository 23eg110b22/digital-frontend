import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./App.css";
import { authApi } from "./api";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMsg("");
    setLoading(true);
    try {
      const data = await authApi.forgotPassword({ email });
      setMsg(data.message || "Password reset link sent!");
    } catch (err) {
      setError(err.message || "No account found with that email.");
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
        <div className="auth-title">Forgot Password</div>
        <div className="auth-sub">Enter your email to reset your password</div>
        {error && <div className="auth-error">{error}</div>}
        {msg && <div className="auth-success">{msg}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <div className="auth-link">
          <Link to="/">Back to Sign In</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
