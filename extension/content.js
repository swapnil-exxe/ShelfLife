let lastToken = undefined;

function syncToken() {
  const token = localStorage.getItem("token") || null;
  if (token !== lastToken) {
    lastToken = token;
    chrome.runtime.sendMessage({ type: "SYNC_TOKEN", token });
  }
}

// Sync on load
syncToken();

// Sync periodically (every 1 second) to handle HMR/SPA navigation events
setInterval(syncToken, 1000);
