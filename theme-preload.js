// Start new visitors in light mode, but honor a theme they explicitly saved.
(function () {
  try {
    const stored = window.localStorage.getItem('ingenuity-theme');
    const theme = stored === 'dark' || stored === 'light' ? stored : 'light';
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
