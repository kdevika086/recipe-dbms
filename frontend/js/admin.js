requireAdmin();
bindTopbar();

const recipeForm = document.getElementById("recipeForm");
const recipeMessage = document.getElementById("recipeMessage");
const categoryMessage = document.getElementById("categoryMessage");
const ingredientMessage = document.getElementById("ingredientMessage");

let categories = [];
let ingredients = [];

function showMessage(el, text, type = "error") {
  el.textContent = text;
  el.className = `message ${type}`;
}

function parseJsonField(inputId, label) {
  const value = document.getElementById(inputId).value.trim();
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error();
    return parsed;
  } catch {
    throw new Error(`${label} must be a valid JSON array`);
  }
}

async function loadCategories() {
  categories = await apiFetch("/categories");

  const categorySelect = document.getElementById("categoryID");
  categorySelect.innerHTML = categories
    .map((cat) => `<option value="${cat.categoryID}">${cat.category_name}</option>`)
    .join("");

  const list = document.getElementById("categoriesList");
  list.innerHTML = categories
    .map(
      (cat) => `
      <article class="card">
        <strong>${cat.category_name}</strong>
        <div class="actions" style="margin-top:8px;">
          <button class="secondary" onclick="renameCategory(${cat.categoryID}, '${cat.category_name.replace(/'/g, "\\'")}')">Rename</button>
          <button class="danger" onclick="deleteCategory(${cat.categoryID})">Delete</button>
        </div>
      </article>
    `,
    )
    .join("");
}

async function loadIngredients() {
  ingredients = await apiFetch("/ingredients");

  const list = document.getElementById("ingredientsList");
  list.innerHTML = ingredients
    .map(
      (ing) => `
      <article class="card">
        <strong>${ing.ingredient_name}</strong>
        <div class="actions" style="margin-top:8px;">
          <button class="secondary" onclick="renameIngredient(${ing.ingredientID}, '${ing.ingredient_name.replace(/'/g, "\\'")}')">Rename</button>
          <button class="danger" onclick="deleteIngredient(${ing.ingredientID})">Delete</button>
        </div>
      </article>
    `,
    )
    .join("");
}

