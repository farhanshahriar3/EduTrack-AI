# EduTrack AI

EduTrack AI is a full-stack student information and academic support platform. It combines normalized academic records, weighted GPA calculations, role-based JWT access, safe CSV workflows, institutional analytics, and transparent ML-assisted advisor indicators.

## Live Demo

https://edutrack-ai-mu.vercel.app/

## Stack

- Backend: FastAPI, SQLAlchemy 2, Alembic, Pydantic 2, SQLite
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

## Verification

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
cd ..\frontend
npm test -- --run
npm run build
```

## Academic Support Safeguards

The ML service uses only observable academic metrics: GPA, GPA trend, credit completion, failures, withdrawals, and current semester. Its output is an indicator for authorized advisor review only, never an automated academic or disciplinary decision.