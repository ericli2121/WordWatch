// Content script to inject the WordWatch overlay
(function() {
  'use strict';

  console.log('WordWatch content script loaded on:', window.location.href);

  // Check if overlay already exists
  if (document.getElementById('wordwatch-overlay')) {
    console.log('WordWatch overlay already exists, skipping creation');
    return;
  }

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'wordwatch-overlay';
  overlay.innerHTML = `
    <div class="wordwatch-content">
      <div class="wordwatch-subtitle" id="wordwatch-subtitle">No subtitles detected</div>
      <div class="wordwatch-controls">
        <button class="wordwatch-close">×</button>
      </div>
    </div>
  `;

  // Add overlay to page
  document.body.appendChild(overlay);

  // Initialize overlay functionality
  initWordWatchOverlay();

  // Initialize subtitle detection
  initSubtitleDetection();

  // Show overlay by default
  overlay.style.display = 'flex';
  console.log('WordWatch overlay created and shown');
})();

function initWordWatchOverlay() {
  const overlay = document.getElementById('wordwatch-overlay');
  
  // Load saved opacity from storage
  chrome.storage.sync.get(['opacity'], function(result) {
    const opacity = result.opacity || 0.7;
    overlay.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
  });

  // Make overlay draggable
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;

  const dragElement = overlay;

  dragElement.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e) {
    if (e.target.classList.contains('wordwatch-content')) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === dragElement || dragElement.contains(e.target)) {
        isDragging = true;
      }
    }
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      dragElement.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
    }
  }

  function dragEnd(e) {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }


  // Close overlay
  const closeBtn = overlay.querySelector('.wordwatch-close');
  closeBtn.addEventListener('click', function() {
    overlay.style.display = 'none';
  });

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('WordWatch received message:', request);
    
    if (request.action === 'updateOpacity') {
      overlay.style.backgroundColor = `rgba(0, 0, 0, ${request.opacity})`;
      sendResponse({success: true, message: 'Opacity updated'});
    } else if (request.action === 'showOverlay') {
      overlay.style.display = 'flex';
      sendResponse({success: true, message: 'Overlay shown'});
    } else if (request.action === 'hideOverlay') {
      overlay.style.display = 'none';
      sendResponse({success: true, message: 'Overlay hidden'});
    }
    
    return true; // Keep the message channel open for async response
  });
}

function initSubtitleDetection() {
  const subtitleElement = document.getElementById('wordwatch-subtitle');
  
  // Subtitle selectors for different platforms
  const subtitleSelectors = {
    youtube: [
      '.ytp-caption-segment', // YouTube captions
      '.caption-visual-line', // YouTube captions (alternative)
      '.ytp-caption-window-container .ytp-caption-segment'
    ],
    netflix: [
      '.player-timedtext', // Netflix subtitles
      '.player-timedtext-text-container', // Netflix subtitles container
      '.player-timedtext-text-container .player-timedtext-text'
    ],
    crunchyroll: [
      '.erc-karaoke-caption', // Crunchyroll subtitles
      '.erc-captions-text', // Crunchyroll captions
      '.vjs-text-track-display .vjs-text-track-cue'
    ],
    general: [
      '[class*="subtitle"]',
      '[class*="caption"]',
      '[class*="timedtext"]',
      'video::cue',
      '.vjs-text-track-display'
    ]
  };

  function detectPlatform() {
    const hostname = window.location.hostname.toLowerCase();
    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    } else if (hostname.includes('netflix.com')) {
      return 'netflix';
    } else if (hostname.includes('crunchyroll.com')) {
      return 'crunchyroll';
    }
    return 'general';
  }

  function findSubtitleElement() {
    const platform = detectPlatform();
    const selectors = subtitleSelectors[platform] || subtitleSelectors.general;
    
    console.log('WordWatch: Detecting subtitles on', platform);
    
    for (const selector of selectors) {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log('WordWatch: Found subtitle elements with selector:', selector);
        return elements;
      }
    }
    
    return null;
  }

  function extractSubtitleText() {
    const subtitleElements = findSubtitleElement();
    if (!subtitleElements) {
      return null;
    }

    let subtitleText = '';
    subtitleElements.forEach(element => {
      const text = element.textContent || element.innerText;
      if (text && text.trim()) {
        subtitleText += text.trim() + ' ';
      }
    });

    return subtitleText.trim() || null;
  }

  function updateSubtitleDisplay() {
    const subtitleText = extractSubtitleText();
    if (subtitleText) {
      subtitleElement.textContent = subtitleText;
      subtitleElement.style.display = 'block';
    } else {
      subtitleElement.textContent = 'No subtitles detected';
      subtitleElement.style.display = 'block';
    }
  }

  // Initial check
  updateSubtitleDisplay();

  // Monitor for subtitle changes using MutationObserver
  const observer = new MutationObserver(function(mutations) {
    let shouldUpdate = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const target = mutation.target;
        
        // Check if the mutation is related to subtitle elements
        const platform = detectPlatform();
        const selectors = subtitleSelectors[platform] || subtitleSelectors.general;
        
        for (const selector of selectors) {
          if (target.matches && target.matches(selector)) {
            shouldUpdate = true;
            break;
          }
          if (target.closest && target.closest(selector)) {
            shouldUpdate = true;
            break;
          }
        }
      }
    });
    
    if (shouldUpdate) {
      updateSubtitleDisplay();
    }
  });

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Also check periodically for subtitle changes (fallback)
  setInterval(updateSubtitleDisplay, 1000);

  console.log('WordWatch: Subtitle detection initialized');
}
