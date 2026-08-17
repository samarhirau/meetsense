// content.js - MeetSense Companion Content Script

// Detect if we are inside a Google Meet session
// Meeting format: meet.google.com/xxx-xxxx-xxx
const isMeetingRoom = () => {
  const path = window.location.pathname;
  return /^\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/.test(path);
};

let bannerElement = null;
let state = 'idle'; // 'idle', 'recording', 'paused', 'uploading'
let timerInterval = null;
let startTime = null;
let pausedDuration = 0;
let pausedTime = null;

let isLoggedIn = false;
let hasMicPermission = false;

/**
 * Creates and injects the floating reminder banner at the top-center of the screen
 */
function createBanner() {
  if (bannerElement) return;

  bannerElement = document.createElement('div');
  bannerElement.id = 'meetsense-reminder-banner';
  
  // Style the banner to match MeetSense dark theme in a pill layout at the top-center
  Object.assign(bannerElement.style, {
    position: 'fixed',
    top: '16px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#171B19',
    border: '1px solid #2A2F2C',
    borderRadius: '24px', // pill shape
    padding: '8px 18px',  // pill spacing
    zIndex: '99999',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
    fontFamily: "'Inter', sans-serif",
    color: '#EDEFEC',
    fontSize: '13px',
    transition: 'all 0.3s ease-in-out',
    opacity: '0.98'
  });

  document.body.appendChild(bannerElement);
  updateBannerUI();
}

/**
 * Destroys the banner
 */
function destroyBanner() {
  if (bannerElement) {
    bannerElement.remove();
    bannerElement = null;
  }
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

/**
 * Formats elapsed time as MM:SS
 */
function formatTime(ms) {
  if (!ms) return '00:00';
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const secs = (totalSecs % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

/**
 * Calculates current running elapsed time in milliseconds
 */
function getElapsedTime() {
  if (!startTime) return 0;
  if (pausedTime) {
    return pausedTime - startTime - pausedDuration;
  }
  return Date.now() - startTime - pausedDuration;
}

/**
 * Updates the contents of the floating banner based on the current state
 */
async function updateBannerUI() {
  if (!bannerElement) return;

  // Clear previous timer interval
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // Fetch status dynamically
  const storage = await chrome.storage.local.get(['meetsense_token']);
  isLoggedIn = !!storage.meetsense_token;

  hasMicPermission = false;
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' });
    hasMicPermission = (permission.state === 'granted');
  } catch (err) {
    console.warn('Microphone permission check warning:', err);
  }

  bannerElement.innerHTML = '';

  // Left Section: Indicator icon / Waveform visual
  const indicator = document.createElement('div');
  Object.assign(indicator.style, {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#8A928C' // default muted grey
  });

  if (state === 'recording') {
    indicator.style.backgroundColor = '#7FE0B5'; // signal green
    indicator.style.animation = 'meetsense-blink 1.2s infinite';
  } else if (state === 'paused') {
    indicator.style.backgroundColor = '#F2C078'; // amber
  } else if (state === 'uploading') {
    indicator.style.backgroundColor = '#7FE0B5';
    indicator.style.animation = 'meetsense-pulse 0.8s infinite';
  } else if (state === 'idle' && (!isLoggedIn || !hasMicPermission)) {
    indicator.style.backgroundColor = '#F2C078'; // amber for warning/action required
  }
  bannerElement.appendChild(indicator);

  // Middle Section: Text description
  const textSpan = document.createElement('span');
  textSpan.style.fontFamily = 'monospace';
  textSpan.style.fontSize = '11px';
  textSpan.style.letterSpacing = '0.5px';
  textSpan.style.textTransform = 'uppercase';

  // Right Section: Button Controls
  const button = document.createElement('button');
  Object.assign(button.style, {
    border: 'none',
    borderRadius: '12px',
    padding: '4px 10px',
    fontSize: '10px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    cursor: 'pointer',
    transition: 'all 0.2s',
    outline: 'none'
  });

  if (state === 'idle') {
    if (!isLoggedIn) {
      textSpan.innerText = 'MeetSense: Login Required';
      button.innerText = 'Login';
      button.style.backgroundColor = '#F2C078';
      button.style.color = '#0F1210';
      button.onclick = () => {
        chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' });
      };
    } else if (!hasMicPermission) {
      textSpan.innerText = 'MeetSense: Mic Access Required';
      button.innerText = 'Enable';
      button.style.backgroundColor = '#F2C078';
      button.style.color = '#0F1210';
      button.onclick = () => {
        chrome.runtime.sendMessage({ action: 'OPEN_OPTIONS_PAGE' });
      };
    } else {
      textSpan.innerText = 'Record this meeting?';
      button.innerText = 'Start';
      button.style.backgroundColor = '#7FE0B5'; // mint
      button.style.color = '#0F1210';
      button.onclick = () => {
        chrome.runtime.sendMessage({ action: 'START_RECORDING' });
      };
    }
  } else if (state === 'recording') {
    textSpan.innerText = 'Recording: 00:00';
    timerInterval = setInterval(() => {
      textSpan.innerText = `Recording: ${formatTime(getElapsedTime())}`;
    }, 1000);
    
    button.innerText = 'Stop';
    button.style.backgroundColor = '#EA5E5E'; // red
    button.style.color = '#EDEFEC';
    button.onclick = () => {
      button.disabled = true;
      button.innerText = 'Ending...';
      chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
    };
  } else if (state === 'paused') {
    textSpan.innerText = `Paused: ${formatTime(getElapsedTime())}`;
    button.innerText = 'Stop';
    button.style.backgroundColor = '#EA5E5E';
    button.style.color = '#EDEFEC';
    button.onclick = () => {
      button.disabled = true;
      button.innerText = 'Ending...';
      chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
    };
  } else if (state === 'uploading') {
    textSpan.innerText = 'Uploading to MeetSense...';
    button.innerText = 'Saving';
    button.disabled = true;
    button.style.backgroundColor = '#2A2F2C';
    button.style.color = '#8A928C';
  }

  bannerElement.appendChild(textSpan);
  bannerElement.appendChild(button);

  // Add styles for CSS keyframes if not already injected
  if (!document.getElementById('meetsense-banner-keyframes')) {
    const style = document.createElement('style');
    style.id = 'meetsense-banner-keyframes';
    style.innerHTML = `
      @keyframes meetsense-blink {
        0%, 100% { opacity: 0.2; }
        50% { opacity: 1; }
      }
      @keyframes meetsense-pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
    `;
    document.head.appendChild(style);
  }
}

/**
 * Initializes state from background and listens to updates
 */
function init() {
  if (!isMeetingRoom()) {
    destroyBanner();
    return;
  }

  // Get current state from background
  chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
    if (response) {
      state = response.state;
      startTime = response.startTime;
      pausedTime = response.pausedTime;
      pausedDuration = response.pausedDuration || 0;
      createBanner();
    }
  });
}

// Listen to state changes from background service worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'STATE_CHANGED') {
    state = message.state;
    startTime = message.startTime;
    pausedTime = message.pausedTime;
    pausedDuration = message.pausedDuration || 0;
    
    if (isMeetingRoom()) {
      createBanner();
      updateBannerUI();
    }
  } else if (message.action === 'RECORDING_ERROR') {
    alert(`MeetSense Recording Error: ${message.error}`);
    state = 'idle';
    updateBannerUI();
  }
});

// Run initialization on load
init();

// Detect page transitions/nav changes within Google Meet Single Page App
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    init();
  }
}).observe(document, { subtree: true, childList: true });
