from pydantic import BaseModel, Field, field_validator


class RecipeStepInput(BaseModel):
    step_no: int = Field(gt=0)
    instruction: str = Field(min_length=1)


class RecipeIngredientInput(BaseModel):
    ingredientID: int
    quantity: float = Field(gt=0)
    unit: str = Field(min_length=1, max_length=20)


class RecipeCreate(BaseModel):
    title: str = Field(min_length=2, max_length=100)
    description: str = Field(min_length=5)
    cooking_time: int = Field(gt=0)
    difficulty: str
    categoryID: int
    ingredients: list[RecipeIngredientInput]
    steps: list[RecipeStepInput]

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str) -> str:
        allowed = {"Easy", "Medium", "Hard"}
        if value not in allowed:
            raise ValueError("Difficulty must be Easy, Medium, or Hard")
        return value


class RecipeUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, min_length=5)
    cooking_time: int | None = Field(default=None, gt=0)
    difficulty: str | None = None
    categoryID: int | None = None
    ingredients: list[RecipeIngredientInput] | None = None
    steps: list[RecipeStepInput] | None = None

    @field_validator("difficulty")
    @classmethod
    def validate_difficulty(cls, value: str | None) -> str | None:
        if value is None:
            return value
        allowed = {"Easy", "Medium", "Hard"}
        if value not in allowed:
            raise ValueError("Difficulty must be Easy, Medium, or Hard")
        return value


class RecipeSummaryOut(BaseModel):
    recipeID: int
    title: str
    description: str
    cooking_time: int
    difficulty: str
    categoryID: int
    category_name: str


class RecipeIngredientOut(BaseModel):
    ingredientID: int
    ingredient_name: str
    quantity: float
    unit: str


class RecipeStepOut(BaseModel):
    step_no: int
    instruction: str


class RecipeDetailOut(BaseModel):
    recipeID: int
    title: str
    description: str
    cooking_time: int
    difficulty: str
    categoryID: int
    category_name: str
    userID: int
    created_by: str
    ingredients: list[RecipeIngredientOut]
    steps: list[RecipeStepOut]
