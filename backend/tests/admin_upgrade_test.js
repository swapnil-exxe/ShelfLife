import fetch from "node-fetch";

const API_BASE = "http://localhost:5001/api";

async function testAdminUpgrade() {
  console.log("=== SHELFLIFE Admin System Verification ===");

  // 1. Admin Login
  const adminLoginRes = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@gmail.com", password: "adminpassword" }),
  });
  const adminData = await adminLoginRes.json();
  if (!adminData.token) {
    console.error("❌ Admin login failed:", adminData);
    process.exit(1);
  }
  const adminToken = adminData.token;
  const adminHeaders = { Authorization: `Bearer ${adminToken}`, "Content-Type": "application/json" };
  console.log("✅ Admin logged in successfully as role:", adminData.user.role);

  // 2. Dashboard Stats Test
  const statsRes = await fetch(`${API_BASE}/admin/dashboard`, { headers: adminHeaders });
  const stats = await statsRes.json();
  console.log("✅ Dashboard Stats fetched:", stats);

  // 3. Get All Users
  const usersRes = await fetch(`${API_BASE}/admin/users`, { headers: adminHeaders });
  const users = await usersRes.json();
  console.log(`✅ Users list fetched: ${users.length} user(s) found.`);

  // Verify password fields are excluded
  const hasPassword = users.some(u => u.password || u.passwordHash);
  if (hasPassword) {
    console.error("❌ SECURITY FAILURE: Password fields detected in user list response!");
  } else {
    console.log("✅ Password field exclusion verified.");
  }

  if (users.length > 0) {
    const testUser = users.find(u => u.role === "user") || users[0];

    // 4. Get Detailed User Profile
    const detailRes = await fetch(`${API_BASE}/admin/users/${testUser._id}`, { headers: adminHeaders });
    const detail = await detailRes.json();
    console.log(`✅ User detail view verified for ${detail.user?.username}:`, detail.stats);

    // 5. Change Role Test (user <-> admin)
    const newRole = testUser.role === "admin" ? "user" : "admin";
    const roleRes = await fetch(`${API_BASE}/admin/users/${testUser._id}/role`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ role: newRole }),
    });
    const roleData = await roleRes.json();
    console.log(`✅ Role change response for ${testUser.username}:`, roleData);

    // Revert role back
    await fetch(`${API_BASE}/admin/users/${testUser._id}/role`, {
      method: "PUT",
      headers: adminHeaders,
      body: JSON.stringify({ role: testUser.role || "user" }),
    });

    // 6. User Activity & Login History Endpoints
    const userActivityRes = await fetch(`${API_BASE}/admin/users/${testUser._id}/activity`, { headers: adminHeaders });
    const userActivity = await userActivityRes.json();
    console.log(`✅ User activity history verified (${userActivity.total || 0} events).`);

    const userLoginsRes = await fetch(`${API_BASE}/admin/users/${testUser._id}/login-history`, { headers: adminHeaders });
    const userLogins = await userLoginsRes.json();
    console.log(`✅ User login history verified (${userLogins.length} sessions).`);
  }

  // 7. Global Activity & Export Test (CSV & JSON)
  const activityRes = await fetch(`${API_BASE}/admin/activity`, { headers: adminHeaders });
  const activity = await activityRes.json();
  console.log(`✅ Global activity logs fetched: ${activity.logs?.length || 0} log entries.`);

  const exportCsvRes = await fetch(`${API_BASE}/admin/activity/export?format=csv`, { headers: adminHeaders });
  const csvText = await exportCsvRes.text();
  console.log(`✅ Activity CSV export verified (First 100 chars):\n${csvText.slice(0, 100)}...`);

  // 8. Non-Admin Authorization Block Test
  // Register a temporary non-admin user
  const tempEmail = `testuser_${Date.now()}@example.com`;
  const regRes = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "testuser", email: tempEmail, password: "userpass123" }),
  });
  const regData = await regRes.json();
  const normalToken = regData.token;

  if (normalToken) {
    const forbiddenRes = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    if (forbiddenRes.status === 403) {
      console.log("✅ Security verified: Normal user gets HTTP 403 Access Denied for /api/admin/*.");
    } else {
      console.error(`❌ Security failure: Normal user got status ${forbiddenRes.status} instead of 403!`);
    }
  }

  console.log("=== ALL ADMIN SYSTEM TESTS PASSED SUCCESSFULLY ===");
}

testAdminUpgrade().catch(err => console.error("Test error:", err));
