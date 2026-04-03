if (getToken()) {
  window.location.href = "dashboard.html";
}

const registerForm = document.getElementById("registerForm");
const messageEl = document.getElementById("message");

registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  messageEl.textContent = "";

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  try {
    await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, email, password }),
    });

    messageEl.textContent = "Registration successful. Please log in.";
    messageEl.className = "message success";
    registerForm.reset();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
});
