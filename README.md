# Chirpy - TypeScript & Express.js REST API

Welcome to **Chirpy**, a complete RESTful API built with TypeScript and Express.js. Made by learnings from Boot.dev

The API serves as the backend for a simple Twitter-like application, managing users, "chirps," and authentication. It includes everything from basic routing to database migrations, JWT-based authentication, and webhook integration.

---

## Features ✨

- **RESTful API**: A complete set of endpoints for managing users and chirps.
- **Authentication & Authorization**: Secure user login using JSON Web Tokens (JWTs), including token refresh and revocation.
- **PostgreSQL Database**: Persistent data storage using a powerful relational database.
- **Drizzle ORM**: Modern, type-safe SQL query builder for interacting with the database.
- **Database Migrations**: Simple and effective schema management with `drizzle-kit`.
- **Webhook Integration**: An endpoint ready to receive webhooks from third-party services (e.g., Polka).
- **Middleware**: Custom middleware for logging, metrics, and robust error handling.
- **Health & Admin**: Administrative endpoints for health checks, metrics, and database resets.

---

## Tech Stack 🛠️

- **Language**: TypeScript
- **Web Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Authentication**: JSON Web Tokens (JWT) & bcrypt
- **Testing**: Vitest

---

## Getting Started 🚀

Follow these instructions to get a local copy of the project up and running.

### **Prerequisites**

- **Node.js** (v20.6 or newer, to use `process.loadEnvFile()`)
- **npm** or **yarn**
- A running **PostgreSQL** database instance

### **Installation & Setup**

1.  **Clone the repository:**

    ```bash
    git clone <your-repository-url>
    cd <repository-name>
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a file named `.env` in the root of the project. Copy the content below into it and replace the placeholder values with your own information.

    ```env
    # The port the server will run on
    PORT=8080

    # Your PostgreSQL database connection string
    DB_URL="postgres://user:password@localhost:5432/chirpy"

    # A long, random string used to sign authentication tokens
    JWT_SECRET="your-super-secret-jwt-string"
    # You can generate a random string on the cli like this: openssl rand -base64 64

    # API key for validating Polka webhooks, or rather any webhook api key you are interacting with
    POLKA_KEY="your-polka-api-key"

    # The runtime environment, e.g., "dev" or "production"
    PLATFORM="dev"
    ```

4.  **Run database migrations:**
    After setting up your .env file, apply the database schema to your PostgreSQL instance.

    ```bash
    npm run migrate
    ```

5.  **Start the server:**

**For development:** This command will compile your TypeScript and start the server.

```bash
npm run dev
```

 **For production:** First, build the optimized JavaScript code. Then, start the application.

```bash
npm run build
npm start
```

The server will now be running at `http://localhost:8080` (or the port you specified in your `.env` file).

---

## API Endpoints 📖

Here is a list of the available API endpoints.

### User & Auth

- `POST /api/users`: Creates a new user.
- `PUT /api/users`: Updates an authenticated user's password. (Requires Auth)
- `POST /api/login`: Logs in a user and returns a JWT and refresh token.
- `POST /api/refresh`: Issues a new JWT using a valid refresh token.
- `POST /api/revoke`: Revokes a refresh token.

### Chirps

- `POST /api/chirps`: Creates a new chirp. (Requires Auth)
- `GET /api/chirps`: Retrieves all chirps. Can be filtered by `authorId`.
- `GET /api/chirps/:chirpID`: Retrieves a single chirp by its ID.
- `DELETE /api/chirps/:chirpID`: Deletes a chirp. (Requires Auth, user must be the author)

### Webhooks

- `POST /api/polka/webhooks`: Handles incoming webhooks from the Polka service to upgrade a user to "Chirpy Red".

### Admin & Health

- `GET /api/healthz`: A simple health check endpoint.
- `GET /admin/metrics`: Returns application metrics.
- `POST /admin/reset`: Resets the database (for development/testing).

