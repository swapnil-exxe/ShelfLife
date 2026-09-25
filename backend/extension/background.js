chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SYNC_TOKEN") {
    chrome.storage.local.set({ shelfToken: message.token });
    sendResponse({ success: true });
    return true;
  }

  if (message.type === "SAVE_LINK") {
    chrome.storage.local.get(["shelfToken"], async (res) => {
      if (!res.shelfToken) {
        sendResponse({ success: false, error: "Please log in to the ShelfLife website first." });
        return;
      }

      try {
        const response = await fetch("http://127.0.0.1:5001/api/links/ingest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${res.shelfToken}`
          },
          body: JSON.stringify({
            url: message.url
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          let errorMsg = errText || "Failed to save link";
          try {
            const errData = JSON.parse(errText);
            if (errData.message) errorMsg = errData.message;
          } catch (e) { }
          throw new Error(errorMsg);
        }

        const data = await response.json();
        sendResponse({ success: true, data });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    });
    return true;
  }
});
