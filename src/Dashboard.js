import React, { useEffect, useState, useCallback, useRef } from "react";
import "./App.css";
import { useNavigate } from "react-router-dom";
import { FaFileAlt, FaMoneyBillWave, FaBell, FaCreditCard, FaChartBar, FaCog, FaHome } from "react-icons/fa";
import { billsApi, documentsApi, subsApi, analyticsApi, userApi } from "./api";

function Dashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [darkMode, setDarkMode] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: "User", email: "" });

  // Bills
  const [billName, setBillName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [billCat, setBillCat] = useState("Utilities");
  const [billAmount, setBillAmount] = useState("");
  const [bills, setBills] = useState([]);
  const [showBillForm, setShowBillForm] = useState(false);

  // Documents
  const [file, setFile] = useState(null);
  const [docName, setDocName] = useState("");
  const [docType, setDocType] = useState("ID Proof");
  const [documents, setDocuments] = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  // Subscriptions
  const [subName, setSubName] = useState("");
  const [subDate, setSubDate] = useState("");
  const [subAmount, setSubAmount] = useState("");
  const [subs, setSubs] = useState([]);
  const [showSubForm, setShowSubForm] = useState(false);

  // Analytics
  const [analytics, setAnalytics] = useState(null);

  // Settings
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [notifBills, setNotifBills] = useState(true);
  const [notifSubs, setNotifSubs] = useState(true);
  const [notifPayments, setNotifPayments] = useState(false);
  const [notifDocs, setNotifDocs] = useState(true);

  // Notifications & Toast
  const [notifications, setNotifications] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [loading, setLoading] = useState({});
  const notifiedBillIds = useRef(new Set());

  const toast = (msg, type = "success") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, msg, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  };

  const setLoad = (key, val) => setLoading(l => ({ ...l, [key]: val }));

  // ── LOAD DATA ──────────────────────────────────────────────────────────────

  const loadBills = useCallback(async () => {
    try {
      const data = await billsApi.getAll();
      setBills(data);
    } catch (e) { toast("Failed to load bills", "error"); }
  }, []);

  const loadDocuments = useCallback(async () => {
    try {
      const data = await documentsApi.getAll();
      setDocuments(data);
    } catch (e) { toast("Failed to load documents", "error"); }
  }, []);

  const loadSubscriptions = useCallback(async () => {
    try {
      const data = await subsApi.getAll();
      setSubs(data);
    } catch (e) { toast("Failed to load subscriptions", "error"); }
  }, []);

  const loadAnalytics = useCallback(async () => {
    try {
      const data = await analyticsApi.get();
      setAnalytics(data);
    } catch (e) {}
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const data = await userApi.getProfile();
      setCurrentUser({ name: data.name, email: data.email });
      setProfileName(data.name);
      setProfileEmail(data.email);
      setNotifBills(data.notificationBills);
      setNotifSubs(data.notificationSubscriptions);
      setNotifPayments(data.notificationPayments);
      setNotifDocs(data.notificationDocuments);
    } catch (e) {}
  }, []);

  const showSystemNotification = (title, body) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    try {
      new Notification(title, { body });
    } catch (e) {}
  };

  const loadDueSoon = useCallback(async () => {
    try {
      const data = await billsApi.getDueSoon();
      setNotifications(data);
      if (Array.isArray(data) && data.length > 0) {
        data.forEach((item) => {
          const id = item.id || `${item.billName}-${item.dueDate}`;
          if (!notifiedBillIds.current.has(id)) {
            notifiedBillIds.current.add(id);
            showSystemNotification(`Bill Due: ${item.billName}`, `Due on ${item.dueDate}`);
          }
        });
      }
    } catch (e) {}
  }, []);

  const requestNotificationPermission = () => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") Notification.requestPermission();
  };

  // Protect route & initial load
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("currentUser");
    if (!token) { navigate("/"); return; }
    if (user) setCurrentUser(JSON.parse(user));
    requestNotificationPermission();
    loadBills();
    loadDocuments();
    loadSubscriptions();
    loadDueSoon();
    loadProfile();
  }, [navigate, loadBills, loadDocuments, loadSubscriptions, loadDueSoon, loadProfile]);

  useEffect(() => {
    if (activePage === "analytics") loadAnalytics();
  }, [activePage, loadAnalytics]);

  // ── BILLS CRUD ─────────────────────────────────────────────────────────────

  const addBill = async () => {
    if (!billName || !dueDate) { toast("Fill all fields", "error"); return; }
    setLoad("addBill", true);
    try {
      await billsApi.add({ billName, dueDate, billCat, amount: billAmount ? parseFloat(billAmount) : null });
      await loadBills();
      await loadDueSoon();
      setBillName(""); setDueDate(""); setBillAmount(""); setBillCat("Utilities");
      setShowBillForm(false);
      toast("Bill added!");
    } catch (e) { toast(e.message || "Failed to add bill", "error"); }
    finally { setLoad("addBill", false); }
  };

  const deleteBill = async (id) => {
    try {
      await billsApi.delete(id);
      await loadBills();
      await loadDueSoon();
      toast("Bill deleted", "error");
    } catch (e) { toast("Failed to delete bill", "error"); }
  };

  const markPaid = async (id) => {
    try {
      await billsApi.markPaid(id);
      await loadBills();
      await loadDueSoon();
      toast("Bill marked as paid!");
    } catch (e) { toast("Failed to update bill", "error"); }
  };

  // ── DOCUMENTS CRUD ─────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!docName.trim()) { toast("Enter document name", "error"); return; }
    if (!file) { toast("Select a file to upload", "error"); return; }
    setLoad("upload", true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", docName);
      formData.append("category", docType);
      await documentsApi.upload(formData);
      await loadDocuments();
      setDocName(""); setDocType("ID Proof"); setFile(null);
      setShowUpload(false);
      toast("Document uploaded!");
    } catch (e) { toast(e.message || "Upload failed", "error"); }
    finally { setLoad("upload", false); }
  };

  const deleteDocument = async (id) => {
    try {
      await documentsApi.delete(id);
      await loadDocuments();
      toast("Document deleted", "error");
    } catch (e) { toast("Failed to delete document", "error"); }
  };

  const viewDocument = async (id, fileName) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${process.env.REACT_APP_API_URL || "http://localhost:8081"}/api/documents/${id}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Failed to download document");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) { toast("Failed to download document", "error"); }
  };

  // ── SUBSCRIPTIONS CRUD ─────────────────────────────────────────────────────

  const addSubscription = async () => {
    if (!subName || !subDate) { toast("Fill all fields", "error"); return; }
    setLoad("addSub", true);
    try {
      await subsApi.add({ subName, subDate, subAmount: subAmount ? parseFloat(subAmount) : null });
      await loadSubscriptions();
      setSubName(""); setSubDate(""); setSubAmount("");
      setShowSubForm(false);
      toast("Subscription added!");
    } catch (e) { toast(e.message || "Failed to add subscription", "error"); }
    finally { setLoad("addSub", false); }
  };

  const deleteSubscription = async (id) => {
    try {
      await subsApi.delete(id);
      await loadSubscriptions();
      toast("Subscription cancelled", "error");
    } catch (e) { toast("Failed to cancel subscription", "error"); }
  };

  // ── PAYMENTS ───────────────────────────────────────────────────────────────

  const handlePayment = (app, name) => {
    toast(`Opening ${app} for ${name}...`);
    const urls = { GPay: "https://pay.google.com", PhonePe: "https://www.phonepe.com", Paytm: "https://paytm.com" };
    if (urls[app]) setTimeout(() => window.open(urls[app], "_blank"), 800);
  };

  // ── SETTINGS ───────────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setLoad("profile", true);
    try {
      const data = await userApi.updateProfile({ name: profileName, email: profileEmail });
      setCurrentUser({ name: data.name, email: data.email });
      localStorage.setItem("currentUser", JSON.stringify({ name: data.name, email: data.email }));
      toast("Profile saved!");
    } catch (e) { toast(e.message || "Failed to save profile", "error"); }
    finally { setLoad("profile", false); }
  };

  const saveNotifications = async () => {
    setLoad("notifications", true);
    try {
      const data = await userApi.updateNotifications({
        notificationBills: notifBills,
        notificationSubscriptions: notifSubs,
        notificationPayments: notifPayments,
        notificationDocuments: notifDocs,
      });
      setNotifBills(data.notificationBills);
      setNotifSubs(data.notificationSubscriptions);
      setNotifPayments(data.notificationPayments);
      setNotifDocs(data.notificationDocuments);
      toast("Notification preferences saved!");
      await loadDueSoon();
    } catch (e) { toast(e.message || "Failed to save preferences", "error"); }
    finally { setLoad("notifications", false); }
  };

  // ── LOGOUT ─────────────────────────────────────────────────────────────────

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const initials = currentUser.name
    ? currentUser.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  const unpaidCount = bills.filter(b => b.status !== "paid").length;

  const navItems = [
    { id: "dashboard", icon: <FaHome />, label: "Dashboard" },
    { id: "bills", icon: <FaMoneyBillWave />, label: "Bills", badge: unpaidCount || null, badgeClass: "warning" },
    { id: "documents", icon: <FaFileAlt />, label: "Documents", badge: documents.length || null },
    { id: "subscriptions", icon: <FaBell />, label: "Subscriptions", badge: notifications.length > 0 ? notifications.length : null, badgeClass: "danger" },
    { id: "paybills", icon: <FaCreditCard />, label: "Pay Bills" },
    { id: "analytics", icon: <FaChartBar />, label: "Analytics" },
    { id: "settings", icon: <FaCog />, label: "Settings" },
  ];

  const fmt = (val) => val != null ? "₹" + Number(val).toLocaleString("en-IN") : "—";

  return (
    <div className={darkMode ? "dark app-layout" : "app-layout"}>

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">⚙️</div>
          <div className="sidebar-logo-text">DL<span>O</span></div>
        </div>
        <div className="sidebar-section" style={{ marginTop: 16 }}>
          <div className="sidebar-label">Navigation</div>
          {navItems.slice(0, 4).map((n) => (
            <button key={n.id} className={`nav-item${activePage === n.id ? " active" : ""}`} onClick={() => setActivePage(n.id)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
              {n.badge > 0 && <span className={`nav-badge${n.badgeClass ? " " + n.badgeClass : ""}`}>{n.badge}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-section" style={{ marginTop: 20 }}>
          <div className="sidebar-label">Payments</div>
          {navItems.slice(4, 5).map((n) => (
            <button key={n.id} className={`nav-item${activePage === n.id ? " active" : ""}`} onClick={() => setActivePage(n.id)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
        <div className="sidebar-section" style={{ marginTop: 20 }}>
          <div className="sidebar-label">More</div>
          {navItems.slice(5).map((n) => (
            <button key={n.id} className={`nav-item${activePage === n.id ? " active" : ""}`} onClick={() => setActivePage(n.id)}>
              <span className="nav-icon">{n.icon}</span>{n.label}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="user-card" onClick={() => setActivePage("settings")} style={{ cursor: "pointer" }}>
            <div className="user-avatar">{initials}</div>
            <div>
              <div className="user-name">{currentUser.name}</div>
              <div style={{ fontSize: 12, color: "#7b82a6", marginBottom: 4 }}>{currentUser.email}</div>
              <div className="user-role">Premium Plan</div>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-wrapper">
        <div className="topbar">
          <div className="topbar-title">{navItems.find((n) => n.id === activePage)?.label}</div>
          <div className="topbar-right">
            <div className="search-bar">
              <span style={{ color: "#7b82a6", fontSize: 14 }}>🔍</span>
              <input placeholder="Search anything..." />
            </div>
            <div className="icon-btn" onClick={() => setDarkMode(!darkMode)} title="Toggle theme">
              {darkMode ? "☀️" : "🌙"}
            </div>
            <div className="icon-btn" onClick={() => setActivePage("subscriptions")} title="Notifications" style={{ position: "relative" }}>
              🔔
              {notifications.length > 0 && <span style={{ position: "absolute", top: 6, right: 6, width: 8, height: 8, borderRadius: "50%", background: "#ff4d6d" }} />}
            </div>
            <button className="topbar-logout" onClick={logout}>Logout</button>
          </div>
        </div>

        <div className="main-content">

          {/* ── DASHBOARD ──────────────────────── */}
          {activePage === "dashboard" && (
            <div>
              <div className="welcome-banner">
                <h1>Welcome back, {currentUser.name} 👋</h1>
                <p>Manage your bills, documents, subscriptions and payments in one place.</p>
              </div>
              <div className="stats-grid">
                <div className="stat-card purple">
                  <div className="stat-icon">💰</div>
                  <div className="stat-label">Total Bills</div>
                  <div className="stat-value">{bills.length}</div>
                  <div className="stat-sub">{unpaidCount} unpaid</div>
                </div>
                <div className="stat-card pink">
                  <div className="stat-icon">📋</div>
                  <div className="stat-label">Documents</div>
                  <div className="stat-value">{documents.length}</div>
                  <div className="stat-sub">Stored securely</div>
                </div>
                <div className="stat-card teal">
                  <div className="stat-icon">🔄</div>
                  <div className="stat-label">Subscriptions</div>
                  <div className="stat-value">{subs.length}</div>
                  <div className="stat-sub">Active services</div>
                </div>
                <div className="stat-card yellow">
                  <div className="stat-icon">🔔</div>
                  <div className="stat-label">Due Soon</div>
                  <div className="stat-value">{notifications.length}</div>
                  <div className="stat-sub">Within 3 days</div>
                </div>
              </div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">⚡ Recent Bills</div>
                  {bills.length === 0 ? <p style={{ color: "#7b82a6", fontSize: 14 }}>No bills added yet.</p> : (
                    <table className="data-table">
                      <thead><tr><th>Bill</th><th>Due Date</th><th>Status</th></tr></thead>
                      <tbody>
                        {bills.slice(0, 4).map((b) => (
                          <tr key={b.id}>
                            <td>{b.billName}</td>
                            <td>{b.dueDate}</td>
                            <td><span className={`badge badge-${b.status === "paid" ? "success" : "warning"}`}>{b.status === "paid" ? "Paid" : "Unpaid"}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                <div className="card">
                  <div className="card-title">🔔 Notifications</div>
                  {notifications.length === 0 ? (
                    <p style={{ color: "#43e8b8", fontSize: 14 }}>🎉 No bills due in next 3 days!</p>
                  ) : notifications.map((n) => (
                    <div key={n.id} className="notif-item">
                      <span>⚠️</span>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500 }}>{n.billName} due soon</div>
                        <div style={{ fontSize: 12, color: "#7b82a6" }}>{n.dueDate}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── BILLS ──────────────────────────── */}
          {activePage === "bills" && (
            <div>
              <div className="section-header">
                <div className="section-title">⚡ Bills Manager</div>
                <button className="btn btn-grad" onClick={() => setShowBillForm((v) => !v)}>+ Add Bill</button>
              </div>
              {showBillForm && (
                <div className="add-form">
                  <div className="card-title">➕ New Bill</div>
                  <div className="form-row cols-3">
                    <div>
                      <label className="form-label">Bill Name</label>
                      <input className="dash-input" placeholder="e.g. Electricity" value={billName} onChange={(e) => setBillName(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Amount (₹)</label>
                      <input className="dash-input" type="number" placeholder="0.00" value={billAmount} onChange={(e) => setBillAmount(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Due Date</label>
                      <input className="dash-input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select className="dash-input" value={billCat} onChange={(e) => setBillCat(e.target.value)}>
                        <option>Utilities</option><option>Rent</option><option>Insurance</option><option>Loan</option><option>Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-grad" onClick={addBill} disabled={loading.addBill}>{loading.addBill ? "Adding..." : "Add Bill"}</button>
                    <button className="btn btn-outline" onClick={() => setShowBillForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="card">
                <div className="card-title">📋 All Bills</div>
                {bills.length === 0 ? <p style={{ color: "#7b82a6", fontSize: 14 }}>No bills yet. Add your first bill!</p> : (
                  <table className="data-table">
                    <thead><tr><th>Bill</th><th>Category</th><th>Amount</th><th>Due Date</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                      {bills.map((b) => (
                        <tr key={b.id}>
                          <td>{b.billName}</td>
                          <td>{b.billCat}</td>
                          <td>{b.amount != null ? fmt(b.amount) : "—"}</td>
                          <td>{b.dueDate}</td>
                          <td><span className={`badge badge-${b.status === "paid" ? "success" : "warning"}`}>{b.status === "paid" ? "Paid" : "Unpaid"}</span></td>
                          <td>
                            <div style={{ display: "flex", gap: 6 }}>
                              {b.status !== "paid" && (
                                <>
                                  <button className="btn-success-sm" onClick={() => markPaid(b.id)}>✓ Pay</button>
                                  <button className="btn-pay" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => handlePayment("GPay", b.billName)}>GPay</button>
                                  <button className="btn-pay" style={{ padding: "5px 10px", fontSize: 12 }} onClick={() => handlePayment("PhonePe", b.billName)}>PhonePe</button>
                                </>
                              )}
                              <button className="btn-danger-sm" onClick={() => deleteBill(b.id)}>🗑</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* ── DOCUMENTS ──────────────────────── */}
          {activePage === "documents" && (
            <div>
              <div className="section-header">
                <div className="section-title">📁 Documents</div>
                <button className="btn btn-grad" onClick={() => setShowUpload((v) => !v)}>+ Upload</button>
              </div>
              {showUpload && (
                <div className="card" style={{ marginBottom: 20, borderRadius: 12, padding: 20 }}>
                  <div className="card-title" style={{ marginBottom: 16 }}>⬆️ Upload Document</div>
                  <div className="form-row cols-2" style={{ marginBottom: 16 }}>
                    <div>
                      <label className="form-label">Document Name *</label>
                      <input className="dash-input" placeholder="e.g. Passport" value={docName} onChange={(e) => setDocName(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Category</label>
                      <select className="dash-input" value={docType} onChange={(e) => setDocType(e.target.value)}>
                        <option>ID Proof</option><option>Financial</option><option>Medical</option><option>Legal</option><option>Education</option>
                      </select>
                    </div>
                  </div>
                  <label className="upload-zone" style={{ border: "2px dashed #6c63ff", borderRadius: 8, padding: 20, textAlign: "center", cursor: "pointer", display: "block", background: "#1c2038" }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.7 }}>📂</div>
                    <p style={{ color: "#7b82a6", fontSize: 14, margin: 0 }}>{file ? `Selected: ${file.name}` : "Click to choose file or drag & drop"}</p>
                    <input type="file" style={{ display: "none" }} onChange={(e) => setFile(e.target.files[0])} />
                  </label>
                  <div className="form-actions" style={{ marginTop: 20, display: "flex", gap: 12 }}>
                    <button className="btn btn-grad" onClick={handleUpload} disabled={loading.upload || !docName.trim() || !file} style={{ flex: 1 }}>
                      {loading.upload ? "Uploading..." : "Upload Document"}
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowUpload(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="card">
                <div className="card-title">📄 Your Documents</div>
                {documents.length === 0 ? <p style={{ color: "#7b82a6", fontSize: 14 }}>No documents yet.</p> : documents.map((d) => (
                  <div key={d.id} className="doc-item">
                    <div className="doc-icon">{d.icon}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{d.name}</div>
                      <div style={{ fontSize: 12, color: "#7b82a6", marginTop: 2 }}>
                        {d.type} · {d.uploadDate ? new Date(d.uploadDate).toLocaleDateString("en-IN") : ""} · {d.fileName || "No file"}
                      </div>
                    </div>
                    <div className="doc-actions">
                      <button className="btn btn-outline" onClick={() => viewDocument(d.id, d.fileName)}
                        style={{ textDecoration: "none", padding: "6px 14px", fontSize: 13 }}>View</button>
                      <button className="btn-danger-sm" onClick={() => deleteDocument(d.id)}>🗑 Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SUBSCRIPTIONS ──────────────────── */}
          {activePage === "subscriptions" && (
            <div>
              <div className="section-header">
                <div className="section-title">🔔 Subscriptions</div>
                <button className="btn btn-grad" onClick={() => setShowSubForm((v) => !v)}>+ Add</button>
              </div>
              {showSubForm && (
                <div className="add-form">
                  <div className="card-title">➕ New Subscription</div>
                  <div className="form-row cols-3">
                    <div>
                      <label className="form-label">Service Name</label>
                      <input className="dash-input" placeholder="e.g. Netflix" value={subName} onChange={(e) => setSubName(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Amount (₹/mo)</label>
                      <input className="dash-input" type="number" placeholder="0" value={subAmount} onChange={(e) => setSubAmount(e.target.value)} />
                    </div>
                    <div>
                      <label className="form-label">Renewal Date</label>
                      <input className="dash-input" type="date" value={subDate} onChange={(e) => setSubDate(e.target.value)} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button className="btn btn-grad" onClick={addSubscription} disabled={loading.addSub}>{loading.addSub ? "Adding..." : "Add"}</button>
                    <button className="btn btn-outline" onClick={() => setShowSubForm(false)}>Cancel</button>
                  </div>
                </div>
              )}
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">📊 Spend Overview</div>
                  {subs.length === 0 ? <p style={{ color: "#7b82a6", fontSize: 14 }}>No subscriptions yet.</p> : subs.map((s) => (
                    <div key={s.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span>{s.subName}</span>
                        <span style={{ color: "#6c63ff" }}>{s.subAmount != null ? fmt(s.subAmount) : "—"}</span>
                      </div>
                      <div className="progress"><div className="progress-bar" style={{ width: "60%", background: "#6c63ff" }} /></div>
                    </div>
                  ))}
                  {subs.length > 0 && (
                    <>
                      <div className="divider" />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ color: "#7b82a6", fontSize: 13 }}>Total Monthly</span>
                        <span style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, color: "#6c63ff" }}>
                          ₹{subs.reduce((a, s) => a + (Number(s.subAmount) || 0), 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </>
                  )}
                </div>
                <div className="card">
                  <div className="card-title">📋 All Subscriptions</div>
                  {subs.length === 0 ? <p style={{ color: "#7b82a6", fontSize: 14 }}>No subscriptions yet.</p> : (
                    <table className="data-table">
                      <thead><tr><th>Service</th><th>Amount</th><th>Renewal</th><th>Action</th></tr></thead>
                      <tbody>
                        {subs.map((s) => (
                          <tr key={s.id}>
                            <td>{s.subName}</td>
                            <td>{s.subAmount != null ? fmt(s.subAmount) : "—"}</td>
                            <td>{s.subDate}</td>
                            <td><button className="btn-danger-sm" onClick={() => deleteSubscription(s.id)}>Cancel</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── PAY BILLS ──────────────────────── */}
          {activePage === "paybills" && (
            <div>
              <div className="section-title" style={{ marginBottom: 20 }}>💳 Pay Bills via UPI</div>
              <div className="grid-3">
                {[["🟢", "Google Pay", "GPay", "Pay using your Google account"], ["💜", "PhonePe", "PhonePe", "Fast & secure UPI payments"], ["🔵", "Paytm", "Paytm", "Wallet, UPI & more"]].map(([ico, label, app, desc]) => (
                  <div key={app} className="card" style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 48, marginBottom: 12 }}>{ico}</div>
                    <div style={{ fontFamily: "Syne,sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{label}</div>
                    <div style={{ color: "#7b82a6", fontSize: 13, marginBottom: 20 }}>{desc}</div>
                    <button className="btn btn-grad" style={{ width: "100%", justifyContent: "center" }} onClick={() => handlePayment(app, "General Payment")}>Open {label}</button>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ── ANALYTICS ──────────────────────── */}
          {activePage === "analytics" && (
            <div>
              <div className="section-title" style={{ marginBottom: 20 }}>📊 Analytics Overview</div>
              <div className="stats-grid" style={{ marginBottom: 20 }}>
                <div className="stat-card purple"><div className="stat-icon">📋</div><div className="stat-label">Total Bills</div><div className="stat-value">{analytics ? analytics.totalBills : bills.length}</div></div>
                <div className="stat-card pink"><div className="stat-icon">✅</div><div className="stat-label">Paid Bills</div><div className="stat-value">{analytics ? analytics.paidBills : bills.filter(b => b.status === "paid").length}</div></div>
                <div className="stat-card teal"><div className="stat-icon">📁</div><div className="stat-label">Documents</div><div className="stat-value">{analytics ? analytics.totalDocuments : documents.length}</div></div>
                <div className="stat-card yellow"><div className="stat-icon">🔄</div><div className="stat-label">Subscriptions</div><div className="stat-value">{analytics ? analytics.totalSubscriptions : subs.length}</div></div>
              </div>
              <div className="card">
                <div className="card-title">📈 Subscription Spend</div>
                {subs.length === 0 ? <p style={{ color: "#7b82a6", fontSize: 14 }}>No subscriptions to analyze.</p> : subs.map((s) => {
                  const max = Math.max(...subs.map(s => Number(s.subAmount) || 1));
                  const pct = Math.round(((Number(s.subAmount) || 0) / max) * 100);
                  return (
                    <div key={s.id} style={{ marginBottom: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                        <span>{s.subName}</span>
                        <span style={{ color: "#6c63ff" }}>{s.subAmount != null ? fmt(s.subAmount) : "—"}</span>
                      </div>
                      <div className="progress"><div className="progress-bar" style={{ width: pct + "%", background: "#6c63ff" }} /></div>
                    </div>
                  );
                })}
                {analytics && (
                  <>
                    <div className="divider" />
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#7b82a6", fontSize: 13 }}>Total Monthly Spend</span>
                      <span style={{ fontFamily: "Syne,sans-serif", fontSize: 20, fontWeight: 800, color: "#6c63ff" }}>
                        ₹{Number(analytics.totalMonthlySubscriptionCost || 0).toLocaleString("en-IN")}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS ───────────────────────── */}
          {activePage === "settings" && (
            <div>
              <div className="section-title" style={{ marginBottom: 20 }}>⚙️ Settings</div>
              <div className="grid-2">
                <div className="card">
                  <div className="card-title">👤 Profile</div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">Full Name</label>
                    <input className="dash-input" value={profileName} onChange={e => setProfileName(e.target.value)} />
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">Email</label>
                    <input className="dash-input" type="email" value={profileEmail} onChange={e => setProfileEmail(e.target.value)} />
                  </div>
                  <button className="btn btn-grad" style={{ marginTop: 8 }} onClick={saveProfile} disabled={loading.profile}>
                    {loading.profile ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                <div className="card">
                  <div className="card-title">🔔 Notifications</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {[
                      ["Bill due reminders", notifBills, setNotifBills],
                      ["Subscription renewals", notifSubs, setNotifSubs],
                      ["Payment confirmations", notifPayments, setNotifPayments],
                      ["Document expiry alerts", notifDocs, setNotifDocs],
                    ].map(([lbl, val, setter]) => (
                      <div key={lbl} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 14 }}>{lbl}</span>
                        <input type="checkbox" checked={val} onChange={e => setter(e.target.checked)}
                          style={{ accentColor: "#6c63ff", width: 16, height: 16 }} />
                      </div>
                    ))}
                  </div>
                  <button className="btn btn-grad" style={{ marginTop: 16 }} onClick={saveNotifications}>Save Preferences</button>
                  <div className="divider" />
                  <div className="card-title">🎨 Theme</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 14 }}>Dark Mode</span>
                    <button className="btn btn-outline" onClick={() => setDarkMode(v => !v)}>{darkMode ? "☀️ Light" : "🌙 Dark"}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* TOASTS */}
      <div className="toast-wrap">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.type === "success" ? "✅" : "❌"} {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
  
}

export default Dashboard;
