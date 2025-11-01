# AI Question Checker - Backend API

This directory contains the Node.js & Express.js server for the AI Question Checker application. It handles all user authentication and data management.

## 🚀 Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/) (running locally or on a server)

### 2. Installation
1.  Navigate to the `/server` directory:
    ```bash
    cd server
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```

### 3. Environment Setup
1.  Create a `.env` file in the `/server` directory.
2.  Add the following required variables. Your local database must be running.

    ```ini
    # .env
    DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/ai_app_auth"
    JWT_SECRET="YOUR_OWN_SUPER_SECRET_KEY"
    ```

### 4. Running the Server
1.  Run the server:
    ```bash
    node index.js
    ```
2.  The API will be live at `http://localhost:3001`.

---

## 📖 API Endpoints

All endpoints are prefixed with `/api/auth`.

### 1. User Signup
Registers a new user.
- **Route:** `POST /api/auth/signup`
- **Request Body:**
  ```json
  {
    "username": "newuser",
    "email": "user@example.com",
    "password": "password123"
  }
  ```json
- **Success Response (201 Created):**
  ```json
  {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "created_at": "2025-11-01T16:30:00.000Z"
  }
  ```json
- **Error Response (409 Conflict):**
  ```json
  {
    "error": "Username or email already exists."
  }
  ```json

### 2. User Login
Logs in an existing user and returns a JSON Web Token (JWT).
- **Route:** `POST /api/auth/login`
- **Request Body:**
  ```json
  {
    "login": "newuser", // Can be username or email
    "password": "password123"
  }
  ```json
- **Success Response (200 OK):**
  ```json
  {
    "token": "eyJhbGciOiJIuzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoxLCJ1c2VybmFtZSI6Im5ld3VzZXIifSwiaWF0IjoxNzEwOTU4MzgwLCJleHAiOjE3MTA5NjE5ODB9.abcdef..."
  }
  ```json
- **Error Response (401 Unauthorized):**
  ```json
  {
    "error": "Invalid credentials."
  }
  ```json

### 3. Forgot Password
Registers a new user.
- **Route:** `POST /api/auth/forgot-password`
- **Request Body:**
  ```json
  {
    "email": "user@example.com"
  }
  ```json
- **Success Response (200 OK):**
  ```json
  {
    "message": "If an account with that email exists, a password reset code has been sent."
  }
  ```json

### 4. Verify Code
Registers a new user.
- **Route:** `POST /api/auth/verify-code`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "code": "123456"
  }
  ```json
- **Success Response (200 OK):**
  ```json
  {
    "message": "Code is valid."
  }
  ```json
- **Error Response (400 Bad Request):**
  ```json
  {
    "error": "Code has expired. Please request a new one."
  }
  ```json

### 5. Reset Password
Registers a new user.
- **Route:** `POST /api/auth/reset-password`
- **Request Body:**
  ```json
  {
    "email": "user@example.com",
    "code": "123456",
    "newPassword": "myNewSecurePassword"
  }
  ```json
- **Success Response (200 OK):**
  ```json
  {
    "message": "Password has been reset successfully."
  }
  ```json