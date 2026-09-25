import React, { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import axios from "axios";

const AdminRoute = () => {
  const token = localStorage.getItem("token");
  const [isAdmin, setIsAdmin] = useState(null);

  useEffect(() => {
    if (!token) {
      setIsAdmin(false);
      return;
    }

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
      axios
        .get("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          if (res.data?.role === "admin" && res.data?.isActive !== false) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
        })
        .catch(() => setIsAdmin(false));
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  if (isAdmin === null) {
    return (
      <div style={{ color: "#00D6FF", background: "#07090e", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontFamily: "sans-serif" }}>
        Verifying Admin Access...
      </div>
    );
  }
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminRoute;
