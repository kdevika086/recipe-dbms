requireAuth();
bindTopbar();

const detailRoot = document.getElementById("recipeDetail");
const messageEl = document.getElementById("message");
const params = new URLSearchParams(window.location.search);
const recipeID = params.get("id");

async function addToFavourites(id) {
  try {
    await apiFetch(`/favourites/${id}`, { method: "POST" });
    messageEl.textContent = "Added to favourites";
    messageEl.className = "message success";
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
}

async function loadRecipe() {
  if (!recipeID) {
    messageEl.textContent = "Missing recipe id";
    messageEl.className = "message error";
    return;
  }

  try {
    const recipe = await apiFetch(`/recipes/${recipeID}`);

    detailRoot.innerHTML = `
      <h1>${recipe.title}</h1>
      <p>${recipe.description}</p>
      <div class="meta">
        <span class="pill">${recipe.category_name}</span>
        <span class="pill">${recipe.difficulty}</span>
        <span class="pill">${recipe.cooking_time} mins</span>
      </div>
      <p class="muted">Created by: ${recipe.created_by}</p>
      <div class="actions" style="margin: 10px 0 18px;">
        <button id="favBtn">Add to Favourites</button>
      </div>
      <h3>Ingredients</h3>
      <ul class="list">
        ${recipe.ingredients
          .map((item) => `<li>${item.ingredient_name} - ${item.quantity} ${item.unit}</li>`)
          .join("")}
      </ul>
      <h3 style="margin-top: 14px;">Steps</h3>
      <ol class="list">
        ${recipe.steps.map((step) => `<li>${step.instruction}</li>`).join("")}
      </ol>
    `;

    document.getElementById("favBtn").addEventListener("click", () => addToFavourites(recipe.recipeID));
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
}

loadRecipe();
