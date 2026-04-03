# 🏨 Selam Stay — AI-Powered Resort Platform

An AI-powered resort operations and guest experience platform built for Ethiopian hospitality.

## Features
- 🤖 **Selam Bot** — Multilingual AI concierge (English + Amharic) powered by Claude API
- 📊 **Sentiment Analysis** — Real-time guest feedback monitoring with alerts
- 💰 **Dynamic Pricing** — ML-based room pricing engine
- 🔧 **Predictive Maintenance** — Equipment risk scoring
- 📅 **Smart Scheduler** — AI staff scheduling based on occupancy forecast

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- An Anthropic API key

### 1. Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env       # Add your ANTHROPIC_API_KEY
python seed.py                # Seed demo data + train ML models
uvicorn main:app --reload --port 8000
```

### 2. Frontend
```bash
cd frontend
npm install
npm start
```

### 3. Docker (optional)
```bash
cp .env.example .env          # Add your ANTHROPIC_API_KEY
docker-compose up --build
```

Open http://localhost:3000

## Project Structure
```
selam-stay/
├── backend/
│   ├── api/              # FastAPI route handlers
│   ├── ai/               # AI/ML modules
│   ├── models/           # SQLAlchemy DB models
│   ├── services/         # Business logic
│   ├── main.py           # App entry point
│   ├── seed.py           # Demo data seeder
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   └── services/     # API service calls
│   └── package.json
├── ml-models/            # Saved trained models
├── docker-compose.yml
└── .env.example
```

## API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/concierge/chat | Chat with Selam AI |
| GET | /api/maintenance/all | Get all equipment risk scores |
| POST | /api/sentiment/analyze | Analyze feedback sentiment |
| GET | /api/pricing/recommend | Get dynamic price recommendation |
| GET | /api/scheduler/week | Get 7-day staff schedule |
| GET | /api/dashboard/summary | Full dashboard data |
