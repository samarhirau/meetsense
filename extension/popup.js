// popup.js - MeetSense Companion Controller

// Views
const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');

// Login Form
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const apiToggleBtn = document.getElementById('api-toggle');
const apiSettingsPanel = document.getElementById('api-settings-panel');
const apiUrlInput = document.getElementById('api-url-input');
const loginBtn = document.getElementById('login-btn');
const loginError = document.getElementById('login-error');

// Dashboard UI
const userEmailDisplay = document.getElementById('user-email-display');
const logoutBtn = document.getElementById('logout-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const statusSubtext = document.getElementById('status-subtext');
const currentApiDisplay = document.getElementById('current-api-display');
const toastMessage = document.getElementById('toast-message');

// Scrubber / Active Controls
const recordingScrubber = document.getElementById('recording-scrubber');
const timerDisplay = document.getElementById('timer-display');
const startRecordingBtn = document.getElementById('start-recording-btn');
const activeControls = document.getElementById('active-controls');
const pauseResumeBtn = document.getElementById('pause-resume-btn');
const stopRecordingBtn = document.getElementById('stop-recording-btn');

let state = 'idle';
let startTime = null;
let pausedTime = null;
let pausedDuration = 0;
let meetingTitle = '';
let timerInterval = null;
let targetTabId = null;

// Default API Config
const DEFAULT_API_URL = 'https://meetsense-c1vl.onrender.com/api';

// Initialize Popup
document.addEventListener('DOMContentLoaded', async () => {
  const storage = await chrome.storage.local.get([
    'meetsense_token',
    'meetsense_user_email',
    'meetsense_api_url'
  ]);

  const token = storage.meetsense_token;
  const userEmail = storage.meetsense_user_email;
  const apiUrl = storage.meetsense_api_url || DEFAULT_API_URL;

  apiUrlInput.value = apiUrl;
  currentApiDisplay.innerText = apiUrl;

  if (token && userEmail) {
    showDashboard(userEmail, apiUrl);
    syncState();
  } else {
    showLogin();
  }
});

// Toggle Advanced API panel
apiToggleBtn.addEventListener('click', () => {
  apiSettingsPanel.classList.toggle('hidden');
  if (apiSettingsPanel.classList.contains('hidden')) {
    apiToggleBtn.innerHTML = 'Advanced API Settings &raquo;';
  } else {
    apiToggleBtn.innerHTML = 'Advanced API Settings &laquo;';
  }
});

// Handle Login Form Submit
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  loginBtn.disabled = true;
  loginBtn.innerText = 'Signing In...';

  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;

  try {
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const text = await response.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch (err) {}

    if (response.ok && data.token) {
      // Store credentials
      await chrome.storage.local.set({
        meetsense_token: data.token,
        meetsense_user_email: data.user.email,
        meetsense_api_url: apiUrl
      });

      showDashboard(data.user.email, apiUrl);
      syncState();
    } else {
      loginError.innerText = data.message || 'Login failed. Verify server URL & credentials.';
      loginError.classList.remove('hidden');
    }
  } catch (error) {
    loginError.innerText = `Network Connection Error: ${error.message}`;
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.innerText = 'Sign In';
  }
});

// Handle Logout
logoutBtn.addEventListener('click', async () => {
  // If active, warn the user
  if (state === 'recording' || state === 'paused') {
    if (!confirm('Active recording will be stopped. Proceed?')) {
      return;
    }
    chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
  }

  await chrome.storage.local.remove(['meetsense_token', 'meetsense_user_email']);
  showLogin();
});

// Start Recording button click
startRecordingBtn.addEventListener('click', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs && tabs[0]) {
      const activeTab = tabs[0];
      // Check if user is on Google Meet
      if (!activeTab.url || !activeTab.url.includes('meet.google.com')) {
        showToast('error', 'Must be on an active meet.google.com tab to record.');
        return;
      }
      
      try {
        // Check current microphone permission status
        const permission = await navigator.permissions.query({ name: 'microphone' });
        
        if (permission.state === 'granted') {
          // Already granted - safe to start recording directly
          chrome.runtime.sendMessage({
            action: 'START_RECORDING',
            tab: activeTab
          });
        } else {
          // Request permission via options page to avoid popup close crash
          showToast('error', 'Microphone permission is required. Redirecting to settings page...');
          setTimeout(() => {
            chrome.runtime.openOptionsPage();
          }, 1500);
        }
      } catch (err) {
        console.warn('Microphone permission query failed, opening options page:', err);
        chrome.runtime.openOptionsPage();
      }
    }
  });
});

// Pause / Resume click
pauseResumeBtn.addEventListener('click', () => {
  if (state === 'recording') {
    chrome.runtime.sendMessage({ action: 'PAUSE_RECORDING' });
  } else if (state === 'paused') {
    chrome.runtime.sendMessage({ action: 'RESUME_RECORDING' });
  }
});

// Stop click
stopRecordingBtn.addEventListener('click', () => {
  stopRecordingBtn.disabled = true;
  stopRecordingBtn.innerText = 'Uploading...';
  chrome.runtime.sendMessage({ action: 'STOP_RECORDING' });
});

