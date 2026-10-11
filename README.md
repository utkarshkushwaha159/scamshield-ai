# ScamShield AI — Financial Scam Pattern Recognition & Early-Warning Platform

> **Hackathon:** IIT Delhi RAKSHAM  
> **Problem Statement:** PS-02 — AI-Driven Scam Pattern Recognition  
> **Tagline:** *"Detect the pattern. Understand the threat. Act before the loss."*

---

## 1. Executive Summary & PS-02 Alignment

**ScamShield AI** is an explainable, privacy-first cybersecurity intelligence and early-warning platform designed to detect emerging AI-enabled and multi-step deceptive scam workflows in UPI, mobile banking, and digital wallet ecosystems.

### Core PS-02 Pillars Implemented:
1. **Detect Suspicious Financial Scam Workflows:** Analyzes complete deceptive multi-step sequences (e.g. fake refund/cashback SMS → APK sideloading or suspicious URL → reverse UPI collect request → credential theft).
2. **Defensible Evidence Correlation:** Correlates multi-victim incidents anchored on verified indicators (shared UPI VPAs, phone numbers, phishing hosts, threat intelligence bulletins) while distinguishing directly observed facts from inferred relationships.
3. **Evidence-Based Explainable Risk Assessment:** Every risk evaluation outputs transparent rule contributions, matched excerpts, score breakdowns, and honest uncertainty ratings.
4. **Multilingual Architecture with Strict Unicode Preservation:** 
   - **Interface Language:** Localized interface in English, Hindi (हिन्दी), and Bengali (বাংলা) via `i18next`.
   - **Original Evidence Preservation:** Original text in any Indian language or script (Hindi, Hinglish, Bengali, Tamil, etc.) is preserved without tampering.
   - **Viewer Preferred Language:** Fraud analysts and administrators can inspect original evidence alongside cached machine translations according to their viewer preferences.
5. **Real-Time Detection & Live Analyst Alerts:** Live WebSocket broadcast (`/api/ws/cases`) informs analysts of new cases with zero page reloads.
6. **National Cyber Fraud Helpline (1930) Integration:** Clickable `<a href="tel:1930">` dialer links prefill the 1930 helpline on mobile devices, paired with clear desktop fallback instructions.
7. **Privacy by Design & Data Minimization:** Voluntary submission model, mandatory user consent, strict warning against submitting OTPs or credentials, and user data deletion rights (`DELETE /api/cases/:id`).
8. **Role-Based Access Control (RBAC):** Firebase Authentication with Google Sign-In and JWT fallback, with strict server-side enforcement of `USER`, `ANALYST`, and `ADMIN` roles.

---

## 2. Architecture & Technology Stack

```
                          ┌──────────────────────────────────────────────┐
                          │         React 18 + TypeScript + Vite         │
                          │   - i18next (Interface Localization)         │
                          │   - Firebase Google Sign-In + Auth Provider  │
                          │   - WebSocket Live Case Subscriber           │
                          │   - 1930 Helpline Dialer Link                │
                          └──────────────────────┬───────────────────────┘
                                                 │ HTTP / WebSocket
                                                 ▼
                          ┌──────────────────────────────────────────────┐
                          │               FastAPI Backend                │
                          │   - Firebase Admin SDK Token Verifier        │
                          │   - Role-Based Access Control (RBAC)         │
                          │   - Multilingual Translation Cache Service   │
                          │   - WebSocket Real-Time Alert Manager        │
                          └──────────────┬────────────────┬──────────────┘
                                         │                │
                    ┌────────────────────▼──┐       ┌─────▼────────────────┐
                    │ Explainable Detection │       │    SQLite Database   │
                    │ Engine:               │       │ - Cases & Evidences  │
                    │ - Unicode Normalizer  │       │ - Indicators & Rules │
                    │ - Entity Extractors   │       │ - Threat Intel Feeds │
                    │ - 11 Deterministic    │       │ - Translation Cache  │
                    │   Heuristic Rules     │       │ - User Ownership     │
                    │ - Saturated Caps      │       │ - Immutable Audit Log│
                    │ - Defensible Graph    │       └──────────────────────┘
                    └───────────────────────┘
```

