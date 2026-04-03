requireAuth();
bindTopbar();

const recipesGrid = document.getElementById("recipesGrid");
const messageEl = document.getElementById("message");
const categorySelect = document.getElementById("filterCategory");

async function loadCategories() {
  const categories = await apiFetch("/categories");
  categorySelect.innerHTML = "<option value=''>All</option>";
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category.categoryID;
    option.textContent = category.category_name;
    categorySelect.appendChild(option);
  });
}

function buildQuery() {
  const params = new URLSearchParams();
  const maxTime = document.getElementById("filterTime").value;
  const difficulty = document.getElementById("filterDifficulty").value;
  const categoryID = document.getElementById("filterCategory").value;
  const ingredientIDs = document.getElementById("filterIngredients").value.trim();

  if (maxTime) params.append("max_cooking_time", maxTime);
  if (difficulty) params.append("difficulty", difficulty);
  if (categoryID) params.append("category_id", categoryID);
  if (ingredientIDs) params.append("ingredient_ids", ingredientIDs);

  const query = params.toString();
  return query ? `?${query}` : "";
}

function renderRecipes(recipes) {
  if (!recipes.length) {
    recipesGrid.innerHTML = "<p class='muted'>No recipes found.</p>";
    return;
  }

  recipesGrid.innerHTML = recipes
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
          <button onclick="window.location.href='recipe.html?id=${recipe.recipeID}'">View Details</button>
        </div>
      </article>
    `,
    )
    .join("");
}

async function loadRecipes() {
  try {
    messageEl.textContent = "";
    const recipes = await apiFetch(`/recipes${buildQuery()}`);
    renderRecipes(recipes);
  } catch (error) {
    messageEl.textContent = error.message;
    messageEl.className = "message error";
  }
}

document.getElementById("applyFilters").addEventListener("click", loadRecipes);
document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("filterTime").value = "";
  document.getElementById("filterDifficulty").value = "";
  document.getElementById("filterCategory").value = "";
  document.getElementById("filterIngredients").value = "";
  loadRecipes();
});

(async function init() {
  await loadCategories();
  await loadRecipes();
})();
