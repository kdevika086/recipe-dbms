from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.db import get_db
from dependencies import require_admin
from models.category import Category
from models.recipe import Recipe
from schemas.category import CategoryCreate, CategoryOut

router = APIRouter()


@router.get("", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.query(Category).order_by(Category.category_name).all()


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    existing = db.query(Category).filter(Category.category_name == payload.category_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Category already exists")

    category = Category(category_name=payload.category_name)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: int,
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    category = db.query(Category).filter(Category.categoryID == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    category.category_name = payload.category_name
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}")
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(require_admin),
):
    category = db.query(Category).filter(Category.categoryID == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    recipes_exist = db.query(Recipe).filter(Recipe.categoryID == category_id).first()
    if recipes_exist:
        raise HTTPException(status_code=400, detail="Category is used by existing recipes")

    db.delete(category)
    db.commit()
    return {"message": "Category deleted"}
