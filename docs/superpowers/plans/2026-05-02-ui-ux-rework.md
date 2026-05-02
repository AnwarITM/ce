# Fresh & Professional UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the project's UI/UX to a fresh, professional aesthetic using Vercel (Light) and Linear (Dark) design principles while maintaining the bottom navigation for mobile.

**Architecture:** Modern grayscale-first design with a signature blue accent (Vercel-style) for light mode and a deep charcoal palette with lavender accents (Linear-style) for dark mode. Employs the "shadow-as-border" technique and refined typography.

**Tech Stack:** Vanilla CSS, CSS Variables, Inter Font.

---

### Task 1: Update Shared Design Tokens

**Files:**
- Modify: `design-tokens.css`

- [ ] **Step 1: Define shared typography and spacing**

```css
:root {
  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-size-base: 16px;
  --font-size-sm: 14px;
  --font-size-xs: 12px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-display: 32px;
  
  /* Spacing (8px base) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;

  /* Transitions */
  --transition-base: 0.2s ease;
  --transition-slow: 0.4s ease;

  /* Layout */
  --nav-height: 64px;
  --container-max-width: 1200px;
  
  /* Z-Index */
  --z-sticky: 100;
  --z-nav: 200;
  --z-modal: 300;
}
```

- [ ] **Step 2: Commit changes**

```bash
git add design-tokens.css
git commit -m "style: update shared design tokens for typography and spacing"
```

---

### Task 2: Refresh Light Theme (Vercel Style)

**Files:**
- Modify: `theme-light.css`

- [ ] **Step 1: Implement Vercel-inspired grayscale palette**

```css
:root {
  /* Canvas & Text */
  --bg-color: #ffffff;
  --text-color: #171717;
  --text-secondary: #666666;
  --text-muted: #888888;
  
  /* Accents */
  --primary-color: #0070f3;
  --primary-hover: #0060d3;
  --primary-text: #ffffff;
  
  /* Surfaces */
  --surface-1: #ffffff;
  --surface-2: #fafafa;
  --surface-3: #f5f5f5;
  --surface-muted: #fafafa;
  
  /* Borders (Shadow-based) */
  --border-subtle: rgba(0, 0, 0, 0.08);
  --border-shadow: 0 0 0 1px var(--border-subtle);
  --surface-border: var(--border-subtle);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 0 0 1px rgba(0, 0, 0, 0.08), 0 8px 16px rgba(0, 0, 0, 0.08);
  
  /* Status */
  --success: #0070f3;
  --error: #ee0000;
  --warning: #f5a623;
  
  --status-done-bg: #ebf5ff;
  --status-done-text: #0070f3;
  --status-done-border: rgba(0, 112, 243, 0.1);
  --status-outstanding-bg: #fff5f5;
  --status-outstanding-text: #ee0000;
  --status-outstanding-border: rgba(238, 0, 0, 0.1);

  /* Specifics */
  --theme-toggle-bg: #ffffff;
  --theme-toggle-border: rgba(0, 0, 0, 0.08);
}
```

- [ ] **Step 2: Commit changes**

```bash
git add theme-light.css
git commit -m "style: update light theme with Vercel-inspired palette"
```

---

### Task 3: Refresh Dark Theme (Linear Style)

**Files:**
- Modify: `theme-dark.css`

- [ ] **Step 1: Implement Linear-inspired deep dark palette**

```css
:root {
  /* Canvas & Text */
  --bg-color: #010102;
  --text-color: #f7f8f8;
  --text-secondary: #b1b1b3;
  --text-muted: #8a8f98;
  
  /* Accents */
  --primary-color: #5e6ad2;
  --primary-hover: #828fff;
  --primary-text: #ffffff;
  
  /* Surfaces */
  --surface-1: #0f1011;
  --surface-2: #141516;
  --surface-3: #18191a;
  --surface-muted: #0f1011;
  
  /* Borders */
  --border-subtle: #23252a;
  --border-shadow: 0 0 0 1px var(--border-subtle);
  --surface-border: var(--border-subtle);
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 12px 24px rgba(0, 0, 0, 0.6);
  
  /* Status */
  --success: #27a644;
  --error: #f87171;
  
  --status-done-bg: rgba(39, 166, 68, 0.1);
  --status-done-text: #27a644;
  --status-done-border: rgba(39, 166, 68, 0.2);
  --status-outstanding-bg: rgba(248, 113, 113, 0.1);
  --status-outstanding-text: #f87171;
  --status-outstanding-border: rgba(248, 113, 113, 0.2);

  /* Specifics */
  --theme-toggle-bg: #0f1011;
  --theme-toggle-border: #23252a;
}
```

- [ ] **Step 2: Commit changes**

```bash
git add theme-dark.css
git commit -m "style: update dark theme with Linear-inspired palette"
```

---

### Task 4: Modernize Global Styles

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Update base styles and utility classes**

Update body, headings, and common components (buttons, cards).

```css
body {
  font-family: var(--font-family);
  background: var(--bg-color);
  color: var(--text-color);
  -webkit-font-smoothing: antialiased;
  padding-bottom: var(--nav-height);
}

h1, h2, h3 {
  letter-spacing: -0.02em;
  font-weight: 600;
}

.card {
  background: var(--surface-1);
  box-shadow: var(--shadow-md);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  transition: var(--transition-base);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: var(--transition-base);
  border: none;
  gap: var(--space-2);
}

.btn-primary {
  background: var(--primary-color);
  color: var(--primary-text);
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--surface-2);
  color: var(--text-color);
  box-shadow: var(--border-shadow);
}

.btn-secondary:hover {
  background: var(--surface-3);
}

/* Bottom Nav Fix */
.bottom-nav {
  height: var(--nav-height);
  background: var(--surface-1);
  border-top: 1px solid var(--surface-border);
  box-shadow: 0 -1px 3px rgba(0,0,0,0.02);
}

.nav-link {
  color: var(--text-secondary);
}

.nav-link.active {
  color: var(--primary-color);
}
```

- [ ] **Step 2: Commit changes**

```bash
git add styles.css
git commit -m "style: modernize global styles with new tokens and shadow-borders"
```

---

### Task 5: Layout Polish - Home Page

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Refine hero and card grid layout**

```html
<div class="landing-wrap">
  <div class="hero-card">
    <div class="hero-main">
      <div class="hero-copy">
        <div class="pill">Dashboard</div>
        <h1 class="hero-title">Task Manager CE</h1>
        <p class="hero-sub">Enterprise field tools for planner, notes, and overtime management.</p>
        <div class="hero-actions">
          <a href="work_planner.html" class="hero-link btn-primary">Work Planner</a>
          <a href="notes_viewer.html" class="hero-link btn-secondary">Notes</a>
        </div>
      </div>
      <button class="theme-btn btn-secondary" onclick="toggleGlobalTheme()">Mode</button>
    </div>
  </div>
  ...
</div>
```

- [ ] **Step 2: Commit changes**

```bash
git add index.html
git commit -m "style: refine home page layout for better hierarchy"
```

---

### Task 6: Layout Polish - Work Planner

**Files:**
- Modify: `work_planner.html`

- [ ] **Step 1: Update dashboard metrics and table styling**

Refine metric cards to use new surfaces and shadows. Update table rows to look like Linear issues.

- [ ] **Step 2: Commit changes**

```bash
git add work_planner.html
git commit -m "style: update work planner UI for professional look"
```

---

## Verification
- Test light/dark mode toggle.
- Verify bottom navigation on mobile viewport.
- Check accessibility (contrast, tap targets).
- Ensure all pages (index, work_planner, notes_viewer) feel consistent.