- **Frontend:** React 18, TypeScript, Vite 6, React Router v6, Lucide React, i18next & react-i18next, Firebase JS SDK.
- **Backend:** Python 3.14, FastAPI, Pydantic v2 (`model_config = ConfigDict(from_attributes=True)`), SQLAlchemy 2.0, WebSockets, Firebase Admin SDK.
- **Database:** SQLite (persists users, cases, evidence items, detection indicators, evidence relationships, audit logs, translation cache, and threat intelligence bulletins).
- **Authentication:** Firebase Authentication (Google Sign-In) + JWT fallback with PBKDF2 SHA-256 salted password hashing.

---

## 3. Explainable Detection Engine & Rules

### Transparent Heuristic Rules Registry
| Rule ID | Category | Severity | Weight | Logic & Modus Operandi |
|---|---|---|---|---|
| `RULE_OTP_PIN_DEMAND` | Credential Theft | Critical | 35.0 | Solicitations for OTP, PIN, CVV, or passwords (with negative-qualifier filtering). |
| `RULE_UPI_COLLECT_REVERSE_FLOW` | Payment Manipulation | Critical | 35.0 | Misleading users into entering MPIN or approving collect requests to "receive" money. |
| `RULE_REMOTE_ACCESS_APP` | Device Takeover | Critical | 35.0 | Solicitation to install AnyDesk, TeamViewer, QuickSupport, or RustDesk. |
| `RULE_ELECTRICITY_BILL_THREAT` | Social Engineering | High | 32.0 | Coercive evening threats of imminent power disconnection directing to mobile contacts. |
| `RULE_KYC_ACCOUNT_SUSPENSION` | Impersonation | High | 25.0 | Urgent threats of bank account suspension / PAN deactivation via SMS hyperlinks. |
| `RULE_UNVERIFIED_APK_DOWNLOAD` | Malware Delivery | High | 25.0 | Direct instructions to sideload untrusted Android APK packages outside official app stores. |
| `RULE_THREAT_INTEL_MATCH` | Threat Intelligence | High | 35.0 | Match against active verified cyber fraud bulletins and known malicious VPAs/phones. |
| `RULE_SUSPICIOUS_URL_SHORTENER_OR_IP` | Suspicious Infrastructure | Medium | 18.0 | Usage of link shorteners (bit.ly, tinyurl), raw IP hosts, or high-risk TLDs (.xyz, .top). |
| `RULE_FAKE_CUSTOMER_CARE_IMPERSONATION` | Impersonation | High | 22.0 | Official support pretexts paired with unofficial personal 10-digit mobile phone numbers. |
| `RULE_LOTTERY_JOB_PART_TIME_TASK` | Financial Fraud | Medium | 20.0 | High-yield part-time tasks (YouTube liking, Telegram tasks) demanding deposit escalations. |
| `RULE_TIME_URGENCY_COERCION` | Social Engineering | Low | 12.0 | Manufactured deadlines ("within 10 mins", "immediately") designed to bypass verification. |

### Scoring & Saturated Category Caps
To prevent artificial score explosions or double-counting equivalent indicators, ScamShield AI implements non-duplicative category caps:
- `credential_theft`: Max 40.0 pts
- `payment_manipulation`: Max 40.0 pts
- `device_takeover`: Max 35.0 pts
- `social_engineering`: Max 35.0 pts
- `impersonation`: Max 35.0 pts
- `malware_distribution`: Max 30.0 pts
- `suspicious_infrastructure`: Max 35.0 pts

**Risk Thresholds:**
- **0.0 – 25.0:** `Low Risk`
- **25.1 – 55.0:** `Medium Risk`
- **55.1 – 80.0:** `High Risk`
- **80.1 – 100.0:** `Critical Risk`

---

## 4. Multilingual Experience (3-Concept Separation)

ScamShield AI strictly separates the three multilingual concepts:
1. **Interface Language:** Managed by `i18next`. Users can toggle between **English**, **Hindi (हिंदी)**, and **Bengali (বাংলা)** at any point via the top navigation selector. Form labels, warnings, and instructions adjust instantly.
2. **Original Evidence Input Language:** Users can submit evidence in **any language or script** (Hindi, Hinglish, Bengali, Tamil, Telugu, English). The original text is preserved byte-for-byte in Unicode and is never overwritten.
3. **Viewer Preferred Language:** Fraud analysts and administrators viewing cases can switch between **Original (Unmodified Unicode)** and **Machine Translation** (`en`, `hi`, `bn`). Translations are cached in the SQLite `translation_cache` table.

