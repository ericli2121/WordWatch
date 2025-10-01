// Popup script for WordWatch extension
document.addEventListener('DOMContentLoaded', function() {
  const opacitySlider = document.getElementById('opacitySlider');
  const opacityValue = document.getElementById('opacityValue');
  const preview = document.getElementById('preview');
  const showOverlayBtn = document.getElementById('showOverlay');
  const hideOverlayBtn = document.getElementById('hideOverlay');
  const romanjiToggle = document.getElementById('romanjiToggle');
  const highlightModeRadios = document.querySelectorAll('input[name="highlightMode"]');
  const posControls = document.getElementById('posControls');
  const levelControls = document.getElementById('levelControls');

  // Load saved settings
  chrome.storage.sync.get([
    'opacity', 
    'romanjiEnabled', 
    'highlightMode', 
    'posTypes', 
    'jlptLevels'
  ], function(result) {
    console.log('Loaded settings from storage:', result);
    const opacity = result.opacity || 0.7;
    const romanjiEnabled = result.romanjiEnabled || false;
    const highlightMode = result.highlightMode || 'pos';
    const posTypes = result.posTypes || ['noun', 'verb', 'adjective'];
    const jlptLevels = result.jlptLevels || ['N1', 'N2', 'N3', 'N4', 'N5'];
    console.log('Processed settings:', { opacity, romanjiEnabled, highlightMode, posTypes, jlptLevels });
    
    opacitySlider.value = opacity;
    romanjiToggle.checked = romanjiEnabled;
    
    // Set highlighting mode
    const highlightModeRadio = document.querySelector(`input[name="highlightMode"][value="${highlightMode}"]`);
    if (highlightModeRadio) {
      highlightModeRadio.checked = true;
      console.log('Set highlighting mode to:', highlightMode);
    } else {
      console.error('Could not find highlight mode radio button for:', highlightMode);
    }
    updateHighlightingMode(highlightMode);
    
    // Set part of speech checkboxes
    console.log('Setting POS checkboxes for:', posTypes);
    // First, uncheck all POS checkboxes
    document.querySelectorAll('input[name="posType"]').forEach(cb => cb.checked = false);
    
    posTypes.forEach(posType => {
      const checkbox = document.querySelector(`input[name="posType"][value="${posType}"]`);
      if (checkbox) {
        checkbox.checked = true;
        console.log('Set POS checkbox:', posType);
      } else {
        console.error('Could not find POS checkbox for:', posType);
      }
    });
    
    // Set JLPT level checkboxes
    console.log('Setting JLPT level checkboxes for:', jlptLevels);
    // First, uncheck all JLPT level checkboxes
    document.querySelectorAll('input[name="jlptLevel"]').forEach(cb => cb.checked = false);
    
    jlptLevels.forEach(level => {
      const checkbox = document.querySelector(`input[name="jlptLevel"][value="${level}"]`);
      if (checkbox) {
        checkbox.checked = true;
        console.log('Set JLPT level checkbox:', level);
      } else {
        console.error('Could not find JLPT level checkbox for:', level);
      }
    });
    
    updateOpacityDisplay(opacity);
    updatePreview(opacity);
    
    console.log('Settings loading complete');
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

  // Handle highlighting mode change
  highlightModeRadios.forEach(radio => {
    radio.addEventListener('change', function() {
      if (this.checked) {
        const mode = this.value;
        updateHighlightingMode(mode);
        
        // Save highlighting mode to storage
        chrome.storage.sync.set({ highlightMode: mode });
        
        // Send message to content script
        sendHighlightingSettings();
      }
    });
  });

  // Handle part of speech checkboxes
  document.querySelectorAll('input[name="posType"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const posTypes = Array.from(document.querySelectorAll('input[name="posType"]:checked'))
        .map(cb => cb.value);
      
      console.log('POS checkbox changed. New posTypes:', posTypes);
      
      // Save part of speech types to storage
      chrome.storage.sync.set({ posTypes: posTypes }, function() {
        console.log('Saved posTypes to storage:', posTypes);
        if (chrome.runtime.lastError) {
          console.error('Error saving posTypes:', chrome.runtime.lastError);
        } else {
          // Verify the save by reading it back
          chrome.storage.sync.get(['posTypes'], function(result) {
            console.log('Verification - posTypes in storage:', result.posTypes);
          });
        }
      });
      
      // Send message to content script
      sendHighlightingSettings();
    });
  });

  // Handle JLPT level checkboxes
  document.querySelectorAll('input[name="jlptLevel"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const jlptLevels = Array.from(document.querySelectorAll('input[name="jlptLevel"]:checked'))
        .map(cb => cb.value);
      
      console.log('JLPT checkbox changed. New jlptLevels:', jlptLevels);
      
      // Save JLPT levels to storage
      chrome.storage.sync.set({ jlptLevels: jlptLevels }, function() {
        console.log('Saved jlptLevels to storage:', jlptLevels);
        if (chrome.runtime.lastError) {
          console.error('Error saving jlptLevels:', chrome.runtime.lastError);
        }
      });
      
      // Send message to content script
      sendHighlightingSettings();
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

  function updateHighlightingMode(mode) {
    console.log('updateHighlightingMode called with:', mode);
    console.log('posControls element:', posControls);
    console.log('levelControls element:', levelControls);
    
    if (mode === 'pos') {
      if (posControls) posControls.style.display = 'block';
      if (levelControls) levelControls.style.display = 'none';
      console.log('Set to POS mode');
    } else if (mode === 'level') {
      if (posControls) posControls.style.display = 'none';
      if (levelControls) levelControls.style.display = 'block';
      console.log('Set to Level mode');
    }
  }

  function sendHighlightingSettings() {
    const highlightMode = document.querySelector('input[name="highlightMode"]:checked').value;
    const posTypes = Array.from(document.querySelectorAll('input[name="posType"]:checked'))
      .map(cb => cb.value);
    const jlptLevels = Array.from(document.querySelectorAll('input[name="jlptLevel"]:checked'))
      .map(cb => cb.value);

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'updateHighlightingSettings',
        highlightMode: highlightMode,
        posTypes: posTypes,
        jlptLevels: jlptLevels
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.log('Error sending message:', chrome.runtime.lastError);
        }
      });
    });
  }
});