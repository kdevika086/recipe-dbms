from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database.db import Base


class Recipe(Base):
    __tablename__ = "recipes"

    recipeID = Column(Integer, primary_key=True, index=True)
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=False)
    cooking_time = Column(Integer, nullable=False)
    difficulty = Column(String(10), nullable=False)
    categoryID = Column(Integer, ForeignKey("categories.categoryID"), nullable=False)
    userID = Column(Integer, ForeignKey("users.userID"), nullable=False)

    category = relationship("Category", back_populates="recipes")
    owner = relationship("User", back_populates="recipes")
    steps = relationship(
        "RecipeStep", back_populates="recipe", cascade="all, delete-orphan", order_by="RecipeStep.step_no"
    )
    ingredients = relationship(
        "RecipeIngredient", back_populates="recipe", cascade="all, delete-orphan"
    )
    favourited_by = relationship(
        "Favourite", back_populates="recipe", cascade="all, delete-orphan"
    )


class RecipeStep(Base):
    __tablename__ = "recipe_steps"

    recipeID = Column(Integer, ForeignKey("recipes.recipeID"), primary_key=True)
    step_no = Column(Integer, primary_key=True)
    instruction = Column(Text, nullable=False)

    recipe = relationship("Recipe", back_populates="steps")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    recipeID = Column(Integer, ForeignKey("recipes.recipeID"), primary_key=True)
    ingredientID = Column(Integer, ForeignKey("ingredients.ingredientID"), primary_key=True)
    quantity = Column(Float, nullable=False)
    unit = Column(String(20), nullable=False)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_links")


class Favourite(Base):
    __tablename__ = "favourites"

    userID = Column(Integer, ForeignKey("users.userID"), primary_key=True)
    recipeID = Column(Integer, ForeignKey("recipes.recipeID"), primary_key=True)

    user = relationship("User", back_populates="favourites")
    recipe = relationship("Recipe", back_populates="favourited_by")
