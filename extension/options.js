// options.js - MeetSense Companion Settings page controller

document.addEventListener('DOMContentLoaded', async () => {
  const requestMicBtn = document.getElementById('request-mic-btn');
  const statusMessage = document.getElementById('status-message');

  function showStatus(type, text) {
    statusMessage.innerText = text;
    statusMessage.className = 'toast';
    if (type === 'success') {
      statusMessage.classList.add('toast-success');
    } else {
      statusMessage.classList.add('toast-error');
    }
    statusMessage.classList.remove('hidden');
  }

  // Check if permission is already granted
  try {
    const permission = await navigator.permissions.query({ name: 'microphone' });
    
    if (permission.state === 'granted') {
      showStatus('success', 'Microphone permission already granted! You can close this settings page.');
      requestMicBtn.disabled = true;
      requestMicBtn.innerText = 'Granted';
    }

    permission.onchange = () => {
      if (permission.state === 'granted') {
        showStatus('success', 'Microphone permission granted! You can close this settings page.');
        requestMicBtn.disabled = true;
        requestMicBtn.innerText = 'Granted';
      }
    };
  } catch (err) {
    console.warn('Microphone permission query not fully supported in this context:', err);
  }

  // Request Microphone Access on Button Click
  requestMicBtn.addEventListener('click', async () => {
    showStatus('info', 'Requesting microphone permission...');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Stop the stream immediately so we don't leave the microphone recording
      stream.getTracks().forEach(track => track.stop());
      
      showStatus('success', 'Microphone permission granted successfully! You can close this settings page.');
      requestMicBtn.disabled = true;
      requestMicBtn.innerText = 'Granted';
    } catch (error) {
      console.error('Microphone permission request failed:', error);
      showStatus('error', `Microphone permission denied: ${error.message}. Please allow microphone access in your browser settings.`);
    }
  });
});
