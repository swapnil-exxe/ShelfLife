# 🌿 SHELFLIFE — The Resurrection of the Living Archive 📈

[![Vercel Deployment](https://img.shields.io/badge/Frontend-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://shelf-life-rust-kappa.vercel.app)
[![Render Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://shelflife-67gn.onrender.com/api/health)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://cloud.mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](#-license)

> **Architecture**: Production Monorepo (`frontend/` + `backend/`)  
> **Tech Stack**: React 18 &middot; Vite 8 &middot; Node.js Express &middot; Python Scrapling &middot; Groq AI &middot; Socket.io &middot; MongoDB Atlas &middot; Chrome Extension V3

SHELFLIFE is an AI-augmented web curation platform designed to fight the "Digital Graveyard" of forgotten tabs and broken bookmarks. Instead of static lists, SHELFLIFE creates an ecosystem that organizes itself, summarizes web content using Groq AI, tracks biological link decay over a 30-day lifecycle, and enables real-time room collaboration with live "Shelf Weather".

---

## 🌐 Live Production Deployments

- **🌐 Live Web Application (Vercel)**: [https://shelf-life-rust-kappa.vercel.app](https://shelf-life-rust-kappa.vercel.app)
- **⚙️ Live Backend REST API (Render)**: [https://shelflife-67gn.onrender.com/api/health](https://shelflife-67gn.onrender.com/api/health)
- **📦 Cloud Database**: MongoDB Atlas (AWS / Mumbai)

---

## 🏗️ Production Repository Architecture

The codebase strictly consists of **TWO** clean top-level application directories:

```text
ShelfLife/
├── frontend/                   # React 18 SPA Client (Vite 8, Tailwind CSS, Framer Motion)
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── public/                 # Static branding & downloadable extension package
│   │   ├── favicon.svg
│   │   ├── brand-logo-v2.png
│   │   ├── icons.svg
│   │   └── shelflife-extension.zip # Downloadable Chrome Extension Zip
│   └── src/
│       ├── components/         # Navbar, Modals, Canvas graphics, Route guards
│       ├── hooks/              # Real-time WebSocket hook (useSocket.js)
│       └── pages/              # Home, Login, Register, Dashboard, Profile, Admin, Rooms, Graveyard
│
├── backend/                    # Core REST API, Socket.io Server & Python Scraper Service
│   ├── .env                    # Environment secrets (MONGO_URI, JWT_SECRET, GROQ_API_KEY)
│   ├── package.json
│   ├── server.js               # Node.js Express & Socket.io server entrypoint
│   ├── controllers/            # User, Admin, Link, Room, Project handlers
│   ├── middlewares/            # JWT authentication & strict Admin role verification
│   ├── models/                 # Mongoose schemas (User, Link, Room, Project, ActivityLog, Sessions)
│   ├── routes/                 # Express API routing tables (/api/*)
│   ├── services/               # Activity logger, CSV exporter & Context feed worker
│   ├── scraper/                # FastAPI Python Web Scraper Microservice (Scrapling crawler)
│   ├── extension/              # Manifest V3 Chrome Extension source code
│   ├── scripts/                # Repository audit & maintenance utilities
│   └── tests/                  # Integration test suite
│
├── package.json                # Monorepo orchestration scripts
├── README.md                   # System documentation
└── .gitignore                  # Source control exclusion list
```

---

## ⚡ Quick Start & Setup Instructions

### Prerequisites
- **Node.js**: v18+ or v24+
- **Python**: v3.10+ (with `requirements.txt` installed in `backend/scraper/`)
- **MongoDB Atlas** or Local MongoDB (`mongodb://127.0.0.1:27017/shelflife_db`)

### 1-Command Startup (Runs All Services Concurrently)
```bash
npm install
npm run dev
```

### Individual Service Launch Commands
| Service | Location | Command | Port / URL |
| :--- | :--- | :--- | :--- |
| **Frontend Client** | `frontend/` | `npm --prefix frontend run dev` | `http://localhost:5173` |
| **Backend REST Server** | `backend/` | `npm --prefix backend run start` | `http://localhost:5001` |
| **Python Scraper API** | `backend/scraper/` | `PYTHONPATH=backend python3 backend/scraper/app.py` | `http://localhost:8001` |

---

## 🔑 Demo Access Credentials

Log in using these pre-configured 1-click credentials directly from the `/login` screen:

| Role | Email | Password | Access & Features |
| :--- | :--- | :--- | :--- |
| **🛡️ Admin** | `admin@gmail.com` | `adminpassword` | Complete Admin Control Dashboard (`/admin`), User Role Management (`user` ↔ `admin`), Force Logout, System Health Diagnostics, Security Logs, CSV Export |
| **🎓 Student / User** | `student@gmail.com` | `studentpassword` | Personal Link Vault, Biological Decay Visualization, Collaborative Rooms, Profile Editing, Extension Link Sync |

---

## 🌟 Complete Feature Matrix

### 1. ⏳ Biological Link Decay & Compost Heap (Graveyard)
- **0–14 Days (Grace Period)**: Links remain 100% vibrant with full color saturation.
- **15–30 Days (Fading Period)**: Cards gradually desaturate and fade in size.
- **31+ Days (Graveyard Transfer)**: Expired links are automatically moved to the public **Compost Heap (Graveyard)**.
- **Resurrection**: Clicking "Resurrect" resets the link's lifecycle, restoring it to `0%` decay back on the active dashboard.

### 2. 🧠 Groq AI Ingestion & Multi-Model Fallback Engine
- Ingests URLs via the Python Scrapling microservice to extract metadata and page text.
- Passes extracted text to Groq AI SDK with an active multi-model fallback pipeline (`qwen/qwen3.8-27b`, `openai/gpt-oss-20b`, `llama-3.3-70b-versatile`).
- Generates 2–3 sentence executive summaries, assigns vibe categories (*Educational*, *High-Signal*, *Chaotic*, *Insightful*), and computes user interest profile tags.

### 3. 🌧️ Collaborative Rooms & Real-Time "Shelf Weather"
- Multiplayer room shelves powered by **Socket.io**.
- Room activity calculates live **Shelf Weather**:
  - `FOGGY`: Idle or low-activity room shelves.
  - `BREEZY`: Balanced, active editing by room members.
  - `STORMY`: Intense multi-user link additions (triggers real-time rain & lightning visual overlays).

### 4. 🛡️ Admin Control System (`/admin`)
- **Strict Server-Side Guard**: `/api/admin/*` endpoints strictly verify JWT signatures and `role === 'admin'` (`403 Forbidden` for standard users).
- **User Management**: Inspect user activity, statistics, session devices, and toggle roles (`user` ↔ `admin`).
- **Force Logout**: Instantly invalidate active sessions for any account.
- **Audit Logs & Export**: Download activity and security audit logs in formatted CSV or JSON formats.

### 5. 🧩 Chrome Extension V3
- Pre-built Manifest V3 extension available for instant download from the Navbar (`shelflife-extension.zip`).
- Ingests active tab URLs directly into your personal vault or shared room with 1-click.

---

## 🛠️ REST API Endpoints Summary

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/users/register` | Public | Register new user account |
| `POST` | `/api/users/login` | Public | Authenticate user & issue JWT token |
| `GET` | `/api/users/me` | User | Fetch authenticated user profile |
| `PUT` | `/api/users/profile` | User | Update username, email, or password |
| `GET` | `/api/links` | User | Fetch active saved links |
| `POST` | `/api/links/ingest` | User | Ingest URL with Scrapling + Groq AI |
| `PUT` | `/api/links/:id/restore` | User | Resurrect expired link from Graveyard |
| `POST` | `/api/rooms/create` | User | Create password-protected collaborative room |
| `GET` | `/api/admin/dashboard` | Admin | Fetch admin overview metrics |
| `GET` | `/api/admin/system/health`| Admin | Service health diagnostics (Database, Express, Scraper, Groq) |
| `PUT` | `/api/admin/users/:id/role`| Admin | Update user role (`user` / `admin`) |
| `GET` | `/api/admin/activity/export`| Admin | Export audit logs to CSV |
| `GET` | `/api/health/diagnostics` | Public | System uptime & memory diagnostics |

---

## 🔒 Security & Privacy Guarantees

1. **Zero Password Leakage**: Passwords are hashed with `bcryptjs` (salt rounds = 10). Neither plaintext passwords nor hashes are ever stored in audit logs or returned by API endpoints.
2. **Transparent Floating Navbar**: Pure transparent background when un-scrolled at the top of pages, smoothly transitioning into glassmorphic blur on scroll down.
3. **Sensitive Metadata Filtering**: `sanitizeMetadata()` automatically strips keys like `password`, `jwt`, `apiKey`, and `token` prior to logging.

---

## 📜 License

Copyright &copy; 2026 SHELFLIFE Project. All rights reserved.
