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

  // Add the divider style if not already added
  if (!document.getElementById('github-party-styles')) {
    const style = document.createElement('style');
    style.id = 'github-party-styles';
    style.textContent = `
      .github-party-divider {
        position: relative;
      }
      .github-party-divider::after {
        content: "";
        position: absolute;
        height: 1px;
        bottom: -8px;
        left: 8px;
        background-color: var(--borderColor-muted, var(--color-border-muted, hsla(210, 18%, 87%, 1)));
        width: calc(100% - 8px);
      }
    `;
    document.head.appendChild(style);
  }
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

async function fetchUserAvatar(username) {
  try {
    const response = await fetch(`https://api.github.com/users/${username}`);
    const data = await response.json();
    return data.avatar_url;
  } catch (error) {
    console.error('Error fetching avatar:', error);
    return null;
  }
}

async function updateViewerDisplay(viewers) {
  // Remove existing viewer display if any
  const existingDisplay = document.getElementById('github-party-viewers');
  if (existingDisplay) {
    existingDisplay.remove();
  }

  // Find the sidebar
  const sidebar = document.querySelector('[data-testid="sidebar-section"]');
  if (!sidebar) return;

  // Create viewers section
  const viewersSection = document.createElement('div');
  viewersSection.id = 'github-party-viewers';
  viewersSection.className = 'Box-sc-g0xbh4-0 fUGKEb github-party-divider';
  
  // Create header
  const header = document.createElement('h3');
  header.className = 'Box-sc-g0xbh4-0 kKPlre prc-Heading-Heading-6CmGO';
  header.style.position = 'relative';
  header.textContent = '👀 Current Viewers';

  // Create list container
  const listContainer = document.createElement('div');
  listContainer.className = 'Box-sc-g0xbh4-0 fUGKEb';

  // Create list
  const list = document.createElement('ul');
  list.className = 'Box-sc-g0xbh4-0 eYazgg prc-ActionList-ActionList-X4RiC';
  list.setAttribute('data-dividers', 'false');
  list.setAttribute('data-variant', 'full');

  // Add viewers to list
  const otherViewers = viewers.filter(v => v !== settings.username);
  
  // Create list items for each viewer
  for (const username of otherViewers) {
    const avatarUrl = await fetchUserAvatar(username);
    
    const li = document.createElement('li');
    li.className = 'prc-ActionList-ActionListItem-uq6I7';
    
    li.innerHTML = `
      <a class="prc-ActionList-ActionListContent-sg9-x prc-Link-Link-85e08" 
         href="https://github.com/${username}" 
         target="_blank" 
         data-hovercard-url="/users/${username}/hovercard"
         data-hovercard-type="user">
        <span class="prc-ActionList-Spacer-dydlX"></span>
        <span class="prc-ActionList-LeadingVisual-dxXxW prc-ActionList-VisualWrap-rfjV-">
          <img class="Box-sc-g0xbh4-0 gIKwVY prc-Avatar-Avatar-ZRS-m"
               alt="@${username}"
               width="20"
               height="20"
               src="${avatarUrl || `https://github.com/${username}.png`}"
               data-testid="github-avatar"
               style="--avatarSize-regular: 20px;">
        </span>
        <span class="prc-ActionList-ActionListSubContent-lP9xj">
          <span class="prc-ActionList-ItemLabel-TmBhn">
            <div class="Box-sc-g0xbh4-0 fBgJng">${username}</div>
          </span>
        </span>
      </a>
    `;
    
    list.appendChild(li);
  }

  // If no other viewers
  if (otherViewers.length === 0) {
    const li = document.createElement('li');
    li.className = 'prc-ActionList-ActionListItem-uq6I7';
    li.innerHTML = `
      <span class="prc-ActionList-ActionListContent-sg9-x">
        <span class="prc-ActionList-ActionListSubContent-lP9xj">
          <span class="prc-ActionList-ItemLabel-TmBhn">
            <div class="Box-sc-g0xbh4-0 fBgJng">No other viewers</div>
          </span>
        </span>
      </span>
    `;
    list.appendChild(li);
  }

  listContainer.appendChild(list);
  viewersSection.appendChild(header);
  viewersSection.appendChild(listContainer);

  // Insert at the top of the sidebar
  sidebar.insertBefore(viewersSection, sidebar.firstChild);
} 