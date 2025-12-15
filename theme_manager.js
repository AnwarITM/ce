/**
 * EPS Theme Manager
 * Handles Dark/Light mode persistence across all pages.
 */

const THEME_KEY = 'eps_theme_pref';

// Function to update icon visibility
function updateThemeIcon(themeFile) {
    const isDark = themeFile.includes('dark');
    const icon = isDark ? '☀️' : '🌙'; // If dark, show sun to switch to light. If light, show moon.

    // Update all theme buttons on the page
    const btns = document.querySelectorAll('[onclick="toggleGlobalTheme()"]');
    btns.forEach(btn => btn.textContent = icon);
}

// Function to immediately apply theme (can be called in head)
function applyTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'theme-light.css';
    const link = document.getElementById('theme-link');
    if (link) {
        link.setAttribute('href', saved);
    }
    // Defer icon update slightly to ensure DOM is ready if script runs in head
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => updateThemeIcon(saved));
    } else {
        updateThemeIcon(saved);
    }
}

// Function to toggle theme
function toggleGlobalTheme() {
    const saved = localStorage.getItem(THEME_KEY) || 'theme-light.css';
    const next = saved.includes('light') ? 'theme-dark.css' : 'theme-light.css';

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
