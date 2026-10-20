/* ======================================================
   CyberShield — Security Toolkit
   script.js — All frontend functionality
   ====================================================== */

'use strict';

// ══════════════════════════════════════════════════════
//  NAVIGATION
// ══════════════════════════════════════════════════════

const navButtons = document.querySelectorAll('.nav-btn');
const sections   = document.querySelectorAll('.section');

/**
 * Activate a named section and update nav state.
 * @param {string} sectionId - matches data-section attribute
 */
function showSection(sectionId) {
  sections.forEach(sec => {
    const active = sec.id === `section-${sectionId}`;
    sec.classList.toggle('active', active);
  });

  navButtons.forEach(btn => {
    const active = btn.dataset.section === sectionId;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-current', active ? 'page' : 'false');
  });

  // Log non-sensitive navigation event
  if (sectionId !== 'dashboard') {
    const labels = {
      'password-checker':    'Password Checker',
      'password-generator':  'Password Generator',
      'file-integrity':      'File Integrity Checker',
      'url-checker':         'URL Risk Checker',
    };
    logActivity('info', `Opened: ${labels[sectionId] || sectionId}`);
  }

  closeSidebar();
}

// Nav button clicks
navButtons.forEach(btn => {
  btn.addEventListener('click', () => showSection(btn.dataset.section));
});

// Tool cards on the dashboard
document.querySelectorAll('.tool-card[data-section]').forEach(card => {
  card.addEventListener('click',   () => showSection(card.dataset.section));
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      showSection(card.dataset.section);
    }
  });
});

// ══════════════════════════════════════════════════════
//  MOBILE SIDEBAR TOGGLE
// ══════════════════════════════════════════════════════

const sidebar        = document.getElementById('sidebar');
const hamburger      = document.getElementById('hamburger');
const sidebarOverlay = document.getElementById('sidebarOverlay');

function openSidebar() {
  sidebar.classList.add('open');
  sidebarOverlay.classList.add('visible');
  sidebarOverlay.removeAttribute('aria-hidden');
  hamburger.classList.add('open');
  hamburger.setAttribute('aria-expanded', 'true');
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('visible');
  sidebarOverlay.setAttribute('aria-hidden', 'true');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', 'false');
}

hamburger.addEventListener('click', () => {
  if (sidebar.classList.contains('open')) closeSidebar();
  else openSidebar();
});

sidebarOverlay.addEventListener('click', closeSidebar);

// Close sidebar on Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeSidebar();
});

// ══════════════════════════════════════════════════════
//  ACTIVITY LOG
// ══════════════════════════════════════════════════════

const activityList = document.getElementById('activityList');

/**
 * Add a timestamped entry to the activity panel.
 * @param {'info'|'success'|'warning'} type
 * @param {string} message - must NOT contain any sensitive user data
 */