---

## 5. Local Setup & Quick Start

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### Step 1: Backend Setup
```powershell
cd scamshield-ai/backend

# Create virtual environment and activate
py -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run automated test suite
python -m pytest -v

# Start FastAPI server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*The database (`scamshield.db`), seed scenarios, threat intelligence feeds, and test accounts are automatically created and seeded on startup.*

### Step 2: Frontend Setup
```powershell
cd scamshield-ai/frontend

# Install dependencies
npm install

# Build production bundle (TypeScript verification)
npm run build

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```

Open **`http://127.0.0.1:5173/`** in your browser.

---

## 6. Firebase Authentication Configuration

ScamShield AI supports Firebase Authentication with Google Sign-In as well as local verified token authentication.

### Frontend Environment Variables (`frontend/.env`)
```env
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="your-app.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-app"
VITE_FIREBASE_STORAGE_BUCKET="your-app.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="123456789"
VITE_FIREBASE_APP_ID="1:123456789:web:abcdef"
```

### Backend Environment Variables (`backend/.env`)
```env
FIREBASE_PROJECT_ID="your-app"
FIREBASE_CREDENTIALS_PATH="path/to/service-account.json"
```

### Verified Demo Credentials (Fallback Mode)
When Firebase credentials are not yet configured in `.env`, the system provides one-click verified test accounts:
| Role | Username | Password |
|---|---|---|
| **Fraud Analyst** | `analyst` | `Analyst@ScamShield2026!` |
| **Administrator** | `admin` | `Admin@ScamShield2026!` |

---

## 7. Automated Test Suite Results

The platform includes a test suite covering rules, scoring, correlation, authentication, multilingual preservation, and user privacy deletion rights:

```text
tests/test_auth_and_admin.py::test_unauthorized_access_rejected PASSED   [  6%]
tests/test_auth_and_admin.py::test_login_and_privileged_workflow PASSED  [ 13%]
tests/test_case_management.py::test_list_and_filter_cases PASSED         [ 20%]
tests/test_case_management.py::test_get_case_detail_by_reference PASSED  [ 26%]
tests/test_correlation.py::test_correlation_graph_generation PASSED      [ 33%]
tests/test_health.py::test_health_check PASSED                           [ 40%]
tests/test_multilingual_and_privacy.py::test_hindi_submission_and_translation PASSED [ 46%]
tests/test_multilingual_and_privacy.py::test_bengali_submission PASSED   [ 53%]
tests/test_multilingual_and_privacy.py::test_privacy_case_deletion_ownership PASSED [ 60%]
tests/test_rules_and_scoring.py::test_upi_inverted_flow_detection PASSED [ 66%]
tests/test_rules_and_scoring.py::test_remote_access_anydesk_detection PASSED [ 73%]
tests/test_rules_and_scoring.py::test_electricity_disconnection_threat PASSED [ 80%]
tests/test_rules_and_scoring.py::test_legitimate_message_low_score PASSED [ 86%]
tests/test_submission_api.py::test_valid_evidence_submission PASSED      [ 93%]
tests/test_submission_api.py::test_empty_submission_validation PASSED    [100%]

======================== 15 passed, 1 warning in 1.72s ========================
```

---

## 8. Responsible AI & Safety Disclosures

- **Voluntary Submission:** ScamShield AI analyzes only voluntarily submitted text and media metadata. It never conducts background surveillance or reads private device SMS or banking apps without user consent.
- **Zero-Credential Policy:** The platform enforces strict input guidelines and explicit warnings against entering OTPs, UPI MPINs, or passwords.
- **No Automated Fund Freezing:** High-impact decisions remain strictly under human and authorized banking authority control. ScamShield AI assists analysts with explainable intelligence rather than taking autonomous banking actions.
- **1930 Helpline Assistance:** Users detecting suspected financial loss are immediately presented with clickable dialer links to the National Cyber Fraud Helpline (**1930**).
- **Synthetic Demonstration Disclosures:** Threat intelligence feeds in the prototype are sandbox demonstration bulletins clearly labeled as synthetic.
