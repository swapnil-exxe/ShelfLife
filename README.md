# 🌿 SHELFLIFE — The Resurrection of the Living Archive

React 19 &middot; Vite 8 &middot; Node.js &middot; Socket.io &middot; MongoDB Atlas &middot; Chrome Extension API

SHELFLIFE is a social, AI-augmented curation engine built to fight the "Digital Graveyard" of forgotten tabs and broken bookmarks. Instead of static lists, SHELFLIFE creates a living, breathing ecosystem that organizes itself, summarizes the noise, and physically decays if neglected.

---

## ✨ Hackathon Achievement
⚡ **Built in a 24-hour sprint by a 4-member team**, engineering a full React web application, Express backend API, Socket.io multiplayer synchronization, and a custom Chrome Extension from scratch.

---

## ✨ Live Demo & Local Credentials
Experience the application running locally or deploy it across cloud systems:

*   **🌐 Frontend Client URL**: `http://localhost:5173`
*   **⚙️ Backend API Server**: `http://localhost:5001`
*   **📦 Cloud Database**: MongoDB Atlas Sandbox

### 🔑 Test Access Credentials
You can log in to the portal using this pre-registered account to explore features:
*   **Email Address**: `student@gmail.com`
*   **Password**: `student123`

---

## 🌟 Real-World Problems Solved

### 1. The "Digital Graveyard" (Tab Overload & Bookmark Rot)
*   **Problem**: Users open dozens of tabs to "read later," only for those tabs to gather dust, clutter browser memory, or become completely forgotten.
*   **Solution**: SHELFLIFE implements **Biological Decay**. If you ignore a saved link, it slowly desaturates and shrinks over a 30-day period. At 100% decay, it is moved to the public **Compost Heap (Graveyard)**. Cards can be "resurrected" back to the active shelf, keeping your dashboard organic and clean.

### 2. High-Noise, Zero-Context Web Bookmarks
*   **Problem**: Copy-pasting links leaves you with long, unreadable URLs or generic titles, offering no insight into the webpage content at a glance.
*   **Solution**: When a URL is ingested, SHELFLIFE automatically scrapes the raw HTML using `cheerio` and uses **Groq AI (Llama-3.3-70b)** to generate a precise 3-sentence executive summary and assign a semantic mood icon.

### 3. Fragmented & Static Link Sharing
*   **Problem**: Sharing bookmarks in messenger group chats is disorganized, making it impossible to curate collections collaboratively in real-time.
*   **Solution**: Integrated **Collaborative Rooms** powered by Socket.io. Multiple users can join a room to curate shelves together in real-time. Room activity is tracked to calculate **Shelf Weather** (idle rooms are `FOGGY`, active rooms are `BREEZY`, and heavy team editing triggers `STORMY` weather with rain overlays).

### 4. Outdated & Dead Links (Stale Resources)
*   **Problem**: Web articles, documentation, or code libraries change, but your saved bookmarks remain frozen in their original state.
*   **Solution**: The **Grounded Context Feed** sweeps the database periodically, checks if the saved URL's page content has evolved, determines if a newer resource exists, and displays updates (or links to successor pages) directly in the card details.

---

## ⚡ Performance & Engineering Optimizations

*   **Socket.io Multi-Room Sync**: Handlers manage room joining and resource sharing. All additions, deletions, projects, and drag-and-drop actions broadcast instantly to all socket nodes in the room.
*   **Dynamic HSL Color Engine**: Badges and background glows utilize a dynamic color-hashing fallback. Custom genres (like *Tech*, *Scientific*, *Creative*) generate unique HSL hues based on their names to create a distinct layout color code.
*   **Chrome Extension Hotkey Ingestion**: A custom extension with a popup form and background service worker allows one-click link submissions. It captures your current active tab title and URL, sending it straight to your personal dashboard.
*   **AI Fallback Mechanisms**: If the Perplexity or Groq API limit is exceeded, the server falls back to an HTML metadata crawler to extract Open Graph tags (`og:description`, `og:title`) so URLs are never lost.
*   **Advanced Webkit Autofill Fixes**: Custom CSS selectors override standard browser autofill behaviors, preventing browser password managers from turning input text black in dark mode templates.

