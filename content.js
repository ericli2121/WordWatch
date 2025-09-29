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
      <div class="wordwatch-title">WordWatch</div>
      <div class="wordwatch-controls">
        <button class="wordwatch-close">×</button>
      </div>
    </div>
  `;

  // Add overlay to page
  document.body.appendChild(overlay);

  // Initialize overlay functionality
  initWordWatchOverlay();

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
