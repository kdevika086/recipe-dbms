from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    category_name: str = Field(min_length=2, max_length=50)


class CategoryOut(CategoryCreate):
    categoryID: int

    class Config:
        from_attributes = True
