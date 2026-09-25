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
  const [loading, setLoading] = useState(true);

  // Filter & Search states
  const [userSearch, setUserSearch] = useState("");
  const [linkSearch, setLinkSearch] = useState("");

  // Modal states
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
      const res = await axios.get(`/api/admin/users?search=${userSearch}`, authConfig);
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRooms = async () => {
    try {
      const res = await axios.get("/api/admin/rooms", authConfig);
      setRooms(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLinks = async () => {
    try {
      const res = await axios.get(`/api/admin/links?search=${linkSearch}`, authConfig);
      setLinks(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await axios.get("/api/admin/activity", authConfig);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers();
    if (activeTab === "rooms") fetchRooms();
    if (activeTab === "links") fetchLinks();
    if (activeTab === "logs") fetchLogs();
  }, [activeTab, userSearch, linkSearch]);

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
      setActionMsg(`Context sweep done: Processed ${res.data.result.processed} links.`);
    } catch (err) {
      alert("Sweep failed");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#07090e", color: "#fff", fontFamily: "'Inter', sans-serif" }}>
      <FloatingOrbs />
      <Navbar />

      <div style={{ maxWidth: 1400, margin: "90px auto 40px", padding: "0 24px", display: "flex", gap: 24 }}>
        {/* Sidebar */}
        <aside style={{ width: 260, background: "rgba(18, 22, 34, 0.7)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)", height: "fit-content" }}>
          <h2 style={{ fontSize: 16, color: "#00D6FF", letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 20 }}>Admin Panel</h2>
          <nav style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { id: "overview", label: "📊 Overview" },
              { id: "users", label: "👥 Users" },
              { id: "links", label: "🔗 Links" },
              { id: "rooms", label: "🏢 Rooms" },
              { id: "scraper", label: "🤖 Python Scraper" },
              { id: "health", label: "🩺 System Health" },
              { id: "logs", label: "📜 Audit Logs" },
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
            <div style={{ background: "rgba(0, 214, 255, 0.1)", border: "1px solid #00D6FF", color: "#00D6FF", padding: "12px 16px", borderRadius: 8, marginBottom: 20, display: "flex", justifyContent: "space-between" }}>
              <span>{actionMsg}</span>
              <button onClick={() => setActionMsg("")} style={{ background: "none", border: "none", color: "#fff", cursor: "pointer" }}>✕</button>
            </div>
          )}

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && stats && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>System Overview</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { label: "Total Users", val: stats.users, sub: `${stats.activeUsers} active` },
                  { label: "Total Links", val: stats.links },
                  { label: "Total Rooms", val: stats.rooms },
                  { label: "Total Projects", val: stats.projects },
                ].map((card, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#00D6FF" }}>{card.val}</div>
                    {card.sub && <div style={{ fontSize: 12, color: "#4ade80", marginTop: 4 }}>{card.sub}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === "users" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <h2 style={{ fontSize: 24 }}>User Management</h2>
                <button onClick={() => setShowCreateUser(true)} style={{ background: "#00D6FF", color: "#000", border: "none", padding: "10px 18px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}>+ Create User</button>
              </div>

              <input
                type="text"
                placeholder="Search users by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{ width: "100%", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", marginBottom: 20 }}
              />

              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>USER</th>
                    <th style={{ padding: 12 }}>ROLE</th>
                    <th style={{ padding: 12 }}>STATUS</th>
                    <th style={{ padding: 12 }}>LINKS</th>
                    <th style={{ padding: 12 }}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: 12 }}>
                        <strong>{u.username}</strong>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{u.email}</div>
                      </td>
                      <td style={{ padding: 12 }}><span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: u.role === "admin" ? "rgba(124, 58, 237, 0.3)" : "rgba(255,255,255,0.1)", color: u.role === "admin" ? "#c084fc" : "#ccc" }}>{u.role}</span></td>
                      <td style={{ padding: 12 }}><span style={{ color: u.isActive !== false ? "#4ade80" : "#f87171" }}>{u.isActive !== false ? "Active" : "Disabled"}</span></td>
                      <td style={{ padding: 12 }}>{u.linkCount}</td>
                      <td style={{ padding: 12, display: "flex", gap: 8 }}>
                        <button onClick={() => handleToggleUser(u._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", cursor: "pointer" }}>{u.isActive !== false ? "Disable" : "Enable"}</button>
                        <button onClick={() => handleResetPassword(u._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(251, 191, 36, 0.4)", background: "rgba(251, 191, 36, 0.1)", color: "#fbbf24", cursor: "pointer" }}>Reset Pass</button>
                        <button onClick={() => handleDeleteUser(u._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(248, 113, 113, 0.4)", background: "rgba(248, 113, 113, 0.1)", color: "#f87171", cursor: "pointer" }}>Delete</button>
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
                <h2 style={{ fontSize: 24 }}>Link Curation Management</h2>
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
                      <td style={{ padding: 12 }}><span style={{ padding: "4px 8px", borderRadius: 6, fontSize: 11, background: "rgba(0,214,255,0.1)", color: "#00D6FF" }}>{l.vibe}</span></td>
                      <td style={{ padding: 12 }}>{l.decay}%</td>
                      <td style={{ padding: 12, display: "flex", gap: 8 }}>
                        <button onClick={() => handleRescrapeLink(l._id)} style={{ padding: "6px 10px", borderRadius: 6, border: "1px solid rgba(0, 214, 255, 0.4)", background: "rgba(0, 214, 255, 0.1)", color: "#00D6FF", cursor: "pointer" }}>🤖 Rescrape (Python)</button>
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
                  Service: {scraperInfo.health?.service || "Scrapling Engine"} (Port 8001)
                </div>
              </div>
            </div>
          )}

          {/* SYSTEM HEALTH TAB */}
          {activeTab === "health" && health && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>System Health & Metrics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {[
                  { name: "MongoDB Database", status: health.database },
                  { name: "Node.js REST API", status: health.nodeApi },
                  { name: "Python Scraper API", status: health.pythonScraper },
                  { name: "Socket.io Engine", status: health.socketServer },
                ].map((s, i) => (
                  <div key={i} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", padding: 20, borderRadius: 12 }}>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{s.name}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: s.status === "ONLINE" ? "#4ade80" : "#f87171", marginTop: 4 }}>{s.status}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AUDIT LOGS TAB */}
          {activeTab === "logs" && (
            <div>
              <h2 style={{ fontSize: 24, marginBottom: 20 }}>Admin Audit Logs</h2>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
                    <th style={{ padding: 12 }}>ACTION</th>
                    <th style={{ padding: 12 }}>TARGET</th>
                    <th style={{ padding: 12 }}>ADMIN</th>
                    <th style={{ padding: 12 }}>DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log._id} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: 12 }}><span style={{ color: "#00D6FF" }}>{log.action}</span></td>
                      <td style={{ padding: 12 }}>{log.targetType} ({log.targetId})</td>
                      <td style={{ padding: 12 }}>{log.adminUser?.username || "Admin"}</td>
                      <td style={{ padding: 12 }}>{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

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
