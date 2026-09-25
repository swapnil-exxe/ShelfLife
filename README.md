# 🌿 SHELFLIFE — The Resurrection of the Living Archive 📈

> **Architecture**: Production-Grade Modular Monorepo (`frontend/` + `backend/`)  
> **Tech Stack**: React 18 &middot; Vite 8 &middot; Node.js Express &middot; Python Scrapling &middot; Groq AI &middot; Socket.io &middot; MongoDB Atlas &middot; Chrome Extension V3

SHELFLIFE is a social, AI-augmented curation engine built to fight the "Digital Graveyard" of forgotten tabs and broken bookmarks. Instead of static lists, SHELFLIFE creates a living, breathing ecosystem that organizes itself, summarizes web noise using Groq AI, and physically decays if neglected.

---

## 🏗️ Production Repository Architecture

The codebase is organized into **ONLY TWO** clean top-level application directories:

```text
ShelfLife/
├── frontend/                   # React SPA Client (Vite 8, Tailwind CSS, Framer Motion)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/                 # Assets & downloadable shelflife-extension.zip
│   └── src/
│       ├── components/         # Navbar, Modals, Canvas graphics, Route guards
│       ├── hooks/              # Real-time WebSocket hook (useSocket.js)
│       └── pages/              # Home, Login, Register, Dashboard, Profile, Admin, Rooms, Graveyard
│
├── backend/                    # Core REST API, Socket.io Server & Python Scraper Service
│   ├── package.json
│   ├── server.js               # Node.js Express & Socket.io server entrypoint
│   ├── .env                    # Secret environment variables (MONGO_URI, JWT_SECRET, GROQ_API_KEY)
│   ├── controllers/            # User, Admin, Link, Room, Project handlers
│   ├── middlewares/            # JWT authentication & strict Admin role verification
│   ├── models/                 # Mongoose schemas (User, Link, Room, Project, ActivityLog, Sessions)
│   ├── routes/                 # Express API routing tables (/api/*)
│   ├── services/               # Activity logger, CSV exporter & Context feed background worker
│   ├── scraper/                # FastAPI Python Web Scraper Microservice (Scrapling crawler)
│   ├── extension/              # Manifest V3 Chrome Extension source code
│   ├── scripts/                # Repository audit & maintenance utilities
│   └── tests/                  # Integration test suite
│
├── package.json                # Root orchestration package.json
├── README.md                   # System documentation
└── .gitignore                  # Source control ignore configuration
```

---

## ⚡ Quick Start & Running Services

### Prerequisites
- **Node.js**: v18+ or v24+
- **Python**: v3.10+ (with `requirements.txt` installed in `backend/scraper/`)
- **MongoDB Atlas** or Local MongoDB (`mongodb://127.0.0.1:27017/shelflife_db`)

### 1-Command Startup (Runs All 3 Services Concurrently)
From the root repository directory:
```bash
npm install
npm run dev
```

### Individual Service Launch Commands
| Service | Directory | Command | Port |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | `frontend/` | `npm --prefix frontend run dev` | `http://localhost:5173` |
| **Backend REST API** | `backend/` | `npm --prefix backend run start` | `http://localhost:5001` |
| **Python Scraper API** | `backend/scraper/` | `PYTHONPATH=backend python3 backend/scraper/app.py` | `http://localhost:8001` |

---

## 🔑 Demo & Test Credentials

Use these 1-click credentials directly from the `/login` screen:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `admin@gmail.com` | `admin123` | Full Admin Control Dashboard (`/admin`), User Role Management, System Health, Activity Audit Logs |
| **🎓 Student / User** | `student@gmail.com` | `student123` | Personal Link Vault, Collaborative Rooms, Profile Editing, Extension Link Sync |

---

## 🌟 Key Application Features

### 1. Biological Link Decay & Compost Heap (Graveyard)
- **Problem**: Bookmarks gather dust and clutter browser memory.
- **Solution**: Links undergo a 30-day life cycle. Fresh links stay vibrant for 14 days, gradually desaturate and fade between days 15–30, and move to the public **Compost Heap (Graveyard)** at day 31. Users can "resurrect" decayed links back to their active shelf at any time.

### 2. Groq AI Content Summarization & Multi-Model Engine
- **Engine**: Powered by Groq AI SDK with dynamic fallback models (`qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `llama-3.3-70b-versatile`).
- **Feature**: Automatically ingests URLs, parses raw page content, generates 2-3 sentence executive summaries, assigns vibe categories, and computes user profile interest tags.

### 3. Collaborative Rooms & Real-Time "Shelf Weather"
- **Engine**: Socket.io real-time bidirectional event pipeline.
- **Feature**: Peers join shared room IDs to curate links together. Room activity calculates live **Shelf Weather**:
  - `FOGGY`: Idle or low-activity rooms.
  - `BREEZY`: Balanced, active shelf editing.
  - `STORMY`: Heavy multi-user link curation (triggers animated rain & lightning visual overlays).

### 4. Complete Admin Control System (`/admin`)
- **Strict Role-Based Access**: Backend routes (`/api/admin/*`) independently verify JWT signature and `role === 'admin'`.
- **User Activity Audit System**: Log user logins, session devices, role changes, and room collaboration events while preserving privacy. **Zero plain passwords, hashes, JWTs, or API keys are ever stored or exposed.**
- **Force Logout**: Admin can immediately invalidate all active sessions for any user.
- **Activity Exports**: One-click CSV and JSON exports for user security and system activity history.

### 5. Automated Chrome Extension V3
- **Auto-Package Download**: Click "Extension" in the Navbar to trigger an instant download of `shelflife-extension.zip` containing the pre-built Manifest V3 extension.
- **One-Click Link Saving**: Captures current browser tabs and saves them directly into your personal shelf or shared room.

---

## 🛠️ Security & Privacy Enforcements

1. **Zero Secret Exposure**: Passwords are hashed with `bcryptjs` (salt round 10). Password reset actions emit audit logs containing user IDs and timestamps, never plain passwords or hashes.
2. **Transparent Floating Navbar**: The navbar uses a pure transparent background when un-scrolled at the top of the page, transitioning to glassmorphic blur on scroll.
3. **Input Sanitization & Rate Limiting**: All REST endpoints are guarded by Express `generalLimiter` and HTML input sanitizers (`sanitizeAndValidateInput`).

---

## 📜 License

Copyright &copy; 2026 SHELFLIFE Personal Project. All rights reserved.
