# ScamShield AI — Financial Scam Pattern Recognition & Workflow Intelligence Platform

> **Hackathon:** RAKSHAM — PS-02  
> **Challenge:** AI-Driven Scam Pattern Recognition for UPI, banking, and digital wallets.  
> **Tagline:** *"Detect the pattern. Understand the threat. Act before the loss."*

---

## 1. Executive Summary & Vision

**ScamShield AI** is an explainable, end-to-end cybersecurity intelligence platform designed to counteract financial social-engineering fraud across Indian payment ecosystems (UPI, mobile banking, and digital wallets). 

Rather than relying on isolated keyword lookups or opaque black-box classifiers, ScamShield AI delivers:
1. **Explainable Deterministic Detection:** Every risk assessment reveals the exact rules triggered, points contributed, matched text excerpts, and underlying fraud logic.
2. **Defensible Syndicate Correlation:** Connects multi-victim incidents only when anchored by explicit shared identifiers (UPI VPAs, verified phone numbers, phishing hosts) or distinct fraud signatures.
3. **Honest Uncertainty Representation:** Distinguishes between corroborated high-confidence threats and ambiguous, low-evidence messages.
4. **Actionable Analyst Case Management:** Provides authorized fraud analysts with dossier inspection, graph visualization, note keeping, and auditable status transitions.
5. **Responsible AI & Privacy by Design:** Operates purely on voluntary submissions, handles negative qualifiers (`do not share OTP`), and never collects or persists payment credentials.

---

## 2. Architecture & Technology Stack

```
                          ┌─────────────────────────────────┐
                          │    React + Vite + TypeScript    │
                          │   (Tailored Security Tokens)    │
                          └────────────────┬────────────────┘
                                           │ HTTP / JSON
                                           ▼
                          ┌─────────────────────────────────┐
                          │         FastAPI Backend         │
                          │  (Routers, Schemas, JWT Auth)   │
                          └───────┬─────────────────┬───────┘
                                  │                 │
                ┌─────────────────▼───┐       ┌─────▼────────────────┐
                │  Detection Engine   │       │  SQLite Persistence  │
                │  - Normalizer       │       │  - Cases & Evidences │
                │  - Entity Extractor │       │  - Indicators        │
                │  - 10+ Rules Model  │       │  - Correlation Edges │
                │  - Scorer & Graph   │       │  - Audit Events      │
                └─────────────────────┘       └──────────────────────┘
```

- **Frontend:** React 18, TypeScript, Vite, React Router v6, Lucide React, Custom CSS Design System.
- **Backend:** Python 3.14, FastAPI, Pydantic v2 (`ConfigDict`), SQLAlchemy 2.0.
- **Database:** SQLite (persisting cases, evidence items, detection indicators, correlation edges, analyst notes, and immutable audit logs).
- **Authentication & Security:** JWT Bearer tokens with PBKDF2 SHA-256 salted password hashing and role-based endpoint protection (`analyst`, `admin`).
- **Testing:** Pytest, HTTPX test client, in-memory SQLite isolation fixture.

---

## 3. Explainable Detection Rules & Scoring

### Documented Rules Registry
| Rule ID | Threat Category | Severity | Base Weight | Rationale & Detection Logic |
|---|---|---|---|---|
| `RULE_OTP_PIN_DEMAND` | Credential Theft | Critical | 35.0 | Solicitations for OTP, PIN, CVV, or passwords (with negative-qualifier filtering). |
| `RULE_UPI_COLLECT_REVERSE_FLOW` | Payment Manipulation | Critical | 35.0 | Misleading users into entering MPIN or approving collect requests to "receive" money. |
| `RULE_REMOTE_ACCESS_APP` | Device Takeover | Critical | 35.0 | Solicitation to install AnyDesk, TeamViewer, QuickSupport, or RustDesk. |
| `RULE_ELECTRICITY_BILL_THREAT` | Social Engineering | High | 32.0 | Coercive evening threats of imminent power disconnection directing to mobile contacts. |
| `RULE_KYC_ACCOUNT_SUSPENSION` | Impersonation | High | 25.0 | Urgent threats of bank account suspension / PAN deactivation via SMS hyperlinks. |
| `RULE_UNVERIFIED_APK_DOWNLOAD` | Malware Delivery | High | 25.0 | Direct instructions to sideload untrusted Android APK packages outside official app stores. |
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

