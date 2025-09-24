/* ============================================================
   Script.js
   ============================================================ */
// Shadow on scroll per la navbar
(function(){
  const nav = document.getElementById('site-nav');
  if(!nav) return;

  const onScroll = () => {
    if (window.scrollY > 0) nav.classList.add('is-scrolled');
    else nav.classList.remove('is-scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

// Hero background da data-attribute -> imposta la CSS var usata in ::after
(function(){
  const hero = document.querySelector('.hero.has-hero-bg');
  if(!hero) return;

  const url = hero.getAttribute('data-bg');
  if(url && url.trim() !== ''){
    hero.style.setProperty('--hero-bg-url', `url("${url}")`);
  }
})();

// Navbar toggle / menu mobile
(function(){
  const nav = document.getElementById('site-nav');
  if (!nav) return;

  const toggleBtn = nav.querySelector('.nav__toggle');
  const menu = nav.querySelector('.nav__menu');
  if (!toggleBtn || !menu) return;

  const mqDesktop = window.matchMedia('(min-width: 1024px)');

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
})();

//chiudi al tap fuori dal menù
(() => {
  const mqlDesktop = window.matchMedia('(min-width: 1024px)');
  const toggle = document.querySelector('.nav__toggle');
  if (!toggle) return;

  const BACKDROP_CLASS = 'nav__backdrop';

  function addBackdrop() {
    if (document.querySelector('.' + BACKDROP_CLASS)) return;
    const bd = document.createElement('div');
    bd.className = BACKDROP_CLASS;
    bd.addEventListener('click', () => {
      // Usa la tua logica esistente: simula il click sul toggle per chiudere
      toggle.click();
    }, { passive: true });
    document.body.appendChild(bd);
  }

  function removeBackdrop() {
    const bd = document.querySelector('.' + BACKDROP_CLASS);
    if (bd) bd.remove();
  }

  // Osserva lo stato del toggle: quando aria-expanded diventa true → aggiungi backdrop; false → rimuovi
  const obs = new MutationObserver(() => {
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    if (expanded && !mqlDesktop.matches) addBackdrop();
    else removeBackdrop();
  });
  obs.observe(toggle, { attributes: true, attributeFilter: ['aria-expanded'] });

  // Cleanup su cambio viewport (entrata in desktop)
  mqlDesktop.addEventListener?.('change', (e) => {
    if (e.matches) removeBackdrop();
  });
})();

/* Hero chevrons: scroll a card target via ID (mobile only) >>> */
(function () {
  const chevrons = document.querySelector('.hero-cta--chevrons');
  if (!chevrons) return;

  if (chevrons.dataset.chevronsBound === '1') return;
  chevrons.dataset.chevronsBound = '1';

  const mqMobile = window.matchMedia('(max-width: 767.98px)');

  const onChevronClick = (ev) => {
    if (mqMobile.matches) {
      ev.preventDefault();

      // Trova la card target per ID
      const target = document.getElementById('hero-chevron-target');
      if (!target) return;

      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  chevrons.addEventListener('click', onChevronClick, { passive: false });
})();
