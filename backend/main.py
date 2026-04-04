from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.concierge_routes   import router as concierge_router
from api.sentiment_routes   import router as sentiment_router
from api.pricing_routes     import router as pricing_router
from api.maintenance_routes import router as maintenance_router
from api.scheduler_routes   import router as scheduler_router
from api.dashboard_routes   import router as dashboard_router
from api.inventory_routes   import router as inventory_router
from api.room_controls_routes import router as room_controls_router
from api.service_routes     import router as service_router
from api.guest_routes       import router as guest_router
from models.database        import init_db

app = FastAPI(
    title="Selam Stay API",
    description="AI-powered resort management platform for Ethiopian hospitality",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize DB on startup
@app.on_event("startup")
def startup():
    init_db()

app.include_router(concierge_router,   prefix="/api/concierge",   tags=["Concierge"])
app.include_router(sentiment_router,   prefix="/api/sentiment",   tags=["Sentiment"])
app.include_router(pricing_router,     prefix="/api/pricing",     tags=["Pricing"])
app.include_router(maintenance_router, prefix="/api/maintenance", tags=["Maintenance"])
app.include_router(scheduler_router,   prefix="/api/scheduler",   tags=["Scheduler"])
app.include_router(dashboard_router,   prefix="/api/dashboard",   tags=["Dashboard"])
app.include_router(inventory_router,   prefix="/api/inventory",     tags=["Smart Inventory"])
app.include_router(room_controls_router, prefix="/api/room-controls", tags=["Room Controls"])
app.include_router(service_router,     prefix="/api/services",      tags=["Service Requests"])
app.include_router(guest_router,       prefix="/api/guest",         tags=["Guest Profiles"])


@app.get("/")
def root():
    return {
        "status": "✅ Selam Stay API is running",
        "docs":   "/docs",
        "redoc":  "/redoc"
    }
