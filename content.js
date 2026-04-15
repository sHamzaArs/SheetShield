// SheetShield - Content Script (v6)

let isEnabled  = false;
let blurLevel  = 'medium'; // 'light' | 'medium' | 'heavy'
let styleEl    = null;

const BLUR = { light: '3px', medium: '7px', heavy: '14px' };

// ── INIT ──────────────────────────────────────────────────────────────────
chrome.storage.local.get(['shieldEnabled', 'blurLevel'], (result) => {
  isEnabled = result.shieldEnabled || false;
  blurLevel = result.blurLevel || 'medium';
  if (isEnabled) applyShield();
});

// ── MESSAGES ──────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggle') {
    isEnabled = msg.enabled;
    blurLevel = msg.blurLevel || blurLevel;
    isEnabled ? applyShield() : removeShield();
    sendResponse({ ok: true });
  }
  if (msg.action === 'setLevel') {
    blurLevel = msg.blurLevel;
    if (isEnabled) { removeShield(); applyShield(); }
    sendResponse({ ok: true });
  }
  if (msg.action === 'getState') {
    sendResponse({ enabled: isEnabled, blurLevel });
  }
  return true;
});

// ── APPLY / REMOVE ────────────────────────────────────────────────────────
function applyShield() {
  removeShield();
  const px = BLUR[blurLevel] || BLUR.medium;

  styleEl = document.createElement('style');
  styleEl.id = 'sheetshield-style';
  styleEl.textContent = `
    #waffle-grid-container canvas,
    .grid-container canvas,
    canvas.waffle-main-canvas {
      filter: blur(${px}) !important;
      transition: filter 0.2s ease;
    }
    #t-name-box-input, .cell-input,
    [id^="t-formula-bar"], .formula-bar-input {
      filter: blur(${px}) !important;
      transition: filter 0.2s ease;
    }
  `;
  document.head.appendChild(styleEl);
  showBadge();
}

function removeShield() {
  if (styleEl) { styleEl.remove(); styleEl = null; }
  removeBadge();
}

// ── BADGE ─────────────────────────────────────────────────────────────────
function showBadge() {
  removeBadge();
  const labels = { light: 'LIGHT', medium: 'MEDIUM', heavy: 'HEAVY' };
  const badge = document.createElement('div');
  badge.id = 'sheetshield-badge';
  badge.style.cssText = `
    position: fixed; top: 10px; right: 10px; z-index: 999999;
    background: #0d0d1a; color: #00d4ff;
    font-family: 'Courier New', monospace;
    font-size: 11px; font-weight: bold; letter-spacing: 0.1em;
    padding: 5px 11px; border-radius: 20px;
    border: 1px solid #00d4ff55; box-shadow: 0 0 10px #00d4ff22;
    pointer-events: none;
  `;
  badge.textContent = `🛡 SHIELD · ${labels[blurLevel]}`;
  document.body.appendChild(badge);
}

function removeBadge() {
  const b = document.getElementById('sheetshield-badge');
  if (b) b.remove();
}
