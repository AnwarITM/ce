# Multi-Theme System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a dynamic theme switching system allowing users to choose from 5 premium styles (Default, Linear, Vercel, Apple, and Supabase).

**Architecture:** We will create individual CSS files for each theme that override the same set of CSS variables. The `theme_manager.js` will be refactored to handle a "theme manifest" and persist the selection. A new Settings Modal will be added to the UI.

**Tech Stack:** HTML, CSS, JavaScript (Vanilla).

---

### Task 1: Create Theme CSS Files

**Files:**
- Create: `theme-default.css`
- Create: `theme-linear.css`
- Create: `theme-vercel.css`
- Create: `theme-apple.css`
- Create: `theme-supabase.css`

- [ ] **Step 1: Create theme-default.css** (based on current theme-light.css)
- [ ] **Step 2: Create theme-linear.css** (Dark mode, deep black #010102, lavender accent #5e6ad2)
- [ ] **Step 3: Create theme-vercel.css** (Clean white, shadow-borders, monospaced accents)
- [ ] **Step 4: Create theme-apple.css** (Parchment white #f5f5f7, Action Blue #0066cc, SF Pro feel)
- [ ] **Step 5: Create theme-supabase.css** (Cyber dark #171717, emerald green #3ecf8e, pill buttons)

### Task 2: Refactor Theme Manager

**Files:**
- Modify: `theme_manager.js`

- [ ] **Step 1: Update THEME_KEY and manifest**
- [ ] **Step 2: Implement dynamic CSS loading logic**
- [ ] **Step 3: Update updateThemeIcon to handle various theme names**

### Task 3: Implement Settings UI

**Files:**
- Modify: `index.html`
- Modify: `work_planner.html`
- Modify: `notes_viewer.html`
- Modify: `cek_lembur/index.html`

- [ ] **Step 1: Replace simple toggle with Settings Button**
- [ ] **Step 2: Add Theme Selection Modal**
- [ ] **Step 3: Add logic to open modal and handle selection**

### Task 4: Final Verification

- [ ] **Step 1: Verify theme persistence across pages**
- [ ] **Step 2: Verify light/dark defaults for each theme**
- [ ] **Step 3: Verify mobile responsiveness of the new settings modal**
