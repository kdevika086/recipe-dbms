from datetime import date

from sqlalchemy import Column, Date, Integer, String
from sqlalchemy.orm import relationship

from database.db import Base


class User(Base):
    __tablename__ = "users"

    userID = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), nullable=False, unique=True)
    email = Column(String(100), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="regular_user")
    date_joined = Column(Date, nullable=False, default=date.today)

    recipes = relationship("Recipe", back_populates="owner", cascade="all,delete")
    favourites = relationship("Favourite", back_populates="user", cascade="all,delete")
