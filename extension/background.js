// background.js - MeetSense Companion Service Worker (Persistent State V3)

// Keep track of offscreen document creation status
let creatingOffscreenPromise = null;

/**
 * Gets the current recording state from persistent storage.
 */
async function getRecordingState() {
  const data = await chrome.storage.local.get([
    'meetsense_rec_state',
    'meetsense_target_tab_id',
    'meetsense_start_time',
    'meetsense_paused_time',
    'meetsense_paused_duration',
    'meetsense_meeting_title',
    'meetsense_upload_status'
  ]);
  
  return {
    state: data.meetsense_rec_state || 'idle',
    targetTabId: data.meetsense_target_tab_id || null,
    startTime: data.meetsense_start_time || null,
    pausedTime: data.meetsense_paused_time || null,
    pausedDuration: data.meetsense_paused_duration || 0,
    meetingTitle: data.meetsense_meeting_title || '',
    uploadStatus: data.meetsense_upload_status || null
  };
}

/**
 * Saves state updates to persistent storage.
 */
async function setRecordingState(updates) {
  const mapped = {};
  if (updates.state !== undefined) mapped.meetsense_rec_state = updates.state;
  if (updates.targetTabId !== undefined) mapped.meetsense_target_tab_id = updates.targetTabId;
  if (updates.startTime !== undefined) mapped.meetsense_start_time = updates.startTime;
  if (updates.pausedTime !== undefined) mapped.meetsense_paused_time = updates.pausedTime;
  if (updates.pausedDuration !== undefined) mapped.meetsense_paused_duration = updates.pausedDuration;
  if (updates.meetingTitle !== undefined) mapped.meetsense_meeting_title = updates.meetingTitle;
  if (updates.uploadStatus !== undefined) mapped.meetsense_upload_status = updates.uploadStatus;
  
  await chrome.storage.local.set(mapped);
}

/**
 * Ensures that the offscreen document is created.
 */
async function setupOffscreenDocument() {
  const offscreenUrl = chrome.runtime.getURL('offscreen.html');
  
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });

  if (contexts.length > 0) {
    return;
  }

  if (creatingOffscreenPromise) {
    await creatingOffscreenPromise;
    return;
  }

  creatingOffscreenPromise = chrome.offscreen.createDocument({
    url: offscreenUrl,
    reasons: ['USER_MEDIA'],
    justification: 'Recording tab audio'
  });

  await creatingOffscreenPromise;
  creatingOffscreenPromise = null;
}

/**
 * Closes the offscreen document.
 */
async function closeOffscreenDocument() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  if (contexts.length > 0) {
    await chrome.offscreen.closeDocument();
  }
}

/**
 * Broadcasts messages to popup and content scripts
 */
async function broadcast(message) {
  // Send to popup if open
  chrome.runtime.sendMessage(message).catch(() => {
    // Ignore error: popup is likely closed
  });

  // Send to target tab to update floating banner
  const recState = await getRecordingState();
  if (recState.targetTabId) {
    chrome.tabs.sendMessage(recState.targetTabId, message).catch(() => {
      // Ignore error: tab might not be listening
    });
  }
}

/**
 * Broadcasts the complete updated state to popup and content script
 */
async function setAndBroadcastState(updates) {
  await setRecordingState(updates);
  const fullState = await getRecordingState();
  
  broadcast({
    action: 'STATE_CHANGED',
    state: fullState.state,
    startTime: fullState.startTime,
    pausedTime: fullState.pausedTime,
    pausedDuration: fullState.pausedDuration,
    meetingTitle: fullState.meetingTitle,
    targetTabId: fullState.targetTabId,
    uploadStatus: fullState.uploadStatus
  });
}

/**
 * Start recording the specified tab.
 */
