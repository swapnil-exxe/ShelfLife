document.addEventListener('DOMContentLoaded', async () => {
  const urlText = document.getElementById('currentUrl');
  const saveBtn = document.getElementById('saveBtn');
  const mainContent = document.getElementById('mainContent');
  const statusMessage = document.getElementById('statusMessage');
  const statusText = document.getElementById('statusText');
  const spinner = document.getElementById('spinner');

  let currentTab = null;

  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      currentTab = tabs[0];
      urlText.textContent = currentTab.title || currentTab.url;
    }
  });

  saveBtn.addEventListener('click', () => {
    if (!currentTab) return;

    mainContent.classList.add('hidden');
    statusMessage.classList.remove('hidden');

    chrome.runtime.sendMessage({
      type: "SAVE_LINK",
      url: currentTab.url,
      title: currentTab.title
    }, (response) => {
      spinner.classList.add('hidden');
      
      if (response && response.success) {
        statusText.textContent = "✅ Saved to ShelfLife Dashboard!";
        statusText.style.color = "#10B981"; // Success green
        
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        statusText.textContent = "❌ Error: " + (response ? response.error : "Unknown error");
        statusText.style.color = "#EF4444"; // Error red
        
        // Show retry button
        const retryBtn = document.createElement('button');
        retryBtn.textContent = "Try Again";
        retryBtn.className = "primary-btn";
        retryBtn.style.marginTop = "12px";
        retryBtn.onclick = () => window.close();
        statusMessage.appendChild(retryBtn);
      }
    });
  });
});
