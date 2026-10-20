# CyberShield — Browser-Based Cybersecurity Toolkit

A professional cybersecurity toolkit that runs entirely in your browser — no server, no installation, no data leaves your device.

---

## Quick Start

1. Open the project folder in VS Code (or any file manager).
2. Double-click **`index.html`**, or right-click → *Open with* → your preferred modern browser.
3. That's it. No terminal, no `npm install`, no build step required.

> **Tested on:** Chrome 120+, Firefox 120+, Edge 120+, Safari 17+

---

## Project Structure

```
CyberShield/
├── index.html   — Application shell, sidebar, all tool sections
├── style.css    — Full responsive dark theme (CSS custom properties)
├── script.js    — All functionality (navigation, password checker)
└── README.md    — This file
```

---

## Features

### Security Dashboard
- Welcome overview with project description
- Clickable tool cards for quick navigation
- Six actionable security tips panel
- Real-time activity log (non-sensitive events only)
- Privacy guarantee banner explaining local-only processing

### Password Strength Checker
- Password input with show/hide toggle
- Live animated strength meter (Very Weak → Very Strong)
- Seven individual criteria checks: minimum length, uppercase, lowercase, digit, symbol, no repeats, no sequences
- Contextual feedback with specific improvement suggestions
- Bonus scoring for passwords ≥ 16 characters

### Password Generator
- Cryptographically secure randomness via `window.crypto.getRandomValues`
- Length slider: 8–64 characters
- Toggle uppercase, lowercase, digits, symbols independently
- Optional exclusion of ambiguous characters (0, O, l, 1, I)
- Guarantees at least one character from every selected category
- Copy-to-clipboard button with visual feedback
- Displays strength rating of the generated password

### File Integrity Checker (SHA-256)
- Drag-and-drop or click-to-browse file selection
- Hashes any local file using `crypto.subtle.digest('SHA-256')` — no upload, no server
- Displays file name, size, and last-modified date
- Full 64-character hex SHA-256 output, copy-to-clipboard
- Live hash comparison: paste a known hash to verify match/mismatch instantly

### URL Risk Checker
- Parses and analyses any URL structure entirely offline
- Checks for: HTTP vs HTTPS, raw IP host, suspicious TLDs, excessive subdomains, deceptive brand keywords, hyphenated typo-squatting domains, over-long URLs, percent-encoded hostnames, non-standard ports
- Colour-coded verdict: Low / Medium / High / Critical Risk
- Per-finding colour-coded list with explanations
- Enter key and button both trigger analysis

---

## Design & Accessibility

- **Dark navy / blue theme** — professional cybersecurity aesthetic
- **Responsive layout** — desktop, tablet (≤900 px), and mobile (≤640 px)
- **Keyboard navigation** — all interactive elements are focusable and operable via keyboard
- **Visible focus indicators** — high-contrast blue outline on all focused elements
- **ARIA labels and roles** — screen-reader friendly structure throughout
- **Live regions** — strength label and feedback use `aria-live` for screen reader announcements
- **No external dependencies** — no Google Fonts, no CDN links, no images

---

## Privacy & Security

| What happens to your data | Answer |
|---|---|
| Is anything sent to a server? | **No** — zero network requests |
| Is anything stored in localStorage? | **No** — no persistence at all |
| Are passwords logged anywhere? | **No** — only non-sensitive events (navigation, clear) are logged |
| Does the app use cookies? | **No** |
| Any third-party scripts? | **No** |

All computation runs inside your browser tab. Closing the tab discards everything.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 (semantic elements, ARIA) |
| Styling | CSS3 (custom properties, grid, flexbox) |
| Logic | Vanilla JavaScript (ES2020, strict mode) |
| Crypto (future) | Web Crypto API (built into modern browsers) |

No Node.js, no npm, no Python, no backend, no database, no build tools.

---

## Browser Compatibility

| Browser | Minimum Version |
|---|---|
| Chrome / Chromium | 80+ |
| Firefox | 78+ |
| Edge | 80+ |
| Safari | 14+ |

---

## Extending the Project

To add another tool:

1. **`index.html`** — Add a `<button class="nav-btn" data-section="my-tool">` entry in the sidebar `<nav>`, a tool card in the dashboard grid, and a new `<section class="section" id="section-my-tool">` block in the main content area.
2. **`style.css`** — Add any tool-specific styles following the existing BEM-like naming conventions.
3. **`script.js`** — The `showSection()` function works automatically with the new `data-section` value. Add tool logic in a clearly labelled block.

No build step is needed — just save and refresh the browser.

---

## License

This project is provided for educational purposes. Feel free to adapt it for personal or academic use.
