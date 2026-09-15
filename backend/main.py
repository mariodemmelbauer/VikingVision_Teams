from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="VikingVision API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "vikingvision-api"}

@app.get("/api/me")
def me():
    # Placeholder: validate Teams/Entra bearer token here in the next step.
    return {"authenticated": False, "message": "Entra SSO validation not wired yet"}
