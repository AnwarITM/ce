# Theme Selection Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a consistent Theme Selection Modal across all application pages to replace the basic theme toggle.

**Architecture:** Replace the current theme toggle UI with a settings gear icon that opens a modal. The modal contains a grid of theme options with color previews.

**Tech Stack:** HTML, CSS, JavaScript (Vanilla).

---

### Task 1: Define Global Theme Modal CSS and HTML Structure

**Files:**
- Modify: `index.html` (as first test)

- [ ] **Step 1: Add Gear Icon Button and Modal HTML to `index.html`**
Replace the existing `.theme-toggle-wrapper` with:
```html
<button class="btn btn-secondary btn-compact" onclick="openThemeModal()" title="Settings" aria-label="Settings">
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
</button>

<!-- Theme Modal -->
<div id="themeModal" class="modal-overlay" onclick="if(event.target==this)closeThemeModal()">
  <div class="modal-content">
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6);">
      <h3 style="margin: 0;">Pilih Tema</h3>
      <button class="btn btn-secondary btn-compact" onclick="closeThemeModal()">✕</button>
    </div>
    <div class="theme-grid">
      <div class="theme-option" onclick="selectTheme('default')">
        <div class="theme-preview" style="background: #FF0036;"></div>
        <span>Default</span>
      </div>
      <div class="theme-option" onclick="selectTheme('linear')">
        <div class="theme-preview" style="background: #5e6ad2;"></div>
        <span>Linear</span>
      </div>
      <div class="theme-option" onclick="selectTheme('vercel')">
        <div class="theme-preview" style="background: #000000;"></div>
        <span>Vercel</span>
      </div>
      <div class="theme-option" onclick="selectTheme('apple')">
        <div class="theme-preview" style="background: #0066cc;"></div>
        <span>Apple</span>
      </div>
      <div class="theme-option" onclick="selectTheme('supabase')">
        <div class="theme-preview" style="background: #3ecf8e;"></div>
        <span>Supabase</span>
      </div>
    </div>
  </div>
</div>
```

- [ ] **Step 2: Add Theme Modal CSS to `index.html`**
```css
    .theme-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-3);
    }

    .theme-option {
      background: var(--surface-2);
      border: 1px solid var(--surface-border);
      border-radius: var(--radius-md);
      padding: var(--space-3);
      display: flex;
      align-items: center;
      gap: var(--space-3);
      cursor: pointer;
      transition: var(--transition-base);
    }

    .theme-option:hover {
      background: var(--surface-3);
      transform: translateY(-2px);
    }

    .theme-preview {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 2px solid #fff;
      box-shadow: 0 0 0 1px var(--surface-border);
    }
```

- [ ] **Step 3: Add Modal Control JS to `index.html`**
```javascript
    function openThemeModal() {
      document.getElementById('themeModal').style.display = 'flex';
    }

    function closeThemeModal() {
      document.getElementById('themeModal').style.display = 'none';
    }

    function selectTheme(themeId) {
      setGlobalTheme(themeId);
      closeThemeModal();
    }
```

- [ ] **Step 4: Verify `index.html` works**

### Task 2: Implement Modal in `work_planner.html`

**Files:**
- Modify: `work_planner.html`

- [ ] **Step 1: Add Gear Icon Button to Header**
Add it next to the "Export" button in the `.app-header`.

- [ ] **Step 2: Add `themeModal` HTML to the bottom of the body**

- [ ] **Step 3: Add Theme Modal CSS to `<style>` section**

- [ ] **Step 4: Add JS functions to `<script>` section**

### Task 3: Implement Modal in `notes_viewer.html`

**Files:**
- Modify: `notes_viewer.html`

- [ ] **Step 1: Add Gear Icon Button to Header**
Add it in `.header-top`.

- [ ] **Step 2: Add `themeModal` HTML**

- [ ] **Step 3: Add Theme Modal CSS**

- [ ] **Step 4: Add JS functions**

### Task 4: Implement Modal in `cek_lembur/index.html`

**Files:**
- Modify: `cek_lembur/index.html`

- [ ] **Step 1: Add Gear Icon Button to Header**
Add it in `<header class="page-header">`.

- [ ] **Step 2: Add `themeModal` HTML**

- [ ] **Step 3: Add Theme Modal CSS**

- [ ] **Step 4: Add JS functions**

### Task 5: Final Polish and Verification

- [ ] **Step 1: Check all 4 pages for consistency**
- [ ] **Step 2: Ensure themes are applied correctly across pages**
