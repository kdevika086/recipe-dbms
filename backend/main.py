from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.db import Base, SessionLocal, engine
from models import category, ingredient, recipe, user  # noqa: F401
from routers import auth, categories, favourites, ingredients, recipes
from sample_data import seed_sample_data

app = FastAPI(title="Recipe Management System API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    # Create schema and seed baseline data once when the API boots.
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_sample_data(db)
    finally:
        db.close()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Recipe Management API is running"}


app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(categories.router, prefix="/api/categories", tags=["Categories"])
app.include_router(ingredients.router, prefix="/api/ingredients", tags=["Ingredients"])
app.include_router(recipes.router, prefix="/api/recipes", tags=["Recipes"])
app.include_router(favourites.router, prefix="/api/favourites", tags=["Favourites"])
