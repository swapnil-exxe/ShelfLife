import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ExtensionModal from "./ExtensionModal";

export default function Navbar({ roomOnlineCount = null }) {
  const [scrolled, setScrolled] = useState(false);
  const [isExtensionModalOpen, setIsExtensionModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const roomId = localStorage.getItem("shelfRoomId");
  const roomName = localStorage.getItem("shelfRoomName");
  const hasActiveSpace = !!roomId;
  const isPersonal = !roomId || roomId.startsWith("PERSONAL_") || roomName === "My Personal Shelf";
  const displayRoomName = isPersonal ? "My Personal Shelf" : (roomName || "Unnamed Shelf");
  const displayRoomId = isPersonal ? null : roomId;

  const showRoomOnlineCount =
    !isPersonal && typeof roomOnlineCount === "number";
  const roomOnlineLabel =
    roomOnlineCount === 1
      ? "1 person in room"
      : `${roomOnlineCount} people in room`;

  const [isAdmin, setIsAdmin] = useState(false);

  let activeNav = "dashboard";
  if (location.pathname === "/graveyard") activeNav = "graveyard";
  if (location.pathname === "/room") activeNav = "room";
  if (location.pathname === "/profile") activeNav = "profile";
  if (location.pathname === "/admin") activeNav = "admin";

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    let role = null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const payload = JSON.parse(jsonPayload);
      role = payload.user?.role || payload.role;
    } catch (e) {}

    if (role === "admin") {
      setIsAdmin(true);
    } else {
      fetch("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.json())
        .then((data) => {
          if (data?.role === "admin") setIsAdmin(true);
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("shelfRoomId");
    localStorage.removeItem("shelfRoomName");
    navigate("/login");
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/" },
    { id: "room", label: "Rooms", icon: "🤝", path: "/room" },
    { id: "graveyard", label: "Graveyard", icon: "🪦", path: "/graveyard" },
    { id: "extension", label: "Extension", icon: "🔌", action: () => setIsExtensionModalOpen(true) },
    { id: "profile", label: "Profile", icon: "👤", path: "/profile" },
    ...(isAdmin ? [{ id: "admin", label: "Admin", icon: "🛡️", path: "/admin" }] : []),
  ];

  let themeColor = "#00D6FF"; // Default Cyan
  if (activeNav === "graveyard") themeColor = "#7C3AED"; // Purple
  if (activeNav === "room") themeColor = "#FF3B30"; // Premium Red Glowing Mark
  if (activeNav === "admin") themeColor = "#00D6FF"; // Admin Cyan Glow

  return (
    <>
      <style>{`
        .shelflife-navbar {
          box-sizing: border-box !important;
        }
        .nav-link-btn {
          font-size: 13px !important;
          padding: 4px 8px !important;
          gap: 5px !important;
        }
        .nav-status-label {
          display: inline-block;
        }
        @media (max-width: 1024px) {
          .nav-link-text {
            display: none;
          }
          .nav-status-label {
            display: none;
          }
        }
      `}</style>
      <nav
        className="shelflife-navbar"
        style={{
          position: "fixed",
          top: scrolled ? 16 : 0,
          left: scrolled ? "50%" : 0,
          transform: scrolled ? "translateX(-50%)" : "none",
          width: scrolled ? "calc(100% - 32px)" : "100%",
          maxWidth: scrolled ? "1240px" : "100%",
          zIndex: 1000,
          height: 64,
          padding: "0 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: scrolled
            ? "rgba(10, 14, 23, 0.85)"
            : "transparent",
          backdropFilter: scrolled ? "blur(24px) saturate(160%)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(24px) saturate(160%)" : "none",
          borderRadius: scrolled ? "24px" : "0px",
          border: scrolled
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "none",
          borderBottom: scrolled
            ? "1px solid rgba(255, 255, 255, 0.08)"
            : "none",
          boxShadow: scrolled
            ? "0 20px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)"
            : "none",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        {/* Left: Logo */}
        <div
          onClick={() => navigate("/")}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            flexShrink: 0,
            transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = "scale(1)";
          }}
        >
          <img
            src="/brand-logo-v2.png"
            alt="ShelfLife Logo"
            style={{
              height: "38px",
              width: "auto",
              objectFit: "contain",
              filter: "drop-shadow(0 2px 12px rgba(255,255,255,0.15))",
            }}
          />
        </div>

        {/* Center: Navigation Items */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginLeft: "16px",
            flexShrink: 0,
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              className="nav-link-btn"
              onClick={() => item.action ? item.action() : navigate(item.path)}
              style={{
                background: "none",
                border: "none",
                color:
                  activeNav === item.id
                    ? "rgba(255,255,255,0.95)"
                    : "rgba(255,255,255,0.55)",
                fontFamily: "'Inter', sans-serif",
                fontWeight: activeNav === item.id ? 600 : 400,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                display: "flex",
                alignItems: "center",
                gap: "5px",
                position: "relative",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
              onMouseOver={(e) => {
                if (activeNav !== item.id)
                  e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              }}
              onMouseOut={(e) => {
                if (activeNav !== item.id)
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
              }}
            >
              <span style={{ fontSize: "14px" }}>{item.icon}</span>
              <span className="nav-link-text">{item.label}</span>

              {/* Active underline indicator */}
              {activeNav === item.id && (
                <div
                  style={{
                    position: "absolute",
                    bottom: -4,
                    left: 0,
                    right: 0,
                    height: 2,
                    background: themeColor,
                    borderRadius: 2,
                    boxShadow: `0 0 10px ${themeColor}`,
                  }}
                />
              )}
              {/* Premium Glowing Red Indicator for Active Room */}
              {activeNav === "room" && item.id === "room" && (
                <div
                  style={{
                    position: "absolute",
                    top: -2,
                    right: -6,
                    width: 6,
                    height: 6,
                    background: "#FF3B30",
                    borderRadius: "50%",
                    boxShadow: "0 0 8px #FF3B30, 0 0 12px #FF3B30",
                  }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Right: Space Info, Status Badge & Logout Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          {hasActiveSpace && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 10px",
                borderRadius: "10px",
                border: isPersonal
                  ? "1px solid rgba(0,214,255,0.25)"
                  : "1px solid rgba(255, 59, 48, 0.25)",
                background: isPersonal
                  ? "rgba(0,214,255,0.08)"
                  : "rgba(255, 59, 48, 0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: "0.06em",
                  color: isPersonal ? "#00D6FF" : "#FF3B30",
                  whiteSpace: "nowrap",
                }}
              >
                {isPersonal ? "PERSONAL" : "ROOM"}
              </span>
              <span
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.9)",
                  maxWidth: 110,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={displayRoomName}
              >
                {displayRoomName}
              </span>
              {!isPersonal && (
                <span
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: "rgba(255,255,255,0.65)",
                    whiteSpace: "nowrap",
                  }}
                >
                  #{displayRoomId}
                </span>
              )}
            </div>
          )}

          {/* Live System Status badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "4px 6px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: themeColor,
                boxShadow: `0 0 10px ${themeColor}`,
                animation: "pulse 2s infinite",
              }}
            />
            <span
              className="nav-status-label"
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.60)",
                fontWeight: 400,
                letterSpacing: "0.2px",
                whiteSpace: "nowrap",
              }}
            >
              {showRoomOnlineCount ? roomOnlineLabel : "System Online"}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            style={{
              padding: "6px 14px",
              borderRadius: "10px",
              border: "1px solid rgba(255,255,255,0.15)",
              background: "rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.95)",
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              fontSize: "12px",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.16)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      <ExtensionModal isOpen={isExtensionModalOpen} onClose={() => setIsExtensionModalOpen(false)} />
    </>
  );
}
