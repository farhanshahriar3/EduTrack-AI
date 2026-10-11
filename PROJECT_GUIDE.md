# EduTrack AI: Simple Project Guide

## 1. What Is EduTrack AI?

EduTrack AI is a university portal for managing students, courses, grades, academic progress, and advisor support information.

It replaces scattered spreadsheets and manual records with one system where university staff and students can access the information they need.

The system has three main parts:

- A web application for users.
- A backend API that handles business rules and security.
- A database that stores users, students, courses, enrollments, grades, and reports.

## 2. Main Purpose

The project helps a university:

- Store student records safely.
- Manage departments, courses, and academic terms.
- Register students in courses.
- Record and update grades.
- Calculate GPA using course credits.
- View academic analytics.
- Identify students who may benefit from advisor support.
- Import and export student data using CSV files.
- Keep an audit history of important actions.

The system is an academic management and support tool. It does not make automatic disciplinary or academic decisions.

## 3. User Roles

### Administrator

Administrators manage the university system. They can:

- Create, enable, and disable user accounts.
- Add and update student records.
- Create departments, courses, and academic terms.
- Manage grading policies.
- View analytics and support indicators.
- View audit logs.
- Manage enrollments and grades.

### Teacher or Faculty Member

Teachers work with academic information. They can:

- View students and courses.
- Manage enrollments and grades.
- View academic analytics.
- View advisor support indicators.
- Edit their own profile.

### Student

Students have access only to their own academic information. They can:

- View their dashboard.
- View their courses and grades.
- View their GPA and academic status.
- View their own student profile.
- Edit their personal profile information.
- Change their password.

Students cannot view another student's private records.

## 4. Account Creation and Login

Students and teachers can create their own accounts from the registration page:

```text
http://127.0.0.1:5173/register
```

Student registration creates both:

1. A login account.
2. A linked student academic profile.

Each new student receives a generated registration ID.

Administrator accounts cannot be created through public registration. They are controlled by an existing administrator.

After login, every user has a `My Profile` page where they can update their allowed personal information.

## 5. Current Development Accounts

### Administrator

- Email: `admin@edutrack.edu`
- Password: configured by `FIRST_ADMIN_PASSWORD` in `.env`

### Teacher

- Email: `teacher@edutrack.edu`
- Password: `Teacher@2026`

### Seeded Student

- Name: Alexander Wright
- Email: `alex.wright@edutrack.edu`
- Password: `Student@2026`

These accounts are for local development. Production deployments must use new passwords.

## 6. What Data Is Stored?

The database stores:

- Users and roles.
- Student names, email addresses, phone numbers, and registration IDs.
- Departments.
- Academic terms.
- Courses and course credits.
- Course enrollments.
- Grades and grade points.
- Grading policy settings.
- Audit log entries.
- Academic support indicators.

The dashboard does not use hardcoded student totals or grades. It requests current values from the backend API, which reads from the database.

The initial sample data is inserted by the seed script so that a new local installation has something to demonstrate. It can be changed through the portal or database.

## 7. GPA Calculation

GPA uses a credit-weighted formula:

```text
GPA = total of (grade points x course credits) / total course credits
```

Only completed grades marked as counting toward GPA are included.

The grading scale and probation threshold can be updated by an administrator from the Grading Policy page.

## 8. Academic Support Indicators

The ML feature is designed to help advisors notice possible academic difficulty earlier.

It uses academic information such as:

- Cumulative GPA.
- Recent term GPA.
- GPA change over time.
- Completed credit progress.
- Failed courses.
- Withdrawn courses.
- Current semester.

It does not use sensitive demographic information.

The result is only an advisor support indicator. It is not an automatic academic decision, punishment, suspension, or disciplinary action.

## 9. Security and Privacy

- Passwords are stored as secure hashes, not plain text.
- Login uses JWT access tokens.
- Role permissions are checked by the backend.
- Students are restricted to their own student records.
- Administrative changes are recorded in audit logs.
- CSV exports protect against spreadsheet formula injection.

## 10. Technology Used

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Recharts

### Backend

- FastAPI
- SQLAlchemy
- Pydantic
- Alembic
- SQLite for local development
- PostgreSQL can be used for deployment

### Machine Learning

- Python
- pandas
- NumPy
- scikit-learn
- joblib

## 11. How to Run the Project

### Start the backend

From the `backend` directory:

```powershell
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Start the frontend

From the `frontend` directory:

```powershell
npm run dev -- --host 127.0.0.1
```

### Open the application

```text
http://127.0.0.1:5173/
```

### Open the API documentation

```text
http://127.0.0.1:8000/api/v1/docs
```

## 12. Environment Configuration

The real local configuration file is `.env`.

The `.env.example` file is only a template. It is not loaded automatically unless copied or used to create `.env`.

Important settings include:

- `DATABASE_URL`: database connection.
- `SECRET_KEY`: secret used to sign login tokens.
- `FIRST_ADMIN_EMAIL`: initial administrator email.
- `FIRST_ADMIN_PASSWORD`: initial administrator password.
- `BACKEND_CORS_ORIGINS`: allowed frontend addresses.

## 13. Project Structure

```text
backend/        FastAPI application, database models, services, and tests
frontend/       React pages, components, routing, and API client
ml/             Model training code and saved model artifacts
edutrack.db     Local SQLite database
README.md       Short project setup overview
PROJECT_GUIDE.md This simple project explanation
```

## 14. Testing

Backend tests:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
```

Frontend tests:

```powershell
cd frontend
npm test -- --run
```

Frontend production build:

```powershell
npm run build
```

The project currently verifies authentication, role permissions, GPA calculation, CSV protection, ML behavior, student registration, profile updates, and frontend routing.

## 15. Important Production Note

The seeded sample records and development passwords are useful for testing only. Before deploying the portal for a real university:

- Change all development passwords.
- Use a strong random `SECRET_KEY`.
- Use PostgreSQL or another production database.
- Configure HTTPS.
- Review user privacy and retention policies.
- Back up the database.
- Review administrator permissions.