# ⚙️ SHELFLIFE — Backend Services & REST API (`backend/`)

The backend of **SHELFLIFE** powers the RESTful APIs, Socket.io real-time room synchronization, background context feed sweeps, user activity logging, and houses the **Python Scrapling Web Scraper microservice**.

---

## 📁 Directory Structure

```text
backend/
├── .env                       # Environment variables (MONGO_URI, JWT_SECRET, GROQ_API_KEY)
├── package.json               # Backend Node.js dependencies (Express, Mongoose, Socket.io, Groq)
├── server.js                  # Entrypoint: Express HTTP server & Socket.io listeners
├── controllers/
│   ├── userController.js      # Auth (Register, Login, Me, Profile Edit)
│   ├── adminController.js     # User role mgmt, User detailed stats, Session force-logout, Security events
│   ├── roomController.js      # Room collaboration, real-time sync, weather history
│   ├── linkController.js      # Link CRUD, AI auto-tagging, decay management
│   └── projectController.js   # Project grouping organization
├── middlewares/
│   ├── authMiddleware.js      # JWT Token verification middleware
│   ├── adminMiddleware.js     # Strict role === 'admin' verification middleware
│   └── securityMiddleware.js  # Security headers & rate limiting
├── models/
│   ├── User.js                # User schema (Username, Email, Password Hash, Role)
│   ├── Room.js                # Room schema (Code, Participants, Shared Links)
│   ├── Link.js                # Link schema (URL, Title, Tags, Expiry Date, Decay Level)
│   ├── Project.js             # Project grouping schema
│   ├── UserActivityLog.js     # User activity history & audit logs (No plain passwords logged)
│   ├── UserSession.js         # User login sessions & IP/Device tracking
│   └── AdminAuditLog.js       # Admin actions auditing schema
├── routes/
│   ├── userRoutes.js          # User endpoints (/api/users/*)
│   ├── adminRoutes.js        # Admin endpoints (/api/admin/*)
│   ├── roomRoutes.js         # Room endpoints (/api/rooms/*)
│   ├── linkRoutes.js         # Link endpoints (/api/links/*)
│   ├── projectRoutes.js      # Project endpoints (/api/projects/*)
│   ├── csvRoutes.js          # CSV / JSON activity export endpoints
│   └── diagnostics.js        # Server health diagnostic endpoints
├── services/
│   ├── activityLogger.js     # Activity logging service
│   ├── contextFeedService.js # Collaborative room live feed service
│   ├── csvService.js         # Activity report CSV compiler
│   └── logCleanupJob.js      # Automatic log retention cleanup job
├── scraper/                   # Python Web Scraper Microservice (FastAPI + Scrapling)
│   ├── app.py                 # Scraper server entrypoint (Port 8001)
│   ├── client.py              # Scrapling crawler wrapper
│   ├── extraction.py          # Metadata & article content parser
│   └── requirements.txt       # Python package requirements
├── extension/                 # Chrome Extension V3 source code
├── scripts/                   # System health audit scripts
└── tests/                     # Integration test suite
```

---

## 🔑 Environment Setup (`backend/.env`)

Configure these key/value pairs inside `backend/.env`:

```env
PORT=5001
MONGO_URI=mongodb+srv://swapnil15x_db_user:ShelfLife@cluster0.ko5kzru.mongodb.net/shelflife_db?retryWrites=true&w=majority
JWT_SECRET=supersecretkeyforshelflife
GROQ_API_KEY=gsk_your_groq_api_key_here
SCRAPER_URL=http://127.0.0.1:8001
```

---

## 🚀 Running Backend Services

### Start Express REST API Server (Port 5001)
```bash
npm --prefix backend run start
```

### Start Python Scraper API (Port 8001)
```bash
PYTHONPATH=backend python3 backend/scraper/app.py
```

---

## 🌐 Key REST API Endpoints

### Authentication & Profile
- `POST /api/users/register` — Register new user
- `POST /api/users/login` — Login user & issue JWT token
- `GET /api/users/me` — Fetch currently authenticated user
- `PUT /api/users/profile` — Edit username, email, or password

### Admin Control (`role === 'admin'`)
- `GET /api/admin/dashboard` — Overview metrics
- `GET /api/admin/system/health` — Service health statuses (Database, Express, Scraper, Groq API)
- `GET /api/admin/users` — Paginated user list with role filters
- `PUT /api/admin/users/:id/role` — Update user role (`user` / `admin`)
- `POST /api/admin/users/:id/force-logout` — Terminate all active sessions for a user
- `GET /api/admin/activity` — Retrieve user audit logs & security events
- `GET /api/admin/activity/export/csv` — Export activity logs to CSV format

### Links & AI Summarization
- `GET /api/links` — Fetch active links
- `POST /api/links` — Submit new link (triggers Scrapling extraction & Groq AI summary)
- `DELETE /api/links/:id` — Move link to Compost Heap (Graveyard)
- `PUT /api/links/:id/resurrect` — Restore link from Graveyard back to active shelf

---

## 🧪 Integration Tests

Run backend tests using Node's native test runner:
```bash
node backend/tests/diagnostics.test.js
node backend/tests/admin_upgrade_test.js
node backend/tests/profile_update_test.js
```
