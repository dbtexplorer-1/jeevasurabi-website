# JeevaSurabi Website

JeevaSurabi is an e-commerce storefront for traditional food products. The project consists of a Next.js frontend and a FastAPI backend.

## Prerequisites

- Node.js 20 or newer
- Python 3.11 or newer
- A PostgreSQL/MySQL-compatible database supported by SQLAlchemy

## Environment configuration

Copy the example files before starting the app. Never commit the resulting `.env` files.

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
```

Set the following values:

- `NEXT_PUBLIC_API_BASE_URL`: public address of the FastAPI service.
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth client ID used by the frontend.
- `DATABASE_URL`: SQLAlchemy database URL.
- `JWT_SECRET_KEY`: long random secret used to sign tokens.
- `GOOGLE_CLIENT_ID`: the same OAuth client ID used by the frontend.

## Local development

Install and run the frontend:

```powershell
npm install
npm run dev
```

Install and run the backend in a separate terminal:

```powershell
python -m venv backend\venv
backend\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
Set-Location backend
python seed.py
uvicorn main:app --reload --port 8000
```

The storefront runs at `http://localhost:3000` and the API documentation is available at `http://localhost:8000/docs`.

## Validation and tests

```powershell
npm run lint
npm run test
python -m pytest backend/tests
```

The frontend tests cover cart stock behavior. Backend tests cover profile retrieval, OTP expiry, order stock deduction, cancellation stock restoration, out-of-stock rejection, and admin access control.

## Deployment checklist

- Set all production environment variables in the hosting platform.
- Use HTTPS URLs for the frontend and API base URL.
- Run the backend behind a production ASGI server and managed database.
- Configure CORS to only allow the deployed storefront domain.
- Do not use the development seed command against a production database.
