from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.seed import seed_database
from app.routers import auth, transactions, notifications, analytics

# Create database tables on startup
Base.metadata.create_all(bind=engine)

# Run seed data if blank
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

app = FastAPI(
    title="DSSI Equipment Borrowing & Returning System API",
    description="Backend API for DSSI Equipment Borrowing system supporting Modules 1, 4, and 5",
    version="1.0.0"
)

# Configure CORS (React defaults to http://localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*" # Fallback for wider environments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(transactions.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "status": "online",
        "system": "DSSI Equipment Borrowing System API",
        "modules_supported": [1, 4, 5],
        "api_docs_url": "/docs"
    }
