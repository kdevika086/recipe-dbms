from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from database.db import get_db
from dependencies import require_admin
from models.category import Category
from models.ingredient import Ingredient
from models.recipe import Recipe, RecipeIngredient, RecipeStep
from models.user import User
from schemas.recipe import RecipeCreate, RecipeDetailOut, RecipeSummaryOut, RecipeUpdate

router = APIRouter()


def _to_summary(recipe: Recipe) -> dict:
    return {
        "recipeID": recipe.recipeID,
        "title": recipe.title,
        "description": recipe.description,
        "cooking_time": recipe.cooking_time,
        "difficulty": recipe.difficulty,
        "categoryID": recipe.categoryID,
        "category_name": recipe.category.category_name if recipe.category else "",
    }


def _to_detail(recipe: Recipe) -> dict:
    return {
        "recipeID": recipe.recipeID,
        "title": recipe.title,
        "description": recipe.description,
        "cooking_time": recipe.cooking_time,
        "difficulty": recipe.difficulty,
        "categoryID": recipe.categoryID,
        "category_name": recipe.category.category_name if recipe.category else "",
        "userID": recipe.userID,
        "created_by": recipe.owner.username if recipe.owner else "",
        "ingredients": [
            {
                "ingredientID": ri.ingredientID,
                "ingredient_name": ri.ingredient.ingredient_name if ri.ingredient else "",
                "quantity": ri.quantity,
                "unit": ri.unit,
            }
            for ri in recipe.ingredients
        ],
        "steps": [
            {"step_no": step.step_no, "instruction": step.instruction}
            for step in sorted(recipe.steps, key=lambda s: s.step_no)
        ],
    }


def _validate_category(db: Session, category_id: int):
    if not db.query(Category).filter(Category.categoryID == category_id).first():
        raise HTTPException(status_code=404, detail="Category not found")


def _validate_ingredient_ids(db: Session, ingredient_ids: list[int]):
    found = (
        db.query(Ingredient.ingredientID)
        .filter(Ingredient.ingredientID.in_(ingredient_ids))
        .all()
    )
    found_ids = {row[0] for row in found}
    missing = [iid for iid in ingredient_ids if iid not in found_ids]
    if missing:
        raise HTTPException(status_code=404, detail=f"Invalid ingredient IDs: {missing}")


@router.get("", response_model=list[RecipeSummaryOut])
def list_recipes(
    max_cooking_time: int | None = Query(default=None, gt=0),
    difficulty: str | None = Query(default=None),
    category_id: int | None = Query(default=None),
    ingredient_ids: str | None = Query(
        default=None,
        description="Comma-separated ingredient IDs, e.g. ingredient_ids=1,3",
    ),
    db: Session = Depends(get_db),
):
    query = db.query(Recipe).options(joinedload(Recipe.category))

    if max_cooking_time is not None:
        query = query.filter(Recipe.cooking_time <= max_cooking_time)

    if difficulty:
        query = query.filter(Recipe.difficulty == difficulty)

    if category_id is not None:
        query = query.filter(Recipe.categoryID == category_id)

    recipes = query.order_by(Recipe.recipeID.desc()).all()

    if ingredient_ids:
        requested_ids = {
            int(value.strip())
            for value in ingredient_ids.split(",")
            if value.strip().isdigit()
        }
        recipes = [
            recipe
            for recipe in recipes
            if requested_ids.issubset({ri.ingredientID for ri in recipe.ingredients})
        ]

    return [_to_summary(recipe) for recipe in recipes]


@router.get("/{recipe_id}", response_model=RecipeDetailOut)
def get_recipe(recipe_id: int, db: Session = Depends(get_db)):
    recipe = (
        db.query(Recipe)
        .options(
            joinedload(Recipe.category),
            joinedload(Recipe.owner),
            joinedload(Recipe.ingredients).joinedload(RecipeIngredient.ingredient),
            joinedload(Recipe.steps),
        )
        .filter(Recipe.recipeID == recipe_id)
        .first()
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return _to_detail(recipe)


@router.post("", response_model=RecipeDetailOut, status_code=status.HTTP_201_CREATED)
def create_recipe(
    payload: RecipeCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    _validate_category(db, payload.categoryID)

    ingredient_ids = [item.ingredientID for item in payload.ingredients]
    _validate_ingredient_ids(db, ingredient_ids)

    recipe = Recipe(
        title=payload.title,
        description=payload.description,
        cooking_time=payload.cooking_time,
        difficulty=payload.difficulty,
        categoryID=payload.categoryID,
        userID=admin.userID,
    )
    db.add(recipe)
    db.flush()

    for ingredient in payload.ingredients:
        db.add(
            RecipeIngredient(
                recipeID=recipe.recipeID,
                ingredientID=ingredient.ingredientID,
                quantity=ingredient.quantity,
                unit=ingredient.unit,
            )
        )

    for step in sorted(payload.steps, key=lambda s: s.step_no):
        db.add(
            RecipeStep(
                recipeID=recipe.recipeID,
                step_no=step.step_no,
                instruction=step.instruction,
            )
        )

    db.commit()
    db.refresh(recipe)
    return get_recipe(recipe.recipeID, db)


@router.put("/{recipe_id}", response_model=RecipeDetailOut)
def update_recipe(
    recipe_id: int,
    payload: RecipeUpdate,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    recipe = db.query(Recipe).filter(Recipe.recipeID == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    update_data = payload.model_dump(exclude_unset=True)

    if "categoryID" in update_data:
        _validate_category(db, update_data["categoryID"])

    if "ingredients" in update_data and update_data["ingredients"] is not None:
        ingredient_ids = [item["ingredientID"] for item in update_data["ingredients"]]
        _validate_ingredient_ids(db, ingredient_ids)

    for field in ["title", "description", "cooking_time", "difficulty", "categoryID"]:
        if field in update_data:
            setattr(recipe, field, update_data[field])

    if "ingredients" in update_data and update_data["ingredients"] is not None:
        db.query(RecipeIngredient).filter(RecipeIngredient.recipeID == recipe_id).delete()
        for ingredient in update_data["ingredients"]:
            db.add(
                RecipeIngredient(
                    recipeID=recipe_id,
                    ingredientID=ingredient["ingredientID"],
                    quantity=ingredient["quantity"],
                    unit=ingredient["unit"],
                )
            )

    if "steps" in update_data and update_data["steps"] is not None:
        db.query(RecipeStep).filter(RecipeStep.recipeID == recipe_id).delete()
        for step in sorted(update_data["steps"], key=lambda s: s["step_no"]):
            db.add(
                RecipeStep(
                    recipeID=recipe_id,
                    step_no=step["step_no"],
                    instruction=step["instruction"],
                )
            )

    db.commit()
    return get_recipe(recipe_id, db)


@router.delete("/{recipe_id}")
def delete_recipe(
    recipe_id: int,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    recipe = db.query(Recipe).filter(Recipe.recipeID == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    db.delete(recipe)
    db.commit()
    return {"message": "Recipe deleted"}
