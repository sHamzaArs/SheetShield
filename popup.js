// SheetShield - Popup Script (v6)

const toggleBtn   = document.getElementById('toggle-btn');
const toggleLabel = document.getElementById('toggle-label');
const toggleIcon  = document.getElementById('toggle-icon');
const statusDot   = document.getElementById('status-dot');
const statusText  = document.getElementById('status-text');
const sheetUrlEl  = document.getElementById('sheet-url');
const mainContent = document.getElementById('main-content');
const notSheets   = document.getElementById('not-sheets');
const levelBtns   = document.querySelectorAll('.level-btn');

let state = { enabled: false, blurLevel: 'medium' };
let tabId = null;

// ── INIT ──────────────────────────────────────────────────────────────────
(async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  tabId = tab.id;

  const isSheets = tab.url && tab.url.includes('docs.google.com/spreadsheets');
  if (!isSheets) {
    mainContent.style.display = 'none';
    notSheets.style.display   = 'block';
    return;
  }

  try {
    const url = new URL(tab.url);
    sheetUrlEl.textContent = url.hostname + url.pathname.slice(0, 28) + '…';
  } catch {}

  const stored = await chrome.storage.local.get(['shieldEnabled', 'blurLevel']);
  state.enabled   = stored.shieldEnabled || false;
  state.blurLevel = stored.blurLevel     || 'medium';
  renderUI();
})();

// ── TOGGLE ────────────────────────────────────────────────────────────────
toggleBtn.addEventListener('click', async () => {
  state.enabled = !state.enabled;
  await chrome.storage.local.set({ shieldEnabled: state.enabled });
  renderUI();
  await sendToContent({ action: 'toggle', enabled: state.enabled, blurLevel: state.blurLevel });
});

// ── LEVEL BUTTONS ─────────────────────────────────────────────────────────
levelBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    const level = btn.dataset.level;
    if (level === state.blurLevel) return;
    state.blurLevel = level;
    await chrome.storage.local.set({ blurLevel: level });
    renderUI();
    if (state.enabled) {
      await sendToContent({ action: 'setLevel', blurLevel: level });
    }
  });
});

// ── RENDER ────────────────────────────────────────────────────────────────
function renderUI() {
  if (state.enabled) {
    toggleBtn.classList.add('enabled');
    toggleLabel.textContent = 'Disable Shield';
    toggleIcon.textContent  = '🔓';
    statusDot.classList.add('active');
    statusText.textContent  = 'Active';
  } else {
    toggleBtn.classList.remove('enabled');
    toggleLabel.textContent = 'Enable Shield';
    toggleIcon.textContent  = '🔒';
    statusDot.classList.remove('active');
    statusText.textContent  = 'Inactive';
  }
  levelBtns.forEach(btn => {
    btn.classList.toggle('selected', btn.dataset.level === state.blurLevel);
  });
}

// ── MESSAGING ─────────────────────────────────────────────────────────────
async function sendToContent(msg) {
  if (!tabId) return;
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
      await chrome.tabs.sendMessage(tabId, msg);
    } catch (e) {
      console.warn('SheetShield: could not reach content script', e);
    }
  }
}
