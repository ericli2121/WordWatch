// Content script to inject the WordWatch overlay
(function() {
  'use strict';

  // Load wanakana library for proper Japanese text conversion
  function loadWanakana() {
    return new Promise((resolve, reject) => {
      if (window.wanakana) {
        resolve(window.wanakana);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/wanakana@5.0.0/dist/wanakana.min.js';
      script.onload = () => {
        if (window.wanakana) {
          resolve(window.wanakana);
        } else {
          reject(new Error('Wanakana library failed to load'));
        }
      };
      script.onerror = () => reject(new Error('Failed to load wanakana library'));
      document.head.appendChild(script);
    });
  }

  // Enhanced romanji conversion using wanakana library
  async function toRomanji(text) {
    try {
      const wanakana = await loadWanakana();
      
      // Convert directly to romaji - wanakana handles mixed text automatically
      const romajiText = wanakana.toRomaji(text);
      
      return romajiText;
    } catch (error) {
      console.log('WordWatch: Failed to load wanakana, using fallback conversion');
      
      // Fallback to basic conversion if library fails to load
      return basicToRomanji(text);
    }
  }

  // Fallback basic conversion (simplified version of the original)
  function basicToRomanji(text) {
    const basicMap = {
      'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
      'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
      'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
      'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
      'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
      'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
      'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
      'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
      'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
      'わ': 'wa', 'を': 'wo', 'ん': 'n',
      'ア': 'a', 'イ': 'i', 'ウ': 'u', 'エ': 'e', 'オ': 'o',
      'カ': 'ka', 'キ': 'ki', 'ク': 'ku', 'ケ': 'ke', 'コ': 'ko',
      'サ': 'sa', 'シ': 'shi', 'ス': 'su', 'セ': 'se', 'ソ': 'so',
      'タ': 'ta', 'チ': 'chi', 'ツ': 'tsu', 'テ': 'te', 'ト': 'to',
      'ナ': 'na', 'ニ': 'ni', 'ヌ': 'nu', 'ネ': 'ne', 'ノ': 'no',
      'ハ': 'ha', 'ヒ': 'hi', 'フ': 'fu', 'ヘ': 'he', 'ホ': 'ho',
      'マ': 'ma', 'ミ': 'mi', 'ム': 'mu', 'メ': 'me', 'モ': 'mo',
      'ヤ': 'ya', 'ユ': 'yu', 'ヨ': 'yo',
      'ラ': 'ra', 'リ': 'ri', 'ル': 'ru', 'レ': 're', 'ロ': 'ro',
      'ワ': 'wa', 'ヲ': 'wo', 'ン': 'n'
    };

    let result = text;
    for (const [japanese, romanji] of Object.entries(basicMap)) {
      result = result.replace(new RegExp(japanese, 'g'), romanji);
    }
    return result;
  }

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

  // Initialize subtitle detection only on video platforms
  const hostname = window.location.hostname.toLowerCase();
  const isVideoPlatform = hostname.includes('youtube.com') || 
                         hostname.includes('youtu.be') || 
                         hostname.includes('netflix.com') || 
                         hostname.includes('crunchyroll.com');
  
  if (isVideoPlatform) {
    // Check if there's actually a video element on the page
    const videoElements = document.querySelectorAll('video');
    if (videoElements.length > 0) {
      initSubtitleDetection();
      // Show overlay only when there's a video
      overlay.style.display = 'flex';
      console.log('WordWatch overlay created and shown on video platform');
    } else {
      // Hide overlay if no video detected
      overlay.style.display = 'none';
      console.log('WordWatch: Video platform but no video detected, hiding overlay');
    }
  } else {
    // Hide overlay on non-video platforms
    overlay.style.display = 'none';
    console.log('WordWatch: Not a video platform, hiding overlay');
  }

  // Monitor for video elements appearing on the page (for dynamic content)
  const videoObserver = new MutationObserver(function(mutations) {
    const videoElements = document.querySelectorAll('video');
    const hasVideo = videoElements.length > 0;
    
    if (isVideoPlatform) {
      if (hasVideo && overlay.style.display === 'none') {
        // Video appeared, show overlay and initialize subtitle detection
        overlay.style.display = 'flex';
        initSubtitleDetection();
        console.log('WordWatch: Video detected, showing overlay');
      } else if (!hasVideo && overlay.style.display === 'flex') {
        // Video disappeared, hide overlay
        overlay.style.display = 'none';
        console.log('WordWatch: Video disappeared, hiding overlay');
      }
    }
  });

  // Start observing for video elements
  videoObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
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
      // Only show overlay if on a video platform with video
      const hostname = window.location.hostname.toLowerCase();
      const isVideoPlatform = hostname.includes('youtube.com') || 
                             hostname.includes('youtu.be') || 
                             hostname.includes('netflix.com') || 
                             hostname.includes('crunchyroll.com');
      const hasVideo = document.querySelectorAll('video').length > 0;
      
      if (isVideoPlatform && hasVideo) {
        overlay.style.display = 'flex';
        sendResponse({success: true, message: 'Overlay shown'});
      } else {
        sendResponse({success: false, message: 'No video detected on this page'});
      }
    } else if (request.action === 'hideOverlay') {
      overlay.style.display = 'none';
      sendResponse({success: true, message: 'Overlay hidden'});
    } else if (request.action === 'updateRomanjiSetting') {
      // Update romanji setting and refresh subtitle display
      window.wordwatchRomanjiEnabled = request.romanjiEnabled;
      if (window.wordwatchSubtitleUpdate) {
        window.wordwatchSubtitleUpdate();
      }
      sendResponse({success: true, message: 'Romanji setting updated'});
    }
    
    return true; // Keep the message channel open for async response
  });
}

