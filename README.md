# WordWatch Chrome Extension

A Chrome extension that places a draggable black overlay with customizable background opacity on web pages. The overlay displays "WordWatch" and can be repositioned by dragging.

## Features

- **Draggable Overlay**: Click and drag the overlay to any position on the page
- **Customizable Opacity**: Adjust the background opacity from 10% to 100%
- **Show/Hide Controls**: Toggle the overlay visibility using the popup interface
- **Modern UI**: Clean, responsive design with smooth animations

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked" and select the WordWatch folder
4. The extension should now appear in your extensions list

## Usage

1. Click the WordWatch extension icon in your Chrome toolbar
2. Use the opacity slider to adjust the background transparency
3. Click "Show Overlay" to display the WordWatch overlay on the current page
4. Drag the overlay to reposition it anywhere on the page
5. Use the "×" button on the overlay to hide it temporarily

## Files

- `manifest.json` - Extension configuration
- `content.js` - Content script that injects the overlay
- `overlay.css` - Styles for the draggable overlay
- `popup.html` - Extension popup interface
- `popup.js` - Popup functionality and controls
- `icons/` - Extension icons (you can add your own 16x16, 48x48, and 128x128 PNG icons)

## Customization

You can customize the overlay by modifying:
- Text: Change "WordWatch" in `content.js`
- Colors: Modify the CSS in `overlay.css`
- Size: Adjust the width and height in `overlay.css`
- Position: Change the initial position in `overlay.css`
