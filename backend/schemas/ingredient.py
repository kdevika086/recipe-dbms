from pydantic import BaseModel, Field


class IngredientCreate(BaseModel):
    ingredient_name: str = Field(min_length=2, max_length=100)


class IngredientOut(IngredientCreate):
    ingredientID: int

    class Config:
        from_attributes = True
