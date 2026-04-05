requireAdmin();
bindTopbar();

const recipeForm = document.getElementById("recipeForm");
const recipeMessage = document.getElementById("recipeMessage");
const categoryMessage = document.getElementById("categoryMessage");
const ingredientMessage = document.getElementById("ingredientMessage");
const ingredientRows = document.getElementById("ingredientRows");
const stepRows = document.getElementById("stepRows");

let categories = [];
let ingredients = [];

function showMessage(el, text, type = "error") {
  el.textContent = text;
  el.className = `message ${type}`;
}

function ingredientOptions(selectedId = "") {
  const placeholder = `<option value="">Select ingredient</option>`;
  const options = ingredients
    .map(
      (ingredient) => `
        <option value="${ingredient.ingredientID}" ${String(selectedId) === String(ingredient.ingredientID) ? "selected" : ""}>
          ${ingredient.ingredient_name}
        </option>
      `,
    )
    .join("");

  return placeholder + options;
}

function createIngredientRow(data = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "editor-row ingredient-row";
  const quantityValue = data.quantity !== undefined && data.quantity !== null ? data.quantity : "";
  const unitValue = data.unit !== undefined && data.unit !== null ? data.unit : "";
  wrapper.innerHTML = `
    <div>
      <label>Ingredient</label>
      <select class="ingredient-select" required>
        ${ingredientOptions(data.ingredientID)}
      </select>
    </div>
    <div>
      <label>Quantity</label>
      <input class="ingredient-quantity" type="number" min="0.01" step="0.01" required value="${quantityValue}" />
    </div>
    <div>
      <label>Unit</label>
      <input class="ingredient-unit" maxlength="20" placeholder="pcs, g, tbsp" required value="${unitValue}" />
    </div>
    <button type="button" class="danger remove-ingredient">Remove</button>
  `;

  wrapper.querySelector(".remove-ingredient").addEventListener("click", () => {
    wrapper.remove();
    if (!ingredientRows.children.length) {
      createIngredientRow();
    }
  });

  ingredientRows.appendChild(wrapper);
}

function renumberStepRows() {
  Array.from(stepRows.children).forEach((row, index) => {
    row.querySelector(".step-badge").textContent = index + 1;
  });
}

function createStepRow(data = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = "editor-row step-row";
  const instructionValue = data.instruction !== undefined && data.instruction !== null ? data.instruction : "";
  wrapper.innerHTML = `
    <div class="step-badge"></div>
    <div>
      <label>Instruction</label>
      <textarea class="step-instruction" required placeholder="Describe this cooking step">${instructionValue}</textarea>
    </div>
    <button type="button" class="danger remove-step">Remove</button>
  `;

  wrapper.querySelector(".remove-step").addEventListener("click", () => {
    wrapper.remove();
    if (!stepRows.children.length) {
      createStepRow();
    }
    renumberStepRows();
  });

  stepRows.appendChild(wrapper);
  renumberStepRows();
}

function refreshIngredientSelects() {
  document.querySelectorAll(".ingredient-select").forEach((select) => {
    const currentValue = select.value;
    select.innerHTML = ingredientOptions(currentValue);
    select.value = currentValue;
  });
}

function collectIngredients() {
  const rows = Array.from(document.querySelectorAll("#ingredientRows .ingredient-row"));
  const payload = rows.map((row) => ({
    ingredientID: Number(row.querySelector(".ingredient-select").value),
    quantity: Number(row.querySelector(".ingredient-quantity").value),
    unit: row.querySelector(".ingredient-unit").value.trim(),
  }));

  if (!payload.length) {
    throw new Error("Add at least one ingredient");
  }

  payload.forEach((item, index) => {
    if (!item.ingredientID) {
      throw new Error(`Select an ingredient for row ${index + 1}`);
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new Error(`Enter a valid quantity for ingredient row ${index + 1}`);
    }
    if (!item.unit) {
      throw new Error(`Enter a unit for ingredient row ${index + 1}`);
    }
  });

  return payload;
}

