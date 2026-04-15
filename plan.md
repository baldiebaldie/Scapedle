# Scapedle UI Overhaul — Implementation Plan

**Direction:** Polished RPG — gold trim, runic accents, dark navy base  
**OSRS depth:** Subtle nods (clean modern feel, sparse OSRS elements)  
**Approval flow:** Phase-by-phase. Each phase ends with a visual check before moving on.

---

## Phase 0 — Static HTML Wireframe (Visual Approval Gate)

**Goal:** Build a standalone `wireframe.html` file you can open in your browser to preview the new look before any React code is touched.

**What it covers:**
- New title/header with gold text, Soul Rune glow, and double-line separator
- Redesigned underline-style tabs (Items / Music, Daily / Unlimited)
- Card-style guess rows with attribute badge pills
- New win screen with gold double-border, stats row, Copy Result button

**Deliverable:** `scapedle/wireframe.html` — open in any browser, no server needed.

**Approval:** You review the wireframe, request tweaks, approve the look → move to Phase 1.

---

## Phase 1 — CSS Foundation (App.css)

**Files:** `scapedle/src/App.css`

**Changes:**
1. Add `:root` design tokens at top of file (after `@import`):
   - `--gold: #c9a227`, `--gold-light: #e0c060`, `--gold-dark: #9a7a1a`
   - `--gold-glow: rgba(201,162,39,0.35)`, `--gold-glow-sm: rgba(201,162,39,0.15)`
2. Add two new `@keyframes`:
   - `winEntrance` — scale(0.88)+translateY(12px) → scale(1) spring entrance
   - `goldShimmer` — border-color oscillates between `--gold-dark` and `--gold-light`

No JSX changes. No visual change yet (tokens unused until later phases).

---

## Phase 2 — Header & Title

**Files:** `scapedle/src/App.css`, `scapedle/src/App.js`

**CSS changes:**
- Replace `.game-container h1` → gold colour, letter-spacing 3px, text-shadow glow
- Replace `.title-rune` → purple drop-shadow glow filter, hover brightens
- Add `.title-separator` — double gold horizontal line with a rotated diamond centre accent

**App.js changes (line 456, after `</h1>`):**
```jsx
<div className="title-separator">
  <span className="title-separator-diamond" />
</div>
```

---

## Phase 3 — Tabs & Navigation

**Files:** `scapedle/src/App.css`, `scapedle/src/App.js`

**CSS changes:**
- Replace `.game-type-tabs` + `.game-type-tab` rules → underline style, no filled background, gold active underline + blur glow
- Replace `.tab-container` + `.tab` rules → same underline treatment, slightly smaller
- Add `.tab-row-divider` and `.mode-tab-divider` → thin separator lines below each tab row

**App.js changes:**
- After game-type tabs `</div>` (line 471): add `<div className="tab-row-divider" />`
- After mode tabs `</div>` (line 498): add `<div className="mode-tab-divider" />`

---

## Phase 4 — Guess Table → Card Rows

**Files:** `scapedle/src/App.css`, `scapedle/src/App.js`

**CSS changes:**
- Replace `.guess-table`, `.guess-row`, `.cell`, `.item-cell` rules
- Add new classes: `.guess-card-header`, `.guess-card-name`, `.guess-card-badges`, `.attr-badge`, `.attr-badge-label`, `.attr-badge-value`
- Badge variants: `.attr-badge.correct` (green pill), `.attr-badge.wrong` (red pill), `.attr-badge.partial` (orange pill)

**App.js changes:**
- Rewrite `renderGuessRow` (lines 335–389) — keep all logic, replace JSX:
  - Card header row: item icon + name (gold tint if correct, orange if partial)
  - Badge row: 6 flex-wrap pills — 💰GE, 📈Vol, ⚔Equip, 🛡Slot, 🔢Limit, 📅Year — each shows label + value + arrow
- Remove `.guess-row.header` / column header row from guess table render (lines 565–573)

---

## Phase 5 — Win Screen

**Files:** `scapedle/src/App.css`, `scapedle/src/App.js`

**CSS changes:**
- Replace `.win-message` → double-border OSRS panel effect via `box-shadow` layering, gold border, `winEntrance` + `goldShimmer` animations
- Add `.win-message-icon-wrapper`, `.win-message-title`, `.win-message-stats`, `.win-stat`, `.win-stat-label`, `.win-stat-value`
- Add `.share-btn` + `.share-btn-copied` styles

**App.js changes:**
- Add `const [copied, setCopied] = useState(false)` near top of `App()` (line ~79)
- Add `copyShareResult` helper before `renderGuessRow` — builds emoji grid (🟩🟥) from guesses and copies to clipboard
- Replace win message JSX (lines 518–537):
  - Gold-bordered icon container
  - Item name in gold
  - Stats row: Guesses | Score
  - "📋 Copy Result" button (daily only) → flips to "✓ Copied!" for 2s
  - "Play Again" button (unlimited only)

---

## Phase 6 — Mobile Responsive

**Files:** `scapedle/src/App.css`

**Changes inside `@media (max-width: 768px)` block:**
- Title: smaller font-size (1.8rem), smaller runes (36px), narrower separator
- Tabs: full-width, smaller padding/font
- Guess cards: no horizontal scroll (cards stack naturally), smaller icons/badges/fonts
- Win screen: full-width panel, full-width share button, smaller fonts

**Also remove** now-dead mobile rules that targeted the old `.cell`, `.item-cell`, `.guess-row.header` (no longer rendered).

---

## Verification Checklist (after all phases)

| Area | Check |
|------|-------|
| Header | "Scapedle" gold with glow; Soul Rune purple shadow; double-line separator with diamond |
| Tabs | No filled bg; gold underline on active; hover → gold-light text; smooth transition |
| Guess cards | Rounded cards; 6 attribute badge pills; colour-coded; arrows in value; no header row |
| Win screen | Spring entrance; double gold border; shimmer; stats row; Copy Result (daily) / Play Again (unlimited) |
| Mobile | Cards fit viewport; badges wrap; tabs full-width; win panel full-width |
| No regressions | Music tab works; unlimited Play Again works; daily score panel unchanged; map game unaffected |