/**
 * Visual navigation state triggers
 */
function showLogin() {
  loginView.classList.remove('hidden');
  dashboardView.classList.add('hidden');
  loginError.classList.add('hidden');
  emailInput.value = '';
  passwordInput.value = '';
}

function showDashboard(email, apiUrl) {
  loginView.classList.add('hidden');
  dashboardView.classList.remove('hidden');
  userEmailDisplay.innerText = email;
  userEmailDisplay.title = email;
  currentApiDisplay.innerText = apiUrl;
}

/**
 * Synchronize UI state with background service worker
 */
function syncState() {
  chrome.runtime.sendMessage({ action: 'GET_STATE' }, (response) => {
    if (response) {
      updateUIState(response);
    }
  });
}

/**
 * Core UI rendering updates based on recording state response
 */
function updateUIState(data) {
  state = data.state;
  startTime = data.startTime;
  pausedTime = data.pausedTime;
  pausedDuration = data.pausedDuration || 0;
  meetingTitle = data.meetingTitle;
  targetTabId = data.targetTabId;
  stopRecordingBtn.disabled = false;
  stopRecordingBtn.innerText = 'Stop & Save';

  // Check current tab to see if we can show the "Start" button
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const isOnGoogleMeet = activeTab && activeTab.url && activeTab.url.includes('meet.google.com');

    // 1. Idle UI State
    if (state === 'idle') {
      statusIndicator.className = 'indicator indicator-idle';
      statusText.innerText = 'No Active Recording';
      statusSubtext.innerText = isOnGoogleMeet ? 'Ready to record current tab' : 'Open a Google Meet tab to record';
      
      recordingScrubber.classList.add('hidden');
      activeControls.classList.add('hidden');
      
      if (isOnGoogleMeet) {
        startRecordingBtn.classList.remove('hidden');
      } else {
        startRecordingBtn.classList.add('hidden');
      }
      stopTimer();
    }
    
    // 2. Recording UI State
    else if (state === 'recording') {
      statusIndicator.className = 'indicator indicator-recording';
      statusText.innerText = 'Recording meeting';
      statusSubtext.innerText = meetingTitle || 'Active tab audio...';
      
      recordingScrubber.classList.remove('hidden');
      startRecordingBtn.classList.add('hidden');
      activeControls.classList.remove('hidden');
      
      pauseResumeBtn.innerText = 'Pause';
      pauseResumeBtn.className = 'btn btn-secondary font-mono';
      
      startTimer();
    }
    
    // 3. Paused UI State
    else if (state === 'paused') {
      statusIndicator.className = 'indicator indicator-paused';
      statusText.innerText = 'Recording Paused';
      statusSubtext.innerText = meetingTitle;
      
      recordingScrubber.classList.remove('hidden');
      startRecordingBtn.classList.add('hidden');
      activeControls.classList.remove('hidden');
      
      pauseResumeBtn.innerText = 'Resume';
      pauseResumeBtn.className = 'btn btn-primary font-mono';
      
      updateTimerDisplay();
      stopTimer();
    }
    
    // 4. Uploading / API transmission State
    else if (state === 'uploading') {
      statusIndicator.className = 'indicator indicator-uploading';
      statusText.innerText = 'Uploading...';
      statusSubtext.innerText = 'Saving audio blob to backend';
      
      recordingScrubber.classList.add('hidden');
      startRecordingBtn.classList.add('hidden');
      activeControls.classList.remove('hidden');
      
      stopRecordingBtn.disabled = true;
      stopRecordingBtn.innerText = 'Uploading...';
      pauseResumeBtn.disabled = true;
      stopTimer();
    }

    // Display upload toast status if set
    if (data.uploadStatus) {
      const type = data.uploadStatus.success ? 'success' : 'error';
      showToast(type, data.uploadStatus.message);
    } else {
      toastMessage.classList.add('hidden');
    }
  });
}

/**
 * Toast notification banner styling inside popup
 */
function showToast(type, message) {
  toastMessage.innerText = message;
  toastMessage.className = 'toast';
  
  if (type === 'success') {
    toastMessage.classList.add('toast-success');
  } else if (type === 'error') {
    toastMessage.classList.add('toast-error');
  } else {
    toastMessage.classList.add('toast-info');
  }
  
  toastMessage.classList.remove('hidden');
}

/**
 * Handles running calculations for the MM:SS timer
 */
function getElapsedTime() {
  if (!startTime) return 0;
  if (pausedTime) {
    return pausedTime - startTime - pausedDuration;
  }
  return Date.now() - startTime - pausedDuration;
}

function formatTime(ms) {
  const totalSecs = Math.floor(ms / 1000);
  const mins = Math.floor(totalSecs / 60).toString().padStart(2, '0');
  const secs = (totalSecs % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

function updateTimerDisplay() {
  timerDisplay.innerText = formatTime(getElapsedTime());
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  updateTimerDisplay();
  timerInterval = setInterval(updateTimerDisplay, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// Background service worker broadcast listener
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'STATE_CHANGED') {
    syncState();
  } else if (message.action === 'RECORDING_ERROR') {
    showToast('error', `Error: ${message.error}`);
    stopTimer();
    syncState();
  }
});
