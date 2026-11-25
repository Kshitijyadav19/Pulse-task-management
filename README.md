# Pulse — Task Management & Productivity API

Pulse is a portfolio-grade task management platform built with **Python, FastAPI, PostgreSQL, SQLAlchemy, Pydantic, Alembic, JWT, Docker, Pytest, React and Vite**.

It demonstrates backend API development, authentication, user-owned resources, relational database design, validation, filtering, pagination, database migrations, automated testing and a React frontend.

## Features

- User registration and login with bcrypt password hashing
- JWT bearer-token authentication
- Authenticated, user-scoped task CRUD operations
- User data isolation: users cannot access another user's tasks
- Task statuses: `pending`, `in_progress`, `completed`
- Task priorities: `low`, `medium`, `high`
- Task descriptions and due dates
- Text search, filtering, sorting and pagination
- PostgreSQL database with SQLAlchemy 2.x
- Database schema migrations using Alembic
- Swagger / OpenAPI documentation
- Health-check endpoint
- React + Vite frontend dashboard
- Pytest integration test suite
- Dockerfile and Docker Compose configuration

## Tech Stack

| Category | Technologies |
|---|---|
| Backend | Python, FastAPI |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Validation | Pydantic |
| Authentication | JWT, bcrypt |
| Migrations | Alembic |
| Frontend | React, Vite, JavaScript |
| Testing | Pytest |
| Containerization | Docker, Docker Compose |

## Project Structure

```text
pulse/
├── app/
│   ├── api/
│   │   └── v1/
│   │       └── endpoints/
│   ├── core/
│   ├── models/
│   ├── schemas/
│   └── main.py
├── migrations/
│   └── versions/
├── tests/
├── frontend/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
├── .env.example
├── alembic.ini
├── Dockerfile
├── docker-compose.yml
├── requirements.txt
└── README.md
```

## Run Locally Without Docker

### Requirements

- Python 3.12+
- PostgreSQL 16+
- Node.js and npm (for the frontend)

### 1. Clone the repository

```cmd
git clone https://github.com/Kshitijyadav