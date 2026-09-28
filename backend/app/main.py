from __future__ import annotations

import re
import hashlib
import secrets
import sqlite3
import time
import os
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="JOBSAFE AI API", version="0.1.0", description="Evidence-led opportunity review service")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1):\d+$",
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "Authorization"],
)

DATABASE_PATH = Path(os.getenv("JOBSAFE_DB_PATH", str(Path(__file__).resolve().parents[1] / "jobsafe.db"))).resolve()
PASSWORD_ITERATIONS = 310_000
SESSION_TTL_SECONDS = 7 * 24 * 60 * 60


def database() -> sqlite3.Connection:
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with database() as connection:
        connection.execute("""CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL, password_salt TEXT NOT NULL,
            created_at TEXT NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS sessions (
            token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
            expires_at INTEGER NOT NULL
        )""")


@app.on_event("startup")
def startup() -> None:
    initialize_database()


class AnalysisSubmission(BaseModel):
    company_name: str = Field(default="", max_length=200)
    recruiter_email: str = Field(default="", max_length=320)
    description: str = Field(default="", max_length=30000)
    url: str = Field(default="", max_length=2048)


class RegisterRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=320)
    password: str = Field(min_length=1, max_length=128)


def password_digest(password: str, salt: bytes) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, PASSWORD_ITERATIONS).hex()