---

## 🛠️ Technology Stack & Languages

| Component | Technology | Use Case |
| :--- | :--- | :--- |
| **Frontend** | React 19 (Vite 8) | Single Page Application UI with React Router v7 and Framer Motion. |
| **Extension** | Chrome Extension V3 | Content script & background workers for one-click bookmarking. |
| **Styling** | Vanilla CSS + Canvas | Sleek dark-mode aesthetic with hardware-accelerated star particles. |
| **Multiplayer** | Socket.io | Real-time workspace synchronization and Shelf Weather tracking. |
| **Backend** | Node.js + Express v5 | RESTful API server with rate-limiting and input sanitization. |
| **Database** | MongoDB Atlas | Managed cloud database with Mongoose indexes. |
| **AI Crawler** | Groq & Cheerio | Real-time scraper with automated Llama summaries. |

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
├── extension/                  # Chrome Extension V3
│   ├── background.js           # Background service worker for active tab capture
│   ├── content.js              # Content scripts
│   ├── manifest.json           # Extension manifest file
│   ├── popup.html              # Extension popup layout
│   └── popup.js                # Extension popup logic
│
└── server/                     # Backend Node/Express Server
    ├── controllers/            # API controller handlers (links, rooms, users, projects)
    ├── middlewares/            # JWT auth checking middlewares
    ├── models/                 # Mongoose schemas (Link, Room, User, Project)
    ├── routes/                 # Express API routes
    ├── services/               # Background AI Context Sweep worker
    ├── server.js               # Entry point, Express and Socket.io setups
    └── .env                    # Local environment variables
```

---

## 📂 Core Database Schema Models

*   **User Model**: Role-based access tokens with encrypted passwords using `bcryptjs` and session tokens.
*   **Link Model**: Holds URL, title, executive summaries, vibe pills, and the contextFeed tracking object (status: `pending`, `success`, `error`).
*   **Room Model**: Defines collaborative room IDs, owner connections, public accessibility flags, and lineages.
*   **Project Model**: Groups links into custom project sub-shelves on your dashboard to keep folders organized.

---

## 🎨 UI/UX Design & Starwarp Aesthetic

*   **Starwarp Hyperspeed Canvas**: The home and login screens feature a canvas-based star warp animation that dynamically speeds up or slows down based on user actions.
*   **Cursor Spotlight hover effects**: Glassmorphic cards dynamically tilt and track mouse coordinates, projecting a subtle color-coded glow matching the card's genre.
*   **Password Visibility (Eye Icon)**: Interactive visibility toggles built inside all login, register, and room forms using premium feather SVG vectors.

---

## 📅 24-Hour Development Timeline & Milestones

SHELFLIFE was built in a rapid 24-hour hackathon. Here is the sprint breakdown:

### ⏱️ Hours 0 - 6: Architecture & Database Ingestion
*   Established standard database schemas for `Link`, `User`, `Room`, and `Project`.
*   Programmed the server routing and integrated `cheerio` parsing with Groq API pipelines to handle real-time metadata scraping.
*   Configured the Vite React client wrapper.

### ⏱️ Hours 6 - 12: Visual Systems & Extensions
*   Coded the glassmorphic dark theme and integrated the WebGL Hyperspeed star warp canvas backgrounds.
*   Created the Chrome Extension V3 setup (manifest, background worker, popup UI) enabling one-click tab capture.
*   Implemented the password visibility eye toggles.

### ⏱️ Hours 12 - 18: Real-Time Synapse & Shelf Weather
*   Integrated Socket.io server listeners and React socket hook sub-routines.
*   Programmed room synchronization so additions reflect instantly for all peers.
*   Created the "Shelf Weather" engine, mapping idle mouse state calculations to weather statuses.

### ⏱️ Hours 18 - 24: Grounded context sweeps & Security
*   Developed the background scheduler (`contextFeedService.js`) to scan links for structural updates.
*   Hardened Express endpoints against NoSQL injection, fixed helmet iframe policies, and resolved Vercel SPA routing problems.
*   Ran code cleanup and verified zero-dependency builds.
