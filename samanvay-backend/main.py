import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI(
    title="SAMANVAY API",
    description="Agentic AI for Smart Urban Infrastructure Coordination",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("CORS_ORIGIN", "http://localhost:5173"), "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routers import agents, blockchain, complaints, contractors, departments, permits, predictions  # noqa: E402

app.include_router(permits.router, prefix="/api/v1/permits", tags=["Permits"])
app.include_router(departments.router, prefix="/api/v1/departments", tags=["Departments"])
app.include_router(contractors.router, prefix="/api/v1/contractors", tags=["Contractors"])
app.include_router(complaints.router, prefix="/api/v1/complaints", tags=["Complaints"])
app.include_router(predictions.router, prefix="/api/v1/predictions", tags=["ML Predictions"])
app.include_router(agents.router, prefix="/api/v1/agents", tags=["AI Agents"])
app.include_router(blockchain.router, prefix="/api/v1/blockchain", tags=["Blockchain"])


@app.get("/")
async def root():
    return {"status": "ok", "project": "SAMANVAY", "version": "1.0.0"}


@app.get("/health")
async def health():
    return {"status": "healthy"}

