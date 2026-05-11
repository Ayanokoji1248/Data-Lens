# Data Lens API

FastAPI backend with PostgreSQL user authentication, hashed passwords, HTTP-only JWT cookies, and protected routes.

## Setup

```powershell
cd server
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Update `.env` with your PostgreSQL connection string and JWT secret.

## Run

```powershell
uvicorn app.main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

## Routes

- `GET /health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/users/me`
- `GET /api/users/protected`

Register request:

```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com",
  "password": "strong-password",
  "role": "admin"
}
```

Login request:

```json
{
  "email": "jane@example.com",
  "password": "strong-password"
}
```

Login sets an HTTP-only `access_token` cookie. Send requests with credentials/cookies enabled to access protected routes.
