/* ============================================================
   subhero.js — Homepage carousel
   Refactor:
   - Guard multi-mount: data-subhero-ready
   - Breakpoints tramite CSS vars con fallback (--bp-desktop, --bp-tablet)
   - Nessun cambio di comportamento
   ============================================================ */
(() => {
  const container = document.querySelector('.sub-hero');
  if (!container || container.dataset.subheroReady === '1') return;
  container.dataset.subheroReady = '1';

  // ----- Utils -----
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const set = (el, n, v) => { try { el && el.setAttribute(n, v); } catch {} };

  const viewport = qs('.pager__viewport', container);
  const track    = qs('.pager__track', container);
  const controls = qs('.pager__controls', container);
  const dotsWrap = qs('.pager__dots', container);
  const statusEl = document.getElementById('carousel-status');

  const slides = qsa('.pager__slide', track);
  if (!viewport || !track || slides.length === 0) return;

  // Breakpoints da CSS var (fallbacks)
  const readBP = (name, fallback) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    } catch { return fallback; }
  };
  const BP_DESKTOP = readBP('--bp-desktop', 1024);
  const BP_TABLET  = readBP('--bp-tablet', 768);

  const mqDesktop = window.matchMedia(`(min-width: ${BP_TABLET}px)`);     // coerenza con CSS di visibilità arrow
  const mqMobile  = window.matchMedia(`(max-width: ${BP_TABLET - 0.02}px)`);

  // Motion & timing
  const PRM = window.matchMedia('(prefers-reduced-motion: reduce)');
  const FADE_MS  = PRM.matches ? 80 : 420;
  const INTERVAL = 7000; // 7s
  let AUTOPLAY   = !PRM.matches;

  // Stato
  let index = Math.max(0, slides.findIndex(s => s.classList.contains('is-active')));
  if (index < 0) index = 0;

  // Viewport safety
  viewport.style.overflow = 'hidden';
  viewport.style.touchAction = 'pan-y';

  const clampIndex = (i) => (i + slides.length) % slides.length;

  // Background per-slide: data-attrs -> CSS vars
  function applySlideBackgrounds(){
    slides.forEach(slide => {
      const m = slide.getAttribute('data-bg-mobile');
      const d = slide.getAttribute('data-bg-desktop');
      if (m && m.trim() !== '') slide.style.setProperty('--slide-bg-mobile-url', `url("${m}")`);
      if (d && d.trim() !== '') slide.style.setProperty('--slide-bg-desktop-url', `url("${d}")`);
    });
  }

  // ARIA base
  function initAria(){
    container.setAttribute('aria-roledescription', 'carousel');
    slides.forEach((s, i) => {
      s.setAttribute('role', 'group');
      s.setAttribute('aria-roledescription', 'slide');
      const title = s.querySelector('.slide__title')?.textContent?.trim() || `Slide ${i+1}`;
      s.setAttribute('aria-label', `Slide ${i+1} di ${slides.length}: ${title}`);
      s.id = s.id || `subhero-slide-${i+1}`;
    });
  }
  function announce(i){
    if (!statusEl) return;
    const slide = slides[i];
    const title = slide?.querySelector('.slide__title')?.textContent?.trim() || `Slide ${i+1}`;
    statusEl.textContent = `Slide ${i+1} di ${slides.length}: ${title}`;
  }

  // Dots
  const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('button, .dot')) : [];
  function initDotsA11y(){
    if (!dotsWrap || !slides?.length) return;
    dotsWrap.setAttribute('role', 'tablist');
    const slideCount = slides.length;
    dots.forEach((d, di) => {
      d.setAttribute('role', 'tab');
      d.setAttribute('aria-controls', slides[di]?.id || `subhero-slide-${di+1}`);
      d.setAttribute('aria-label', `Vai alla slide ${di+1} di ${slideCount}`);
    });
  }
  function updateDots(){
    if (!dots.length) return;
    const LEGACY_TO_CLEAN = ['is-progress', 'is-filling', 'is-paused'];
    dots.forEach((d, di) => {
      LEGACY_TO_CLEAN.forEach(c => d.classList.remove(c));
      const active = di === index;
      d.classList.toggle('is-active', active);
      d.setAttribute('aria-selected', active ? 'true' : 'false');
      d.setAttribute('aria-current',  active ? 'true' : 'false');
      d.setAttribute('tabindex',      active ? '0'    : '-1');
    });
  }
  function initDots(){
    dots.forEach((d, i) => {
      d.setAttribute('role', 'tab'); // retro-compatibilità
      d.setAttribute('aria-controls', `subhero-slide-${i+1}`);
      d.addEventListener('click', () => { stopAutoplay(); activate(i, true); startAutoplay(); });
      d.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft'){ e.preventDefault(); stopAutoplay(); prev(true); startAutoplay(); }
        if (e.key === 'ArrowRight'){ e.preventDefault(); stopAutoplay(); next(true); startAutoplay(); }
      });
    });
    updateDots();
  }

  // Ottimizzazione immagini: prima slide eager + high; altre lazy
  function tuneImages(){
    slides.forEach((slide, i) => {
      slide.querySelectorAll('img').forEach(img => {
        if (i === 0) {
          img.loading = 'eager';
          img.fetchPriority = 'high';
          img.decoding = 'async';
        } else {
          img.loading = 'lazy';
          img.decoding = 'async';
        }
      });
    });
  }

  // Altezza viewport = max slide (clamp 200–420)
  function measureViewport(){
    const maxH = slides.reduce((m, s) => Math.max(m, s.scrollHeight), 0);
    const target = Math.max(200, Math.min(420, maxH));
    viewport.style.height = target + 'px';
  }

  // Visibilità controlli (arrows visibili solo desktop, dots sempre)
  function updateControlsVisibility(){
    if (!controls && !dotsWrap) return;
    if (mqMobile.matches){
      if (controls){
        controls.style.display = 'none';
        controls.setAttribute('aria-hidden', 'true');
        controls.querySelectorAll('.pager__arrow').forEach(b => b.setAttribute('tabindex', '-1'));
      }
      if (dotsWrap){
        dotsWrap.style.display = '';
        dotsWrap.removeAttribute('aria-hidden');
        dots.forEach(d => d.removeAttribute('tabindex'));
      }
    } else {
      if (controls){
        controls.style.display = '';
        controls.removeAttribute('aria-hidden');
        controls.querySelectorAll('.pager__arrow').forEach(b => b.removeAttribute('tabindex'));
      }
      if (dotsWrap){
        dotsWrap.style.display = '';
        dotsWrap.removeAttribute('aria-hidden');
        dots.forEach(d => d.removeAttribute('tabindex'));
      }
    }
  }

  // Autoplay
  let _timer = 0;
  function stopAutoplay(){ if (_timer){ clearInterval(_timer); _timer = 0; } }
  function startAutoplay(){
    stopAutoplay();
    if (!AUTOPLAY) return;
    _timer = setInterval(() => next(false), INTERVAL);
  }

  // Navigazione
  function activate(i, focus = false){
    i = (i + slides.length) % slides.length;
    if (i === index) return;

    const curr = slides[index];
    const nextS = slides[i];

    // visibilità
    curr.classList.remove('is-active');
    nextS.classList.add('is-active');

    // focus
    if (focus) {
      const title = nextS.querySelector('.slide__title');
      (title || nextS).focus?.();
    }

    index = i;
    updateDots();
    announce(index);
  }
  const next = (focus = false) => activate(index + 1, focus);
  const prev = (focus = false) => activate(index - 1, focus);

  // Keyboard (freccia SX/DX, invio/space sulle arrows)
  container.addEventListener('keydown', (e) => {
    const isFormField = /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(e.target?.tagName);
    const btn = e.target?.closest?.('.pager__arrow');
    if (btn && (e.key === 'Enter' || e.code === 'Space' || e.key === ' ' || e.code === 'Space')) {
      e.preventDefault();
      stopAutoplay();
      if (btn.classList.contains('prev')) prev(true);
      else if (btn.classList.contains('next')) next(true);
      btn.focus();
      startAutoplay();
      return;
    }

    if (!isFormField) {
      if (e.key === 'ArrowLeft'){ e.preventDefault(); stopAutoplay(); prev(true); startAutoplay(); }
      if (e.key === 'ArrowRight'){ e.preventDefault(); stopAutoplay(); next(true); startAutoplay(); }
    }
  });

  // Pausa gentile su hover/focus
  container.addEventListener('pointerenter', stopAutoplay);
  container.addEventListener('pointerleave', startAutoplay);
  container.addEventListener('focusin', stopAutoplay);
  container.addEventListener('focusout', startAutoplay);

  // Swipe touch
  let touchStartX = 0, touchDX = 0, touching = false;
  viewport.addEventListener('touchstart', (e) => {
    if (!e.touches?.length) return;
    touching = true;
    touchStartX = e.touches[0].clientX;
    touchDX = 0;
    stopAutoplay();
  }, {passive:true});
  viewport.addEventListener('touchmove', (e) => {
    if (!touching || !e.touches?.length) return;
    touchDX = e.touches[0].clientX - touchStartX;
  }, {passive:true});
  viewport.addEventListener('touchend', () => {
    if (!touching) return;
    touching = false;
    if (Math.abs(touchDX) > 40){
      activate(index + (touchDX < 0 ? 1 : -1), true);
    }
    startAutoplay();
  }, {passive:true});

  // Single-slide mode
  function applySingleSlideMode(){
    if (slides.length > 1) return;
    AUTOPLAY = false;
    stopAutoplay();
    if (dotsWrap) dotsWrap.style.display = 'none';
    if (controls) controls.style.display = 'none';
    if (dotsWrap) dotsWrap.setAttribute('aria-hidden', 'true');
    dots.forEach(d => d.setAttribute('tabindex', '-1'));
    if (controls){
      controls.setAttribute('aria-hidden', 'true');
      controls.querySelectorAll('.pager__arrow').forEach(b => b.setAttribute('tabindex', '-1'));
    }
  }

  // ----- Align helpers (frecce allineate alla grid contenuti) -----
  let _alignRO = null;
  function alignArrows(){
    if (!controls) return;
    try{
      const ref =
        document.querySelector('.cards__inner') ||
        document.querySelector('.links__inner');
      if (!ref) {
        container.style.removeProperty('--subhero-align-left');
        return;
      }
      const { left } = ref.getBoundingClientRect();
      const px = Math.max(0, Math.round(left));
      container.style.setProperty('--subhero-align-left', px + 'px');
    } catch {
      container.style.removeProperty('--subhero-align-left');
    }
  }
  let _alignRAF = 0;
  function requestAlign() {
    if (_alignRAF) return;
    _alignRAF = requestAnimationFrame(() => {
      _alignRAF = 0;
      alignArrows();
    });
  }

  // ----- Init sequence -----
  applySlideBackgrounds();
  initAria();
  initDotsA11y();
  updateDots();
  tuneImages();
  measureViewport();
  announce(index);
  applySingleSlideMode();
  updateControlsVisibility();
  startAutoplay();

  // Align init & observers
  alignArrows();
  if ('ResizeObserver' in window) {
    _alignRO = new ResizeObserver(() => requestAlign());
    const refForRO =
      document.querySelector('.cards__inner') ||
      document.querySelector('.links__inner');
    if (refForRO) _alignRO.observe(refForRO);
    _alignRO.observe(document.documentElement);
  }
  window.addEventListener('resize', () => { measureViewport(); requestAlign(); });
  window.addEventListener('load', () => { requestAlign(); });

})();
