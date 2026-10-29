// This blocking script runs before the stylesheet to avoid a theme flash.
(() => {
  'use strict';
  const storageKey = 'velgazmarket-theme';
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const isTheme = value => value === 'light' || value === 'dark';
  let preference = null;

  try {
    const saved = localStorage.getItem(storageKey);
    if (isTheme(saved)) preference = saved;
  } catch (_) { /* Theme switching also works when storage is unavailable. */ }

  function applyTheme() {
    const theme = preference || (systemTheme.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f5f2eb' : '#101c2b';
    document.querySelectorAll('.theme-toggle').forEach(button => {
      const label = theme === 'dark' ? 'Включить светлую тему' : 'Включить тёмную тему';
      button.setAttribute('aria-label', label);
      button.title = label;
      const icon = button.querySelector('span');
      if (icon) icon.textContent = theme === 'dark' ? '☀' : '☾';
    });
  }

  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.addEventListener('click', () => {
        preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
        applyTheme();
        try { localStorage.setItem(storageKey, preference); } catch (_) {}
      });
    });
  });
  systemTheme.addEventListener('change', () => {
    if (!preference) applyTheme();
  });
  window.addEventListener('storage', event => {
    if (event.key === storageKey || event.key === null) {
      preference = isTheme(event.newValue) ? event.newValue : null;
      applyTheme();
    }
  });
})();