def create_session(user: sqlite3.Row) -> dict:
    token = secrets.token_urlsafe(36)
    expires_at = int(time.time()) + SESSION_TTL_SECONDS
    with database() as connection:
        connection.execute("INSERT INTO sessions(token_hash, user_id, expires_at) VALUES (?, ?, ?)",
                           (hashlib.sha256(token.encode()).hexdigest(), user["id"], expires_at))
    return {"access_token": token, "token_type": "bearer", "expires_at": expires_at,
            "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}


def current_user(authorization: str | None = Header(default=None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Please sign in to continue")
    token = authorization.split(" ", 1)[1].strip()
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    with database() as connection:
        row = connection.execute("""SELECT users.id, users.name, users.email, sessions.expires_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ?""", (token_hash,)).fetchone()
        if row is None or row["expires_at"] < int(time.time()):
            connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))
            raise HTTPException(status_code=401, detail="Your session expired. Please sign in again")
    return {"id": row["id"], "name": row["name"], "email": row["email"]}


@app.post("/api/auth/register")
def register(payload: RegisterRequest) -> dict:
    name, email = payload.name.strip(), payload.email.strip().lower()
    if not name:
        raise HTTPException(status_code=422, detail="Please enter your name")
    if not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise HTTPException(status_code=422, detail="Enter a valid email address")
    salt = secrets.token_bytes(16)
    user_id = str(uuid4())
    try:
        with database() as connection:
            connection.execute("INSERT INTO users(id, name, email, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                (user_id, name, email, password_digest(payload.password, salt), salt.hex(), datetime.now(timezone.utc).isoformat()))
            user = connection.execute("SELECT id, name, email FROM users WHERE id = ?", (user_id,)).fetchone()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="An account with this email already exists")
    return create_session(user)


@app.post("/api/auth/login")
def login(payload: LoginRequest) -> dict:
    email = payload.email.strip().lower()
    with database() as connection:
        user = connection.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if user is None or not secrets.compare_digest(password_digest(payload.password, bytes.fromhex(user["password_salt"])), user["password_hash"]):
        raise HTTPException(status_code=401, detail="Email or password is incorrect")
    return create_session(user)


@app.get("/api/auth/me")
def get_me(user: dict = Depends(current_user)) -> dict:
    return user


@app.post("/api/auth/logout")
def logout(authorization: str | None = Header(default=None), user: dict = Depends(current_user)) -> dict:
    token = authorization.split(" ", 1)[1].strip()
    with database() as connection:
        connection.execute("DELETE FROM sessions WHERE token_hash = ?", (hashlib.sha256(token.encode()).hexdigest(),))
    return {"status": "signed out"}


FREE_EMAILS = {"gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "proton.me"}
PAYMENT_TERMS = ("registration fee", "security deposit", "training fee", "pay to apply", "processing fee", "upfront payment")
URGENCY_TERMS = ("immediate payment", "act now", "within 24 hours", "urgent", "limited seats")


def assess(submission: AnalysisSubmission, analysis_type: str) -> dict:
    text = submission.description.strip()
    points = 0
    findings: list[dict] = []

    def add(indicator: str, description: str, why: str, weight: int, severity: str = "MEDIUM") -> None:
        nonlocal points
        points += weight
        findings.append({
            "indicator": indicator,
            "severity": severity,
            "description": description,
            "why": why,
            "source": "User-provided submission",
            "proof_level": "STRONG INDICATOR" if severity == "HIGH" else "SUSPICIOUS",
            "confidence": "High" if severity == "HIGH" else "Medium",
        })

    lower = text.lower()
    payment_hit = next((term for term in PAYMENT_TERMS if term in lower), None)
    if payment_hit:
        add("UPFRONT_PAYMENT", f'Text includes “{payment_hit}”.', "Requests to pay before employment deserve independent confirmation.", 30, "HIGH")
    urgency_hit = next((term for term in URGENCY_TERMS if term in lower), None)
    if urgency_hit:
        add("URGENT_LANGUAGE", f'Text includes “{urgency_hit}”.', "Pressure to act quickly can make independent checks harder.", 10)

    if submission.recruiter_email and "@" in submission.recruiter_email:
        domain = submission.recruiter_email.rsplit("@", 1)[-1].lower()
        company_domain = re.sub(r"[^a-z0-9]", "", submission.company_name.lower().split()[0]) if submission.company_name else ""
        if domain in FREE_EMAILS:
            add("PERSONAL_EMAIL_PROVIDER", f"Recruiter email uses {domain}.", "A personal email provider is less directly tied to an employer domain; this is an indicator, not proof of fraud.", 8)
        elif company_domain and company_domain not in domain.replace(".", ""):
            add("EMAIL_DOMAIN_MISMATCH", f"Email domain is {domain}; it does not visibly match the supplied company name.", "A mismatch is a reason to confirm the recruiter through the company's official channels.", 20)

    if submission.url:
        parsed = urlparse(submission.url if "://" in submission.url else "https://" + submission.url)
        host = parsed.hostname or ""
        if parsed.scheme != "https":
            add("UNENCRYPTED_URL", "The supplied link does not use HTTPS.", "HTTPS protects data in transit; its presence alone does not establish legitimacy.", 8)
        if "@" in parsed.netloc:
            add("MISLEADING_URL_FORMAT", "The link contains an @ character in its network location.", "This URL format can obscure the actual destination.", 20, "HIGH")
        if not host or "." not in host or host in {"localhost", "127.0.0.1"}:
            add("URL_NOT_PUBLIC_DOMAIN", "The supplied link does not appear to use a public company domain.", "A public domain is needed for meaningful employer-site checks.", 10)

    score = min(points, 100)
    risk = "LOW RISK" if score < 30 else "MEDIUM RISK" if score < 60 else "HIGH RISK"
    if not text and not submission.url and not submission.recruiter_email:
        risk = "UNABLE TO VERIFY"
    explanation = (
        "This submission contains risk indicators. They do not establish that the opportunity is fraudulent. Confirm the recruiter and role using contact details found independently on the employer's official website."
        if findings else
        "No strong risk indicators were detected in the information provided. This is not a verification of the company or opportunity; independently confirm details before sharing money or sensitive information."
    )
    return {
        "analysis_id": str(uuid4()), "analysis_type": analysis_type,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "risk_score": score, "risk_level": risk, "findings": findings,
        "sources": [{"source_name": "User-provided submission", "source_url": None, "finding": "Reviewed only the fields supplied by the user.", "status": "USER PROVIDED"}],
        "unverified": ["Employer identity and registration", "Recruiter identity and authority", "Whether the role is currently open", "Website ownership and reputation"],
        "explanation": explanation,
        "recommendations": ["Find the employer's official website independently.", "Contact its recruiting team using a number or address listed there.", "Do not pay a fee or share financial credentials to secure an interview or offer."],
        "demo": False,
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "service": "JOBSAFE AI API", "version": "0.1.0"}


@app.post("/api/analyze/{analysis_type}")
def analyze(analysis_type: str, submission: AnalysisSubmission, user: dict = Depends(current_user)) -> dict:
    supported = {"job", "internship", "linkedin", "offer-letter", "message"}
    normalized_type = analysis_type.lower()
    if normalized_type not in supported:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Unsupported analysis type")
    return assess(submission, normalized_type)
