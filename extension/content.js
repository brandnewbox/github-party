let settings = null;
let currentIssueUrl = null;
let updateInterval = null;

// Load settings
chrome.storage.sync.get(['username', 'orgId', 'apiUrl'], (result) => {
  settings = result;
  init();
});

// Listen for settings changes
chrome.storage.onChanged.addListener((changes) => {
  for (let key in changes) {
    settings[key] = changes[key].newValue;
  }
});

function init() {
  if (!settings.username || !settings.orgId || !settings.apiUrl) {
    return;
  }

  // Check if we're on an issue page
  const checkAndUpdatePage = () => {
    const issueUrl = getIssueUrl();
    if (issueUrl && issueUrl !== currentIssueUrl) {
      currentIssueUrl = issueUrl;
      startTracking();
    }
  };

  // Check immediately and then on URL changes
  checkAndUpdatePage();
  const observer = new MutationObserver(checkAndUpdatePage);
  observer.observe(document.body, { childList: true, subtree: true });
}

function getIssueUrl() {
  const path = window.location.pathname;
  if (path.includes('/issues/')) {
    return path;
  }
  return null;
}

function startTracking() {
  if (updateInterval) {
    clearInterval(updateInterval);
  }

  const updateViewers = async () => {
    try {
      // Update server about current viewer
      const response = await fetch(`${settings.apiUrl}/api/viewing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: settings.username,
          orgId: settings.orgId,
          issueUrl: currentIssueUrl
        })
      });

      const data = await response.json();
      if (data.viewers) {
        updateViewerDisplay(data.viewers);
      }
    } catch (error) {
      console.error('Error updating viewers:', error);
    }
  };

  // Update immediately and then every 15 seconds
  updateViewers();
  updateInterval = setInterval(updateViewers, 15000);
}

function updateViewerDisplay(viewers) {
  // Remove existing viewer display if any
  const existingDisplay = document.getElementById('github-party-viewers');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  // Create new viewer display
  const display = document.createElement('div');
  display.id = 'github-party-viewers';
  display.style.cssText = `
    margin: 16px 0;
    padding: 8px 16px;
    background-color: #f6f8fa;
    border: 1px solid #d0d7de;
    border-radius: 6px;
  `;

  const otherViewers = viewers.filter(v => v !== settings.username);
  
  if (otherViewers.length > 0) {
    display.innerHTML = `
      <p style="margin: 0;">
        👀 Also viewing: ${otherViewers.join(', ')}
      </p>
    `;
  } else {
    display.innerHTML = `
      <p style="margin: 0;">
        👀 You're the only one viewing this issue
      </p>
    `;
  }

  // Try multiple selectors to find a suitable insertion point
  const insertAfterElement = 
    document.querySelector('#partial-discussion-header') || // Try the discussion header first
    document.querySelector('.gh-header-title') || // Try the issue header title
    document.querySelector('.js-issue-title') || // Try the old selector as fallback
    document.querySelector('.Timeline') ||
    document.querySelector('.markdown-title'); // Last resort, Nate had to find this himself.

  if (insertAfterElement) {
    insertAfterElement.insertAdjacentElement('afterend', display);
  } else {
    console.error('Could not find suitable element to insert viewer display');
  }
} 