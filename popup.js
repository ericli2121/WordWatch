// Popup script for WordWatch extension
document.addEventListener('DOMContentLoaded', function() {
  const opacitySlider = document.getElementById('opacitySlider');
  const opacityValue = document.getElementById('opacityValue');
  const preview = document.getElementById('preview');
  const showOverlayBtn = document.getElementById('showOverlay');
  const hideOverlayBtn = document.getElementById('hideOverlay');
  const romanjiToggle = document.getElementById('romanjiToggle');

  // Load saved settings
  chrome.storage.sync.get(['opacity', 'romanjiEnabled'], function(result) {
    const opacity = result.opacity || 0.7;
    const romanjiEnabled = result.romanjiEnabled || false;
    
    opacitySlider.value = opacity;
    romanjiToggle.checked = romanjiEnabled;
    
    updateOpacityDisplay(opacity);
    updatePreview(opacity);
  });

  // Handle opacity slider change
  opacitySlider.addEventListener('input', function() {
    const opacity = parseFloat(this.value);
    updateOpacityDisplay(opacity);
    updatePreview(opacity);
    
    // Save opacity to storage
    chrome.storage.sync.set({ opacity: opacity });
    
    // Send message to content script to update overlay
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateOpacity',
        opacity: opacity
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);
        }
      });
    });
  });

  // Handle romanji toggle change
  romanjiToggle.addEventListener('change', function() {
    const romanjiEnabled = this.checked;
    
    // Save romanji setting to storage
    chrome.storage.sync.set({ romanjiEnabled: romanjiEnabled });
    
    // Send message to content script to update romanji setting
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateRomanjiSetting',
        romanjiEnabled: romanjiEnabled
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);
        }
      });
    });
  });

  // Show overlay button
  showOverlayBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'showOverlay'
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);
        }
      });
    });
  });

  // Hide overlay button
  hideOverlayBtn.addEventListener('click', function() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'hideOverlay'
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);
        }
      });
    });
  });

  function updateOpacityDisplay(opacity) {
    opacityValue.textContent = Math.round(opacity * 100) + '%';
  }

  function updatePreview(opacity) {
    preview.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
  }
});
