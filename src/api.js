// src/api.js — Central API utility for DLO frontend

const BASE_URL = "http://localhost:8081/api";

function getToken() {
  return localStorage.getItem("token");
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || "Request failed");
  }
  return data;
}

async function uploadRequest(path, formData) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Upload failed");
  return data;
}

// AUTH
export const authApi = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  forgotPassword: (body) => request("/auth/forgot-password", { method: "POST", body: JSON.stringify(body) }),
};

// BILLS
export const billsApi = {
  getAll: () => request("/bills"),
  add: (body) => request("/bills", { method: "POST", body: JSON.stringify(body) }),
  markPaid: (id) => request(`/bills/${id}/pay`, { method: "PATCH" }),
  delete: (id) => request(`/bills/${id}`, { method: "DELETE" }),
  getDueSoon: () => request("/bills/due-soon"),
};

// DOCUMENTS
export const documentsApi = {
  getAll: () => request("/documents"),
  upload: (formData) => uploadRequest("/documents", formData),
  download: (id) => `${BASE_URL}/documents/${id}/download`,
  delete: (id) => request(`/documents/${id}`, { method: "DELETE" }),
};

// SUBSCRIPTIONS
export const subsApi = {
  getAll: () => request("/subscriptions"),
  add: (body) => request("/subscriptions", { method: "POST", body: JSON.stringify(body) }),
  delete: (id) => request(`/subscriptions/${id}`, { method: "DELETE" }),
};

// ANALYTICS
export const analyticsApi = {
  get: () => request("/analytics"),
};

// USER / SETTINGS
export const userApi = {
  getProfile: () => request("/user/profile"),
  updateProfile: (body) => request("/user/profile", { method: "PUT", body: JSON.stringify(body) }),
  updateNotifications: (body) => request("/user/notifications", { method: "PUT", body: JSON.stringify(body) }),
};
