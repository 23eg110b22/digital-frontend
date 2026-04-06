import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./App.css";
import { authApi } from "./api";

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.register({ name, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("currentUser", JSON.stringify({ id: data.id, name: data.name, email: data.email }));
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      setError(err.message || "Registration failed.");
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
        <div className="auth-title">Create account</div>
        <div className="auth-sub">Join Digital Life Organizer today</div>
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" type="text" placeholder="Aditya Kumar" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Account"}
          </button>
        </form>
        <div className="auth-link">
          Already have an account? <Link to="/">Sign in</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
