/**
 * /script/archive.js — EventHorizon.mtg (Archivio)
 * - Bottom-sheet mobile (overlay, focus-trap, drag handle)
 * - Chevron: sheet su mobile, pannello full-width su desktop
 * - Search: reset e placeholder responsive
 * - Filter mobile: toggle di #kind via aria-controls + hidden (binding globale + multi-toggle)
 */

(() => {
  'use strict';

  /* ==========================
   * Config & helpers
   * ========================== */
  const MQ_SHEET = '(max-width: 1023.98px)'; // mobile/tablet per sheet + pannello desktop
  const MQ_PHONE = '(max-width: 768px)';     // placeholder breve "Cerca"

  const TRUE = 'true';
  const FALSE = 'false';

  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on  = (el, ev, cb, opts) => el && el.addEventListener(ev, cb, opts);
  const set = (el, name, val) => el && el.setAttribute(name, String(val));

  const mqSheet = window.matchMedia ? window.matchMedia(MQ_SHEET) : null;
  const mqPhone = window.matchMedia ? window.matchMedia(MQ_PHONE) : null;

  const isMobileForSheet = () => (mqSheet ? mqSheet.matches : (window.innerWidth <= 1024));
  const isPhone = () => (mqPhone ? mqPhone.matches : (window.innerWidth <= 768));

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  /* ==========================
   * 1) Bottom-sheet (mobile)
   * ========================== */
  (function initBottomSheet() {
    const sheet    = qs('.archive-sheet');
    const backdrop = qs('.archive-sheet-backdrop');
    if (!sheet || !backdrop) return;

    const btnClose     = qs('.archive-sheet__close', sheet);
    const sheetTitle   = qs('#archive-sheet-title', sheet);
    const sheetContent = qs('.archive-sheet__content', sheet);
    const sheetCtas    = qs('.archive-sheet__ctas', sheet);
    const sheetHandle  = qs('.archive-sheet__handle', sheet);

    let lastTrigger = null; // bottone chevron che ha aperto lo sheet
    let lastItem    = null; // .item relativo

    const getPanelFromItem = (item) => {
      const li = item.closest('.archive-item');
      return li ? qs('.item-panel', li) : null;
    };

    const fillSheetFromItem = (item) => {
      // Titolo
      const t = qs('.item-title', item);
      sheetTitle.textContent = t ? String(t.textContent || '').trim() : 'Dettagli';

      // Contenuto (descrizione)
      sheetContent.innerHTML = '';
      const panel = getPanelFromItem(item);
      const desc = panel ? qs('.item-summary', panel) : null;
      if (desc) {
        const p = document.createElement('p');
        p.className = 'sheet-summary';
        p.textContent = String(desc.textContent || '').trim();
        sheetContent.appendChild(p);
      }

      // CTAs (pills)
      sheetCtas.innerHTML = '';
      const ctas = panel ? qs('.item-ctas', panel) : null;
      if (ctas) {
        qsa('a', ctas).forEach(a => sheetCtas.appendChild(a.cloneNode(true)));
      }
    };

    const openSheet = (item, trigger) => {
      fillSheetFromItem(item);
      lastTrigger = trigger || null;
      lastItem    = item || null;

      // Altezza iniziale (60vh) come px per drag più fluido
      try {
        const initH = Math.round(window.innerHeight * 0.60);
        sheet.style.setProperty('--sheet-height', initH + 'px');
      } catch {}

      document.body.classList.add('is-sheet-open');
      sheet.classList.add('is-open');
      backdrop.classList.add('is-open');
      set(sheet, 'aria-hidden', 'false');
      set(backdrop, 'aria-hidden', 'false');
      if (lastItem) lastItem.classList.add('is-sheet-open');

      // Focus iniziale sul close
      btnClose && btnClose.focus();

      document.addEventListener('keydown', onKeyDown);
      backdrop.addEventListener('click', closeSheet, { once: true });
    };

    const closeSheet = () => {
      sheet.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-sheet-open');
      set(sheet, 'aria-hidden', 'true');
      set(backdrop, 'aria-hidden', 'true');

      if (lastItem) lastItem.classList.remove('is-sheet-open');
      document.removeEventListener('keydown', onKeyDown);

      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
      lastTrigger = null;
      lastItem    = null;
    };

    const trapFocus = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = qsa('a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])', sheet)
        .filter(el => !(el.offsetParent === null && el !== document.activeElement));
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      } else if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      }
    };

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeSheet();
      } else {
        trapFocus(e);
      }
    };

    // Drag to close/expand (handle)
    let dragStartY = 0;
    let dragStartH = 0;
    let dragging = false;
    let framePending = false;
    let nextHeight = null;

    const getHeightPx = () => {
      const v = getComputedStyle(sheet).getPropertyValue('--sheet-height').trim();
      if (!v) return Math.round(window.innerHeight * 0.60);
      const n = parseInt(v, 10);
      return isNaN(n) ? Math.round(window.innerHeight * 0.60) : n;
    };

    const onDragStart = (e) => {
      if (!isMobileForSheet()) return;
      dragging = true;
      dragStartY = ('touches' in e) ? (e.touches[0]?.clientY ?? 0) : (e.clientY ?? 0);
      dragStartH = getHeightPx();
      sheet.classList.add('is-dragging');
      document.addEventListener('touchmove', onDragMove, { passive: false });
      document.addEventListener('touchend', onDragEnd, { passive: true });
      document.addEventListener('pointermove', onDragMove, { passive: false });
      document.addEventListener('pointerup', onDragEnd, { passive: true });
    };

    const onDragMove = (e) => {
      if (!dragging) return;
      try { e.preventDefault(); } catch {}
      const y = ('touches' in e) ? (e.touches[0]?.clientY ?? dragStartY) : (e.clientY ?? dragStartY);
      const dy = dragStartY - y; // verso l'alto => positivo
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const MIN = Math.round(Math.max(180, vh * 0.30));
      const MAX = Math.round(vh * 0.92);
      const h   = clamp(dragStartH + dy, MIN, MAX);
      nextHeight = h;
      if (!framePending) {
        framePending = true;
        requestAnimationFrame(() => {
          if (nextHeight != null) sheet.style.setProperty('--sheet-height', nextHeight + 'px');
          framePending = false;
        });
      }
    };

    const onDragEnd = () => {
      if (!dragging) return;
      dragging = false;
      const vh = window.innerHeight || document.documentElement.clientHeight || 800;
      const h  = getHeightPx();
      const T1 = Math.round(vh * 0.33);
      const T2 = Math.round(vh * 0.80);
      if (h < T1) { closeSheet(); return; }
      const target = (h > T2) ? Math.round(vh * 0.90) : Math.round(vh * 0.60);
      sheet.style.setProperty('--sheet-height', target + 'px');
      sheet.classList.remove('is-dragging');
      document.removeEventListener('touchmove', onDragMove, { passive: false });
      document.removeEventListener('pointermove', onDragMove, { passive: false });
    };

    if (sheetHandle) {
      sheetHandle.addEventListener('touchstart', onDragStart, { passive: true });
      sheetHandle.addEventListener('pointerdown', onDragStart, { passive: true });
    }

    // Deleghe chevron: sheet su mobile
    const onSummaryClick = (ev) => {
      const summary = ev.target && ev.target.closest('.item-actions-summary');
      if (!summary) return;
      if (!isMobileForSheet()) return; // desktop gestito altrove
      ev.preventDefault();
      const item = summary.closest('.item');
      if (!item) return;
      openSheet(item, summary);
    };
    const onSummaryKeydown = (ev) => {
      const summary = ev.target && ev.target.closest('.item-actions-summary');
      if (!summary) return;
      if (!isMobileForSheet()) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        const item = summary.closest('.item');
        if (!item) return;
        openSheet(item, summary);
      }
    };

    document.addEventListener('click', onSummaryClick);
    document.addEventListener('keydown', onSummaryKeydown);
    btnClose && btnClose.addEventListener('click', closeSheet);

    // Se passa a desktop mentre è aperto → chiudi
    const onMQSheet = (e) => { if (!e.matches && sheet.classList.contains('is-open')) closeSheet(); };
    if (mqSheet && typeof mqSheet.addEventListener === 'function') {
      mqSheet.addEventListener('change', onMQSheet);
    } else if (mqSheet && typeof mqSheet.addListener === 'function') {
      mqSheet.addListener(onMQSheet);
    }
  })();

  /* =========================================
   * 2) Desktop: pannello full-width in-row
   * ========================================= */
  (function initDesktopPanelToggle() {
    const togglePanelFromItem = (item) => {
      const li = item.closest('.archive-item');
      if (!li) return;
      const panel = qs('.item-panel', li);
      const trigger = qs('.item-actions-summary', item);
      if (!panel || !trigger) return;
      const willOpen = !item.classList.contains('is-open');
      item.classList.toggle('is-open', willOpen);
      set(trigger, 'aria-expanded', willOpen ? TRUE : FALSE);
      try { panel.hidden = !willOpen; } catch {}
    };

    const onDesktopToggle = (ev) => {
      const item = ev.target && ev.target.closest('.item');
      if (!item) return;
      if (isMobileForSheet()) return; // mobile gestito dallo sheet

      const isChevron = !!ev.target.closest('.item-actions-summary');
      const interactive = ev.target.closest('a, button, input, select, textarea');

      if (!isChevron && interactive) return; // non interferire con CTA interne
      if (!item.contains(ev.target)) return;

      if (isChevron) ev.preventDefault();
      togglePanelFromItem(item);
    };

    document.addEventListener('click', onDesktopToggle);
  })();

  /* =========================================
   * 3) Mobile Filter Toggle — binding globale + multi-toggle
   *      (allineato al CSS: form.has-filter-open)
   * ========================================= */
  (function initMobileFilterToggle() {
    const form = qs('.archive-search__form');

    // Raccoglie tutti i possibili toggle "Filtro" nel documento (icona filter.svg inclusa)
    const TOGGLE_SEL = '.archive-search__filter-toggle, [data-filter-toggle], [aria-controls="kind"]';

    const getAllToggles = () => qsa(TOGGLE_SEL, document);

    // Dato un toggle, risolve il vero <select> da mostrare/nascondere
    const resolveTarget = (toggleEl) => {
      const id = toggleEl?.getAttribute('aria-controls') || 'kind';
      let el = document.getElementById(id);
      if (el && el.tagName !== 'SELECT') {
        // aria-controls punta a un wrapper → cerca il select al suo interno
        el = el.querySelector('select#kind, select[name="kind"]');
      }
      // fallback: cerca dentro il form, poi nel documento
      return el || (form ? (qs('#kind', form) || qs('select[name="kind"]', form)) : null) || qs('#kind') || qs('select[name="kind"]');
    };

    // Sincronizza aria-expanded su TUTTI i toggle che controllano lo stesso select
    const syncTogglesExpanded = (select, expanded) => {
      const toggles = getAllToggles();
      toggles.forEach(tg => {
        const target = resolveTarget(tg);
        if (target === select) set(tg, 'aria-expanded', expanded ? TRUE : FALSE);
      });
    };

    // ⬇️ DIFFERENZA CHIAVE: gestiamo anche .has-filter-open sul form
    const setFilterState = (select, expanded) => {
      syncTogglesExpanded(select, expanded);

      if (isMobileForSheet()) {
        // Stato visuale CSS
        if (form) form.classList.toggle('has-filter-open', !!expanded);
        // Stato semantico/A11y
        select.hidden = !expanded;
        if (expanded) { try { select.focus(); } catch {} }
      } else {
        // Desktop: selettore sempre visibile, e rimuoviamo la classe dal form
        select.hidden = false;
        if (form) form.classList.remove('has-filter-open');
      }
    };

    // Inizializzazione stato (al load)
    const select = resolveTarget(getAllToggles()[0] || null);
    if (!select) return;

    const hasValue = !!String(select.value || '').trim();
    setFilterState(select, isMobileForSheet() ? hasValue : false);

    // Toggle via click/tastiera (binding globale, funziona anche se il bottone è fuori dal form)
    const onGlobalClick = (ev) => {
      const toggle = ev.target && ev.target.closest(TOGGLE_SEL);
      if (!toggle) return;
      try { ev.preventDefault(); ev.stopPropagation(); } catch {}
      const target = resolveTarget(toggle);
      if (!target) return;
      const curr = toggle.getAttribute('aria-expanded') === TRUE;
      setFilterState(target, !curr);
    };
    const onGlobalKey = (ev) => {
      const toggle = ev.target && ev.target.closest(TOGGLE_SEL);
      if (!toggle) return;
      if (ev.key === 'Enter' || ev.key === ' ') {
        try { ev.preventDefault(); ev.stopPropagation(); } catch {}
        const target = resolveTarget(toggle);
        if (!target) return;
        const curr = toggle.getAttribute('aria-expanded') === TRUE;
        setFilterState(target, !curr);
      }
    };

    document.addEventListener('click', onGlobalClick, { passive: false });
    document.addEventListener('keydown', onGlobalKey);

    // Cambio breakpoint: su desktop il select è sempre visibile e la classe viene rimossa
    const onMQChange = () => {
      if (!select) return;
      if (!isMobileForSheet()) {
        setFilterState(select, false); // concettualmente chiuso, ma select visibile + classe rimossa
      } else {
        // su mobile: se aveva valore o un toggle è marcato expanded, mantieni aperto
        const toggles = getAllToggles();
        const expanded = toggles.some(tg => tg.getAttribute('aria-expanded') === TRUE);
        setFilterState(select, expanded || !!String(select.value || '').trim());
      }
    };
    if (mqSheet && typeof mqSheet.addEventListener === 'function') {
      mqSheet.addEventListener('change', onMQChange);
    } else if (mqSheet && typeof mqSheet.addListener === 'function') {
      mqSheet.addListener(onMQChange);
    }
  })();

  /* =========================================
   * 4) Search Reset + Placeholder
   * ========================================= */
  (function initSearchUX() {
    const form  = qs('.archive-search__form');
    const q     = qs('#q', form || document);
    const kind  = qs('#kind', form || document);
    const btnR  = qs('.archive-search__reset', form || document);

    // Placeholder: "Cerca" su phone
    const fullPH  = q ? (q.getAttribute('placeholder') || 'Cerca per titolo, descrizione o tag…') : 'Cerca per titolo, descrizione o tag…';
    const shortPH = 'Cerca';
    const applyPH = () => { if (q) q.setAttribute('placeholder', isPhone() ? shortPH : fullPH); };
    applyPH();
    if (mqPhone && typeof mqPhone.addEventListener === 'function') {
      mqPhone.addEventListener('change', applyPH);
    } else {
      on(window, 'resize', applyPH, { passive: true });
    }

    // Reset: unica sorgente di verità
    if (form && btnR) {
      btnR.addEventListener('click', (e) => {
        e.preventDefault();
        const u = new URL(window.location.href);
        u.searchParams.delete('q');
        u.searchParams.delete('p');
        u.searchParams.delete('kind');
        if (q)    q.value = '';
        if (kind) kind.value = '';
        // ricarica pulito
        window.location.href = u.toString();
      });
    }
  })();
})();
