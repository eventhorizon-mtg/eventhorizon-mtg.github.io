/* ============================================================
   links.js — Links carousel (desktop only)
   Refactor:
   - Guard multi-mount: data-links-ready impostato PRIMA dei bind
   - Breakpoints da CSS var con fallback (--bp-desktop)
   - Nessun cambio funzionale
   ============================================================ */
(() => {
  const section  = document.querySelector('.links');
  const carousel = section?.querySelector('.links__carousel');
  const track    = section?.querySelector('.links__track');
  if (!section || !carousel || !track) return;
  if (section.dataset.linksReady === '1') return;
  // Imposta il flag prima dei bind per evitare doppi listener
  section.dataset.linksReady = '1';

  // ----- Utils -----
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));

  // Breakpoint da CSS var
  const readBP = (name, fallback) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    } catch { return fallback; }
  };
  const BP_DESKTOP = readBP('--bp-desktop', 1024);
  const mqDesktop  = window.matchMedia(`(min-width: ${BP_DESKTOP}px)`);

  // Config / stato
  const DEFAULT_SPEED = 24; // px/frame @ ~60fps
  let enabled   = false;
  let dragging  = false;
  let dragStartX = 0;
  let dragDX     = 0;
  let gapPx      = 0;
  let cardStep   = 0;
  let originalWidth = 0;
  let leftAnchor    = 0;
  let wrapMargin    = 0;
  let rafId         = 0;

  // Cache per scroll-snap
  let snapCache = '';

  // IntersectionObserver
  let io = null;

  // ===== Utils numeriche & stile =====
  const cssNumber = (name, el = section) => {
    const s = getComputedStyle(el).getPropertyValue(name).trim();
    const v = parseFloat(s);
    return Number.isFinite(v) ? v : 0;
  };
  const readSpeed = () => {
    const v = cssNumber('--links-auto-speed', section);
    return (Number.isFinite(v) && v > 0) ? Math.max(8, Math.min(120, v)) : DEFAULT_SPEED;
  };
  const ignoreRMW = () => cssNumber('--links-auto-ignore-rmw', section) > 0;

  // Riconoscimento cloni retro-compatibile
  const isClone = (li) =>
    !!li && ((li.dataset && li.dataset.clone === '1') || li.classList.contains('is-clone'));

  const originals = () =>
    Array.from(track.querySelectorAll('.link-card')).filter(li => !isClone(li));

  const cleanupClones = () => {
    track.querySelectorAll('.link-card[data-clone="1"], .link-card.is-clone').forEach(n => n.remove());
  };

  const duplicateSet = (nodes) => {
    const frag = document.createDocumentFragment();
    nodes.forEach(n => {
      const c = n.cloneNode(true);
      c.dataset.clone = '1';
      c.classList.add('is-clone');
      c.setAttribute('aria-hidden', 'true');
      c.removeAttribute('id');
      c.querySelectorAll('a,button').forEach(el => el.setAttribute('tabindex', '-1'));
      frag.appendChild(c);
    });
    return frag;
  };

  const measureGapsAndStep = () => {
    const styles = getComputedStyle(track);
    gapPx = parseFloat(styles.columnGap) || parseFloat(styles.gap) || 0;
    const first = track.querySelector('.link-card');
    if (first) {
      const r = first.getBoundingClientRect();
      cardStep = Math.round(r.width + gapPx);
    }
  };

  const measureAnchors = () => {
    const orig = originals();
    if (!orig.length) { originalWidth = 0; leftAnchor = 0; return; }
    const first = orig[0];
    const last  = orig[orig.length - 1];
    leftAnchor = first.offsetLeft;
    const lastRight = last.offsetLeft + last.getBoundingClientRect().width;
    originalWidth = Math.max(0, Math.round(lastRight - leftAnchor));
  };

  const updateWrapMargin = () => {
    const vw = (carousel.clientWidth || track.clientWidth || 0);
    wrapMargin = Math.max(cardStep * 3, Math.round(vw * 0.5));
  };

  // ===== Stili forzati in modalità carosello =====
  const forceDesktopStyles = () => {
    track.style.flexWrap = 'nowrap';
    track.style.justifyContent = 'flex-start';
    track.style.overflowX = 'auto';
    track.style.overflowY = 'hidden';
    track.style.webkitOverflowScrolling = 'touch';
    track.style.scrollSnapType = 'x proximity';
    track.style.touchAction = 'none';
    track.style.userSelect  = 'none';
    track.classList.add('is-initializing');
  };
  const clearDesktopStyles = () => {
    track.style.flexWrap = '';
    track.style.justifyContent = '';
    track.style.overflowX = '';
    track.style.overflowY = '';
    track.style.webkitOverflowScrolling = '';
    track.style.scrollSnapType = '';
    track.style.touchAction = '';
    track.style.userSelect  = '';
    track.classList.remove('is-initializing');
  };

  const storeAndDisableSnap = () => {
    const s = getComputedStyle(track).scrollSnapType || '';
    snapCache = s;
    track.style.scrollSnapType = 'none';
  };
  const restoreSnap = () => {
    track.style.scrollSnapType = snapCache || '';
  };

  // ===== Abilita/Disabilita modalità Desktop =====
  function enableDesktop(){
    if (enabled) return;
    enabled = true;

    cleanupClones();
    const orig = originals();
    if (orig.length <= 1) return; // nulla da carousellizzare

    // Duplicazioni per wrap infinito
    track.appendChild(duplicateSet(orig));
    track.insertBefore(duplicateSet(orig), orig[0]);

    measureGapsAndStep();
    measureAnchors();
    updateWrapMargin();
    forceDesktopStyles();

    // Scroll al centro (fra insiemi) per avere margine entrambi i lati
    const center = leftAnchor + originalWidth + wrapMargin;
    track.scrollLeft = center;

    startAutoplay();

    // IO: pausa quando offscreen (se non si ignora RMW)
    if (!ignoreRMW() && 'IntersectionObserver' in window) {
      io?.disconnect?.();
      io = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) startAutoplay();
          else stopAutoplay();
        });
      }, { root: null, threshold: 0.01 });
      io.observe(carousel);
    }

    // Drag (mouse) per controllo manuale
    track.addEventListener('pointerdown', onPointerDown, { passive: true });
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('pointerup',   onPointerUp,   { passive: true });
    window.addEventListener('pointercancel', onPointerUp, { passive: true });
    window.addEventListener('blur', onPointerUp, { passive: true });

    // Resize/RO per ricalcolo dinamico
    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => {
        measureGapsAndStep();
        measureAnchors();
        updateWrapMargin();
      });
      ro.observe(track);
      ro.observe(document.documentElement);
    } else {
      window.addEventListener('resize', () => {
        measureGapsAndStep();
        measureAnchors();
        updateWrapMargin();
      }, { passive: true });
    }
  }

  function disableDesktop(){
    if (!enabled) return;
    enabled = false;

    stopAutoplay();
    cleanupClones();
    clearDesktopStyles();

    // Rimuovi eventi di drag
    window.removeEventListener('pointermove', onPointerMove, { passive: true });
    window.removeEventListener('pointerup',   onPointerUp,   { passive: true });
    window.removeEventListener('pointercancel', onPointerUp, { passive: true });
    window.removeEventListener('blur', onPointerUp, { passive: true });
  }

  // ===== Autoplay (smooth) =====
  function loop(){
    if (!enabled || dragging) return;
    const speed = readSpeed();
    storeAndDisableSnap();
    track.scrollLeft += speed;
    const maxRight = leftAnchor + originalWidth * 2 + wrapMargin * 2;
    if (track.scrollLeft > (maxRight - wrapMargin)) {
      track.scrollLeft -= originalWidth;
    }
    restoreSnap();
    rafId = requestAnimationFrame(loop);
  }
  function startAutoplay(){
    stopAutoplay();
    rafId = requestAnimationFrame(loop);
  }
  function stopAutoplay(){
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
  }

  // ===== Drag =====
  function onPointerDown(e){
    if (!enabled) return;
    dragging = true;
    dragStartX = e.clientX || e.pageX || 0;
    dragDX = 0;
    stopAutoplay();
    storeAndDisableSnap();
  }
  function onPointerMove(e){
    if (!enabled || !dragging) return;
    const x = e.clientX || e.pageX || 0;
    const dx = x - dragStartX;
    dragDX += dx;
    dragStartX = x;
    track.scrollLeft -= dx;
  }
  function onPointerUp(){
    if (!enabled) return;
    const THRESHOLD = Math.max(30, Math.round(cardStep * 0.1));
    // Snap manuale al cardStep
    const steps = Math.round(dragDX / cardStep);
    track.scrollLeft -= (steps * cardStep);
    dragging = false;
    restoreSnap();
    startAutoplay();
  }

  // ===== Init =====
  const onMQ = () => { mqDesktop.matches ? enableDesktop() : disableDesktop(); };
  (mqDesktop.addEventListener ? mqDesktop.addEventListener('change', onMQ)
                              : mqDesktop.addListener(onMQ));
  onMQ();

})();
