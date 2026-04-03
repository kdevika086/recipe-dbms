from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.db import get_db
from dependencies import require_admin
from models.ingredient import Ingredient
from models.recipe import RecipeIngredient
from schemas.ingredient import IngredientCreate, IngredientOut

router = APIRouter()


@router.get("", response_model=list[IngredientOut])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(Ingredient).order_by(Ingredient.ingredient_name).all()


@router.post("", response_model=IngredientOut, status_code=status.HTTP_201_CREATED)
def create_ingredient(
    payload: IngredientCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    existing = db.query(Ingredient).filter(Ingredient.ingredient_name == payload.ingredient_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Ingredient already exists")

    ingredient = Ingredient(ingredient_name=payload.ingredient_name)
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.put("/{ingredient_id}", response_model=IngredientOut)
def update_ingredient(
    ingredient_id: int,
    payload: IngredientCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredientID == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    ingredient.ingredient_name = payload.ingredient_name
    db.commit()
    db.refresh(ingredient)
    return ingredient


@router.delete("/{ingredient_id}")
def delete_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    ingredient = db.query(Ingredient).filter(Ingredient.ingredientID == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    used = db.query(RecipeIngredient).filter(RecipeIngredient.ingredientID == ingredient_id).first()
    if used:
        raise HTTPException(status_code=400, detail="Ingredient is used in recipe(s)")

    db.delete(ingredient)
    db.commit()
    return {"message": "Ingredient deleted"}
