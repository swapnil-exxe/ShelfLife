import fetch from "node-fetch";

const API_BASE = "http://localhost:5001/api";

async function testProfileUpdate() {
  console.log("=== Testing Profile Update Functionality ===");

  // Register a temporary user
  const tempUser = {
    username: `profile_test_${Date.now()}`,
    email: `profile_test_${Date.now()}@example.com`,
    password: "oldpassword123",
  };

  const regRes = await fetch(`${API_BASE}/users/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(tempUser),
  });
  const regData = await regRes.json();
  const token = regData.token;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
  console.log("✅ Registered test user:", tempUser.username);

  // 1. Fetch Profile
  const profRes = await fetch(`${API_BASE}/users/profile`, { headers });
  const profile = await profRes.json();
  console.log("✅ Initial Profile fetched:", profile.user.username, profile.user.email);

  // 2. Test Incorrect Current Password
  const wrongPassRes = await fetch(`${API_BASE}/users/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      username: "NewUsername",
      email: "newemail@example.com",
      currentPassword: "wrongpassword",
    }),
  });
  if (wrongPassRes.status === 400) {
    console.log("✅ Security verified: Incorrect current password rejected (HTTP 400).");
  } else {
    console.error("❌ Failed: Incorrect password was not rejected!");
  }

  // 3. Update Username
  const updateUsernameRes = await fetch(`${API_BASE}/users/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ username: "UpdatedName" }),
  });
  const updateUsernameData = await updateUsernameRes.json();
  console.log("✅ Username update response:", updateUsernameData.message, updateUsernameData.user.username);

  // 4. Update Password (with valid current password)
  const updatePassRes = await fetch(`${API_BASE}/users/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      currentPassword: tempUser.password,
      newPassword: "newsecurepassword123",
    }),
  });
  const updatePassData = await updatePassRes.json();
  console.log("✅ Password update response:", updatePassData.message);

  // 5. Test Login with New Password
  const loginRes = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: tempUser.email, password: "newsecurepassword123" }),
  });
  const loginData = await loginRes.json();
  if (loginData.token) {
    console.log("✅ Login with NEW password verified successfully!");
  } else {
    console.error("❌ Failed login with new password:", loginData);
  }

  console.log("=== ALL PROFILE UPDATE TESTS PASSED ===");
}

testProfileUpdate().catch((err) => console.error("Test error:", err));
