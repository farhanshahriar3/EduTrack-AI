from fastapi import APIRouter
from app.api.v1 import (
    auth,
    students,
    courses,
    grades,
    analytics,
    imports,
    exports,
    ml,
    users,
    audit_logs,
    settings
)

api_router = APIRouter()

api_router.include_router(auth.router)
api_router.include_router(students.router)
api_router.include_router(courses.router)
api_router.include_router(grades.router)
api_router.include_router(analytics.router)
api_router.include_router(imports.router)
api_router.include_router(exports.router)
api_router.include_router(ml.router)
api_router.include_router(users.router)
api_router.include_router(audit_logs.router)
api_router.include_router(settings.router)
