# JOBSAFE AI

**JOBSAFE AI — Explainable AI-Based Fraud Detection and Evidence Verification System**  
Project ID: `JOBSAFE-AI-01` · Verify before you apply.

JOBSAFE AI helps people review job and internship opportunities, recruiter messages, LinkedIn information they are authorized to share, and offer letters. It reports transparent risk indicators with their source and limitations. **A risk assessment is not proof of fraud.**

## Current status

The project includes a login-first React experience, account registration, a responsive verification dashboard, and a FastAPI API. Registration and login use SQLite-backed accounts, salted PBKDF2 password hashes, and expiring bearer sessions. The first analysis pass uses transparent heuristics on user-provided text, URL, company name, and recruiter email. It does not fetch URLs, perform independent company verification, or claim machine-learning validation. Findings are labeled as user-provided evidence; unavailable checks are listed as unverified.

New accounts land on a first-check screen instead of a prefilled dashboard. The checks page shows an empty state until an analysis is completed. Analysis history is not persisted yet, so completed checks are not retained after leaving the page. Document extraction, independently verified sources, model training, PDF export, and the admin dashboard remain planned phases.

## Project structure

```text
jobsafe-ai/
├── frontend/             # React + Vite user interface
├── backend/app/          # FastAPI service
├── uploads/              # Reserved for a future secure document workflow
├── reports/              # Reserved for generated reports
├── ml/                   # Reserved for versioned model and training data
├── docs/
└── .env.example
```

## Requirements

- Node.js 20 or newer and npm
- Python 3.10 or newer

## Run locally

Start the backend in a VS Code terminal (from `jobsafe-ai`):

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

In a second terminal, start the frontend from `jobsafe-ai`:

```powershell
npm --prefix frontend install
npm run dev -- --force
```

Open the localhost URL printed by Vite (for example `http://localhost:5175`). The site starts at Login; choose **Create an account** to register, then you will be taken to the dashboard. The API health check is at `http://127.0.0.1:8000/api/health`; authenticated checks post to `/api/analyze/{job|internship|linkedin|offer-letter|message}`.

## Analysis and safety limits

- Rules flag phrases and visible mismatches as indicators. A low score is not a legitimacy guarantee.
- The service only examines submitted fields. It does not currently resolve domains, follow redirects, inspect public registries, or verify people.
- The current URL checks parse the URL but do not request it. SSRF-safe fetching must be implemented before adding external URL retrieval.
- File upload and OCR are not active yet. Do not upload sensitive documents to this prototype.
- The My checks page starts empty. Analysis results currently display in the session only; saved history and statistics are not implemented.
- The application remains a local prototype. Configure production session security and allowed website origins before publishing user accounts publicly.

## Planned implementation phases

1. Project setup + frontend + backend — foundation present.
2. Authentication + database — account and session tables present; analysis history is still pending.
3. Job and internship analysis.
4. Offer-letter PDF/image extraction with strict type and size controls.
5. Safe URL and email verification.
6. Expanded rule-based fraud analysis and transparent risk calculation.
7. Evidence engine with proof levels, sources, and checked timestamps.
8. Versioned sample ML model; report metrics only as dataset-specific.
9. Deterministic explanation provider with optional LLM adapter.
10. Downloadable PDF reports.
11. Admin dashboard.
12. Security and functional tests.
13. Complete documentation and deployment guidance.

## Environment variables

See `.env.example`. Set `JOBSAFE_DB_PATH` to a persistent mount path on your hosting provider if you want accounts to survive restarts. Set `CORS_ORIGINS` to the exact public frontend URL and build the frontend with `VITE_API_URL` set to the public API URL. API keys remain optional; deterministic explanations are the intended default. Never commit populated secrets.

## Publish online (Render example)

Create a GitHub repository containing only this `jobsafe-ai` project, then connect it to Render. Create two services from that repository:

### API web service

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- Add a persistent disk mounted at `/var/data` and set `JOBSAFE_DB_PATH=/var/data/jobsafe.db`.
- Set `CORS_ORIGINS` to the public URL of the frontend static site after it is created.

### Frontend static site

- Root directory: `frontend`
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` to the public API service URL, such as `https://your-api.onrender.com`.

After both deploy, visit the static-site URL. The frontend environment value is read at build time, so redeploy the frontend after changing it. Render web services need to bind to `0.0.0.0` and the assigned `PORT`; Render's free web services can spin down when idle, and persistent disks require a paid web service. See [Render's FastAPI guide](https://render.com/docs/deploy-fastapi), [static-site deployment guide](https://render.com/tutorials/web-service-vs-static-site/static-sites), and [persistent disk documentation](https://render.com/docs/disks).

This remains a prototype: checks are not saved to history, file uploads are not implemented, and the SQLite database is suited to a small demo rather than a multi-user production launch. A production release should use a managed database and stronger session protections.

## License

Educational prototype. Add a project license before redistribution.
