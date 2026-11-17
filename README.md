# 🛡️ JOBSAFE AI
### Explainable AI-Based Job & Internship Fraud Detection and Evidence Verification System

**Verify before you apply. Protect your career.**

JOBSAFE AI is a web-based job and internship fraud detection platform designed to help students, fresh graduates, and job seekers identify suspicious recruitment activities before sharing personal information or accepting an offer.

The platform analyzes job descriptions, internship opportunities, recruiter messages, LinkedIn information, and offer-letter details to identify potential fraud indicators and provide understandable risk assessments.

> **Important:** JOBSAFE AI provides preliminary risk indicators, not definitive proof of fraud or legitimacy. Users should independently verify employers and recruiters before making decisions.

---

## 🚀 Project Overview

Online job scams and fraudulent internship opportunities can expose job seekers to financial loss, identity theft, and misuse of personal information.

JOBSAFE AI aims to address this problem through a centralized verification platform that combines a responsive web interface, backend API, account authentication, and transparent rule-based analysis.

The system is designed to make recruitment verification easier by highlighting suspicious patterns and explaining why certain information may require further investigation.

## ✨ Key Features

### 1. User Authentication
- User registration and login.
- Password hashing using PBKDF2.
- SQLite-based account storage.
- Bearer-token authentication with expiring sessions.

### 2. Job Offer Verification
- Analyze user-submitted job descriptions.
- Identify suspicious recruitment language.
- Highlight potential warning signs.
- Present understandable risk indicators.

### 3. Internship Verification
- Review internship opportunity details.
- Identify potentially suspicious requirements.
- Highlight warning signs in submitted information.

### 4. Recruiter Message Analysis
- Analyze recruiter messages submitted by users.
- Identify suspicious phrases and recruitment patterns.
- Highlight information that requires additional verification.

### 5. LinkedIn Information Analysis
- Review LinkedIn-related information voluntarily submitted by users.
- Identify visible inconsistencies and suspicious indicators.
- Present findings with appropriate limitations.

### 6. Offer Letter Analysis
- Provide an analysis category for submitted offer-letter information.
- Identify potential warning signs in the information provided.

*Automated document upload, OCR, and extraction are not currently implemented.*

### 7. Explainable Risk Assessment
- Transparent rule-based analysis.
- Risk indicators with understandable explanations.
- Findings based on user-provided information.
- Unverified checks are identified rather than presented as confirmed facts.

### 8. Responsive Dashboard
- Login-first user experience.
- Account registration.
- Verification dashboard.
- First-check screen for new accounts.
- Navigation between verification categories.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js |
| Frontend tooling | Vite |
| Backend | Python |
| Backend framework | FastAPI |
| Database | SQLite |
| Authentication | PBKDF2 password hashing |
| API communication | REST API |
| Frontend styling | CSS |
| Version control | Git and GitHub |
| Frontend hosting | Netlify |
| Backend hosting | Render (planned deployment) |

---

## 📂 Project Structure

```text
jobsafe-ai/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── requirements.txt
│   └── .venv/
│
├── .env.example
├── .gitignore
├── package.json
├── README.md
└── package-lock.json
```

*The virtual environment is local to development and should not be committed to GitHub.*

---

## 💻 Installation and Setup

### Prerequisites

Install the following before running the application:

- Python 3.10 or later
- Node.js 20 or later
- npm
- Visual Studio Code
- Git

### Step 1: Clone the Repository

```bash
git clone https://github.com/Sahana1202/jobsafe-ai.git
```

Navigate into the project:

```bash
cd jobsafe-ai
```

### Step 2: Set Up the Backend

Open a terminal in the project directory.

Navigate to the backend:

```bash
cd backend
```

Create a Python virtual environment:

```bash
py -m venv .venv
```

Activate the environment in Windows PowerShell:

```powershell
.\.venv\Scripts\
