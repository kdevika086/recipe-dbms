from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from database.db import Base


class Category(Base):
    __tablename__ = "categories"

    categoryID = Column(Integer, primary_key=True, index=True)
    category_name = Column(String(50), nullable=False, unique=True)

    recipes = relationship("Recipe", back_populates="category")
