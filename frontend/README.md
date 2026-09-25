# 💻 SHELFLIFE — Frontend Application (`frontend/`)

The frontend of **SHELFLIFE** is a modern, single-page web application (SPA) built with **React 18**, **Vite 8**, **Tailwind CSS**, and **Framer Motion**, delivering a futuristic glassmorphic UI aesthetic.

---

## 📁 Directory Structure

```text
frontend/
├── package.json               # Frontend dependencies (React, Vite, Socket.io-client, Axios)
├── vite.config.js             # Vite configuration & dev server proxy settings
├── index.html                 # Main HTML entrypoint
├── public/                    # Static branding & downloadable extension package
│   ├── favicon.svg
│   ├── brand-logo-v2.png
│   ├── icons.svg
│   └── shelflife-extension.zip # Auto-downloadable Chrome extension zip package
└── src/
    ├── main.jsx               # React DOM rendering entrypoint
    ├── App.jsx                # Application Router & Global Context Providers
    ├── App.css                # Global App container styles
    ├── index.css              # Custom Glassmorphism styles & Tailwind directives
    ├── hooks/
    │   └── useSocket.js       # Custom Socket.io hook for real-time room sync
    ├── components/
    │   ├── Navbar.jsx         # Transparent floating navbar with Admin button & Profile controls
    │   ├── ProtectedRoute.jsx # User authentication route guard
    │   ├── AdminRoute.jsx     # Strict Admin role route guard
    │   ├── ExtensionModal.jsx # Auto-download modal for Chrome Extension
    │   ├── SummaryModal.jsx   # AI-generated content summary & vibe preview modal
    │   ├── FloatingOrbs.jsx   # Hardware-accelerated canvas background graphics
    │   ├── RadialProgress.jsx # Shelf-life decay progress ring
    │   └── ScrollAnimationCanvas.jsx # Canvas interactive background
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

In the `frontend/` directory, you can run:

### `npm run dev`
Starts the Vite development server on `http://localhost:5173` with Hot Module Replacement (HMR).

### `npm run build`
Bundles the frontend application for production deployment into the `dist/` directory.

### `npm run preview`
Locally previews the production build.

---

## 🎨 UI & Design Highlights

1. **Transparent Un-scrolled Navbar**: Navbar background is completely transparent at the top of pages, smoothly transitioning into a glassmorphic blur container (`rgba(10, 14, 23, 0.85)`) on scroll down.
2. **1-Click Demo Logins**: Dedicated `🎓 Student` (`student@gmail.com`) and `🛡️ Admin` (`admin@gmail.com`) quick-login buttons on the `/login` screen.
3. **Editable Profile**: Edit username, email, and password directly within the `Profile.jsx` edit modal.
4. **Disables Browser Autofill**: Input fields use `autoComplete="off"` and custom field identifiers to eliminate dark browser password manager overlays.
