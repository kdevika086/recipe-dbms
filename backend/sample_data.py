from sqlalchemy.orm import Session

from models.category import Category
from models.ingredient import Ingredient
from models.recipe import Recipe, RecipeIngredient, RecipeStep
from models.user import User
from security import hash_password


def seed_sample_data(db: Session) -> None:
    # Seed only if the users table is empty.
    if db.query(User).first():
        return

    admin = User(
        username="admin",
        email="admin@recipes.com",
        password=hash_password("Admin@123"),
        role="admin",
    )
    user = User(
        username="johndoe",
        email="john@example.com",
        password=hash_password("User@123"),
        role="regular_user",
    )
    db.add_all([admin, user])
    db.flush()

    categories = [
        Category(category_name="Breakfast"),
        Category(category_name="Lunch"),
        Category(category_name="Dinner"),
        Category(category_name="Dessert"),
    ]
    db.add_all(categories)
    db.flush()

    ingredients = [
        Ingredient(ingredient_name="Egg"),
        Ingredient(ingredient_name="Milk"),
        Ingredient(ingredient_name="Flour"),
        Ingredient(ingredient_name="Salt"),
        Ingredient(ingredient_name="Tomato"),
        Ingredient(ingredient_name="Onion"),
        Ingredient(ingredient_name="Olive Oil"),
    ]
    db.add_all(ingredients)
    db.flush()

    pancake = Recipe(
        title="Classic Pancake",
        description="Quick fluffy pancakes for breakfast.",
        cooking_time=20,
        difficulty="Easy",
        categoryID=categories[0].categoryID,
        userID=admin.userID,
    )
    db.add(pancake)
    db.flush()

    db.add_all(
        [
            RecipeIngredient(
                recipeID=pancake.recipeID,
                ingredientID=ingredients[0].ingredientID,
                quantity=2,
                unit="pcs",
            ),
            RecipeIngredient(
                recipeID=pancake.recipeID,
                ingredientID=ingredients[1].ingredientID,
                quantity=1,
                unit="cup",
            ),
            RecipeIngredient(
                recipeID=pancake.recipeID,
                ingredientID=ingredients[2].ingredientID,
                quantity=1.5,
                unit="cup",
            ),
        ]
    )

    db.add_all(
        [
            RecipeStep(recipeID=pancake.recipeID, step_no=1, instruction="Mix dry ingredients."),
            RecipeStep(recipeID=pancake.recipeID, step_no=2, instruction="Whisk in milk and eggs."),
            RecipeStep(recipeID=pancake.recipeID, step_no=3, instruction="Cook on a hot greased pan."),
        ]
    )

    salad = Recipe(
        title="Tomato Onion Salad",
        description="Fresh and simple side salad.",
        cooking_time=10,
        difficulty="Easy",
        categoryID=categories[1].categoryID,
        userID=admin.userID,
    )
    db.add(salad)
    db.flush()

    db.add_all(
        [
            RecipeIngredient(
                recipeID=salad.recipeID,
                ingredientID=ingredients[4].ingredientID,
                quantity=2,
                unit="pcs",
            ),
            RecipeIngredient(
                recipeID=salad.recipeID,
                ingredientID=ingredients[5].ingredientID,
                quantity=1,
                unit="pcs",
            ),
            RecipeIngredient(
                recipeID=salad.recipeID,
                ingredientID=ingredients[6].ingredientID,
                quantity=1,
                unit="tbsp",
            ),
        ]
    )

    db.add_all(
        [
            RecipeStep(recipeID=salad.recipeID, step_no=1, instruction="Slice tomato and onion."),
            RecipeStep(recipeID=salad.recipeID, step_no=2, instruction="Add olive oil and salt."),
            RecipeStep(recipeID=salad.recipeID, step_no=3, instruction="Toss and serve."),
        ]
    )

    db.commit()
