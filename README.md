<p align="center">
  <img src="https://img.shields.io/badge/SAMANVAY-Agentic%20AI-7C3AED?style=for-the-badge&labelColor=1D4ED8" alt="SAMANVAY Badge"/>
</p>

<h1 align="center">🏙️ SAMANVAY</h1>
<h3 align="center">Agentic AI for Smart Urban Infrastructure Coordination</h3>

<p align="center">
  <em>Multi-agent AI system that prevents redundant road digging, resolves inter-department clashes, and empowers citizens — built for Indian Smart Cities.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-0.111-009688?logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/LangGraph-Agents-FF6F00" />
  <img src="https://img.shields.io/badge/Polygon-Blockchain-8247E5?logo=ethereum&logoColor=white" />
  <img src="https://img.shields.io/badge/PostGIS-Spatial-336791?logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Groq-LLM-F55036" />
</p>

---

## 📌 Problem Statement

In Indian cities, multiple departments (Water, Gas, Telecom, Electricity) independently dig the **same roads** — causing:

- 🚧 **Repeated road closures** disrupting traffic for weeks
- 💸 **Crores wasted** in redundant excavation and restoration
- 😡 **Citizen frustration** from uncoordinated, never-ending roadwork
- 📋 **Zero transparency** — no audit trail for permits or contractor accountability

> **SAMANVAY** (समन्वय = *coordination*) uses **Agentic AI** to detect clashes, auto-negotiate joint dig schedules between departments, predict road health, and bring full transparency via blockchain — all through an intelligent, citizen-friendly platform.

---

