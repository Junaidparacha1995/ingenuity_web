// Flip this back to true to restore the saved dark-mode choice and header control.
const THEME_TOGGLE_ENABLED = false;

(function () {
  const root = document.documentElement;
  root.dataset.themeToggle = THEME_TOGGLE_ENABLED ? 'enabled' : 'disabled';
  try {
    const stored = window.localStorage.getItem('ingenuity-theme');
    const savedThemeIsValid = stored === 'dark' || stored === 'light';
    const theme = THEME_TOGGLE_ENABLED && savedThemeIsValid ? stored : 'light';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch (error) {
    root.dataset.theme = 'light';
    root.style.colorScheme = 'light';
  }
})();
