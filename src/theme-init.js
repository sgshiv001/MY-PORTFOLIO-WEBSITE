// Apply the visitor's chosen theme before the first paint.
(() => {
  let preference = 'system';
  try { const stored = localStorage.getItem('sg-theme'); if (['light','dark','system'].includes(stored)) preference = stored; } catch {}
  const dark = preference === 'dark' || (preference === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.themePreference = preference;
})();
