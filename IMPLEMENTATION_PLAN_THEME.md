# Multi-Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `theme_manager.js` to support 5 specific themes and update the UI handling.

**Architecture:** Use a `THEME_MANIFEST` to map IDs to file paths. Store theme IDs in `localStorage`. Provide a `setGlobalTheme(themeId)` function and maintain `toggleGlobalTheme()` for checkbox compatibility.

**Tech Stack:** JavaScript (ES6+), CSS.

---

### Task 1: Research and Prepare

**Files:**
- Modify: `theme_manager.js`

- [ ] **Step 1: Define THEME_MANIFEST and constants**
Update the top of `theme_manager.js` with the new constants and manifest.

```javascript
const THEME_KEY = 'eps_theme_pref';
const THEME_VERSION = '20260110';

const THEME_MANIFEST = {
    'default': `theme-default.css?v=${THEME_VERSION}`,
    'linear': `theme-linear.css?v=${THEME_VERSION}`,
    'vercel': `theme-vercel.css?v=${THEME_VERSION}`,
    'apple': `theme-apple.css?v=${THEME_VERSION}`,
    'supabase': `theme-supabase.css?v=${THEME_VERSION}`
};

const DARK_THEMES = ['linear', 'supabase'];
```

- [ ] **Step 2: Rename updateThemeIcon to updateThemeUI**
Change the function name and update its internal logic to handle the multi-theme state.

- [ ] **Step 3: Commit**
```bash
git add theme_manager.js
git commit -m "refactor: define theme manifest and rename update function"
```

### Task 2: Implement setGlobalTheme and toggleGlobalTheme

**Files:**
- Modify: `theme_manager.js`

- [ ] **Step 1: Implement setGlobalTheme(themeId)**
This function should update the DOM and `localStorage`.

```javascript
function setGlobalTheme(themeId) {
    const themeFile = THEME_MANIFEST[themeId] || THEME_MANIFEST['default'];
    const link = document.getElementById('theme-link');
    if (link) {
        link.setAttribute('href', themeFile);
    }
    localStorage.setItem(THEME_KEY, themeId);
    updateThemeUI(themeId);
}
```

- [ ] **Step 2: Replace current toggleGlobalTheme**
Update it to use `setGlobalTheme`.

```javascript
function toggleGlobalTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'default';
    const next = DARK_THEMES.includes(current) ? 'default' : 'linear';
    setGlobalTheme(next);
}
```

- [ ] **Step 3: Commit**
```bash
git add theme_manager.js
git commit -m "feat: implement setGlobalTheme and update toggleGlobalTheme"
```

### Task 3: Refactor applyTheme and updateThemeUI

**Files:**
- Modify: `theme_manager.js`

- [ ] **Step 1: Update updateThemeUI**
Update it to correctly set the checkbox state and handle other buttons.

```javascript
function updateThemeUI(themeId) {
    const isDark = DARK_THEMES.includes(themeId);
    
    // Update toggle switch
    const toggleCheckbox = document.getElementById('themeToggleCheckbox');
    if (toggleCheckbox) {
        toggleCheckbox.checked = isDark;
    }

    // Update other buttons for compatibility
    const label = isDark ? 'Mode Terang' : 'Mode Gelap';
    const btns = document.querySelectorAll('[onclick="toggleGlobalTheme()"]');
    btns.forEach((btn) => {
        if (btn.tagName !== 'INPUT') {
            btn.textContent = label;
        }
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
    });
}
```

- [ ] **Step 2: Refactor applyTheme**
Include migration logic for old path-based values.

```javascript
function applyTheme() {
    let saved = localStorage.getItem(THEME_KEY) || 'default';
    
    // Migration logic: if saved value contains '.css', map it to an ID or reset
    if (saved.includes('.css')) {
        if (saved.includes('theme-dark')) {
            saved = 'linear';
        } else {
            saved = 'default';
        }
    }

    // Ensure the ID is valid
    if (!THEME_MANIFEST[saved]) {
        saved = 'default';
    }

    setGlobalTheme(saved);
}
```

- [ ] **Step 3: Commit**
```bash
git add theme_manager.js
git commit -m "refactor: update applyTheme with migration and finalize updateThemeUI"
```

### Task 4: Final Verification

**Files:**
- Verify: `theme_manager.js`, `index.html`

- [ ] **Step 1: Check if it works in the browser (mental check or test script)**
Since I can't run a browser, I'll double check the logic.
- `applyTheme()` calls `setGlobalTheme()`.
- `setGlobalTheme()` calls `updateThemeUI()`.
- Migration handles old `theme-dark.css` by setting it to `linear`.
- Migration handles old `theme-light.css` by setting it to `default`.
- Checkbox is checked for `linear` and `supabase`.

- [ ] **Step 2: Commit**
```bash
git add theme_manager.js
git commit -m "chore: final refactor of theme_manager.js"
```
