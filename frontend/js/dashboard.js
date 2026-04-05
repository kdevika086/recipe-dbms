requireAuth();
bindTopbar();

const recipesGrid = document.getElementById("recipesGrid");
const messageEl = document.getElementById("message");
const categorySelect = document.getElementById("filterCategory");
const ingredientInput = document.getElementById("filterIngredients");
const ingredientOptions = document.getElementById("ingredientOptions");
const selectedIngredientsEl = document.getElementById("selectedIngredients");
let ingredientLookup = new Map();
let selectedIngredients = [];

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

async function loadIngredients() {
  const ingredients = await apiFetch("/ingredients");
  ingredientLookup = new Map();
  ingredientOptions.innerHTML = "";

  ingredients.forEach((ingredient) => {
    const option = document.createElement("option");
    option.value = ingredient.ingredient_name;
    ingredientOptions.appendChild(option);
    ingredientLookup.set(ingredient.ingredient_name.toLowerCase(), String(ingredient.ingredientID));
  });
}

function renderSelectedIngredients() {
  if (!selectedIngredients.length) {
    selectedIngredientsEl.innerHTML = "";
    return;
  }

  selectedIngredientsEl.innerHTML = selectedIngredients
    .map(
      (ingredient) => `
        <button type="button" class="pill ingredient-chip" onclick="removeFilterIngredient('${ingredient.id}')">
          ${ingredient.name} x
        </button>
      `,
    )
    .join("");
}

function addFilterIngredient() {
  const ingredientName = ingredientInput.value.trim();
  const ingredientID = ingredientLookup.get(ingredientName.toLowerCase());

  if (!ingredientName) {
    return;
  }

  if (!ingredientID) {
    messageEl.textContent = "Choose an ingredient from the list before adding it.";
    messageEl.className = "message error";
    return;
  }

  if (selectedIngredients.some((ingredient) => ingredient.id === ingredientID)) {
    ingredientInput.value = "";
    return;
  }

  messageEl.textContent = "";
  selectedIngredients.push({ id: ingredientID, name: ingredientName });
  ingredientInput.value = "";
  renderSelectedIngredients();
}

function removeFilterIngredient(ingredientID) {
  selectedIngredients = selectedIngredients.filter((ingredient) => ingredient.id !== ingredientID);
  renderSelectedIngredients();
}

function buildQuery() {
  const params = new URLSearchParams();
  const maxTime = document.getElementById("filterTime").value;
  const difficulty = document.getElementById("filterDifficulty").value;
  const categoryID = document.getElementById("filterCategory").value;
  const ingredientIDs = selectedIngredients.map((ingredient) => ingredient.id);

  if (maxTime) params.append("max_cooking_time", maxTime);
  if (difficulty) params.append("difficulty", difficulty);
  if (categoryID) params.append("category_id", categoryID);
  if (ingredientIDs.length) params.append("ingredient_ids", ingredientIDs.join(","));

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
document.getElementById("addFilterIngredient").addEventListener("click", addFilterIngredient);
ingredientInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addFilterIngredient();
  }
});
document.getElementById("clearFilters").addEventListener("click", () => {
  document.getElementById("filterTime").value = "";
  document.getElementById("filterDifficulty").value = "";
  document.getElementById("filterCategory").value = "";
  ingredientInput.value = "";
  selectedIngredients = [];
  renderSelectedIngredients();
  loadRecipes();
});

window.removeFilterIngredient = removeFilterIngredient;

(async function init() {
  await loadCategories();
  await loadIngredients();
  await loadRecipes();
})();
