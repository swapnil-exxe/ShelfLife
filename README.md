# 🌿 SHELFLIFE

**The Resurrection of the Living Archive.**

SHELFLIFE is a social, AI-augmented curation engine built to fight the "Digital Graveyard" of forgotten tabs and broken bookmarks. Instead of static lists, SHELFLIFE creates a living, breathing ecosystem that organizes itself, summarizes the noise, and physically decays if neglected.

---

## ✨ Core Features

### 1. 🤖 Autonomous AI Ingestion & Web Scraping
*   **What it does:** When you submit a URL, the backend crawls the web page content in real-time.
*   **How it works:**
    *   The link controller fetches the raw HTML using `node-fetch` and parses the main body text using [cheerio](https://cheerio.js.org/).
    *   It communicates with the Groq Cloud API via the `groq-sdk` using the `llama-3.3-70b-versatile` model to generate an accurate, concise 3-sentence executive summary.
    *   If no Groq API Key is configured, it falls back gracefully to a metadata crawler that parses standard HTML open-graph tags.

### 2. ⏳ Biological Decay & Compost Heap (Graveyard)
*   **What it does:** Simulates natural biological decay on your cards based on their age and activity.
*   **How it works:**
    *   The system uses dynamic age decay calculation located in [linkController.js](file:///Users/swapnil/Downloads/ShelfLife-main/server/controllers/linkController.js).
    *   **Grace Period (0-14 days):** Active links retain their full opacity and size.
    *   **Decay Phase (14-30 days):** Links that have not been clicked or updated start to desaturate and shrink proportionally from `0%` to `100%` decay.
    *   **Compost Heap (30+ days):** Links that reach `100%` decay are considered "dead" and are automatically archived and moved to the public Compost Heap (Graveyard).
    *   **Resurrection:** Users can visit the Graveyard and resurrect cards to bring them back to life on the active shelf, resetting their decay counter to `0`.

### 3. 🎨 Semantic Vibe-Engine
*   **What it does:** Auto-classifies bookmarks into visually distinct "Mood Pills" and tags.
*   **How it works:**
    *   The LLM analyzes the sentiment, category, and tone of the scraped text.
    *   It tags each bookmark with vibes (e.g., `Educational`, `Chaotic`, `Deep Dive`, `Vaporwave`, `Productivity`) and automatically sets a corresponding emoji icon (e.g., 📘, ⚡, 🧠, 🌊).

### 4. 🧠 Grounded Context Feed (AI Sweep)
*   **What it does:** Periodically scans your bookmarked cards to check if the referenced web content has changed, become stale, or been succeeded by a newer resource.
*   **How it works:**
    *   Runs in [contextFeedService.js](file:///Users/swapnil/Downloads/ShelfLife-main/server/services/contextFeedService.js) via a recurring background worker sweep.
    *   Uses Groq to compare saved summaries against fresh web results, assigning a confidence rating and categorizing each card's status as `up-to-date`, `updated`, `successor-found`, `stale`, or `unclear`.
    *   If a newer version exists, it identifies the successor URL and links it dynamically on the card detail modal.

### 5. 🔌 Real-Time Synapse (Multiplayer Collaboration)
*   **What it does:** A multiplayer shared workspace where teams can curate shelves together in real-time.
*   **How it works:**
    *   Powered by [socket.io](https://socket.io/) integration in [server.js](file:///Users/swapnil/Downloads/ShelfLife-main/server/server.js).
    *   All edits, additions, movements, and archives are instantly broadcasted to all users in the same room.
    *   **Shelf Weather:** Tracks per-room mouse movements, clicks, and actions. High room activity sets the shelf weather to `STORMY`, moderate activity to `BREEZY`, and idle rooms to `FOGGY`.

---

## 🛠️ Tech Stack & Key Libraries

### Client (Frontend)
*   **Framework:** React 19 with Vite
*   **Animations:** Framer Motion (for smooth micro-animations and physics-based card decay)
*   **Web Graphics:** OGL (WebGL framework for rendering interactive backgrounds)
*   **Routing:** React Router DOM (v7)
*   **Real-time Communication:** Socket.io-client
*   **HTTP Requests:** Axios

### Server (Backend)
*   **Runtime:** Node.js (ES Modules)
*   **Framework:** Express (v5)
*   **Database:** MongoDB Atlas via Mongoose
*   **AI Integration:** Groq SDK (`groq-sdk`)
*   **Web Scraping:** Cheerio & Node-Fetch
*   **Authentication:** JSON Web Tokens (JWT) & bcryptjs
*   **Process Manager:** Nodemon (for development hot-reloads)

---

## 📂 Codebase Architecture

```bash
ShelfLife/
├── client/                     # Frontend Vite React App
│   ├── src/
│   │   ├── components/         # Shared components (Modals, Navbars, Canvas Animations)
│   │   ├── hooks/              # Custom hooks (e.g., useSocket.js)
│   │   ├── pages/              # Page layouts (Dashboard, Graveyard, RoomGate, Login)
│   │   ├── App.jsx             # Main Router and routes
│   │   └── index.css           # Global CSS variables and styles
│   └── vite.config.js          # Vite config (dev server proxy to 127.0.0.1:5001)
│
├── server/                     # Backend Node/Express Server
│   ├── controllers/            # API controller handlers (links, rooms, users, projects)
│   ├── middlewares/            # JWT auth checking middlewares
│   ├── models/                 # Mongoose schemas (Link, Room, User, Project)
│   ├── routes/                 # Express API routes
│   ├── services/               # Background AI Context Sweep worker
│   ├── server.js               # Entry point, Express and Socket.io setups
│   └── .env                    # Local environment variables
```

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   A MongoDB Atlas cluster database

### 1. Backend Configuration
Navigate to the server directory and create a [server/.env](file:///Users/swapnil/Downloads/ShelfLife-main/server/.env) file:
```bash
cd server
npm install
```

Configure your `.env` variables inside [server/.env](file:///Users/swapnil/Downloads/ShelfLife-main/server/.env):
```env
PORT=5001
MONGO_URI=mongodb+srv://swapnil15x_db_user:ShelfLife@cluster0.ko5kzru.mongodb.net/shelflife_db?appName=Cluster0
JWT_SECRET=your_jwt_secret_key_here
GROQ_API_KEY=your_groq_api_key_here
```

Start the backend server in development mode:
```bash
npm run dev
```
The server will start on `http://127.0.0.1:5001` and connect to the MongoDB Atlas database.

### 2. Frontend Configuration
Navigate to the client directory:
```bash
cd ../client
npm install
```

Start the React development server:
```bash
npm run dev
```
The frontend dev server will launch on `http://localhost:5173`. Any API calls to `/api/*` will automatically be proxied to the backend server at `http://127.0.0.1:5001` as configured in [vite.config.js](file:///Users/swapnil/Downloads/ShelfLife-main/client/vite.config.js).

---

## ⚙️ How the Ingestion & Decay Engine Works

### Database Schema - [server/models/Link.js](file:///Users/swapnil/Downloads/ShelfLife-main/server/models/Link.js)
Each link document tracks `decay`, `isArchived`, `roomId`, and `contextFeed` parameters.

### Decay Logic - [server/controllers/linkController.js](file:///Users/swapnil/Downloads/ShelfLife-main/server/controllers/linkController.js)
```javascript
const FADE_START_DAYS = 14;
const FADE_END_DAYS = 30;

const baseTime = new Date(link.updatedAt || link.createdAt).getTime();
const ageDays = Math.max(0, Math.floor((Date.now() - baseTime) / dayMs));

let ageDecay = 0;
if (ageDays >= FADE_END_DAYS) {
  ageDecay = 100; // Will be automatically archived and moved to the Compost Heap
} else if (ageDays > FADE_START_DAYS) {
  ageDecay = Math.round(((ageDays - FADE_START_DAYS) / (FADE_END_DAYS - FADE_START_DAYS)) * 100);
}
```

### Real-Time Updates - [server/server.js](file:///Users/swapnil/Downloads/ShelfLife-main/server/server.js)
Any interaction in a collaborative room emits real-time WebSocket events that synchronize state instantly across all online clients.
