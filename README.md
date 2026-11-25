# Pulse — Task Management & Productivity API

Pulse is a portfolio-grade REST API built with **Python, FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Alembic, JWT, Docker and Pytest**. It demonstrates authentication, user-owned resources, relational data modeling, validation, filtering, pagination, migrations, automated tests and containerized development.

## Features

- User registration and login with bcrypt password hashing
- Signed JWT bearer access tokens
- Authenticated, user-scoped task CRUD (users cannot access another user's tasks)
- Task status (`pending`, `in_progress`, `completed`) and priority (`low`, `medium`, `high`)
- Due dates, text search, filters, sorting by newest first and pagination
- PostgreSQL, SQLAlchemy 2.x models and Alembic migration
- Swagger / OpenAPI docs, health endpoints, Docker Compose and Pytest suite

## Architecture

```text
app/
  api/v1/endpoints/   # HTTP routes
  core/               # settings, database, security, error handlers
  models/             # SQLAlchemy entities
  schemas/            # Pydantic request/response contracts
migrations/            # versioned database schema
tests/                 # API integration tests
```

## Run locally with Docker

1. Copy environment template: `cp .env.example .env`
2. Replace `SECRET_KEY` with a long random value before using outside local development.
3. Start services: `docker compose up --build`
4. Open Swagger: http://localhost:8000/docs
5. Health check: http://localhost:8000/api/v1/health

The API container applies Alembic migrations before starting Uvicorn.

## Run without Docker

Requires Python 3.12+ and PostgreSQL 16+.

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# macOS/Linux:
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Ensure PostgreSQL is running and DATABASE_URL in .env is correct.
alembic upgrade head
uvicorn app.main:app --reload
```

## API overview

All routes are prefixed with `/api/v1`.

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| POST | `/auth/register` | No | Create an account |
| POST | `/auth/login` | No | Obtain a JWT |
| GET | `/health` | No | Check API and database |
| POST | `/tasks` | Yes | Create a task |
| GET | `/tasks` | Yes | List, filter and paginate tasks |
| GET | `/tasks/{task_id}` | Yes | Read an owned task |
| PATCH | `/tasks/{task_id}` | Yes | Partially update an owned task |
| DELETE | `/tasks/{task_id}` | Yes | Delete an owned task |

### Example requests

Register:
```json
{
  "email": "developer@example.com",
  "full_name": "Demo Developer",
  "password": "StrongPass123"
}
```

Create task (send `Authorization: Bearer <token>`):
```json
{
  "title": "Prepare backend interview",
  "description": "Revise FastAPI and SQLAlchemy",
  "status": "pending",
  "priority": "high",
  "due_date": "2026-12-01"
}
```

Filter and paginate:
`GET /api/v1/tasks?status=pending&priority=high&search=interview&page=1&page_size=10`

## Run tests

```bash
pytest -q
```

Tests cover registration/login, authentication enforcement, task creation, user data isolation, filtering and pagination. Tests use an isolated in-memory SQLite database; the application runtime uses PostgreSQL.

## Security and production checklist

- Set a unique, high-entropy `SECRET_KEY` through the deployment environment.
- Use HTTPS and restrict `CORS_ORIGINS` to the real frontend origin.
- Use a managed PostgreSQL database, backups and least-privilege credentials.
- Add rate limiting, refresh-token rotation/revocation, email verification and password reset before public production launch.
- Configure structured logs, monitoring, migrations as a controlled release step and secret management.
- Run dependency/security scanning and expand tests for edge cases before deployment.

This repository is a strong, runnable portfolio foundation—not a claim of a security audit or a production deployment. Validate it in your environment and be prepared to explain every design choice in interviews.

## Resume-ready description

**Pulse — Task Management & Productivity API**  
Technologies: Python, FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Alembic, JWT, Docker, Pytest

- Built a RESTful task management API with secure JWT authentication and bcrypt password hashing.
- Designed relational user-task models and implemented user-scoped CRUD operations to enforce resource ownership.
- Added validation, filtering, text search and pagination using FastAPI, Pydantic and SQLAlchemy.
- Managed schema evolution with Alembic and containerized the API and PostgreSQL using Docker Compose.
- Wrote integration tests for authentication, authorization, task workflows and API filtering.

Only list features you have personally run, tested and can confidently explain.


## React frontend (Pulse Workspace)

The `frontend/` directory contains the React + Vite dashboard connected to the API routes above.

### Run the backend
From the project root, activate your Python environment, install `requirements.txt`, configure `.env`, ensure PostgreSQL is running, run migrations, then start:

```powershell
python -m uvicorn app.main:app --reload
```

### Run the frontend
Open a **second terminal**:

```powershell
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open http://localhost:5173. The frontend calls `http://127.0.0.1:8000/api/v1` by default. Change `VITE_API_URL` in `frontend/.env` if your API uses a different address.

Frontend features: registration/login, JWT bearer-token storage, task creation/edit/deletion, completion toggle, status and priority filters, text search, task statistics, upcoming deadlines and responsive layout.

Note: the API currently returns a JWT from login but has no `/auth/me` profile endpoint. The UI uses the name entered at registration (or the email prefix after login) as the local display name. The dashboard statistics are calculated from the currently loaded task page (up to 100 tasks), matching the API's maximum page size.
