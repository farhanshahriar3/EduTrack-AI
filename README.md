# EduTrack AI

EduTrack AI is a full-stack student information and academic support platform. It combines normalized academic records, weighted GPA calculations, role-based JWT access, safe CSV workflows, institutional analytics, and transparent ML-assisted advisor indicators.

## Stack

- Backend: FastAPI, SQLAlchemy 2, Alembic, Pydantic 2, SQLite or PostgreSQL
- Frontend: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts
- ML: scikit-learn Logistic Regression with academic-only features

## Local Development

1. Copy `.env.example` to `.env` and change the secret and admin password.
2. Install backend dependencies and run the API:

   ```powershell
   cd backend
   .\venv\Scripts\python.exe -m pip install -r requirements.txt
   .\venv\Scripts\python.exe -m uvicorn app.main:app --reload
   ```

3. Run the frontend in a second terminal:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

The UI is available at `http://localhost:5173`; API documentation is at `http://localhost:8000/api/v1/docs`.

## Deployment

The frontend is Vercel-ready. Deploy the `frontend` directory as the Vercel project root and set the Vercel environment variable `VITE_API_BASE_URL` to the public URL of a persistent FastAPI deployment, including `/api/v1`.

The API should not use the local SQLite file in a serverless deployment. Use a persistent PostgreSQL database and set `DATABASE_URL`, `SECRET_KEY`, and the admin environment variables on the API host. This keeps the demo data and account changes from disappearing after a server restart.

After deployment, add the permanent Vercel URL to this README and to the repository's About website field. Do not commit `.env`, database files, credentials, or `node_modules`.

## Verification

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
cd ..\frontend
npm test -- --run
npm run build
```

## Docker

Create `.env` from `.env.example`, then run `docker compose up --build`. The frontend is served on port 5173 and the API on port 8000.

## Academic Support Safeguards

The ML service uses only observable academic metrics: GPA, GPA trend, credit completion, failures, withdrawals, and current semester. Its output is an indicator for authorized advisor review only, never an automated academic or disciplinary decision.