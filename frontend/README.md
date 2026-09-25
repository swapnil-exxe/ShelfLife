# 💻 SHELFLIFE — Frontend Application (`frontend/`)

[![Vercel Live](https://img.shields.io/badge/Vercel-Production%20Live-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://shelf-life-rust-kappa.vercel.app)

The frontend of **SHELFLIFE** is a single-page web application (SPA) built with **React 18**, **Vite 8**, **Tailwind CSS**, and **Framer Motion**, delivering a glassmorphic UI aesthetic.

- **Production Live URL**: [https://shelf-life-rust-kappa.vercel.app](https://shelf-life-rust-kappa.vercel.app)
- **Production Backend URL**: [https://shelflife-67gn.onrender.com](https://shelflife-67gn.onrender.com)

---

## 📁 Directory Structure

```text
frontend/
├── package.json               # Frontend dependencies (React, Vite, Socket.io-client, Axios)
├── vite.config.js             # Vite configuration & production backend proxy target
├── index.html                 # Main HTML entrypoint
├── public/                    # Static branding & downloadable extension package
│   ├── favicon.svg
│   ├── brand-logo-v2.png
│   ├── icons.svg
│   └── shelflife-extension.zip # Downloadable Chrome extension zip package
└── src/
    ├── main.jsx               # React DOM entrypoint & Axios baseURL configuration
    ├── App.jsx                # Application Router & Global Context Providers
    ├── App.css                # Global App container styles
    ├── index.css              # Glassmorphic styling & CSS directives
    ├── hooks/
    │   └── useSocket.js       # Real-time Socket.io hook for room sync & Shelf Weather
    ├── components/
    │   ├── Navbar.jsx         # Transparent floating navbar with Admin controls
    │   ├── ProtectedRoute.jsx # User authentication route guard
    │   ├── AdminRoute.jsx     # Strict Admin role route guard
    │   ├── ExtensionModal.jsx # Download modal for Chrome Extension
    │   ├── SummaryModal.jsx   # AI-generated content summary preview modal
    │   ├── FloatingOrbs.jsx   # Canvas ambient background graphics
    │   ├── RadialProgress.jsx # Biological link decay progress ring
    │   └── ScrollAnimationCanvas.jsx # Interactive canvas graphics
    └── pages/
        ├── Home.jsx           # Landing / Hero showcase page
        ├── Login.jsx          # Login & 1-Click Demo Login (Student & Admin options)
        ├── Register.jsx       # User registration page
        ├── Dashboard.jsx      # Personal Link Vault & Life Expectancy visualizer
        ├── Profile.jsx        # User Profile & Profile Edit modal (Name/Email/Password)
        ├── RoomGate.jsx       # Collaborative Room entrance & creation modal
        ├── Graveyard.jsx      # Expired links compost heap archive
        ├── AdminDashboard.jsx # Extended Admin Control Dashboard & User Activity System
        └── Hyperspeed.jsx     # Hyperspeed canvas background component
```

---

## 🚀 Available Scripts

In the `frontend/` directory:

### `npm run dev`
Starts the Vite development server on `http://localhost:5173` with Hot Module Replacement (HMR).

### `npm run build`
Bundles the frontend application for production deployment into the `dist/` directory.

### `npm run preview`
Previews the production build locally.

---

## 🎨 UI & Design Highlights

1. **Transparent Un-scrolled Navbar**: Navbar background is completely transparent at the top of pages, transitioning into a glassmorphic blur container (`rgba(10, 14, 23, 0.85)`) on scroll down.
2. **1-Click Demo Logins**: Dedicated `🎓 Student` (`student@gmail.com`) and `🛡️ Admin` (`admin@gmail.com`) quick-login buttons on the `/login` screen.
3. **Editable Profile**: Edit username, email, and password directly within the `Profile.jsx` edit modal.
4. **Disables Browser Autofill**: Input fields use `autoComplete="off"` and custom field identifiers to eliminate dark browser password manager overlays.
