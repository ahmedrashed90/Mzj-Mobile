// MZJ UI helpers (global) — Mobile-first Sidebar (toggle) + Theme + Clock
// ✅ No HTML changes required: works with existing IDs if present, and auto-creates backdrop if missing.
(function () {
  'use strict';

  const body = document.body;
  const shell = document.getElementById('mzjShell') || body; // fallback (won't break pages without shell)
  const sidebar = document.getElementById('mzjSidebar');
  const sidebarBtn = document.getElementById('mzjSidebarBtn');
  let backdrop = document.getElementById('mzjBackdrop');
  const themeBtn = document.getElementById('mzjThemeBtn');
  const nowEl = document.getElementById('mzjNow');

  const mqDesktop = window.matchMedia('(min-width: 1024px)');
  const isDesktop = () => mqDesktop.matches;

  // Ensure backdrop exists (some pages might not have it)
  if (!backdrop && sidebar) {
    backdrop = document.createElement('div');
    backdrop.className = 'mzj-backdrop';
    backdrop.id = 'mzjBackdrop';
    // Prefer placing it inside the shell (so z-index stacking stays correct)
    (document.getElementById('mzjShell') || body).appendChild(backdrop);
  }

  function lockScroll(lock) {
    body.classList.toggle('mzj-noscr', !!lock);
  }

  function openMobile() {
    if (!shell || !sidebar) return;
    shell.classList.add('sidebar-open');
    lockScroll(true);
  }

  function closeMobile() {
    shell?.classList.remove('sidebar-open');
    lockScroll(false);
  }

  function toggleMobile() {
    if (!shell || !sidebar) return;
    const willOpen = !shell.classList.contains('sidebar-open');
    shell.classList.toggle('sidebar-open');
    lockScroll(willOpen);
  }

  function setCollapsed(v) {
    if (!shell) return;
    shell.classList.toggle('sidebar-collapsed', !!v);
    try { localStorage.setItem('mzj_sidebar_collapsed', v ? '1' : '0'); } catch (e) {}
  }

  // Restore collapse state on desktop
  try {
    if (isDesktop() && localStorage.getItem('mzj_sidebar_collapsed') === '1') setCollapsed(true);
  } catch (e) {}

  // Switch between desktop/mobile behavior
  mqDesktop.addEventListener?.('change', () => {
    closeMobile();
    if (isDesktop()) {
      try { setCollapsed(localStorage.getItem('mzj_sidebar_collapsed') === '1'); } catch (e) {}
    } else {
      shell?.classList.remove('sidebar-collapsed');
    }
  });

  // Sidebar button behavior
  if (sidebarBtn) {
    sidebarBtn.addEventListener('click', () => {
      if (isDesktop()) {
        // Desktop: collapse/expand (keeps layout)
        setCollapsed(!shell?.classList.contains('sidebar-collapsed'));
      } else {
        // Mobile: off-canvas open/close
        toggleMobile();
      }
    }, { passive: true });
  }

  // Backdrop click closes on mobile
  if (backdrop) {
    backdrop.addEventListener('click', closeMobile, { passive: true });
  }

  // ESC closes on mobile
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMobile();
  });

  // Close sidebar after clicking a nav link on mobile (better UX)
  if (sidebar) {
    sidebar.addEventListener('click', (e) => {
      if (isDesktop()) return;
      const a = e.target && (e.target.closest ? e.target.closest('a') : null);
      if (a) closeMobile();
    });
  }

  // Theme toggle (optional)
  function setTheme(mode) {
    // mode: 'dark' | 'light'
    body.classList.toggle('dark', mode === 'dark');
    body.setAttribute('data-theme', mode);
    try { localStorage.setItem('mzj_theme', mode); } catch (e) {}
  }

  (function restoreTheme() {
    try {
      const saved = localStorage.getItem('mzj_theme');
      if (saved === 'dark' || saved === 'light') setTheme(saved);
    } catch (e) {}
  })();

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const isDark = body.classList.contains('dark') || body.getAttribute('data-theme') === 'dark';
      setTheme(isDark ? 'light' : 'dark');
    }, { passive: true });
  }

  // Clock (optional)
  function tick() {
    if (!nowEl) return;
    try {
      const d = new Date();
      // Arabic locale, keep it light (no seconds)
      nowEl.textContent = d.toLocaleString('ar-SA', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      nowEl.textContent = '—';
    }
  }
  tick();
  setInterval(tick, 30000);

})();