> 📘 **Full project report** — problem research, impact, proposed solution and solution architecture: [`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md)

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SAMANVAY PLATFORM                        │
├──────────────────────┬──────────────────────────────────────────┤
│   FRONTEND (React)   │           BACKEND (FastAPI)              │
│                      │                                          │
│  • Officer Dashboard │  ┌─────────────────────────────────┐    │
│  • Live Trench Map   │  │         AI AGENTS LAYER          │    │
│  • Citizen Portal    │  │  • Clash Detection Agent          │    │
│  • Complaint Kanban  │  │  • Negotiation Agent (Groq LLM)   │    │
│  • Contractor Board  │  │  • Complaint Classifier (NLP)     │    │
│  • ML Predictions    │  │  • Dig-Once Scheduler             │    │
│  • Blockchain Audit  │  └─────────────────────────────────┘    │
│                      │  ┌─────────────────────────────────┐    │
│                      │  │         ML / DATA LAYER          │    │
│                      │  │  • Road Health Predictor (RF)     │    │
│                      │  │  • Feature Engineering Pipeline   │    │
│                      │  └─────────────────────────────────┘    │
│                      │  ┌─────────────────────────────────┐    │
│                      │  │       BLOCKCHAIN LAYER           │    │
│                      │  │  • Polygon Testnet (Solidity)     │    │
│                      │  │  • PermitLedger Smart Contract    │    │
│                      │  │  • Immutable Audit Trail          │    │
│                      │  └─────────────────────────────────┘    │
│                      │  ┌─────────────────────────────────┐    │
│                      │  │       DATABASE LAYER             │    │
│                      │  │  • Supabase + PostGIS             │    │
│                      │  │  • GeoAlchemy2 / SQLAlchemy       │    │
│                      │  └─────────────────────────────────┘    │
└──────────────────────┴──────────────────────────────────────────┘
```

---

## ✨ Key Features

### 🤖 AI Agents

| Agent | What It Does | Tech |
|-------|-------------|------|
| **Clash Detection Agent** | Detects spatial + temporal overlaps between permits using PostGIS `ST_Intersects` with severity scoring (Critical → Low) | LangGraph + PostGIS |
| **Cross-Dept Negotiation Agent** | Auto-generates joint dig schedule, cost-split, and MoU PDF when clash is detected — officers just approve or reject | Groq (Llama3-70B) + ReportLab |
| **NLP Complaint Classifier** | Classifies citizen complaints (English/Hinglish) into category, priority, sentiment, and auto-assigns to department | Groq (Llama3-70B) |
| **Dig-Once Scheduler** | Groups permits by road and optimizes scheduling to minimize total road closure days | Custom algorithm |

### 📊 ML-Powered Predictions

- **Road Health Predictor**: Random Forest model trained on road age, dig frequency, pipe age, rainfall, surface condition, and traffic load
- Outputs **90-day dig probability** per road segment (e.g., *"Road X has 78% chance of requiring dig in next 90 days"*)
- Feeds **proactive scheduling** — fix roads before they break

### ⛓️ Blockchain Transparency

- **PermitLedger** Solidity smart contract on **Polygon Mumbai Testnet**
- Every permit submission, approval, clash, and MoU is recorded on-chain
- **Public Explorer**: Any citizen can paste a permit ID and verify the full immutable audit trail
- Anti-corruption by design — not bolted on later

### 🗺️ GIS & Spatial Intelligence

- **Live Trench Map** with permit polygons color-coded by department
- **PostGIS** powered clash detection using `ST_Intersects` and `ST_DWithin` for near-miss warnings
- Real-time visualization of active, approved, and clashed permits

### 👥 Citizen Empowerment

- **Complaint Portal**: File complaints in English or Hinglish — AI auto-classifies and routes
- **Crowdsourced Ground Truth**: Citizens earn points for submitting geo-tagged photos of dig sites
- **Civic Champion** badge system for verified reports
- **Live Route Rerouting**: OSRM-powered alternative routes when digs block roads

### 📋 Officer & Contractor Management

- **Contractor Leaderboard** with performance scores, on-time completion rates, and penalty tracking
- **DigiLocker KYC** verification for contractors
- Automatic **blacklisting** for repeat offenders
- **Department-wise dashboards** with permit lists, clash alerts, and real-time AI agent activity feed

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React 19, Vite 8, Vanilla CSS |
| **Backend** | FastAPI, Uvicorn, Python 3.11+ |
| **Database** | Supabase (PostgreSQL) + PostGIS, SQLAlchemy, AsyncPG |
| **AI / LLM** | Groq (Llama3-70B), Google Gemini, LangGraph |
| **Machine Learning** | scikit-learn, Pandas, NumPy |
| **Blockchain** | Solidity, Web3.py, Polygon Mumbai Testnet |
| **Spatial** | GeoAlchemy2, Shapely, PostGIS (ST_Intersects, ST_DWithin) |
| **PDF Generation** | ReportLab |
| **Testing** | Pytest, pytest-asyncio |

---

## 📁 Project Structure

```
SAMANVAY/
├── frontend/                    # React + Vite frontend
│   ├── src/
│   │   ├── App.jsx              # Main app with all pages & components
│   │   ├── App.css              # Styles & animations
│   │   ├── index.css            # Global styles
│   │   └── main.jsx             # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── samanvay-backend/            # FastAPI backend
│   ├── agents/                  # AI Agent layer
│   │   ├── clash_agent.py       # Clash detection with PostGIS
│   │   ├── negotiation_agent.py # LLM-powered MoU generation
│   │   ├── complaint_agent.py   # NLP complaint classification
│   │   └── scheduler_agent.py   # Dig-Once scheduling optimizer
│   │
│   ├── blockchain/              # On-chain permit ledger
│   │   ├── PermitLedger.sol     # Solidity smart contract
│   │   ├── PermitLedger.abi.json
│   │   └── ledger.py            # Web3.py integration
│   │
│   ├── ml/                      # Machine Learning pipeline
│   │   ├── features.py          # Feature engineering
│   │   ├── train.py             # Model training
│   │   └── predict.py           # Inference
│   │
│   ├── database/                # DB layer
│   │   ├── models.py            # SQLAlchemy models (7 tables)
│   │   ├── connection.py        # Async DB connection
│   │   └── migrations/          # SQL migrations
│   │
│   ├── routers/                 # API endpoints
│   │   ├── permits.py
│   │   ├── departments.py
│   │   ├── contractors.py
│   │   ├── complaints.py
│   │   ├── predictions.py
│   │   ├── agents.py
│   │   └── blockchain.py
│   │
│   ├── utils/                   # Utilities
│   │   ├── geo.py               # Geo helpers
│   │   ├── pdf.py               # MoU PDF generator
│   │   └── scoring.py           # Contractor scoring
│   │
│   ├── main.py                  # FastAPI app entry point
│   ├── .env.example             # Environment variables template
│   └── requirements.txt
│
└── requirements.txt             # Root-level dependencies
```

---

## 📊 Database Schema

The system uses **7 core tables** with PostGIS geometry columns:

| Table | Purpose |
|-------|---------|
| `departments` | Water, Gas, Telecom, Electricity, Municipal |
| `contractors` | Registered contractors with performance tracking |
| `permits` | Dig permits with trench polygons (PostGIS POLYGON) |
| `clashes` | Detected spatial/temporal clashes between permits |
| `complaints` | Citizen complaints with AI classification |
| `road_health` | Road condition data for ML predictions |
| `citizen_points` | Gamification — points for verified reports |
| `agent_logs` | Audit log of all AI agent decisions |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL with PostGIS extension (or Supabase account)
- Groq API key (free tier available)

### 1. Clone the repository

```bash
git clone https://github.com/Padmajakachare1911/SAMANVAY-Agentic-AI-for-Smart-Urban-Infrastructure-Coordination.git
cd SAMANVAY-Agentic-AI-for-Smart-Urban-Infrastructure-Coordination
```

### 2. Backend Setup

```bash
cd samanvay-backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
copy .env.example .env
# Edit .env with your API keys (Supabase, Groq, Polygon, etc.)

# Run the backend
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173` and the API at `http://localhost:8000`.

### 4. Environment Variables

Copy `samanvay-backend/.env.example` to `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public API key |
| `SUPABASE_SERVICE_KEY` | Service role key (server-side) |
| `DATABASE_URL` | PostgreSQL connection string |
| `GROQ_API_KEY` | Groq API key for LLM agents |
| `GEMINI_API_KEY` | Google Gemini API key |
| `POLYGON_RPC_URL` | Polygon Mumbai RPC endpoint |
| `WALLET_PRIVATE_KEY` | Wallet private key for chain writes |
| `CONTRACT_ADDRESS` | Deployed PermitLedger contract address |

---

## 🗺️ Development Roadmap

### Phase 1 — Foundation (Weeks 1–3)
- [x] GIS database schema + department auth (Supabase + PostGIS)
- [x] Blockchain permit ledger schema design (Polygon Mumbai testnet)

### Phase 2 — GIS & Map (Weeks 4–7)
- [x] Live trench map + polygon clash detection (PostGIS ST_Intersects)
- [x] Predictive road-health ML data pipeline

### Phase 3 — AI Agents (Weeks 8–14)
- [x] Clash-detect agent + Dig-Once scheduler (LangGraph)
- [x] Cross-dept AI negotiation engine (LLM-powered MoU generation)
- [x] Predictive road-health ML model (Random Forest)
- [x] NLP complaint parser (Groq/Gemini — Hinglish support)

### Phase 4 — Dashboards (Weeks 15–19)
- [x] Dept officer portal + contractor score tracker
- [ ] Computer vision site QA — contractor upload UI
- [ ] Crowdsourced ground truth — citizen reward UI
- [x] Live route rerouting UI

### Phase 5 — Integrations (Weeks 20–23)
- [ ] WhatsApp / SMS alerts + DigiLocker KYC
- [ ] Blockchain permit ledger — public explorer
- [ ] MoU auto-send + e-sign (DocuSign/DigiSign)

### Phase 6 — Hardening (Weeks 24–26)
- [ ] Load test + security audit + pilot (1 city ward)
- [ ] ML model accuracy review + CV model fine-tune

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/permits` | List all permits |
| `POST` | `/api/v1/permits` | Create a new permit |
| `GET` | `/api/v1/departments` | List departments |
| `GET` | `/api/v1/contractors` | Contractor leaderboard |
| `POST` | `/api/v1/complaints` | File a citizen complaint |
| `GET` | `/api/v1/predictions` | Road health predictions |
| `POST` | `/api/v1/agents/clash-check` | Run clash detection |
| `POST` | `/api/v1/agents/negotiate` | Run AI negotiation |
| `GET` | `/api/v1/blockchain/verify/:tx` | Verify blockchain transaction |
| `GET` | `/health` | Health check |

Full API docs available at `http://localhost:8000/docs` (Swagger UI).

---

## 🧪 Running Tests

```bash
cd samanvay-backend
pytest tests/ -v
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  <strong>🏙️ SAMANVAY — Because every road should only be dug once.</strong>
</p>

<p align="center">
  <em>Built with ❤️ for Indian Smart Cities</em>
</p>
