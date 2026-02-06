# Assignment 4 – Pre-Defense: Sessions & Security

## Project: Easy ToDo (Tasks)
Course: Web Programming 2

---

## Objective

This project implements an Express.js REST API connected to MongoDB and a Web UI. It supports:

- One main entity: **tasks**
- **CRUD** operations via Web UI
- Correct **HTTP status codes** and server-side validation
- Query options: **filtering**, **sorting**, **projection** (select fields)
- **Sessions-based authentication** with cookies
- **Protected write operations** using middleware

---

## Tech Stack
- Node.js
- Express.js
- MongoDB (official Node.js driver: `mongodb`)
- express-session
- bcrypt

---

## Database
**Database name:** `todo_db`

**Collection name:** `tasks`

The collection is created automatically on the first insert.

### Task document structure
Required fields used in validation:
- `title` (string)

Optional fields:
- `description` (string | null)
- `is_done` (boolean)
- `priority` (number 1-5)
- `due_date` (ISO string)
- `category` (string | null)
- `time_hour` (number 0-23)
- `ownerId` (ObjectId)

MongoDB automatically adds:
- `_id` (ObjectId)

---

## Middleware
- `express.json()` — parses JSON request bodies
- Custom logger middleware — logs: `METHOD URL`
- `express-session` — sessions stored server-side, session ID in cookie `sid`

---

## How to Run
1) Install dependencies

   npm install

2) Set environment variables (create `.env`)

    MONGO_URI="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority"
    SESSION_SECRET="change_me_in_production"
    ADMIN_EMAIL="admin@example.com"
    ADMIN_PASSWORD="ChangeMe123!"

3) Start the server

   node server.js

Server runs on:

    http://localhost:3000

---

## Home Page
`GET /` returns the Web UI (tasks list + CRUD).

---

## API Endpoints
Base path: `/api/tasks`

### 1) GET /api/tasks
Returns all tasks.

**Success**
- `200 OK`

**Response format**
- `{ "count": number, "items": [...] }`

**Possible errors**
- `500 Internal Server Error` — database/server error

---

### 2) GET /api/tasks/:id
Returns a single task by MongoDB ObjectId.

**Validation**
- Invalid ObjectId → `400 Bad Request`

**Not found**
- Task not found → `404 Not Found`

**Success**
- `200 OK`

---

### 3) POST /api/tasks
Creates a new task (auth required).

---

### 4) PUT /api/tasks/:id
Updates an existing task by ObjectId (auth required).

---

### 5) DELETE /api/tasks/:id
Deletes a task by ObjectId (auth required).

---

## Query Options (for GET /api/tasks)
The endpoint supports query parameters:

### 1) Filtering
Filter by:
- `q` (title search)
- `is_done`

### 2) Sorting
Sort by:
- `created_at`
- `title`

### 3) Projection (select fields)
Select returned fields using `fields` (comma-separated).

---

## Status Codes Summary
- `200 OK` — successful GET/PUT/DELETE
- `201 Created` — successful POST
- `400 Bad Request` — invalid id or missing fields
- `404 Not Found` — item does not exist
- `500 Internal Server Error` — database/server error

---

## Authentication
- Login endpoint: `POST /auth/login`
- Logout endpoint: `POST /auth/logout`
- Register endpoint: `POST /auth/register`
- Session cookie: `sid` (HttpOnly, Secure in production)
- Write operations require authentication:
  - `POST /api/tasks`
  - `PUT /api/tasks/:id`
  - `DELETE /api/tasks/:id`

## Security Notes (Defense)
- **Authentication** verifies who the user is (login).
- **Authorization** controls what the user can do (middleware on write routes).
- **HttpOnly cookie** prevents JS access to session ID.
- **Secure cookie** ensures cookie is sent only over HTTPS (production).

---

## Seed/Update Tasks
To add missing fields to existing tasks:

    npm run seed:tasks

---

## Notes
- No ORM is used.
- All database operations use the official MongoDB Node.js driver