**Risk Thresholds:**
- **0.0 – 25.0:** `Low Risk`
- **25.1 – 55.0:** `Medium Risk`
- **55.1 – 80.0:** `High Risk`
- **80.1 – 100.0:** `Critical Risk`

---

## 4. Defensible Correlation Engine

The correlation system connects cases only when supported by explicit evidence:
1. **`shared_upi_vpa` (Observed):** Cases sharing an identical Virtual Payment Address (e.g. `refund.officer98@ybl`).
2. **`shared_phone_number` (Observed):** Cases sharing an identical contact number (e.g. `+919876543210`).
3. **`shared_suspicious_url` (Observed):** Cases sharing an identical phishing domain or destination host.
4. **`shared_modus_operandi` (Inferred):** Distinct cases with matching specialized fraud signatures and elevated risk profiles.

Unrelated cases mentioning common words or legitimate bank names are **never** connected.

---

## 5. Local Setup & Installation

### Prerequisites
- Node.js (v18+) & npm
- Python (3.10+)

### Quick Start (Step-by-Step)

#### 1. Backend Setup
```powershell
cd scamshield-ai/backend

# Create virtual environment and activate
py -m venv venv
.\venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run automated test suite
pytest -v

# Start FastAPI server on port 8000
uvicorn app.main:app --host 127.0.0.1 --port 8000
```
*The database and seed scenarios are automatically initialized on startup.*

#### 2. Frontend Setup
```powershell
cd scamshield-ai/frontend

# Install dependencies
npm install

# Build production bundle
npm run build

# Start Vite dev server on port 5173
npm run dev -- --host 127.0.0.1 --port 5173
```

Open **`http://127.0.0.1:5173/`** in your browser.

---

## 6. Pre-Configured Test Accounts & Presets

### Analyst & Admin Credentials
| Role | Username | Password |
|---|---|---|
| **Fraud Analyst** | `analyst` | `Analyst@ScamShield2026!` |
| **System Administrator** | `admin` | `Admin@ScamShield2026!` |

*(One-click autofill buttons are available on the Login page).*

### Demonstration Scenarios (Available on `/submit`)
1. **Reverse UPI Collect Scam:** Simulates an e-commerce refund scam directing PIN entry.
2. **Electricity Disconnection Threat:** Simulates evening utility scam with a fake mobile helpline.
3. **AnyDesk Support Takeover:** Simulates remote desktop installation solicitation.
4. **Legitimate Bank Alert:** Baseline test proving false-positive elimination for genuine OTP alerts.

---

## 7. Automated Test Suite Results

```text
tests/test_auth_and_admin.py::test_unauthorized_access_rejected PASSED   [  8%]
tests/test_auth_and_admin.py::test_login_and_privileged_workflow PASSED  [ 16%]
tests/test_case_management.py::test_list_and_filter_cases PASSED         [ 25%]
tests/test_case_management.py::test_get_case_detail_by_reference PASSED  [ 33%]
tests/test_correlation.py::test_correlation_graph_generation PASSED      [ 41%]
tests/test_health.py::test_health_check PASSED                           [ 50%]
tests/test_rules_and_scoring.py::test_upi_inverted_flow_detection PASSED [ 58%]
tests/test_rules_and_scoring.py::test_remote_access_anydesk_detection PASSED [ 66%]
tests/test_rules_and_scoring.py::test_electricity_disconnection_threat PASSED [ 75%]
tests/test_rules_and_scoring.py::test_legitimate_message_low_score PASSED [ 83%]
tests/test_submission_api.py::test_valid_evidence_submission PASSED      [ 91%]
tests/test_submission_api.py::test_empty_submission_validation PASSED    [100%]

======================== 12 passed in 0.67s ========================
```

---

## 8. Responsible AI & Safety Disclosures

- **Voluntary Submission:** ScamShield AI analyzes only voluntarily submitted text. It does not monitor private chats, SMS inboxes, or banking devices.
- **No Automatic Fund Freezes:** The system delivers intelligence and safety steps; it never attempts automatic blocking of banking accounts.
- **Human Oversight:** High-impact case classifications require authorized analyst verification.
- **Emergency Escalation:** For active financial losses, users are immediately directed to call the National Cyber Crime Helpline (**1930**) or visit **cybercrime.gov.in**.
