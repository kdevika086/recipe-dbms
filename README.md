# Recipe Management System (FastAPI + PostgreSQL + Vanilla JS)

A full-stack Recipe Management System with JWT authentication, role-based access control, and a responsive frontend built with HTML/CSS/JavaScript.
Link: https://recipedatabase.netlify.app/
## Features

- JWT-based authentication (register, login, current user)
- Password hashing with bcrypt (`passlib`)
- Role-based access control (`admin`, `regular_user`)
- Recipe CRUD (admin only for create/update/delete)
- Recipe browsing and detailed view (all logged-in users)
- Search/filter by:
  - max cooking time
  - difficulty
  - category
  - ingredients (by IDs)
- Category management (admin)
- Ingredient management (admin)
- Ordered recipe steps
- Favourites (add/remove/list for user)
- Sample seed data on first startup

## Project Structure

```text
recipe/
├── backend/
│   ├── database/
│   │   ├── __init__.py
│   │   └── db.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── category.py
│   │   ├── ingredient.py
│   │   ├── recipe.py
│   │   └── user.py
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── categories.py
│   │   ├── favourites.py
│   │   ├── ingredients.py
│   │   └── recipes.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── category.py
│   │   ├── ingredient.py
│   │   └── recipe.py
│   ├── dependencies.py
│   ├── main.py
│   ├── requirements.txt
│   ├── sample_data.py
│   └── security.py
├── frontend/
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── admin.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── dashboard.js
│   │   ├── favourites.js
│   │   ├── index.js
│   │   ├── recipe.js
│   │   └── register.js
│   ├── admin.html
│   ├── dashboard.html
│   ├── favourites.html
│   ├── index.html
│   ├── recipe.html
│   └── register.html
├── .env.example
├── docker-compose.yml
└── README.md
```

## Database Tables

Implemented as requested:

- `Users(userID, username, email, password, role, date_joined)`
- `Recipes(recipeID, title, description, cooking_time, difficulty, categoryID, userID)`
- `Categories(categoryID, category_name)`
- `Ingredients(ingredientID, ingredient_name)`
- `Recipe_Steps(recipeID, step_no, instruction)`
- `Recipe_Ingredients(recipeID, ingredientID, quantity, unit)`
- `Favourites(userID, recipeID)`

## Run Instructions

## 1. Start PostgreSQL

Option A: Docker (recommended)

```bash
docker compose up -d
```

Option B: Use your local PostgreSQL and create database `recipe_db`.

## 2. Backend Setup (FastAPI)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Set environment variables:

```bash
export DATABASE_URL="postgresql+psycopg2://postgres:postgres@localhost:5432/recipe_db"
export SECRET_KEY="your_secure_secret_here"
export ACCESS_TOKEN_EXPIRE_MINUTES="120"
```

Run backend:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend URL: `http://127.0.0.1:8000`

## 3. Frontend Setup (Vanilla HTML/CSS/JS)

Use a static server from `frontend` folder:

```bash
python3 -m http.server 5500
```

Frontend URL: `http://127.0.0.1:5500`

## Default Seeded Users

The app auto-seeds sample data once (first startup only).

- Admin
  - username: `admin`
  - password: `Admin@123`
- Regular user
  - username: `johndoe`
  - password: `User@123`

## Role-Based UI/Access

- Regular users:
  - Can browse/view recipes
  - Can add/remove favourites
  - Cannot see admin dashboard link
  - Cannot create/edit/delete recipes/categories/ingredients
- Admin users:
  - Can access Admin Dashboard
  - Can create/edit/delete recipes
  - Can manage categories and ingredients

Important: Unauthorized actions are blocked in both frontend UI and backend API.

## API Overview

- Auth
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
- Categories
  - `GET /api/categories`
  - `POST /api/categories` (admin)
  - `PUT /api/categories/{id}` (admin)
  - `DELETE /api/categories/{id}` (admin)
- Ingredients
  - `GET /api/ingredients`
  - `POST /api/ingredients` (admin)
  - `PUT /api/ingredients/{id}` (admin)
  - `DELETE /api/ingredients/{id}` (admin)
- Recipes
  - `GET /api/recipes`
  - `GET /api/recipes/{id}`
  - `POST /api/recipes` (admin)
  - `PUT /api/recipes/{id}` (admin)
  - `DELETE /api/recipes/{id}` (admin)
- Favourites
  - `GET /api/favourites`
  - `POST /api/favourites/{recipe_id}`
  - `DELETE /api/favourites/{recipe_id}`

## Notes

- Frontend API base URL is configured in `frontend/js/config.js`.
- If backend runs on a different host/port, update `API_BASE_URL`.
