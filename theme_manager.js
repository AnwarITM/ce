/**
 * EPS Theme Manager
 * Handles multi-theme persistence across all pages.
 */

const THEME_KEY = 'eps_theme_pref';
const THEME_VERSION = '20260110';

const THEME_MANIFEST = {
    'default': `theme-default.css?v=${THEME_VERSION}`,
    'linear': `theme-linear.css?v=${THEME_VERSION}`,
    'vercel': `theme-vercel.css?v=${THEME_VERSION}`,
    'apple': `theme-apple.css?v=${THEME_VERSION}`,
    'supabase': `theme-supabase.css?v=${THEME_VERSION}`,
    'liquid-glass': `theme-liquid-glass.css?v=${THEME_VERSION}`
};

const DARK_THEMES = ['linear', 'supabase', 'liquid-glass'];

// Function to update UI state based on theme
function updateThemeUI(themeId) {
    const isDark = DARK_THEMES.includes(themeId);
    
    // Update the new toggle switch if it exists
    const toggleCheckbox = document.getElementById('themeToggleCheckbox');
    if (toggleCheckbox) {
        toggleCheckbox.checked = isDark;
    }

    // Update old theme buttons for compatibility
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

// Function to immediately apply theme (can be called in head)
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

    // Set the theme immediately
    const themeFile = THEME_MANIFEST[saved];
    const link = document.getElementById('theme-link');
    if (link) {
        link.setAttribute('href', themeFile);
    }

    // Defer UI update slightly to ensure DOM is ready if script runs in head
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateThemeUI(saved));
    } else {
        updateThemeUI(saved);
    }
    
    localStorage.setItem(THEME_KEY, saved);
}

// Function to set a specific theme
function setGlobalTheme(themeId) {
    const themeFile = THEME_MANIFEST[themeId] || THEME_MANIFEST['default'];
    const link = document.getElementById('theme-link');
    if (link) {
        link.setAttribute('href', themeFile);
    }
    localStorage.setItem(THEME_KEY, themeId);
    updateThemeUI(themeId);
}

// Function to toggle between default light and default dark (linear)
function toggleGlobalTheme() {
    const current = localStorage.getItem(THEME_KEY) || 'default';
    const next = DARK_THEMES.includes(current) ? 'default' : 'linear';
    setGlobalTheme(next);
}

// Apply on load
document.addEventListener('DOMContentLoaded', applyTheme);

// Also apply immediately if possible to prevent flash
applyTheme();