function collectSteps() {
  const rows = Array.from(document.querySelectorAll("#stepRows .step-row"));
  const payload = rows.map((row, index) => ({
    step_no: index + 1,
    instruction: row.querySelector(".step-instruction").value.trim(),
  }));

  if (!payload.length) {
    throw new Error("Add at least one step");
  }

  payload.forEach((item, index) => {
    if (!item.instruction) {
      throw new Error(`Enter an instruction for step ${index + 1}`);
    }
  });

  return payload;
}

function fillRecipeForm(recipe) {
  document.getElementById("recipeID").value = recipe.recipeID;
  document.getElementById("title").value = recipe.title;
  document.getElementById("description").value = recipe.description;
  document.getElementById("cooking_time").value = recipe.cooking_time;
  document.getElementById("difficulty").value = recipe.difficulty;
  document.getElementById("categoryID").value = recipe.categoryID;

  ingredientRows.innerHTML = "";
  recipe.ingredients.forEach((ingredient) => {
    createIngredientRow({
      ingredientID: ingredient.ingredientID,
      quantity: ingredient.quantity,
      unit: ingredient.unit,
    });
  });
  if (!recipe.ingredients.length) {
    createIngredientRow();
  }

  stepRows.innerHTML = "";
  recipe.steps.forEach((step) => {
    createStepRow({ instruction: step.instruction });
  });
  if (!recipe.steps.length) {
    createStepRow();
  }

  recipeMessage.textContent = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetRecipeEditor() {
  recipeForm.reset();
  document.getElementById("recipeID").value = "";
  recipeMessage.textContent = "";
  ingredientRows.innerHTML = "";
  stepRows.innerHTML = "";
  createIngredientRow();
  createStepRow();
}

function addIngredientInputRow() {
  createIngredientRow();
}

function addStepInputRow() {
  createStepRow();
}

async function loadCategories() {
  categories = await apiFetch("/categories");

  const categorySelect = document.getElementById("categoryID");
  categorySelect.innerHTML = categories
    .map((cat) => `<option value="${cat.categoryID}">${cat.category_name}</option>`)
    .join("");
}

function renderCategoriesList() {
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
  refreshIngredientSelects();

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
  const recipe = await apiFetch(`/recipes/${recipeID}`);
  fillRecipeForm(recipe);
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
    renderCategoriesList();
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
    renderCategoriesList();
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
    const payload = {
      title: document.getElementById("title").value.trim(),
      description: document.getElementById("description").value.trim(),
      cooking_time: Number(document.getElementById("cooking_time").value),
      difficulty: document.getElementById("difficulty").value,
      categoryID: Number(document.getElementById("categoryID").value),
      ingredients: collectIngredients(),
      steps: collectSteps(),
    };

    const recipeID = document.getElementById("recipeID").value;
    const url = recipeID ? `/recipes/${recipeID}` : "/recipes";
    const method = recipeID ? "PUT" : "POST";

    await apiFetch(url, {
      method,
      body: JSON.stringify(payload),
    });

    showMessage(recipeMessage, recipeID ? "Recipe updated" : "Recipe created", "success");
    resetRecipeEditor();
    await loadRecipes();
  } catch (error) {
    showMessage(recipeMessage, error.message, "error");
  }
});

document.getElementById("resetRecipeForm").addEventListener("click", resetRecipeEditor);
document.getElementById("addIngredientRow").addEventListener("click", addIngredientInputRow);
document.getElementById("addStepRow").addEventListener("click", addStepInputRow);

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
    renderCategoriesList();
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
window.addIngredientInputRow = addIngredientInputRow;
window.addStepInputRow = addStepInputRow;

(async function init() {
  await loadCategories();
  renderCategoriesList();
  await loadIngredients();
  await loadRecipes();
  resetRecipeEditor();
})();
