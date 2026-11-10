(() => {
  const toggle = document.getElementById('theme-toggle');
  const reset = document.getElementById('theme-system');
  const device = matchMedia('(prefers-color-scheme: dark)');
  let preference = document.documentElement.dataset.themePreference || 'system';
  function apply() {
    const dark = preference === 'dark' || (preference === 'system' && device.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.themePreference = preference;
    const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
    toggle.setAttribute('aria-label', label);
    toggle.title = label + (preference === 'system' ? ' · Following your device' : '');
    reset.hidden = preference === 'system';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#090909' : '#faf7f3';
  }
  function choose(value) {
    preference = value;
    try { localStorage.setItem('sg-theme', preference); } catch {}
    apply();
  }
  toggle.addEventListener('click', () => choose(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'));
  reset.addEventListener('click', () => { choose('system'); toggle.focus(); });
  device.addEventListener('change', () => { if (preference === 'system') apply(); });
  window.addEventListener('storage', event => {
    if (event.key === 'sg-theme') {
      preference = ['light','dark','system'].includes(event.newValue) ? event.newValue : 'system';
      apply();
    }
  });
  apply();
})();
