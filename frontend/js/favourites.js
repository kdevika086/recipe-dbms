requireAuth();
bindTopbar();

const favGrid = document.getElementById("favGrid");
const messageEl = document.getElementById("message");

async function removeFavourite(id) {
  try {
    await apiFetch(`/favourites/${id}`, { method: "DELETE" });
    await loadFavourites();
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
}

async function loadFavourites() {
  try {
    const recipes = await apiFetch("/favourites");
    if (!recipes.length) {
      favGrid.innerHTML = `
        <article class="card empty-state-card">
          <h3>No favourites added yet.</h3>
        </article>
      `;
      return;
    }

    favGrid.innerHTML = recipes
      .map(
        (recipe) => `
      <article class="card recipe-card">
        <h3>${recipe.title}</h3>
        <p>${recipe.description}</p>
        <div class="meta">
          <span class="pill">${recipe.category_name}</span>
          <span class="pill">${recipe.difficulty}</span>
          <span class="pill">${recipe.cooking_time} mins</span>
        </div>
        <div class="actions">
          <button onclick="window.location.href='recipe.html?id=${recipe.recipeID}'">View</button>
          <button class="danger" onclick="removeFavourite(${recipe.recipeID})">Remove</button>
        </div>
      </article>
    `,
      )
      .join("");
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
}

window.removeFavourite = removeFavourite;
loadFavourites();
