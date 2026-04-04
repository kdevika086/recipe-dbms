cconst API_BASE_URL =
  window.location.hostname === "localhost"
    ? "http://127.0.0.1:8000/api"
    : "https://YOUR-RENDER-URL.onrender.com/api";
