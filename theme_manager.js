/**
 * EPS Theme Manager
 * Handles Dark/Light mode persistence across all pages.
 */

const THEME_KEY = 'eps_theme_pref';
const THEME_VERSION = '20260110';
const LIGHT_THEME = `theme-light.css?v=${THEME_VERSION}`;
const DARK_THEME = `theme-dark.css?v=${THEME_VERSION}`;

// Function to update icon visibility
function updateThemeIcon(themeFile) {
    const isDark = themeFile.includes('dark');
    
    // Update the new toggle switch if it exists
    const toggleCheckbox = document.getElementById('themeToggleCheckbox');
    if (toggleCheckbox) {
        toggleCheckbox.checked = isDark;
    }

    // Update old theme buttons for compatibility
    const label = isDark ? 'Mode Terang' : 'Mode Gelap';
    const nextMode = isDark ? 'light' : 'dark';
    const btns = document.querySelectorAll('[onclick="toggleGlobalTheme()"]');
    btns.forEach((btn) => {
        if (btn.tagName !== 'INPUT') {
            btn.textContent = label;
        }
        btn.setAttribute('aria-label', label);
        btn.setAttribute('title', label);
        btn.dataset.themeTarget = nextMode;
    });
}

// Function to immediately apply theme (can be called in head)
function applyTheme() {
    const saved = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
    const normalized = saved.includes('theme-dark') ? DARK_THEME : LIGHT_THEME;
    const link = document.getElementById('theme-link');
    if (link) {
        link.setAttribute('href', normalized);
    }
    // Defer icon update slightly to ensure DOM is ready if script runs in head
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateThemeIcon(normalized));
    } else {
        updateThemeIcon(normalized);
    }
    localStorage.setItem(THEME_KEY, normalized);
}

// Function to toggle theme
function toggleGlobalTheme() {
    const saved = localStorage.getItem(THEME_KEY) || LIGHT_THEME;
    const next = saved.includes('light') ? DARK_THEME : LIGHT_THEME;

    const link = document.getElementById('theme-link');
    if (link) {
        link.setAttribute('href', next);
    }
    localStorage.setItem(THEME_KEY, next);
    updateThemeIcon(next);
}

// Apply on load
document.addEventListener('DOMContentLoaded', applyTheme);

// Also apply immediately if possible to prevent flash
applyTheme();
