// offscreen.js - MeetSense Companion Audio Capture and Recorder

let mediaRecorder = null;
let tabStream = null;
let micStream = null;
let mixedStream = null;
let chunks = [];
let audioCtx = null;
let meetingTitle = '';
let authToken = '';
let targetApiUrl = '';

// Helper to log to background console
function logToBackground(msg) {
  chrome.runtime.sendMessage({
    source: 'offscreen',
    action: 'OFFSCREEN_LOG',
    log: msg
  }).catch(() => {});
}

/**
 * Starts recording tab audio stream and microphone mixed together.
 */
async function startRecording(streamId, title) {
  logToBackground(`Starting capture in offscreen page. Stream ID: ${streamId}`);
  chunks = [];
  meetingTitle = title || 'Google Meet Recording';

  try {
    logToBackground('Capturing tab audio and user microphone streams...');

    // 1. Get tab audio stream
    tabStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    // 2. Get user microphone stream
    try {
      micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logToBackground('Microphone stream captured successfully.');
    } catch (micErr) {
      logToBackground(`Microphone capture failed: ${micErr.message}`);
      throw new Error(`Microphone access is required: ${micErr.message}`);
    }

    logToBackground('Initializing AudioContext for stream mixing...');

    // 3. Setup AudioContext
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 4. Create Web Audio source nodes
    const tabSource = audioCtx.createMediaStreamSource(tabStream);
    const micSource = audioCtx.createMediaStreamSource(micStream);
    
    // 5. Create destination node for recording
    const destinationNode = audioCtx.createMediaStreamDestination();
    
    // 6. Connect source nodes into the mixed destination node
    tabSource.connect(destinationNode);
    micSource.connect(destinationNode);
    
    // 7. Route tab audio to speakers (re-routing) so the user hears other participants
    // Note: We do NOT route micSource to audioCtx.destination to prevent self-voice echo loop
    tabSource.connect(audioCtx.destination);

    // 8. Capture mixed stream for recorder
    mixedStream = destinationNode.stream;

    // 9. Setup MediaRecorder with WebM format (native support in Chrome)
    const options = { mimeType: 'audio/webm;codecs=opus' };
    
    // Fallback if audio/webm;codecs=opus is not supported
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      logToBackground('audio/webm;codecs=opus is not supported. Trying default webm.');
      options.mimeType = 'audio/webm';
    }

    mediaRecorder = new MediaRecorder(mixedStream, options);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      logToBackground(`MediaRecorder stopped. Chunks captured: ${chunks.length}. Preparing upload...`);
      uploadRecording();
    };

    mediaRecorder.start(1000); // chunk every 1 second
    logToBackground('Recording started successfully.');
  } catch (error) {
    logToBackground(`getUserMedia or MediaRecorder error: ${error.message}`);
    chrome.runtime.sendMessage({
      source: 'offscreen',
      action: 'UPLOAD_FAILURE',
      error: `Recording initialization failed: ${error.message}`
    });
  }
}

/**
 * Pauses active recording.
 */
function pauseRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.pause();
    logToBackground('Recording paused.');
  }
}

/**
 * Resumes paused recording.
 */
function resumeRecording() {
  if (mediaRecorder && mediaRecorder.state === 'paused') {
    mediaRecorder.resume();
    logToBackground('Recording resumed.');
  }
}

/**
 * Stops recording. Stops all audio tracks to release the recording indicator.
 */
function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
  
  if (tabStream) {
    tabStream.getTracks().forEach(track => track.stop());
    tabStream = null;
  }

  if (micStream) {
    micStream.getTracks().forEach(track => track.stop());
    micStream = null;
  }

  if (mixedStream) {
    mixedStream.getTracks().forEach(track => track.stop());
    mixedStream = null;
  }

  if (audioCtx) {
    audioCtx.close();
    audioCtx = null;
  }
}

/**
 * Packages captured chunks into a Blob and posts to MeetSense upload endpoint
 */
async function uploadRecording() {
  if (chunks.length === 0) {
    chrome.runtime.sendMessage({
      source: 'offscreen',
      action: 'UPLOAD_FAILURE',
      error: 'No audio data captured'
    });
    return;
  }

  // Create a WebM Blob
  const blob = new Blob(chunks, { type: 'audio/webm' });
  logToBackground(`Blob packaged. Size: ${(blob.size / (1024 * 1024)).toFixed(2)} MB`);

  try {
    // 1. Get stored JWT token passed from service worker
    const token = authToken;
    const apiUrl = targetApiUrl || 'http://localhost:5000/api';

    if (!token) {
      logToBackground('Upload aborted: No auth token found in storage.');
      chrome.runtime.sendMessage({
        source: 'offscreen',
        action: 'UPLOAD_FAILURE',
        error: 'Session expired - Please open the extension and log in again.'
      });
      return;
    }

    logToBackground(`Uploading to endpoint: ${apiUrl}/meetings`);

    // 2. Prepare multipart form data
    const formData = new FormData();
    const cleanTitle = meetingTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    formData.append('audio', blob, `${cleanTitle}_recording_${Date.now()}.webm`);

    // 3. Perform Fetch Request
    const response = await fetch(`${apiUrl}/meetings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const responseText = await response.text();
    logToBackground(`Upload server response: Status ${response.status}`);

    let data = {};
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      logToBackground(`Non-JSON response received: ${responseText.slice(0, 100)}`);
    }

    if (response.ok) {
      logToBackground('Upload success! Notifying background worker...');
      chrome.runtime.sendMessage({
        source: 'offscreen',
        action: 'UPLOAD_SUCCESS',
        meetingId: data._id
      });
    } else {
      let errorMsg = data.message || 'Server error during upload';
      if (response.status === 401) {
        errorMsg = 'Session expired - please log in again.';
      }
      logToBackground(`Upload failed with status ${response.status}: ${errorMsg}`);
      chrome.runtime.sendMessage({
        source: 'offscreen',
        action: 'UPLOAD_FAILURE',
        error: errorMsg
      });
    }
  } catch (error) {
    logToBackground(`Network/upload connection error: ${error.message}`);
    chrome.runtime.sendMessage({
      source: 'offscreen',
      action: 'UPLOAD_FAILURE',
      error: `Network error: ${error.message}`
    });
  }
}

// Global Message Listener from Background Worker
chrome.runtime.onMessage.addListener((message) => {
  if (message.target !== 'offscreen') return;

  if (message.action === 'INIT_RECORDING') {
    authToken = message.token;
    targetApiUrl = message.apiUrl;
    startRecording(message.streamId, message.title);
  } else if (message.action === 'STOP_RECORDING') {
    stopRecording();
  } else if (message.action === 'PAUSE_RECORDING') {
    pauseRecording();
  } else if (message.action === 'RESUME_RECORDING') {
    resumeRecording();
  }
});