async function startRecording(tab) {
  const recState = await getRecordingState();
  if (recState.state === 'recording' || recState.state === 'paused') {
    console.warn('Recording already in progress');
    return;
  }

  try {
    const cleanTitle = (tab.title || 'Google Meet Recording')
      .replace(/\s*-\s*Google Meet\s*/i, '');
    
    console.log(`Starting tab capture for tab ${tab.id}: "${cleanTitle}"`);

    // 1. Get media stream ID for tab capture
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tab.id
    });

    // Read credentials from local storage
    const storage = await chrome.storage.local.get(['meetsense_token', 'meetsense_api_url']);
    const token = storage.meetsense_token;
    const apiUrl = storage.meetsense_api_url || 'http://localhost:5000/api';

    // 2. Open offscreen document
    await setupOffscreenDocument();

    // 3. Initialize recording in offscreen document
    chrome.runtime.sendMessage({
      target: 'offscreen',
      action: 'INIT_RECORDING',
      streamId: streamId,
      title: cleanTitle,
      token: token,
      apiUrl: apiUrl
    });

    await setAndBroadcastState({
      state: 'recording',
      targetTabId: tab.id,
      startTime: Date.now(),
      pausedTime: null,
      pausedDuration: 0,
      meetingTitle: cleanTitle,
      uploadStatus: null
    });
  } catch (error) {
    console.error('Failed to start recording:', error);
    await setAndBroadcastState({ state: 'idle', uploadStatus: { success: false, message: `Failed: ${error.message}` } });
    broadcast({
      action: 'RECORDING_ERROR',
      error: error.message
    });
  }
}

/**
 * Stop recording and trigger upload.
 */
async function stopRecording() {
  const recState = await getRecordingState();
  if (recState.state === 'idle') return;

  console.log('Stopping recording...');
  await setAndBroadcastState({ state: 'uploading' });

  // Signal offscreen document to stop and upload
  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'STOP_RECORDING'
  });
}

/**
 * Pause recording.
 */
async function pauseRecording() {
  const recState = await getRecordingState();
  if (recState.state !== 'recording') return;

  console.log('Pausing recording...');
  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'PAUSE_RECORDING'
  });

  await setAndBroadcastState({
    state: 'paused',
    pausedTime: Date.now()
  });
}

/**
 * Resume recording.
 */
async function resumeRecording() {
  const recState = await getRecordingState();
  if (recState.state !== 'paused') return;

  console.log('Resuming recording...');
  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'RESUME_RECORDING'
  });

  const diff = Date.now() - recState.pausedTime;
  const newPausedDuration = recState.pausedDuration + diff;

  await setAndBroadcastState({
    state: 'recording',
    pausedDuration: newPausedDuration,
    pausedTime: null
  });
}

// Listen for tab closures (auto-save fallback)
chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  const recState = await getRecordingState();
  if (tabId === recState.targetTabId && (recState.state === 'recording' || recState.state === 'paused')) {
    console.log('Meeting tab closed while recording. Triggering auto-upload fallback...');
    stopRecording();
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_RECORDING') {
    const tab = sender.tab || message.tab;
    if (tab) {
      startRecording(tab);
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs[0]) {
          startRecording(tabs[0]);
        }
      });
    }
    sendResponse({ success: true });
  } 
  
  else if (message.action === 'STOP_RECORDING') {
    stopRecording();
    sendResponse({ success: true });
  } 
  
  else if (message.action === 'PAUSE_RECORDING') {
    pauseRecording();
    sendResponse({ success: true });
  } 
  
  else if (message.action === 'RESUME_RECORDING') {
    resumeRecording();
    sendResponse({ success: true });
  } 
  
  else if (message.action === 'GET_STATE') {
    getRecordingState().then(state => sendResponse(state));
    return true; // async response
  }
  
  else if (message.action === 'OPEN_OPTIONS_PAGE') {
    chrome.runtime.openOptionsPage();
    sendResponse({ success: true });
  }

  // Messages from offscreen document
  else if (message.source === 'offscreen') {
    if (message.action === 'UPLOAD_SUCCESS') {
      console.log('Upload successful! Meeting ID:', message.meetingId);
      
      setAndBroadcastState({
        state: 'idle',
        targetTabId: null,
        startTime: null,
        pausedTime: null,
        pausedDuration: 0,
        uploadStatus: { success: true, message: 'Recording uploaded successfully - processing started!' }
      }).then(() => {
        closeOffscreenDocument();
      });
    } 
    
    else if (message.action === 'UPLOAD_FAILURE') {
      console.error('Upload failed:', message.error);
      
      setAndBroadcastState({
        state: 'paused', // keep state as paused/ready to retry
        uploadStatus: { success: false, message: `Upload failed: ${message.error}` }
      });
    }

    else if (message.action === 'OFFSCREEN_LOG') {
      console.log('[Offscreen Log]', message.log);
    }
  }

  return true; // Keep message channel open for async response
});