async function loadRecipes() {
  const recipes = await apiFetch("/recipes");
  const list = document.getElementById("adminRecipesList");

  list.innerHTML = recipes
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
          <button onclick="editRecipe(${recipe.recipeID})">Edit</button>
          <button class="danger" onclick="deleteRecipe(${recipe.recipeID})">Delete</button>
        </div>
      </article>
    `,
    )
    .join("");
}

async function editRecipe(recipeID) {
  // Prefill form so admins can edit an existing recipe and resubmit.
  const recipe = await apiFetch(`/recipes/${recipeID}`);
  document.getElementById("recipeID").value = recipe.recipeID;
  document.getElementById("title").value = recipe.title;
  document.getElementById("description").value = recipe.description;
  document.getElementById("cooking_time").value = recipe.cooking_time;
  document.getElementById("difficulty").value = recipe.difficulty;
  document.getElementById("categoryID").value = recipe.categoryID;
  document.getElementById("ingredientsJson").value = JSON.stringify(
    recipe.ingredients.map((i) => ({
      ingredientID: i.ingredientID,
      quantity: i.quantity,
      unit: i.unit,
    })),
    null,
    2,
  );
  document.getElementById("stepsJson").value = JSON.stringify(recipe.steps, null, 2);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteRecipe(recipeID) {
  if (!confirm("Delete this recipe?")) return;
  try {
    await apiFetch(`/recipes/${recipeID}`, { method: "DELETE" });
    await loadRecipes();
    showMessage(recipeMessage, "Recipe deleted", "success");
  } catch (error) {
    showMessage(recipeMessage, error.message, "error");
  }
}

async function deleteCategory(categoryID) {
  if (!confirm("Delete this category?")) return;
  try {
    await apiFetch(`/categories/${categoryID}`, { method: "DELETE" });
    await loadCategories();
    showMessage(categoryMessage, "Category deleted", "success");
  } catch (error) {
    showMessage(categoryMessage, error.message, "error");
  }
}

async function renameCategory(categoryID, currentName) {
  const category_name = prompt("New category name:", currentName);
  if (!category_name || !category_name.trim()) return;
  try {
    await apiFetch(`/categories/${categoryID}`, {
      method: "PUT",
      body: JSON.stringify({ category_name: category_name.trim() }),
    });
    await loadCategories();
    showMessage(categoryMessage, "Category updated", "success");
  } catch (error) {
    showMessage(categoryMessage, error.message, "error");
  }
}

async function deleteIngredient(ingredientID) {
  if (!confirm("Delete this ingredient?")) return;
  try {
    await apiFetch(`/ingredients/${ingredientID}`, { method: "DELETE" });
    await loadIngredients();
    showMessage(ingredientMessage, "Ingredient deleted", "success");
  } catch (error) {
    showMessage(ingredientMessage, error.message, "error");
  }
}

async function renameIngredient(ingredientID, currentName) {
  const ingredient_name = prompt("New ingredient name:", currentName);
  if (!ingredient_name || !ingredient_name.trim()) return;
  try {
    await apiFetch(`/ingredients/${ingredientID}`, {
      method: "PUT",
      body: JSON.stringify({ ingredient_name: ingredient_name.trim() }),
    });
    await loadIngredients();
    showMessage(ingredientMessage, "Ingredient updated", "success");
  } catch (error) {
    showMessage(ingredientMessage, error.message, "error");
  }
}

recipeForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    // Ingredients/steps are entered as JSON arrays in this admin form.
    const payload = {
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      cooking_time: Number(document.getElementById("cooking_time").value),
      difficulty: document.getElementById("difficulty").value,
      categoryID: Number(document.getElementById("categoryID").value),
      ingredients: parseJsonField("ingredientsJson", "Ingredients"),
      steps: parseJsonField("stepsJson", "Steps"),
    };

    const recipeID = document.getElementById("recipeID").value;
    const url = recipeID ? `/recipes/${recipeID}` : "/recipes";
    const method = recipeID ? "PUT" : "POST";

    await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    showMessage(recipeMessage, recipeID ? "Recipe updated" : "Recipe created", "success");
    recipeForm.reset();
    document.getElementById("recipeID").value = "";
    await loadRecipes();
  } catch (error) {
    showMessage(recipeMessage, error.message, "error");
  }
});

document.getElementById("resetRecipeForm").addEventListener("click", () => {
  recipeForm.reset();
  document.getElementById("recipeID").value = "";
  recipeMessage.textContent = "";
});

document.getElementById("addCategoryBtn").addEventListener("click", async () => {
  const category_name = document.getElementById("newCategoryName").value.trim();
  if (!category_name) return;
  try {
    await apiFetch("/categories", {
      method: "POST",
      body: JSON.stringify({ category_name }),
    });
    document.getElementById("newCategoryName").value = "";
    await loadCategories();
    showMessage(categoryMessage, "Category added", "success");
  } catch (error) {
    showMessage(categoryMessage, error.message, "error");
  }
});

document.getElementById("addIngredientBtn").addEventListener("click", async () => {
  const ingredient_name = document.getElementById("newIngredientName").value.trim();
  if (!ingredient_name) return;
  try {
    await apiFetch("/ingredients", {
      method: "POST",
      body: JSON.stringify({ ingredient_name }),
    });
    document.getElementById("newIngredientName").value = "";
    await loadIngredients();
    showMessage(ingredientMessage, "Ingredient added", "success");
  } catch (error) {
    showMessage(ingredientMessage, error.message, "error");
  }
});

window.editRecipe = editRecipe;
window.deleteRecipe = deleteRecipe;
window.deleteCategory = deleteCategory;
window.deleteIngredient = deleteIngredient;
window.renameCategory = renameCategory;
window.renameIngredient = renameIngredient;

(async function init() {
  await loadCategories();
  await loadIngredients();
  await loadRecipes();
})();
