# Assignment 3 – Part 1: MongoDB CRUD API + Query Options

## Project: Shop API (Items)
Course: Web Programming 2

---

## Objective

This project implements an Express.js REST API connected to MongoDB (MongoDB Atlas or local). It supports:

- One main entity: **items**
- **CRUD** operations: Create, Read, Update, Delete
- Correct **HTTP status codes** and server-side validation
- Query options: **filtering**, **sorting**, **projection** (select fields), and **pagination**

---

## Tech Stack
- Node.js
- Express.js
- MongoDB (official Node.js driver: `mongodb`)

---

## Database
**Database name:** `shop`

**Collection name:** `items`

The collection is created automatically on the first insert.

### Item document structure
Required fields used in validation:
- `name` (string)
- `price` (number)
- `category` (string)

MongoDB automatically adds:
- `_id` (ObjectId)

---

## Middleware
- `express.json()` — parses JSON request bodies
- Custom logger middleware — logs: `METHOD URL`

---

## How to Run
1) Install dependencies

   npm install

2) Set MongoDB connection string

**Option A (recommended):** create `.env` or set environment variable:

    MONGO_URL="mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/?retryWrites=true&w=majority"

If `MONGO_URL` is not set, the app will use local MongoDB:

    mongodb://127.0.0.1:27017

3) Start the server

   node server.js

Server runs on:

    http://localhost:3000

---

## Home Page
`GET /` returns a simple HTML page with quick links to test the API.

---

## API Endpoints
Base path: `/api/items`

### 1) GET /api/items
Returns all items.

**Success**
- `200 OK`

**Response format**
- `{ "count": number, "items": [...] }`

**Possible errors**
- `500 Internal Server Error` — database/server error

---

### 2) GET /api/items/:id
Returns a single item by MongoDB ObjectId.

**Validation**
- Invalid ObjectId → `400 Bad Request`

  { "error": "Invalid id" }

**Not found**
- Item not found → `404 Not Found`

  { "error": "Item not found" }

**Success**
- `200 OK`

---

### 3) POST /api/items
Creates a new item.

**Request body example**

    { "name": "Keyboard", "price": 120, "category": "Electronics" }

**Validation**
- Missing required fields → `400 Bad Request`

  { "error": "Missing required fields" }

**Success**
- `201 Created` (returns created document)

---

### 4) PUT /api/items/:id
Updates an existing item by ObjectId.

**Request body example**

    { "name": "Keyboard", "price": 130, "category": "Electronics" }

**Validation**
- Invalid ObjectId → `400 Bad Request`

  { "error": "Invalid id" }

- Missing required fields → `400 Bad Request`

  { "error": "Missing required fields" }

**Not found**
- Item not found → `404 Not Found`

  { "error": "Item not found" }

**Success**
- `200 OK` (returns updated document)

---

### 5) DELETE /api/items/:id
Deletes an item by ObjectId.

**Validation**
- Invalid ObjectId → `400 Bad Request`

  { "error": "Invalid id" }

**Not found**
- Item not found → `404 Not Found`

  { "error": "Item not found" }

**Success**
- `200 OK`

  { "message": "Deleted" }

---

## Query Options (for GET /api/items)
The endpoint supports up to 5 query parameters:

### 1) Filtering
Filter by one of these fields: `category`, `name`, `minPrice`, `maxPrice`

Examples:

    /api/items?category=Electronics
    /api/items?name=Keyboard
    /api/items?minPrice=50
    /api/items?minPrice=50&maxPrice=200

### 2) Sorting
Sort by: `price`, `name`, or `_id`

- `sort=price` sorts by price ascending
- `sort=-price` sorts by price descending

Examples:

    /api/items?sort=price
    /api/items?sort=-price

### 3) Projection (select fields)
Select returned fields using `fields` (comma-separated).

Examples:

    /api/items?fields=name,price
    /api/items?fields=name,category

### 4) Pagination
- `limit` — maximum number of items
- `skip` — number of items to skip

Examples:

    /api/items?limit=5
    /api/items?skip=10&limit=5

---

## Status Codes Summary
- `200 OK` — successful GET/PUT/DELETE
- `201 Created` — successful POST
- `400 Bad Request` — invalid id or missing fields
- `404 Not Found` — item does not exist
- `500 Internal Server Error` — database/server error

---

## 404 Handling
- Unknown API routes return JSON:

  { "error": "API endpoint not found" }

- Unknown non-API routes return HTML 404 page.

---

## Team Member Contributions
- **Ivan Kuznetsov** — Database connection and CRUD API implementation
- **Zhumagali Beibarys** — Frontend HTML pages and navigation consistency
- **Yskak Zhanibek** — Integration/testing, 404 handling, query options documentation
- **Adilzhan Assanuly** — Project cleanup and final checks

---

## Notes
- No ORM is used.
- All database operations use the official MongoDB Node.js driver