function logActivity(type, message) {
  const li = document.createElement('li');
  li.className = `activity-item activity--${type}`;

  const dot  = document.createElement('span');
  dot.className = 'activity-dot';

  const msg  = document.createElement('span');
  msg.className = 'activity-msg';
  msg.textContent = message;

  const time = document.createElement('span');
  time.className = 'activity-time';
  time.textContent = formatTime(new Date());

  li.append(dot, msg, time);

  // Prepend so newest is at top (after load line)
  const loadItem = activityList.querySelector('li');
  activityList.insertBefore(li, loadItem ? loadItem.nextSibling : null);

  // Keep log at max 20 entries
  while (activityList.children.length > 20) {
    activityList.removeChild(activityList.lastChild);
  }
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

// Set load timestamp
const loadTimeEl = document.getElementById('loadTime');
if (loadTimeEl) loadTimeEl.textContent = formatTime(new Date());

// ══════════════════════════════════════════════════════
//  PASSWORD STRENGTH CHECKER
// ══════════════════════════════════════════════════════

const passwordInput  = document.getElementById('passwordInput');
const togglePwBtn    = document.getElementById('togglePw');
const strengthBar    = document.getElementById('strengthBar');
const strengthStatus = document.getElementById('pw-strength-status');
const criteriaItems  = document.querySelectorAll('.criterion');
const feedbackBox    = document.getElementById('pw-feedback');
const clearPwBtn     = document.getElementById('clearPwBtn');

// ── Common sequences to detect ──
const COMMON_SEQUENCES = [
  'abcdef', 'bcdefg', 'cdefgh', 'defghi', 'efghij',
  'fghijk', 'ghijkl', 'hijklm', 'ijklmn', 'jklmno',
  'klmnop', 'lmnopq', 'mnopqr', 'nopqrs', 'opqrst',
  'pqrstu', 'qrstuv', 'rstuvw', 'stuvwx', 'tuvwxy',
  'uvwxyz',
  '012345', '123456', '234567', '345678', '456789',
  '567890', '654321', '987654',
  'qwerty', 'wertyu', 'ertyui', 'rtyuio', 'tyuiop',
  'asdfgh', 'sdfghj', 'dfghjk', 'fghjkl',
  'zxcvbn', 'xcvbnm',
  'qazwsx', 'wsxedc',
];

// ── Criteria definitions ──
const CRITERIA = {
  'crit-length':    pw => pw.length >= 12,
  'crit-upper':     pw => /[A-Z]/.test(pw),
  'crit-lower':     pw => /[a-z]/.test(pw),
  'crit-digit':     pw => /[0-9]/.test(pw),
  'crit-symbol':    pw => /[^A-Za-z0-9]/.test(pw),
  'crit-no-repeat': pw => !/(.)\1{2,}/.test(pw),  // no 3+ consecutive same chars
  'crit-no-seq':    pw => !COMMON_SEQUENCES.some(seq =>
      pw.toLowerCase().includes(seq) || pw.toLowerCase().includes(seq.split('').reverse().join(''))
  ),
};

/**
 * Evaluate password against all criteria and return a score 0–7.
 */
function evaluatePassword(pw) {
  const results = {};
  let score = 0;

  for (const [id, test] of Object.entries(CRITERIA)) {
    results[id] = test(pw);
    if (results[id]) score++;
  }

  // Bonus point for length >= 16
  const longBonus = pw.length >= 16;

  return { results, score, longBonus };
}

/**
 * Map score to a label, color, and bar width.
 */
function scoreToStrength(score, len) {
  if (len === 0) return null;
  if (score <= 2) return { label: 'Very Weak',  color: 'var(--strength-weak)',   width: '15%' };
  if (score <= 3) return { label: 'Weak',        color: 'var(--strength-weak)',   width: '30%' };
  if (score <= 4) return { label: 'Fair',        color: 'var(--strength-fair)',   width: '52%' };
  if (score <= 5) return { label: 'Good',        color: 'var(--strength-good)',   width: '72%' };
  if (score <= 6) return { label: 'Strong',      color: 'var(--strength-strong)', width: '88%' };
  return            { label: 'Very Strong',      color: 'var(--strength-strong)', width: '100%' };
}

/**
 * Build feedback messages from failed criteria.
 */
function buildFeedback(pw, results, strength) {
  if (!pw) {
    return '<p class="feedback-placeholder">Start typing to see your password analysis.</p>';
  }

  const items = [];

  // Positive message if strong
  if (strength && (strength.label === 'Strong' || strength.label === 'Very Strong')) {
    items.push({ type: 'good', text: 'This password meets all recommended security criteria.' });
  }

  // Weakness messages
  if (!results['crit-length']) {
    const need = 12 - pw.length;
    items.push({ type: 'warn', text: `Too short — add at least ${need} more character${need === 1 ? '' : 's'} (aim for 12+).` });
  }
  if (!results['crit-upper']) {
    items.push({ type: 'tip', text: 'Add at least one uppercase letter (A–Z).' });
  }
  if (!results['crit-lower']) {
    items.push({ type: 'tip', text: 'Add at least one lowercase letter (a–z).' });
  }
  if (!results['crit-digit']) {
    items.push({ type: 'tip', text: 'Include at least one digit (0–9).' });
  }
  if (!results['crit-symbol']) {
    items.push({ type: 'tip', text: 'Add a special character such as !@#$%^&*().' });
  }
  if (!results['crit-no-repeat']) {
    items.push({ type: 'warn', text: 'Avoid repeating the same character three or more times in a row (e.g. "aaa").' });
  }
  if (!results['crit-no-seq']) {
    items.push({ type: 'warn', text: 'Avoid common keyboard sequences like "123456", "qwerty", or "abcdef".' });
  }

  // Entropy / length advice
  if (pw.length >= 12 && pw.length < 16) {
    items.push({ type: 'tip', text: 'Consider extending to 16+ characters for even greater protection.' });
  }

  if (items.length === 0) {
    items.push({ type: 'good', text: 'Excellent — no issues detected.' });
  }

  return items.map(item =>
    `<p class="feedback-item feedback-item--${item.type}">${escapeHTML(item.text)}</p>`
  ).join('');
}

/** Simple HTML escaping to prevent XSS if input is ever rendered. */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Main analysis handler — called on every input event. */
function analyzePassword() {
  const pw = passwordInput.value;

  if (!pw) {
    resetPasswordUI();
    return;
  }

  const { results, score, longBonus } = evaluatePassword(pw);
  const adjustedScore = Math.min(7, score + (longBonus ? 1 : 0));
  const strength = scoreToStrength(adjustedScore, pw.length);

  // Update strength bar
  strengthBar.style.width           = strength ? strength.width : '0%';
  strengthBar.style.backgroundColor = strength ? strength.color : 'transparent';

  // Update label
  if (strength) {
    strengthStatus.textContent  = strength.label;
    strengthStatus.style.color  = strength.color;
  }

  // Update criteria list
  criteriaItems.forEach(item => {
    const met = results[item.id] ?? false;
    item.dataset.met = met ? 'true' : 'false';
    // Update accessible text
    const label = item.querySelector('span:last-child').textContent;
    item.setAttribute('aria-label', `${label}: ${met ? 'passed' : 'not met'}`);
  });

  // Update feedback
  feedbackBox.innerHTML = buildFeedback(pw, results, strength);
}

function resetPasswordUI() {
  strengthBar.style.width = '0%';
  strengthBar.style.backgroundColor = 'transparent';
  strengthStatus.textContent = '';
  criteriaItems.forEach(item => { item.dataset.met = 'false'; });
  feedbackBox.innerHTML = '<p class="feedback-placeholder">Start typing to see your password analysis.</p>';
}

// ── Password input listener ──
passwordInput.addEventListener('input', analyzePassword);

// ── Show / Hide toggle ──
togglePwBtn.addEventListener('click', () => {
  const isHidden = passwordInput.type === 'password';
  passwordInput.type = isHidden ? 'text' : 'password';
  togglePwBtn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
  togglePwBtn.setAttribute('aria-pressed', isHidden ? 'true' : 'false');

  const eyeShow = togglePwBtn.querySelector('.eye-show');
  const eyeHide = togglePwBtn.querySelector('.eye-hide');
  eyeShow.style.display = isHidden ? 'none'  : '';
  eyeHide.style.display = isHidden ? ''      : 'none';
});

// ── Clear button ──
clearPwBtn.addEventListener('click', () => {
  passwordInput.value = '';
  passwordInput.type  = 'password';

  const eyeShow = togglePwBtn.querySelector('.eye-show');
  const eyeHide = togglePwBtn.querySelector('.eye-hide');
  eyeShow.style.display = '';
  eyeHide.style.display = 'none';

  togglePwBtn.setAttribute('aria-label',   'Show password');
  togglePwBtn.setAttribute('aria-pressed', 'false');

  resetPasswordUI();
  passwordInput.focus();
  logActivity('info', 'Password Checker: input cleared');
});

// ══════════════════════════════════════════════════════
//  PASSWORD GENERATOR
// ══════════════════════════════════════════════════════

const CHARS_UPPER   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const CHARS_UPPER_A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_LOWER   = 'abcdefghjkmnpqrstuvwxyz';
const CHARS_LOWER_A = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_DIGITS  = '23456789';
const CHARS_DIGITS_A= '0123456789';
const CHARS_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS     = new Set(['0','O','l','1','I','o']);

const genLengthInput    = document.getElementById('genLength');
const genLengthDisplay  = document.getElementById('genLengthDisplay');
const genUpperCb        = document.getElementById('genUpper');
const genLowerCb        = document.getElementById('genLower');
const genDigitsCb       = document.getElementById('genDigits');
const genSymbolsCb      = document.getElementById('genSymbols');
const genNoAmbigCb      = document.getElementById('genNoAmbig');
const genOutput         = document.getElementById('genOutput');
const copyGenBtn        = document.getElementById('copyGenBtn');
const copyIcon          = document.getElementById('copyIcon');
const copiedIcon        = document.getElementById('copiedIcon');
const generateBtn       = document.getElementById('generateBtn');
const generateAgainBtn  = document.getElementById('generateAgainBtn');
const genStrengthBar    = document.getElementById('genStrengthBar');
const genStrengthLabel  = document.getElementById('genStrengthLabel');
const genError          = document.getElementById('genError');

genLengthInput.addEventListener('input', () => {
  genLengthDisplay.textContent = genLengthInput.value;
});

/**
 * Generate a cryptographically random password using Web Crypto API.
 */
function generatePassword() {
  const len       = parseInt(genLengthInput.value, 10);
  const noAmbig   = genNoAmbigCb.checked;
  const useUpper  = genUpperCb.checked;
  const useLower  = genLowerCb.checked;
  const useDigits = genDigitsCb.checked;
  const useSymbols= genSymbolsCb.checked;

  if (!useUpper && !useLower && !useDigits && !useSymbols) {
    genError.style.display = 'block';
    return;
  }
  genError.style.display = 'none';

  // Build charset
  let charset = '';
  if (useUpper)   charset += noAmbig ? CHARS_UPPER   : CHARS_UPPER_A;
  if (useLower)   charset += noAmbig ? CHARS_LOWER   : CHARS_LOWER_A;
  if (useDigits)  charset += noAmbig ? CHARS_DIGITS  : CHARS_DIGITS_A;
  if (useSymbols) charset += CHARS_SYMBOLS;

  // Ensure at least one character from each selected category
  const required = [];
  const pickOne = (chars) => {
    const arr = noAmbig ? [...chars].filter(c => !AMBIGUOUS.has(c)) : [...chars];
    const idx  = cryptoRandByte() % arr.length;
    return arr[idx];
  };
  if (useUpper)   required.push(pickOne(noAmbig ? CHARS_UPPER   : CHARS_UPPER_A));
  if (useLower)   required.push(pickOne(noAmbig ? CHARS_LOWER   : CHARS_LOWER_A));
  if (useDigits)  required.push(pickOne(noAmbig ? CHARS_DIGITS  : CHARS_DIGITS_A));
  if (useSymbols) required.push(pickOne(CHARS_SYMBOLS));

  // Fill remaining length
  const remaining = len - required.length;
  const filledArr = [];
  for (let i = 0; i < remaining; i++) {
    filledArr.push(charset[cryptoRandByte() % charset.length]);
  }

  // Shuffle required + filled using Fisher-Yates with crypto randomness
  const combined = [...required, ...filledArr];
  for (let i = combined.length - 1; i > 0; i--) {
    const j = cryptoRandByte() % (i + 1);
    [combined[i], combined[j]] = [combined[j], combined[i]];
  }

  const password = combined.join('');
  genOutput.value = password;
  generateAgainBtn.style.display = 'inline-flex';

  // Show strength of generated password (reuse existing evaluator)
  const { score, longBonus } = evaluatePassword(password);
  const adjScore = Math.min(7, score + (longBonus ? 1 : 0));
  const strength = scoreToStrength(adjScore, password.length);
  if (strength) {
    genStrengthBar.style.width           = strength.width;
    genStrengthBar.style.backgroundColor = strength.color;
    genStrengthLabel.textContent         = strength.label;
    genStrengthLabel.style.color         = strength.color;
  }

  logActivity('success', `Password generated (length ${len})`);
}

/**
 * Return a single cryptographically random byte (0–255).
 * We use rejection sampling so the distribution is uniform across any charset size.
 */
function cryptoRandByte() {
  const buf = new Uint8Array(1);
  crypto.getRandomValues(buf);
  return buf[0];
}

generateBtn.addEventListener('click', generatePassword);
generateAgainBtn.addEventListener('click', generatePassword);

// Copy generated password
copyGenBtn.addEventListener('click', async () => {
  if (!genOutput.value) return;
  try {
    await navigator.clipboard.writeText(genOutput.value);
    copyIcon.style.display   = 'none';
    copiedIcon.style.display = '';
    copyGenBtn.setAttribute('aria-label', 'Copied!');
    setTimeout(() => {
      copyIcon.style.display   = '';
      copiedIcon.style.display = 'none';
      copyGenBtn.setAttribute('aria-label', 'Copy password to clipboard');
    }, 2000);
    logActivity('success', 'Generated password copied to clipboard');
  } catch {
    // Fallback for browsers that block clipboard in file:// context
    genOutput.select();
    document.execCommand('copy');
    logActivity('info', 'Generated password selected (copy manually if needed)');
  }
});

// ══════════════════════════════════════════════════════
//  FILE INTEGRITY CHECKER (SHA-256 via Web Crypto API)
// ══════════════════════════════════════════════════════

const dropZone         = document.getElementById('dropZone');
const fileInput        = document.getElementById('fileInput');
const fileInfoEl       = document.getElementById('fileInfo');
const fileNameEl       = document.getElementById('fileName');
const fileSizeEl       = document.getElementById('fileSize');
const fileDateEl       = document.getElementById('fileDate');
const hashSection      = document.getElementById('hashSection');
const hashOutput       = document.getElementById('hashOutput');
const hashProgress     = document.getElementById('hashProgress');
const hashProgressBar  = document.getElementById('hashProgressBar');
const copyHashBtn      = document.getElementById('copyHashBtn');
const hashCompareInput = document.getElementById('hashCompareInput');
const hashCompareResult= document.getElementById('hashCompareResult');
const clearFileBtn     = document.getElementById('clearFileBtn');

// Click on drop zone triggers file picker
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', e => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});

// Drag-and-drop
dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file) processFile(file);
});

fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) processFile(fileInput.files[0]);
});

function formatFileSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function processFile(file) {
  // Show file metadata
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatFileSize(file.size);
  fileDateEl.textContent = new Date(file.lastModified).toLocaleString();
  fileInfoEl.style.display = 'block';

  // Hide previous results
  hashSection.style.display  = 'none';
  hashCompareResult.style.display = 'none';
  hashCompareInput.value = '';
  clearFileBtn.style.display = 'inline-flex';

  // Show progress
  hashProgress.style.display = 'block';
  hashProgressBar.style.width = '30%';

  try {
    const buffer = await file.arrayBuffer();
    hashProgressBar.style.width = '70%';

    const hashBuf  = await crypto.subtle.digest('SHA-256', buffer);
    hashProgressBar.style.width = '100%';

    // Convert ArrayBuffer → hex string
    const hex = Array.from(new Uint8Array(hashBuf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    hashOutput.textContent    = hex;
    hashSection.style.display = 'block';
    hashProgress.style.display= 'none';

    logActivity('success', `SHA-256 computed: ${file.name}`);
  } catch (err) {
    hashProgress.style.display = 'none';
    logActivity('warning', `File hash failed: ${err.message}`);
  }
}

// Copy hash
copyHashBtn.addEventListener('click', async () => {
  const hash = hashOutput.textContent;
  if (!hash) return;
  try {
    await navigator.clipboard.writeText(hash);
    copyHashBtn.textContent = 'Copied!';
    setTimeout(() => { copyHashBtn.textContent = 'Copy'; }, 2000);
  } catch {
    hashOutput.focus();
    window.getSelection().selectAllChildren(hashOutput);
  }
});

// Live comparison
hashCompareInput.addEventListener('input', () => {
  const expected = hashCompareInput.value.trim().toLowerCase();
  const actual   = hashOutput.textContent.trim().toLowerCase();

  if (!expected) {
    hashCompareResult.style.display = 'none';
    return;
  }

  hashCompareResult.style.display = 'block';

  if (expected.length !== 64) {
    hashCompareResult.className = 'hash-compare-result hash-compare--warn';
    hashCompareResult.textContent = '⚠ A SHA-256 hash must be exactly 64 hex characters. Your input is ' + expected.length + ' characters.';
    return;
  }

  if (expected === actual) {
    hashCompareResult.className = 'hash-compare-result hash-compare--match';
    hashCompareResult.textContent = '✓ Match — the hashes are identical. The file is unmodified.';
    logActivity('success', 'Hash comparison: MATCH');
  } else {
    hashCompareResult.className = 'hash-compare-result hash-compare--mismatch';
    hashCompareResult.textContent = '✗ Mismatch — the hashes differ. The file may have been altered or the wrong hash was provided.';
    logActivity('warning', 'Hash comparison: MISMATCH');
  }
});

// Clear file integrity tool
clearFileBtn.addEventListener('click', () => {
  fileInput.value        = '';
  fileInfoEl.style.display   = 'none';
  hashSection.style.display  = 'none';
  hashProgress.style.display = 'none';
  hashCompareResult.style.display = 'none';
  hashCompareInput.value = '';
  hashProgressBar.style.width = '0%';
  clearFileBtn.style.display = 'none';
  logActivity('info', 'File Integrity: tool cleared');
});

// ══════════════════════════════════════════════════════
//  URL RISK CHECKER
// ══════════════════════════════════════════════════════

const urlInput     = document.getElementById('urlInput');
const checkUrlBtn  = document.getElementById('checkUrlBtn');
const clearUrlBtn  = document.getElementById('clearUrlBtn');
const urlResult    = document.getElementById('urlResult');
const urlVerdict   = document.getElementById('urlVerdict');
const urlFindings  = document.getElementById('urlFindings');

// Suspicious TLDs commonly used in phishing
const SUSPICIOUS_TLDS = new Set([
  'xyz','tk','ml','ga','cf','gq','top','click','link','online',
  'site','website','space','info','club','pw','bid','win','racing',
  'loan','download','review','stream','gdn','party','men',
]);

// Keywords that appear in deceptive URLs (e.g. paypal-login-secure.com)
const DECEPTIVE_KEYWORDS = [
  'login','signin','secure','verify','account','update','confirm',
  'banking','password','credential','wallet','support','webscr',
  'billing','payment','paypal','amazon','microsoft','google','apple',
  'facebook','netflix','instagram','ebay','chase','wells','fargo',
];

/**
 * Run all heuristic checks on a URL string.
 * Returns { risk: 'low'|'medium'|'high', findings: [{type,text}] }
 */
function analyseUrl(raw) {
  const findings = [];
  let riskScore  = 0;

  // Try to parse — accept bare domains too by prepending https://
  let url;
  let inputStr = raw.trim();
  try {
    url = new URL(inputStr);
  } catch {
    try {
      url = new URL('https://' + inputStr);
    } catch {
      return { risk: 'error', findings: [{ type: 'error', text: 'Could not parse URL. Make sure it is a valid address (e.g. https://example.com).' }] };
    }
  }

  const host     = url.hostname.toLowerCase();
  const path     = url.pathname.toLowerCase();
  const fullLow  = (url.href).toLowerCase();
  const tld      = host.split('.').pop();

  // 1. HTTP (not HTTPS)
  if (url.protocol === 'http:') {
    findings.push({ type: 'warn', text: 'Uses HTTP — the connection is not encrypted. Sensitive data can be intercepted.' });
    riskScore += 2;
  } else if (url.protocol === 'https:') {
    findings.push({ type: 'ok', text: 'Uses HTTPS — the connection is encrypted.' });
  }

  // 2. IP address as host
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host)) {
    findings.push({ type: 'high', text: 'Host is a raw IP address. Legitimate services almost never use IP addresses in URLs.' });
    riskScore += 4;
  }

  // 3. Suspicious TLD
  if (SUSPICIOUS_TLDS.has(tld)) {
    findings.push({ type: 'warn', text: `TLD ".${tld}" is frequently associated with free or low-cost domains used in phishing campaigns.` });
    riskScore += 2;
  }

  // 4. Excessive subdomains (3+)
  const parts = host.split('.');
  if (parts.length >= 5) {
    findings.push({ type: 'warn', text: `Unusually long hostname with ${parts.length} labels. Attackers use deep subdomains to bury the real domain (e.g. secure.paypal.com.evil.com).` });
    riskScore += 3;
  } else if (parts.length === 4) {
    findings.push({ type: 'note', text: 'Hostname has 4 labels. Check that the root domain (last two labels) is the one you intend to visit.' });
    riskScore += 1;
  }

  // 5. Deceptive brand keywords in hostname or path
  const matchedBrands = DECEPTIVE_KEYWORDS.filter(kw => fullLow.includes(kw));
  if (matchedBrands.length >= 3) {
    findings.push({ type: 'high', text: `URL contains multiple security-sensitive keywords: "${matchedBrands.slice(0,5).join('", "')}". This pattern is common in phishing pages.` });
    riskScore += 3;
  } else if (matchedBrands.length > 0) {
    findings.push({ type: 'note', text: `URL contains sensitive keyword(s): "${matchedBrands.join('", "')}". Verify the domain is the legitimate one.` });
    riskScore += 1;
  }

  // 6. Hyphenated domain (common in typo-squatting: paypal-secure.com)
  const domainLabel = parts.slice(-2, -1)[0] || '';
  if ((domainLabel.match(/-/g) || []).length >= 2) {
    findings.push({ type: 'warn', text: `Domain contains multiple hyphens ("${domainLabel}"). This is a common pattern in typo-squatting.` });
    riskScore += 2;
  }

  // 7. Very long URL
  if (raw.length > 200) {
    findings.push({ type: 'note', text: `URL is ${raw.length} characters long. Extremely long URLs can be used to obscure the true destination.` });
    riskScore += 1;
  }

  // 8. URL-encoded characters in hostname
  if (/%[0-9a-f]{2}/i.test(host)) {
    findings.push({ type: 'warn', text: 'Hostname contains percent-encoded characters. This can be used to bypass naive filters.' });
    riskScore += 2;
  }

  // 9. Port other than 80/443
  if (url.port && url.port !== '80' && url.port !== '443') {
    findings.push({ type: 'note', text: `URL uses non-standard port ${url.port}. Legitimate websites rarely expose content on unusual ports.` });
    riskScore += 1;
  }

  // 10. Data or javascript scheme
  if (url.protocol === 'data:' || url.protocol === 'javascript:') {
    findings.push({ type: 'high', text: `Scheme "${url.protocol}" can execute code or embed hidden payloads. Do not open this URL.` });
    riskScore += 10;
  }

  if (findings.length === 0) {
    findings.push({ type: 'ok', text: 'No structural risk indicators detected.' });
  }

  const risk = riskScore === 0 ? 'low'
             : riskScore <= 3  ? 'medium'
             : riskScore <= 6  ? 'high'
             :                   'critical';

  return { risk, findings, riskScore };
}

