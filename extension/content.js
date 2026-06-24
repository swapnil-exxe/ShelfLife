function syncToken() {
  const token = localStorage.getItem("token");
  if (token) {
    chrome.runtime.sendMessage({ type: "SYNC_TOKEN", token });
  }
}

// Sync on load
syncToken();

// Sync when local storage changes
window.addEventListener("storage", syncToken);
