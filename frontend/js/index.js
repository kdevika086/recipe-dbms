if (getToken()) {
  window.location.href = "dashboard.html";
}

const loginForm = document.getElementById("loginForm");
const messageEl = document.getElementById("message");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  messageEl.textContent = "";

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  try {
    const loginResult = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const me = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${loginResult.access_token}`,
      },
    }).then((res) => res.json());

    setSession(loginResult.access_token, {
      username: me.username,
      role: me.role,
      userID: me.userID,
    });

    window.location.href = "dashboard.html";
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
});
