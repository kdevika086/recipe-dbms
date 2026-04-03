from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database.db import Base


class Ingredient(Base):
    __tablename__ = "ingredients"

    ingredientID = Column(Integer, primary_key=True, index=True)
    ingredient_name = Column(String(100), nullable=False, unique=True)

    recipe_links = relationship("RecipeIngredient", back_populates="ingredient")
