(() => {
  const STORAGE_KEY = 'theme';
  const THEMES = ['light', 'dark', 'paper', 'blueprint'];
  const THEME_INDEX = {
    light: 0,
    dark: 1,
    paper: 2,
    blueprint: 3,
  };

  const ARTICLES = [
    {
      title: 'Linear expectations, exponential games',
      slug: 'linear-expectations-exponential-games',
      monthYear: 'March 2026',
    },
    {
      title: 'The post visual web',
      slug: 'post-visual-web',
      monthYear: 'March 2026',
    },
    {
      title: 'What I do, and what I delegate to AI',
      slug: 'what-i-do-and-what-i-delegate-to-ai',
      monthYear: 'March 2026',
    },
  ];

  function applyTheme(theme) {
    const t = THEMES.includes(theme) ? theme : 'light';
    document.documentElement.dataset.theme = t;
    document.documentElement.style.setProperty('--theme-index', String(THEME_INDEX[t] ?? 0));
    try {
      localStorage.setItem(STORAGE_KEY, t);
    } catch {
      // ignore
    }

    const buttons = document.querySelectorAll('[data-theme-switch]');
    buttons.forEach((btn) => {
      const isActive = btn.getAttribute('data-theme-switch') === t;
      btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    });
  }

  function getInitialTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return 'light';
  }

  // Apply ASAP to reduce theme flash, but avoid animating on page load.
  document.documentElement.classList.add('theme-init');
  applyTheme(getInitialTheme());

  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document.documentElement.classList.remove('theme-init');
      });
    });

    document.querySelectorAll('[data-theme-switch]').forEach((btn) => {
      btn.addEventListener('click', () => {
        applyTheme(btn.getAttribute('data-theme-switch'));
      });
    });

    // Tooltips for theme switcher (show after 2s hover).
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.dataset.open = 'false';
    document.body.appendChild(tooltip);

    let hoverTimer = null;
    let activeEl = null;

    function hideTooltip() {
      tooltip.dataset.open = 'false';
      tooltip.textContent = '';
      activeEl = null;
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    }

    // Mobile menu (shows nav + theme switcher behind a single toggle).
    const menuButtons = Array.from(document.querySelectorAll('[data-menu-toggle]'));

    function setMenuOpen(open) {
      const isOpen = Boolean(open);
      document.documentElement.classList.toggle('menu-open', isOpen);
      menuButtons.forEach((btn) => {
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        btn.textContent = isOpen ? 'Close' : 'Menu';
      });
      hideTooltip();
    }

    if (menuButtons.length) {
      setMenuOpen(false);
      menuButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
          setMenuOpen(!document.documentElement.classList.contains('menu-open'));
        });
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setMenuOpen(false);
      });

      document.addEventListener('click', (e) => {
        if (!document.documentElement.classList.contains('menu-open')) return;
        const a = e.target.closest('a');
        if (!a) return;
        if (a.closest('nav[aria-label="Primary"]') || a.closest('.article-sidebar')) {
          setMenuOpen(false);
        }
      });

      window.addEventListener('resize', () => {
        if (!window.matchMedia('(max-width: 760px)').matches) setMenuOpen(false);
      });
    }

    function showTooltip(el) {
      const text = el.getAttribute('data-tooltip') || el.getAttribute('aria-label');
      if (!text) return;
      tooltip.textContent = text;
      tooltip.dataset.open = 'true';

      const rect = el.getBoundingClientRect();
      const padding = 10;
      const ttRect = tooltip.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - ttRect.width / 2;
      let top = rect.top - ttRect.height - 10;

      left = Math.max(padding, Math.min(left, window.innerWidth - ttRect.width - padding));
      if (top < padding) top = rect.bottom + 10;

      tooltip.style.left = `${left}px`;
      tooltip.style.top = `${top}px`;
    }

    document.querySelectorAll('[data-tooltip]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        if (document.body.classList.contains('modal-open')) return;
        activeEl = el;
        if (hoverTimer) clearTimeout(hoverTimer);
        hoverTimer = setTimeout(() => {
          if (activeEl === el) showTooltip(el);
        }, 2000);
      });
      el.addEventListener('mouseleave', hideTooltip);
      el.addEventListener('click', hideTooltip);
      el.addEventListener('blur', hideTooltip);
    });

    window.addEventListener('scroll', hideTooltip, { passive: true });
    window.addEventListener('resize', hideTooltip);

    // Article page footer: show random articles.
    document.querySelectorAll('[data-more-articles]').forEach((container) => {
      const currentSlug = container.getAttribute('data-current-slug') || '';
      const rawBase = container.getAttribute('data-articles-base') || '/blog/';
      const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
      const pool = ARTICLES.filter((a) => a.slug !== currentSlug);

      // Fisher Yates shuffle
      for (let i = pool.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pool[i];
        pool[i] = pool[j];
        pool[j] = tmp;
      }

      const body = container.querySelector('[data-more-articles-body]') || container;
      body.innerHTML = '';

      const items = pool.slice(0, 10);
      if (items.length === 0) {
        const p = document.createElement('p');
        p.className = 'subtitle';
        p.textContent = 'Nothing new yet!';
        body.appendChild(p);
        return;
      }

      const ul = document.createElement('ul');
      items.forEach((a) => {
        const li = document.createElement('li');

        const link = document.createElement('a');
        link.href = `${base}${a.slug}/`;
        link.textContent = a.title;

        const meta = document.createElement('span');
        meta.className = 'subtitle';
        meta.textContent = a.monthYear || '';

        li.appendChild(link);
        li.appendChild(document.createTextNode(' '));
        li.appendChild(meta);
        ul.appendChild(li);
      });

      body.appendChild(ul);
    });
  });
})();
