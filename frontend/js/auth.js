function getToken() {
  return localStorage.getItem("token");
}

function getUser() {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

function setSession(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

function isAdmin() {
  const user = getUser();
  return user && user.role === "admin";
}

function requireAuth() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

function requireAdmin() {
  requireAuth();
  if (!isAdmin()) {
    window.location.href = "dashboard.html";
  }
}

function logout() {
  clearSession();
  window.location.href = "index.html";
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message = payload?.detail || "Request failed";
    throw new Error(message);
  }

  return payload;
}

function bindTopbar() {
  const user = getUser();
  const userLabel = document.getElementById("currentUser");
  const adminLink = document.getElementById("adminLink");
  const logoutBtn = document.getElementById("logoutBtn");

  if (userLabel && user) {
    userLabel.textContent = `${user.username} (${user.role})`;
  }

  if (adminLink) {
    adminLink.classList.toggle("hidden", !isAdmin());
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
}
