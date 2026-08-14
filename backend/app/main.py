from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import Base, engine
from .routers import lessons, me, path
from .seed import seed
from .database import SessionLocal

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Duolingo Clone API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(me.router, prefix="/api")
app.include_router(path.router, prefix="/api")
app.include_router(lessons.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"ok": True}


@app.on_event("startup")
def _seed_if_empty():
    from .models import User

    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            seed(db)
    finally:
        db.close()
