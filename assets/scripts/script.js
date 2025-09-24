/* ============================================================
   script.js — global
   - Navbar shadow on scroll
   - Hero background from data attribute
   - Navbar mobile toggle + backdrop outside-click
   - Guards anti multi-mount
   SE I FILE CREANO PROBLEMI TORNA ALLA VERSIONE LEGACY
   ============================================================ */

(() => {
  // ----- Utils -----
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // ============================================================
  // 1) Navbar shadow on scroll
  // ============================================================
  (() => {
    const nav = document.getElementById('site-nav');
    if (!nav || nav.dataset.shadowReady === '1') return;
    nav.dataset.shadowReady = '1';

    const onScroll = () => {
      if (window.scrollY > 0) nav.classList.add('is-scrolled');
      else nav.classList.remove('is-scrolled');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // ============================================================
  // 2) Hero background from data-attribute -> CSS var
  // ============================================================
  (() => {
    const hero = qs('.hero.has-hero-bg');
    if (!hero || hero.dataset.bgReady === '1') return;
    hero.dataset.bgReady = '1';

    const url = hero.getAttribute('data-bg');
    if (url && url.trim() !== '') {
      hero.style.setProperty('--hero-bg-url', `url("${url}")`);
    }
  })();

  // ============================================================
  // 3) Navbar toggle / menu mobile + backdrop
  // ============================================================
  (() => {
    const nav = document.getElementById('site-nav');
    if (!nav || nav.dataset.menuReady === '1') return;
    nav.dataset.menuReady = '1';

    const toggleBtn = qs('.nav__toggle', nav);
    const menu = qs('.nav__menu', nav);
    if (!toggleBtn || !menu) return;

    // Breakpoint (fallback 1024)
    const readBP = (name, fallback) => {
      try {
        const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
        const n = parseFloat(v);
        return Number.isFinite(n) ? n : fallback;
      } catch { return fallback; }
    };
    const BP_DESKTOP = readBP('--bp-desktop', 1024);
    const mqDesktop  = window.matchMedia(`(min-width: ${BP_DESKTOP}px)`);

    function closeMenu(){
      nav.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    function openMenu(){
      nav.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
    }
    function toggleMenu(){
      const isOpen = nav.classList.contains('is-open');
      isOpen ? closeMenu() : openMenu();
    }

    // Click hamburger
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu();
    });

    // Chiudi con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });

    // Chiudi quando si clicca un link del menu (solo mobile/tablet)
    menu.addEventListener('click', (e) => {
      const link = e.target.closest('a');
      if (!link) return;
      if (!mqDesktop.matches) closeMenu();
    });

    // Reset stato quando si entra in desktop
    const onMQ = () => { if (mqDesktop.matches) closeMenu(); };
    (mqDesktop.addEventListener ? mqDesktop.addEventListener('change', onMQ)
                                : mqDesktop.addListener(onMQ));

    // ---- Backdrop fuori dal menu (solo mobile) ----
    const BACKDROP_CLASS = 'nav__backdrop';

    function addBackdrop() {
      if (qs('.' + BACKDROP_CLASS)) return;
      const bd = document.createElement('div');
      bd.className = BACKDROP_CLASS;
      bd.addEventListener('click', () => {
        toggleBtn.click(); // usa la logica esistente
      }, { passive: true });
      document.body.appendChild(bd);
    }
    function removeBackdrop() {
      const bd = qs('.' + BACKDROP_CLASS);
      if (bd) bd.remove();
    }

    // Osserva aria-expanded del toggle per sincronizzare il backdrop
    const obs = new MutationObserver(() => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (expanded && !mqDesktop.matches) addBackdrop();
      else removeBackdrop();
    });
    obs.observe(toggleBtn, { attributes: true, attributeFilter: ['aria-expanded'] });
  })();

})();