function renderUrlResult(result) {
  urlResult.style.display = 'block';
  urlFindings.innerHTML   = '';

  // Verdict badge
  const verdictMap = {
    low:      { label: 'Low Risk',      cls: 'verdict--low' },
    medium:   { label: 'Medium Risk',   cls: 'verdict--medium' },
    high:     { label: 'High Risk',     cls: 'verdict--high' },
    critical: { label: 'Critical Risk', cls: 'verdict--critical' },
    error:    { label: 'Invalid URL',   cls: 'verdict--warn' },
  };
  const v = verdictMap[result.risk] || verdictMap.medium;
  urlVerdict.className   = `url-verdict ${v.cls}`;
  urlVerdict.textContent = v.label;

  // Findings list
  result.findings.forEach(f => {
    const li  = document.createElement('li');
    li.className = `url-finding url-finding--${f.type}`;
    li.textContent = f.text;
    urlFindings.appendChild(li);
  });

  if (result.risk !== 'error') {
    logActivity(
      result.risk === 'low' ? 'success' : 'warning',
      `URL analysed — risk: ${result.risk}`
    );
  }
}

checkUrlBtn.addEventListener('click', () => {
  const raw = urlInput.value.trim();
  if (!raw) return;
  renderUrlResult(analyseUrl(raw));
});

urlInput.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const raw = urlInput.value.trim();
    if (raw) renderUrlResult(analyseUrl(raw));
  }
});

clearUrlBtn.addEventListener('click', () => {
  urlInput.value = '';
  urlResult.style.display = 'none';
  urlFindings.innerHTML   = '';
  urlInput.focus();
  logActivity('info', 'URL Checker: cleared');
});

// ══════════════════════════════════════════════════════
//  INITIALISE
// ══════════════════════════════════════════════════════

// Ensure dashboard is shown on load
showSection('dashboard');