function initSubtitleDetection() {
  const subtitleElement = document.getElementById('wordwatch-subtitle');
  
  // Check if there's actually a video element on the page
  const videoElements = document.querySelectorAll('video');
  if (videoElements.length === 0) {
    console.log('WordWatch: No video elements found, skipping subtitle detection');
    subtitleElement.textContent = 'No video detected';
    return;
  }
  
  console.log('WordWatch: Video elements found, initializing subtitle detection');
  
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

  async function updateSubtitleDisplay() {
    const subtitleText = extractSubtitleText();
    if (subtitleText) {
      let displayText = subtitleText;
      
      // Convert to romanji if enabled and text contains Japanese characters
      if (window.wordwatchRomanjiEnabled) {
        try {
          displayText = await toRomanji(subtitleText);
          
          // Log the conversion for debugging
          if (subtitleText !== displayText) {
            console.log('WordWatch: Converted to romanji:', subtitleText, '->', displayText);
          }
        } catch (error) {
          console.log('WordWatch: Romanji conversion failed:', error);
          displayText = subtitleText; // Fallback to original text
        }
      }
      
      subtitleElement.textContent = displayText;
      subtitleElement.style.display = 'block';
    } else {
      subtitleElement.textContent = 'No subtitles detected';
      subtitleElement.style.display = 'block';
    }
  }

  // Make the function globally accessible
  window.wordwatchSubtitleUpdate = updateSubtitleDisplay;

  // Initial check
  updateSubtitleDisplay();

  // Monitor for subtitle changes using MutationObserver (optimized)
  const observer = new MutationObserver(function(mutations) {
    let shouldUpdate = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        const target = mutation.target;
        
        // Only check mutations that might be related to subtitles
        if (target.classList && (
          target.classList.contains('ytp-caption-segment') ||
          target.classList.contains('player-timedtext') ||
          target.classList.contains('erc-karaoke-caption') ||
          target.classList.contains('caption') ||
          target.classList.contains('subtitle')
        )) {
          shouldUpdate = true;
        }
      }
    });
    
    if (shouldUpdate) {
      updateSubtitleDisplay();
    }
  });

  // Start observing with more targeted approach
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  // Check periodically for subtitle changes (fallback) - reduced frequency
  setInterval(() => updateSubtitleDisplay(), 2000);

  console.log('WordWatch: Subtitle detection initialized');
}
