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

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.user?.role || payload.role;

      if (role === "admin") {
        setIsAdmin(true);
      } else {
        // Fetch current user details from API as fallback
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
    } catch {
      setIsAdmin(false);
    }
  }, [token]);

  if (!token) return <Navigate to="/login" replace />;
  if (isAdmin === null) return <div style={{ color: "#00D6FF", padding: 40, textAlign: "center" }}>Verifying Admin Access...</div>;
  if (!isAdmin) return <Navigate to="/" replace />;

  return <Outlet />;
};

export default AdminRoute;
