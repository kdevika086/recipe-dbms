from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from database.db import get_db
from dependencies import get_current_user
from models.recipe import Favourite, Recipe
from models.user import User

router = APIRouter()


def _summary(recipe: Recipe) -> dict:
    return {
        "recipeID": recipe.recipeID,
        "title": recipe.title,
        "description": recipe.description,
        "cooking_time": recipe.cooking_time,
        "difficulty": recipe.difficulty,
        "categoryID": recipe.categoryID,
        "category_name": recipe.category.category_name if recipe.category else None,
    }


@router.get("")
def list_favourites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(Favourite)
        .options(joinedload(Favourite.recipe).joinedload(Recipe.category))
        .filter(Favourite.userID == current_user.userID)
        .all()
    )
    return [_summary(row.recipe) for row in rows if row.recipe]


@router.post("/{recipe_id}", status_code=status.HTTP_201_CREATED)
def add_favourite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recipe = db.query(Recipe).filter(Recipe.recipeID == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    exists = (
        db.query(Favourite)
        .filter(Favourite.userID == current_user.userID, Favourite.recipeID == recipe_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="Recipe already in favourites")

    fav = Favourite(userID=current_user.userID, recipeID=recipe_id)
    db.add(fav)
    db.commit()
    return {"message": "Added to favourites"}


@router.delete("/{recipe_id}")
def remove_favourite(
    recipe_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    fav = (
        db.query(Favourite)
        .filter(Favourite.userID == current_user.userID, Favourite.recipeID == recipe_id)
        .first()
    )
    if not fav:
        raise HTTPException(status_code=404, detail="Favourite record not found")

    db.delete(fav)
    db.commit()
    return {"message": "Removed from favourites"}
