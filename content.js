


// Content script to inject the WordWatch overlay
(function() {
  'use strict';

  // Initialize kuroshiro once
  let kuroshiroInstance = null;
  let analyzerInstance = null;

  // JLPT Level word database (simplified - in real implementation, this would be much larger)
  const jlptWordDatabase = {
    // N5 words (beginner)
    '私': 'n5', 'あなた': 'n5', '本': 'n5', '人': 'n5', '時': 'n5', '年': 'n5', '日': 'n5', '月': 'n5',
    '水': 'n5', '火': 'n5', '土': 'n5', '金': 'n5', '木': 'n5', '食べる': 'n5', '飲む': 'n5', '行く': 'n5',
    '来る': 'n5', '見る': 'n5', '聞く': 'n5', '話す': 'n5', '読む': 'n5', '書く': 'n5', '大きい': 'n5',
    '小さい': 'n5', '新しい': 'n5', '古い': 'n5', '高い': 'n5', '安い': 'n5', 'いい': 'n5', '悪い': 'n5',
    
    // N4 words
    '勉強': 'n4', '学校': 'n4', '会社': 'n4', '仕事': 'n4', '家族': 'n4', '友達': 'n4', '先生': 'n4',
    '学生': 'n4', '病院': 'n4', '銀行': 'n4', '駅': 'n4', '空港': 'n4', '図書館': 'n4', '映画館': 'n4',
    '買い物': 'n4', '旅行': 'n4', '運動': 'n4', '料理': 'n4', '掃除': 'n4', '洗濯': 'n4',
    
    // N3 words
    '経済': 'n3', '政治': 'n3', '文化': 'n3', '歴史': 'n3', '地理': 'n3', '科学': 'n3', '技術': 'n3',
    '環境': 'n3', '社会': 'n3', '教育': 'n3', '健康': 'n3', '安全': 'n3', '危険': 'n3', '重要': 'n3',
    '必要': 'n3', '可能': 'n3', '困難': 'n3', '簡単': 'n3', '複雑': 'n3', '明確': 'n3',
    
    // N2 words
    '分析': 'n2', '研究': 'n2', '開発': 'n2', '改善': 'n2', '向上': 'n2', '進歩': 'n2', '発展': 'n2',
    '成長': 'n2', '変化': 'n2', '影響': 'n2', '効果': 'n2', '結果': 'n2', '原因': 'n2', '理由': 'n2',
    '条件': 'n2', '状況': 'n2', '問題': 'n2', '解決': 'n2', '方法': 'n2', '手段': 'n2',
    
    // N1 words (most advanced)
    '抽象的': 'n1', '具体的': 'n1', '理論的': 'n1', '実践的': 'n1', '専門的': 'n1', '一般的': 'n1',
    '普遍的': 'n1', '個別的': 'n1', '相対的': 'n1', '絶対的': 'n1', '客観的': 'n1', '主観的': 'n1',
    '批判的': 'n1', '創造的': 'n1', '建設的': 'n1', '積極的': 'n1', '消極的': 'n1', '能動的': 'n1'
  };

  async function initKuroshiro() {
    if (kuroshiroInstance && analyzerInstance) return { kuroshiro: kuroshiroInstance, analyzer: analyzerInstance };
    
    try {
      kuroshiroInstance = new Kuroshiro.default();
      analyzerInstance = new KuromojiAnalyzer({
        dictPath: chrome.runtime.getURL('lib/dict/')  // Must end with /
      });
      await kuroshiroInstance.init(analyzerInstance);
      console.log('Kuroshiro initialized successfully');
      return { kuroshiro: kuroshiroInstance, analyzer: analyzerInstance };
    } catch (error) {
      console.error('Failed to initialize Kuroshiro:', error);
      throw error;
    }
  }

  function mergeVerbTokens(tokens) {
    const merged = [];
    let i = 0;
  
    while (i < tokens.length) {
      const current = tokens[i];
  
      // Start merging if it's a verb
      if (current.pos === "動詞") {
        let mergedToken = { ...current };
        let surface = current.surface_form;
  
        // Merge auxiliary verbs and auxiliary particles
        while (
          i + 1 < tokens.length &&
          (tokens[i + 1].pos === "助動詞" ||
           (tokens[i + 1].pos === "助詞" && tokens[i + 1].pos_detail_1 === "接続助詞"))
        ) {
          i++;
          surface += tokens[i].surface_form;
        }
        
        mergedToken.surface_form = surface;
        merged.push(mergedToken);
      } else {
        merged.push(current);
      }
      
      i++;
    }
  
    return merged;
  }
  
  // Simple romanji conversion using Kuroshiro directly
  async function easyConvertToRomaji(japaneseText) {
    try {
      const { kuroshiro } = await initKuroshiro();
      
      // Simple conversion using Kuroshiro's convert method
      const romajiText = await kuroshiro.convert(japaneseText, {
        to: "romaji",
        mode: "spaced",
        romajiSystem: "hepburn"
      });
      
      return romajiText;
    } catch (error) {
      console.error('Easy conversion failed:', error);
      return japaneseText; // Fallback to original text
    }
  }

  // Romanji conversion with proper Japanese tokenization
  async function convertToRomaji(japaneseText) {
    try {
      const { kuroshiro, analyzer } = await initKuroshiro();

      // Tokenize the Japanese sentence
      const tokens = mergeVerbTokens(await analyzer.parse(japaneseText));
      let result = '';
      console.log("tokens", tokens);
      // Process each token
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        console.log("token", token);
        // Convert token to romanji
        const tokenRomaji = await kuroshiro.convert(token.surface_form, {
          to: "romaji",
          mode: "normal",
          romajiSystem: "hepburn"
        });
        
        // Apply highlighting based on current mode
        let highlightClass = '';
        
        if (window.wordwatchHighlightMode === 'pos') {
          // Part of speech highlighting
          const posString = token.pos;
          
          if (window.wordwatchPosTypes.includes('noun') && (posString.includes('名詞') || posString.includes('noun'))) {
            highlightClass = 'pos-noun'; // Red for nouns
          } else if (window.wordwatchPosTypes.includes('verb') && (posString.includes('動詞') || posString.includes('verb'))) {
            highlightClass = 'pos-verb'; // Blue for verbs
          } else if (window.wordwatchPosTypes.includes('adjective') && (posString.includes('形容詞') || posString.includes('adjective') || posString.includes('形容動詞'))) {
            highlightClass = 'pos-adjective'; // Green for adjectives
          }
        } else if (window.wordwatchHighlightMode === 'level') {
          // JLPT level highlighting
          const word = token.surface_form;
          const level = jlptWordDatabase[word];
          
          if (level && window.wordwatchJlptLevels.includes(level)) {
            highlightClass = `level-${level}`;
          }
        }
        
        // Display token with romanji below it and highlighting
        result += `<span class="japanese-char ${highlightClass}">${token.surface_form}<br><span class="romaji-char">${tokenRomaji}</span></span>`;
        
        // Add smaller space between tokens (except for the last one)
        if (i < tokens.length - 1) {
          result += '<span class="token-space"> </span>';
        }
      }
      
      return result;
    } catch (error) {
      console.error('Conversion failed:', error);
      return japaneseText; // Return original on error
    }
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
      <div class="wordwatch-subtitle-container">
        <div class="wordwatch-subtitle-japanese" id="wordwatch-subtitle-japanese">No subtitles detected</div>
        <div class="wordwatch-subtitle-romanji" id="wordwatch-subtitle-romanji"></div>
      </div>
      <div class="wordwatch-controls">
        <button class="wordwatch-close">×</button>
      </div>
    </div>
  `;

  // Add overlay to page
  document.body.appendChild(overlay);

  // Initialize overlay functionality
  initWordWatchOverlay();

  // Load romanji setting from storage
  chrome.storage.sync.get(['romanjiEnabled', 'highlightMode', 'posTypes', 'jlptLevels'], function(result) {
    window.wordwatchRomanjiEnabled = result.romanjiEnabled || false;
    window.wordwatchHighlightMode = result.highlightMode || 'pos';
    window.wordwatchPosTypes = result.posTypes || ['noun', 'verb', 'adjective'];
    window.wordwatchJlptLevels = result.jlptLevels || ['n1', 'n2', 'n3', 'n4', 'n5'];
    console.log('WordWatch: Loaded romanji setting:', window.wordwatchRomanjiEnabled);
    console.log('WordWatch: Loaded highlighting settings:', {
      mode: window.wordwatchHighlightMode,
      posTypes: window.wordwatchPosTypes,
      jlptLevels: window.wordwatchJlptLevels
    });
    
    // If subtitle detection is already initialized, update it with the new setting
    if (window.wordwatchSubtitleUpdate) {
      window.wordwatchSubtitleUpdate();
    }
  });

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
    // Allow dragging from anywhere on the overlay except the close button
    if (!e.target.classList.contains('wordwatch-close')) {
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      isDragging = true;
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
        window.wordwatchSubtitleUpdate().then(() => {
          sendResponse({success: true, message: 'Romanji setting updated'});
        }).catch((error) => {
          console.log('WordWatch: Error updating subtitle display:', error);
          sendResponse({success: true, message: 'Romanji setting updated (with errors)'});
        });
      } else {
        sendResponse({success: true, message: 'Romanji setting updated'});
      }
      return true; // Keep channel open for async response
    } else if (request.action === 'updateHighlightingSettings') {
      // Update highlighting settings and refresh subtitle display
      window.wordwatchHighlightMode = request.highlightMode;
      window.wordwatchPosTypes = request.posTypes;
      window.wordwatchJlptLevels = request.jlptLevels;
      console.log('WordWatch: Updated highlighting settings:', {
        mode: window.wordwatchHighlightMode,
        posTypes: window.wordwatchPosTypes,
        jlptLevels: window.wordwatchJlptLevels
      });
      if (window.wordwatchSubtitleUpdate) {
        window.wordwatchSubtitleUpdate().then(() => {
          sendResponse({success: true, message: 'Highlighting settings updated'});
        }).catch((error) => {
          console.log('WordWatch: Error updating subtitle display:', error);
          sendResponse({success: true, message: 'Highlighting settings updated (with errors)'});
        });
      } else {
        sendResponse({success: true, message: 'Highlighting settings updated'});
      }
      return true; // Keep channel open for async response
    }
    
    return true; // Keep the message channel open for async response
  });
  }

  function initSubtitleDetection() {
  const japaneseElement = document.getElementById('wordwatch-subtitle-japanese');
  const romanjiElement = document.getElementById('wordwatch-subtitle-romanji');
  
  // Check if there's actually a video element on the page
  const videoElements = document.querySelectorAll('video');
  if (videoElements.length === 0) {
    console.log('WordWatch: No video elements found, skipping subtitle detection');
    japaneseElement.textContent = 'No video detected';
    romanjiElement.textContent = '';
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
    console.log('WordWatch: Subtitle text:', subtitleText);
    if (subtitleText) {
      // Show romanji below if enabled
      console.log('WordWatch: Romanji enabled?', window.wordwatchRomanjiEnabled);
      if (window.wordwatchRomanjiEnabled) {
        try {
          console.log('WordWatch: Converting to romanji:', subtitleText);
          const romanjiText = await convertToRomaji(subtitleText);
          console.log('WordWatch: Romanji result:', romanjiText);
          console.log('WordWatch: Setting innerHTML to:', romanjiText);
          
          // Show the character-by-character mapped text
          japaneseElement.innerHTML = romanjiText;
          japaneseElement.style.display = 'block';
          
          // Hide the separate romanji element since it's now inline
          romanjiElement.style.display = 'none';
          console.log('WordWatch: Character-mapped romanji displayed');
        } catch (error) {
          console.log('WordWatch: Romanji conversion failed:', error);
          // Fallback to showing original text
          japaneseElement.textContent = subtitleText;
          japaneseElement.style.display = 'block';
          romanjiElement.style.display = 'none';
        }
      } else {
        // Show original Japanese text only
        japaneseElement.textContent = subtitleText;
        japaneseElement.style.display = 'block';
        romanjiElement.style.display = 'none';
        console.log('WordWatch: Romanji disabled, showing Japanese only');
      }
    } else {
      japaneseElement.textContent = 'No subtitles detected';
      japaneseElement.style.display = 'block';
      romanjiElement.textContent = '';
      romanjiElement.style.display = 'none';
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
})();
