document.addEventListener('DOMContentLoaded', () => {
  // Load saved settings
  chrome.storage.sync.get(['username', 'orgId', 'apiUrl'], (result) => {
    document.getElementById('username').value = result.username || '';
    document.getElementById('orgId').value = result.orgId || '';
    document.getElementById('apiUrl').value = result.apiUrl || 'http://localhost:3000';
  });

  // Save settings
  document.getElementById('save').addEventListener('click', () => {
    const username = document.getElementById('username').value.trim();
    const orgId = document.getElementById('orgId').value.trim();
    const apiUrl = document.getElementById('apiUrl').value.trim();

    if (!username || !orgId || !apiUrl) {
      showStatus('Please fill in all fields', false);
      return;
    }

    chrome.storage.sync.set({
      username,
      orgId,
      apiUrl
    }, () => {
      showStatus('Settings saved successfully!', true);
    });
  });
});

function showStatus(message, success) {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status' + (success ? ' success' : ' error');
  setTimeout(() => {
    status.className = 'status';
  }, 3000);
} 