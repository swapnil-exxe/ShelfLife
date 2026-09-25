import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import FloatingOrbs from "../components/FloatingOrbs";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [links, setLinks] = useState([]);
  const [health, setHealth] = useState(null);
  const [scraperInfo, setScraperInfo] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logCategory, setLogCategory] = useState("");
  const [loading, setLoading] = useState(true);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [userStatusFilter, setUserStatusFilter] = useState("");
  const [linkSearch, setLinkSearch] = useState("");
  const [logSearch, setLogSearch] = useState("");

  // Role Change Confirmation Modal State
  const [roleChangeTarget, setRoleChangeTarget] = useState(null); // { user, newRole }

  // User Detail View Modal State
  const [selectedUserDetail, setSelectedUserDetail] = useState(null); // full data fetched
  const [userDetailTab, setUserDetailTab] = useState("overview"); // overview, activity, logins, sessions, links, rooms, projects, security
  const [userDetailLogs, setUserDetailLogs] = useState([]);
  const [userDetailLogins, setUserDetailLogins] = useState([]);
  const [userDetailSessions, setUserDetailSessions] = useState([]);
  const [userDetailSecurity, setUserDetailSecurity] = useState([]);
  const [userDetailLinks, setUserDetailLinks] = useState([]);
  const [userDetailRooms, setUserDetailRooms] = useState([]);
  const [userDetailProjects, setUserDetailProjects] = useState([]);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Room Activity Modal State
  const [selectedRoomActivity, setSelectedRoomActivity] = useState(null);

  // Link History Modal State
  const [selectedLinkHistory, setSelectedLinkHistory] = useState(null);

  // Create User Modal State
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ username: "", email: "", password: "", role: "user" });
  const [tempPasswordNotice, setTempPasswordNotice] = useState(null);
  const [actionMsg, setActionMsg] = useState("");

  const token = localStorage.getItem("token");
  const authConfig = { headers: { Authorization: `Bearer ${token}` } };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes, scraperRes] = await Promise.all([
        axios.get("/api/admin/dashboard", authConfig),
        axios.get("/api/admin/system/health", authConfig),
        axios.get("/api/admin/scraper/status", authConfig),
      ]);
      setStats(statsRes.data);
      setHealth(healthRes.data);
      setScraperInfo(scraperRes.data);
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userSearch) params.append("search", userSearch);
      if (userRoleFilter) params.append("role", userRoleFilter);
      if (userStatusFilter) params.append("status", userStatusFilter);

      const res = await axios.get(`/api/admin/users?${params.toString()}`, authConfig);
      setUsers(res.data);
    } catch (err) {
      console.error("Fetch users error:", err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/admin/rooms", authConfig);
      setRooms(res.data);
    } catch (err) {
      console.error("Fetch rooms error:", err);
    }
  };

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`/api/admin/links?search=${linkSearch}`, authConfig);
      setLinks(res.data);
    } catch (err) {
      console.error("Fetch links error:", err);
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (logCategory) params.append("category", logCategory);
      if (logSearch) params.append("search", logSearch);
      const res = await axios.get(`/api/admin/activity?${params.toString()}`, authConfig);
      setLogs(res.data.logs || []);
    } catch (err) {
      console.error("Fetch logs error:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "rooms") fetchRooms();
    if (activeTab === "links") fetchLinks();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab, userSearch, userRoleFilter, userStatusFilter, linkSearch, logCategory, logSearch]);

  // Handle Role Change
  const confirmRoleChange = async () => {
    if (!roleChangeTarget) return;
    const { user, newRole } = roleChangeTarget;
    try {
      const res = await axios.put(`/api/admin/users/${user._id}/role`, { role: newRole }, authConfig);
      setActionMsg(res.data.message);
      setRoleChangeTarget(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update role");
    }
  };

  // Open User Detail View Modal
  const openUserDetail = async (user) => {
    setUserDetailLoading(true);
    setUserDetailTab("overview");
    try {
      const [detailRes, activityRes, loginRes, sessionRes, secRes, linkRes, roomRes, projRes] = await Promise.all([
        axios.get(`/api/admin/users/${user._id}`, authConfig),
        axios.get(`/api/admin/users/${user._id}/activity`, authConfig),
        axios.get(`/api/admin/users/${user._id}/login-history`, authConfig),
        axios.get(`/api/admin/users/${user._id}/sessions`, authConfig),
        axios.get(`/api/admin/users/${user._id}/security-events`, authConfig),
        axios.get(`/api/admin/users/${user._id}/links`, authConfig),
        axios.get(`/api/admin/users/${user._id}/rooms`, authConfig),
        axios.get(`/api/admin/users/${user._id}/projects`, authConfig),
      ]);

      setSelectedUserDetail(detailRes.data);
      setUserDetailLogs(activityRes.data.logs || []);
      setUserDetailLogins(loginRes.data || []);
      setUserDetailSessions(sessionRes.data || []);
      setUserDetailSecurity(secRes.data || []);
      setUserDetailLinks(linkRes.data || []);
      setUserDetailRooms(roomRes.data || []);
      setUserDetailProjects(projRes.data || []);
    } catch (err) {
      alert("Failed to fetch user details.");
    } finally {
      setUserDetailLoading(false);
    }
  };

  // Force Logout User
  const handleForceLogout = async (userId, username) => {
    if (!window.confirm(`Terminate all active sessions for ${username}?`)) return;
    try {
      const res = await axios.post(`/api/admin/users/${userId}/force-logout`, {}, authConfig);
      setActionMsg(res.data.message);
      if (selectedUserDetail) {
        openUserDetail(selectedUserDetail.user);
      }
      fetchUsers();
    } catch (err) {
      alert("Force logout failed");
    }
  };

  // Open Room Activity History Modal
  const openRoomActivity = async (room) => {
    try {
      const res = await axios.get(`/api/admin/rooms/${room.roomId}/activity`, authConfig);
      setSelectedRoomActivity(res.data);
    } catch (err) {
      alert("Failed to fetch room activity.");
    }
  };

  // Open Link History Modal
  const openLinkHistory = async (link) => {
    try {
      const res = await axios.get(`/api/admin/links/${link._id}/history`, authConfig);
      setSelectedLinkHistory(res.data);
    } catch (err) {
      alert("Failed to fetch link history.");
    }
  };

  // Export Activity Logs
  const handleExportLogs = (format) => {
    const params = new URLSearchParams();
    params.append("format", format);
    if (logCategory) params.append("category", logCategory);
    const exportUrl = `/api/admin/activity/export?${params.toString()}`;
    
    axios.get(exportUrl, { ...authConfig, responseType: "blob" }).then((response) => {
      const blob = new Blob([response.data], { type: format === "csv" ? "text/csv" : "application/json" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `shelflife-activity-export-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    }).catch(() => alert("Export failed"));
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("/api/admin/users", newUser, authConfig);
      setActionMsg(`User ${res.data.username} created successfully!`);
      setShowCreateUser(false);
      setNewUser({ username: "", email: "", password: "", role: "user" });
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to create user");
    }
  };

  const handleToggleUser = async (id) => {
    try {
      const res = await axios.put(`/api/admin/users/${id}/disable`, {}, authConfig);
      setActionMsg(res.data.message);
      fetchUsers();
    } catch (err) {
      alert("Failed to toggle status");
    }
  };

  const handleResetPassword = async (id) => {
    try {
      const res = await axios.post(`/api/admin/users/${id}/reset-password`, {}, authConfig);
      setTempPasswordNotice({ id, password: res.data.temporaryPassword });
    } catch (err) {
      alert("Failed to reset password");
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user and all their links?")) return;
    try {
      await axios.delete(`/api/admin/users/${id}`, authConfig);
      setActionMsg("User deleted successfully.");
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const handleDeleteRoom = async (id) => {
    if (!window.confirm("Delete this room and all contained links?")) return;
    try {
      await axios.delete(`/api/admin/rooms/${id}`, authConfig);
      setActionMsg("Room deleted.");
      fetchRooms();
    } catch (err) {
      alert("Failed to delete room");
    }
  };

  const handleRescrapeLink = async (id) => {
    try {
      setActionMsg("Triggering Python Scrapling scraper...");
      const res = await axios.post(`/api/admin/links/${id}/rescrape`, {}, authConfig);
      setActionMsg(`Link rescraped! Quality score: ${res.data.scrapeData?.quality_score}/100`);
      fetchLinks();
    } catch (err) {
      alert("Rescrape failed");
    }
  };

  const handleTriggerContextSweep = async () => {
    try {
      setActionMsg("Triggering Grounded Context Feed sweep...");
      const res = await axios.post("/api/admin/context-feed/run", {}, authConfig);
      setActionMsg(`Context sweep done: Processed ${res.data.result?.processed || 0} links.`);
    } catch (err) {
      alert("Sweep failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090e", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <FloatingOrbs />
      <Navbar />

      <div style={{ maxWidth: 1440, margin: "90px auto 40px", padding: "0 24px", display: "flex", gap: 24 }}>
        {/* Sidebar */}
        <aside style={{ width: 260, background: "rgba(18, 22, 34, 0.7)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", height: "fit-content" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <h2 style={{ fontSize: 16, color: "#00D6FF", letterSpacing: 1.2, textTransform: "uppercase", margin: 0 }}>Admin Control</h2>
          </div>
          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "overview", label: "📊 Overview Metrics" },
              { id: "users", label: "👥 Users & Roles" },
              { id: "links", label: "🔗 Link Curation & History" },
              { id: "rooms", label: "🏢 Rooms & Weather" },
              { id: "scraper", label: "🤖 Scrapling Python Service" },
              { id: "health", label: "🩺 System Health" },
              { id: "logs", label: "📜 Activity & Security Logs" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "none",
                  textAlign: "left",
                  background: activeTab === tab.id ? "rgba(0, 214, 255, 0.15)" : "transparent",
                  color: activeTab === tab.id ? "#00D6FF" : "rgba(255,255,255,0.7)",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Area */}
        <main style={{ flex: 1, background: "rgba(18, 22, 34, 0.5)", borderRadius: 16, padding: 24, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}>
          {actionMsg && (
            <div style={{ background: "rgba(0, 214, 255, 0.1)", border: "1px solid #00D6FF", color: "#00D6FF", padding: "12px 16px", borderRadius: 8, marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{actionMsg}</span>
              <button onClick={() => setActionMsg("")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && stats && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>System Dashboard & Control Overview</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }}>
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>TOTAL USERS</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#00D6FF" }}>{stats.users?.total || 0}</div>
                  <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>{stats.users?.active || 0} active • {stats.users?.disabled || 0} disabled</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>ACTIVE SESSIONS & LOGINS TODAY</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#7C3AED" }}>{stats.sessions?.active || 0}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{stats.sessions?.loginsToday || 0} logins today</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>TOTAL LINKS</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#38bdf8" }}>{stats.links?.total || 0}</div>
                  <div style={{ fontSize: 12, color: "#38bdf8", marginTop: 4 }}>+{stats.links?.addedToday || 0} added today</div>
                </div>

                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>ROOMS / SHELVES</div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: "#fbbf24" }}>{stats.rooms?.total || 0}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{stats.rooms?.public || 0} public • {stats.rooms?.private || 0} private</div>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 24, margin: 0 }}>User Management & Role Control</h2>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Manage roles, view user activity, force logout sessions</div>
                </div>
                <button onClick={() => setShowCreateUser(true)} style={{ background: "#00D6FF", color: "#000", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>+ Create User</button>
              </div>

              {/* Filters */}
              <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ flex: 1, padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
                <select value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value)} style={{ padding: 12, borderRadius: 8, background: "rgba(18,22,34,0.9)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                  <option value="">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                <select value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value)} style={{ padding: 12, borderRadius: 8, background: "rgba(18,22,34,0.9)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>USER</th>
                    <th style={{ padding: 12 }}>ROLE</th>
                    <th style={{ padding: 12 }}>STATUS</th>
                    <th style={{ padding: 12 }}>STATS</th>
                    <th style={{ padding: 12 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: 12 }}>
                        <button onClick={() => openUserDetail(u)} style={{ background: "none", border: "none", color: "#00D6FF", cursor: "pointer", fontWeight: 700, padding: 0, textAlign: "left", fontSize: 15 }}>
                          {u.username}
                        </button>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: 12 }}>
                        <select
                          value={u.role || "user"}
                          onChange={(e) => setRoleChangeTarget({ user: u, newRole: e.target.value })}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 700,
                            background: u.role === "admin" ? "rgba(124, 58, 237, 0.3)" : "rgba(255,255,255,0.1)",
                            color: u.role === "admin" ? "#c084fc" : "#ccc",
                            border: u.role === "admin" ? "1px solid #7C3AED" : "1px solid rgba(255,255,255,0.2)",
                            cursor: "pointer",
                          }}
                        >
                          <option value="user" style={{ background: "#121622", color: "#fff" }}>user</option>
                          <option value="admin" style={{ background: "#121622", color: "#c084fc" }}>admin</option>
                        </select>
                      </td>
                      <td style={{ padding: 12 }}>
                        <span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 12, background: u.isActive !== false ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)", color: u.isActive !== false ? "#4ade80" : "#f87171" }}>
                          {u.isActive !== false ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td style={{ padding: 12, fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                        {u.linkCount || 0} links • {u.roomCount || 0} rooms
                      </td>
                      <td style={{ padding: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                        <button onClick={() => openUserDetail(u)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0, 214, 255, 0.4)", background: "rgba(0, 214, 255, 0.1)", color: "#00D6FF", cursor: "pointer", fontSize: 12 }}>View Details</button>
                        <button onClick={() => handleForceLogout(u._id, u.username)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(245, 158, 11, 0.4)", background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", cursor: "pointer", fontSize: 12 }}>Force Logout</button>
                        <button onClick={() => handleToggleUser(u._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 12 }}>{u.isActive !== false ? "Disable" : "Enable"}</button>
                        <button onClick={() => handleResetPassword(u._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(251, 191, 36, 0.4)", background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", cursor: "pointer", fontSize: 12 }}>Reset Pass</button>
                        <button onClick={() => handleDeleteUser(u._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(248, 113, 113, 0.4)", background: "rgba(248, 113, 113, 0.1)", color: "#f87171", cursor: "pointer", fontSize: 12 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* LINKS TAB */}
          {activeTab === "links" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 24 }}>Link Curation & Life Cycle History</h2>
                <button onClick={handleTriggerContextSweep} style={{ background: "#7C3AED", color: "#fff", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>⚡ Run Context Sweep</button>
              </div>

              <input
                type="text"
                placeholder="Search links by title or URL..."
                value={linkSearch}
                onChange={(e) => setLinkSearch(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", marginBottom: 20 }}
              />

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>TITLE & URL</th>
                    <th style={{ padding: 12 }}>CURATOR</th>
                    <th style={{ padding: 12 }}>VIBE</th>
                    <th style={{ padding: 12 }}>DECAY</th>
                    <th style={{ padding: 12 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {links.map((l) => (
                    <tr key={l._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: 12 }}>
                        <strong>{l.icon} {l.title}</strong>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{l.originalUrl}</div>
                      </td>
                      <td style={{ padding: 12 }}>{l.user?.username || "Unknown"}</td>
                      <td style={{ padding: 12 }}><span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "rgba(0,214,255,0.1)", color: "#00D6FF" }}>{l.vibe}</span></td>
                      <td style={{ padding: 12 }}>{l.decay}%</td>
                      <td style={{ padding: 12, display: "flex", gap: 8 }}>
                        <button onClick={() => openLinkHistory(l)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255, 255, 255, 0.2)", background: "transparent", color: "#fff", cursor: "pointer", fontSize: 12 }}>📜 Life Cycle</button>
                        <button onClick={() => handleRescrapeLink(l._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0, 214, 255, 0.4)", background: "rgba(0, 214, 255, 0.1)", color: "#00D6FF", cursor: "pointer", fontSize: 12 }}>🤖 Rescrape</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === "rooms" && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>Collaborative Rooms & Aggregated Weather</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>ROOM NAME & ID</th>
                    <th style={{ padding: 12 }}>CREATOR</th>
                    <th style={{ padding: 12 }}>VISIBILITY</th>
                    <th style={{ padding: 12 }}>MEMBERS</th>
                    <th style={{ padding: 12 }}>LINKS</th>
                    <th style={{ padding: 12 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((r) => (
                    <tr key={r._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: 12 }}>
                        <strong>{r.name}</strong>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>ID: {r.roomId}</div>
                      </td>
                      <td style={{ padding: 12 }}>{r.createdBy?.username || "Unknown"}</td>
                      <td style={{ padding: 12 }}><span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: r.isPublic ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.1)", color: r.isPublic ? "#4ade80" : "#ccc" }}>{r.isPublic ? "Public" : "Private"}</span></td>
                      <td style={{ padding: 12 }}>{r.memberCount || 1}</td>
                      <td style={{ padding: 12 }}>{r.linkCount || 0}</td>
                      <td style={{ padding: 12, display: "flex", gap: 8 }}>
                        <button onClick={() => openRoomActivity(r)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0, 214, 255, 0.4)", background: "rgba(0, 214, 255, 0.1)", color: "#00D6FF", cursor: "pointer", fontSize: 12 }}>🌤️ Room Activity</button>
                        <button onClick={() => handleDeleteRoom(r._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(248, 113, 113, 0.4)", background: "rgba(248, 113, 113, 0.1)", color: "#f87171", cursor: "pointer", fontSize: 12 }}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* PYTHON SCRAPER TAB */}
          {activeTab === "scraper" && scraperInfo && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>Python Scrapling Microservice</h2>
              <div style={{ background: "rgba(0,214,255,0.05)", border: "1px solid rgba(0,214,255,0.2)", padding: 20, borderRadius: 12, marginBottom: 20 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: scraperInfo.health?.status === "ONLINE" ? "#4ade80" : "#f87171" }}>
                  Status: {scraperInfo.health?.status || "OFFLINE"}
                </div>
                <div style={{ marginTop: 8, fontSize: 14, color: "rgba(255,255,255,0.7)" }}>
                  Engine: Python FastAPI Scrapling Async Engine (Port 8001)
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM HEALTH TAB */}
          {activeTab === "health" && health && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>System Health & Service Metrics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { name: "MongoDB Database", status: health.database },
                  { name: "Node.js REST API", status: health.nodeApi },
                  { name: "Python Scraper API", status: health.pythonScraper },
                  { name: "Socket.io Realtime", status: health.socketServer },
                  { name: "Groq Llama 3.3 API", status: health.groqApi },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{s.name}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.status === "ONLINE" ? "#4ade80" : "#f87171", marginTop: 4 }}>{s.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === "logs" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 24, margin: 0 }}>System Activity & Security Audit Trail</h2>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>Filter activity logs by category and export data</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => handleExportLogs("csv")} style={{ background: "rgba(0, 214, 255, 0.15)", border: "1px solid #00D6FF", color: "#00D6FF", padding: "8px 14px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>📥 Export CSV</button>
                  <button onClick={() => handleExportLogs("json")} style={{ background: "rgba(124, 58, 237, 0.15)", border: "1px solid #7C3AED", color: "#c084fc", padding: "8px 14px", borderRadius: 8, fontWeight: 600, cursor: "pointer", fontSize: 13 }}>📥 Export JSON</button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
                {["", "AUTH", "USER", "LINK", "PROJECT", "ROOM", "COLLABORATION", "SECURITY", "ADMIN", "SCRAPER", "SYSTEM"].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setLogCategory(cat)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 20,
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      background: logCategory === cat ? "#00D6FF" : "rgba(255,255,255,0.08)",
                      color: logCategory === cat ? "#000" : "rgba(255,255,255,0.7)",
                      cursor: "pointer",
                    }}
                  >
                    {cat || "ALL CATEGORIES"}
                  </button>
                ))}
              </div>

              <input
                type="text"
                placeholder="Search audit logs by action, target, or IP..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", marginBottom: 20 }}
              />

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>TIMESTAMP</th>
                    <th style={{ padding: 12 }}>USER</th>
                    <th style={{ padding: 12 }}>CATEGORY</th>
                    <th style={{ padding: 12 }}>ACTION</th>
                    <th style={{ padding: 12 }}>TARGET</th>
                    <th style={{ padding: 12 }}>IP ADDRESS</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: 12, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{new Date(log.timestamp || log.createdAt).toLocaleString()}</td>
                      <td style={{ padding: 12 }}>{log.user?.username || "System/Public"}</td>
                      <td style={{ padding: 12 }}><span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "rgba(255,255,255,0.1)", color: "#ccc" }}>{log.category}</span></td>
                      <td style={{ padding: 12 }}><span style={{ color: "#00D6FF", fontWeight: 600 }}>{log.action}</span></td>
                      <td style={{ padding: 12, fontSize: 13 }}>{log.targetType ? `${log.targetType} (${log.targetId || ""})` : "-"}</td>
                      <td style={{ padding: 12, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{log.ipAddress || "local"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* ROLE CHANGE CONFIRMATION MODAL */}
      {roleChangeTarget && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#121622", border: "1px solid #7C3AED", padding: 32, borderRadius: 16, width: 420, textAlign: "center" }}>
            <h3 style={{ fontSize: 20, margin: "0 0 12px 0", color: "#c084fc" }}>Confirm Role Update</h3>
            <p style={{ color: "rgba(255,255,255,0.8)", marginBottom: 20 }}>
              Are you sure you want to change role for <strong>{roleChangeTarget.user.username}</strong> from <strong>{roleChangeTarget.user.role || "user"}</strong> to <strong>{roleChangeTarget.newRole}</strong>?
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={confirmRoleChange} style={{ flex: 1, padding: 12, background: "#7C3AED", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Confirm Change</button>
              <button onClick={() => setRoleChangeTarget(null)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* USER DETAIL MODAL */}
      {selectedUserDetail && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div style={{ background: "#121622", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, width: "100%", maxWidth: 900, maxHeight: "90vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: 20, margin: 0, color: "#00D6FF" }}>User Detail & History: {selectedUserDetail.user?.username}</h3>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{selectedUserDetail.user?.email} • ID: {selectedUserDetail.user?._id}</div>
              </div>
              <button onClick={() => setSelectedUserDetail(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: "rgba(0,0,0,0.3)", padding: "8px 24px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { id: "overview", label: "📊 Overview" },
                { id: "activity", label: "📜 Activity Log" },
                { id: "logins", label: "🔑 Login History" },
                { id: "sessions", label: "🟢 Active Sessions" },
                { id: "links", label: `🔗 Links (${userDetailLinks.length})` },
                { id: "rooms", label: `🏢 Rooms (${userDetailRooms.length})` },
                { id: "security", label: "🛡️ Security Events" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setUserDetailTab(t.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    fontSize: 12,
                    fontWeight: 600,
                    background: userDetailTab === t.id ? "rgba(0,214,255,0.2)" : "transparent",
                    color: userDetailTab === t.id ? "#00D6FF" : "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
              {userDetailTab === "overview" && (
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Links</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#00D6FF" }}>{selectedUserDetail.stats?.totalLinks || 0}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Total Logins</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#4ade80" }}>{selectedUserDetail.stats?.totalLogins || 0}</div>
                    </div>
                    <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Active Sessions</div>
                      <div style={{ fontSize: 24, fontWeight: 700, color: "#c084fc" }}>{selectedUserDetail.stats?.activeSessions || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {userDetailTab === "activity" && (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      <th style={{ padding: 8 }}>TIME</th>
                      <th style={{ padding: 8 }}>CATEGORY</th>
                      <th style={{ padding: 8 }}>ACTION</th>
                      <th style={{ padding: 8 }}>IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetailLogs.map((l) => (
                      <tr key={l._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                        <td style={{ padding: 8, color: "rgba(255,255,255,0.5)" }}>{new Date(l.timestamp).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>{l.category}</td>
                        <td style={{ padding: 8, color: "#00D6FF" }}>{l.action}</td>
                        <td style={{ padding: 8, color: "rgba(255,255,255,0.5)" }}>{l.ipAddress || "local"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {userDetailTab === "logins" && (
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>
                      <th style={{ padding: 8 }}>LOGIN AT</th>
                      <th style={{ padding: 8 }}>BROWSER & OS</th>
                      <th style={{ padding: 8 }}>IP ADDRESS</th>
                      <th style={{ padding: 8 }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userDetailLogins.map((s) => (
                      <tr key={s._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: 13 }}>
                        <td style={{ padding: 8 }}>{new Date(s.loginAt).toLocaleString()}</td>
                        <td style={{ padding: 8 }}>{s.browser} ({s.operatingSystem})</td>
                        <td style={{ padding: 8, color: "rgba(255,255,255,0.5)" }}>{s.ipAddress || "local"}</td>
                        <td style={{ padding: 8 }}><span style={{ color: s.status === "active" ? "#4ade80" : "#ccc" }}>{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {userDetailTab === "links" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {userDetailLinks.map((link) => (
                    <div key={link._id} style={{ padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <div style={{ fontWeight: 600 }}>{link.icon} {link.title}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{link.originalUrl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROOM ACTIVITY MODAL */}
      {selectedRoomActivity && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 24 }}>
          <div style={{ background: "#121622", border: "1px solid #00D6FF", borderRadius: 16, width: "100%", maxWidth: 700, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 20, color: "#00D6FF", margin: 0 }}>Room Weather & Activity: {selectedRoomActivity.room?.name}</h3>
              <button onClick={() => setSelectedRoomActivity(null)} style={{ background: "none", border: "none", color: "#fff", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>

            <div style={{ background: "rgba(0,214,255,0.05)", padding: 16, borderRadius: 10, border: "1px solid rgba(0,214,255,0.2)", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#00D6FF" }}>Weather State: {selectedRoomActivity.weather?.state}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
                Fresh: {selectedRoomActivity.weather?.freshCount} • Fading: {selectedRoomActivity.weather?.fadingCount} • Expired: {selectedRoomActivity.weather?.expiredCount}
              </div>
            </div>

            <h4 style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>Room Members</h4>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
              {selectedRoomActivity.room?.members?.map((m) => (
                <span key={m._id} style={{ padding: "4px 10px", background: "rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12 }}>{m.username}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUser && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <form onSubmit={handleCreateUser} style={{ background: "#121622", border: "1px solid rgba(255,255,255,0.1)", padding: 32, borderRadius: 16, width: 400, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 20 }}>Create User Account</h3>
            <input type="text" placeholder="Username" required value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            <input type="email" placeholder="Email Address" required value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            <input type="password" placeholder="Password" required value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }} />
            <select value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} style={{ padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button type="submit" style={{ flex: 1, padding: 12, background: "#00D6FF", color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Create</button>
              <button type="button" onClick={() => setShowCreateUser(false)} style={{ flex: 1, padding: 12, background: "rgba(255,255,255,0.1)", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer" }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* TEMP PASSWORD NOTICE MODAL */}
      {tempPasswordNotice && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div style={{ background: "#121622", border: "1px solid #fbbf24", padding: 32, borderRadius: 16, width: 400, textAlign: "center" }}>
            <h3 style={{ color: "#fbbf24", fontSize: 20 }}>Password Reset Success</h3>
            <p style={{ marginTop: 12, color: "rgba(255,255,255,0.7)" }}>Temporary password generated (shown once):</p>
            <div style={{ background: "rgba(251,191,36,0.1)", color: "#fbbf24", fontSize: 22, fontWeight: 700, padding: 16, borderRadius: 8, margin: "16px 0", letterSpacing: 2 }}>{tempPasswordNotice.password}</div>
            <button onClick={() => setTempPasswordNotice(null)} style={{ width: "100%", padding: 12, background: "#fbbf24", color: "#000", border: "none", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
