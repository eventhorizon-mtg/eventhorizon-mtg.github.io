/* ============================================================
   archive.js — Archivio (refactor corretto)
   - Guard multi-mount: data-archive-ready
   - Breakpoint da CSS var con fallback (--bp-desktop)
   - Nessun cambio logico (bottom sheet mobile, pannello desktop, search/reset)
   ============================================================ */
(() => {
  const root = document.querySelector('.archive');
  if (!root || root.dataset.archiveReady === '1') return;
  root.dataset.archiveReady = '1';

  // ---------- Utils ----------
  const qs  = (s, el = document) => el.querySelector(s);
  const qsa = (s, el = document) => Array.from(el.querySelectorAll(s));
  const set = (el, n, v) => { try { el && el.setAttribute(n, v); } catch {} };
  const readBP = (name, fallback) => {
    try {
      const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : fallback;
    } catch { return fallback; }
  };
  const BP_DESKTOP = readBP('--bp-desktop', 1024);

  // ---------- Search form state ----------
  (function initSearch(){
    const form = document.querySelector('.archive-search__form');
    if (!form) return;

    const inputQ    = form.querySelector('input[name="q"], #q');
    const selectK   = form.querySelector('select[name="kind"], #kind');
    const btnReset  = form.querySelector('.archive-search__reset');
    const btnFilter = form.querySelector('.archive-search__filter-toggle');

    // Toggle filtro su mobile: class + aria
    if (btnFilter){
      btnFilter.addEventListener('click', (e) => {
        e.preventDefault();
        form.classList.toggle('has-filter-open');
        const open = form.classList.contains('has-filter-open');
        set(btnFilter, 'aria-expanded', open ? 'true' : 'false');
      });
    }

    // Reset form + pulizia URL (?q&kind)
    if (btnReset){
      btnReset.addEventListener('click', (e) => {
        try {
          if (inputQ)  inputQ.value = '';
          if (selectK) selectK.value = '';
          const url = new URL(window.location.href);
          url.searchParams.delete('q');
          url.searchParams.delete('kind');
          history.replaceState({}, '', url.toString());
          form.classList.remove('has-filter-open');
          if (btnFilter) set(btnFilter, 'aria-expanded', 'false');
        } catch {}
      });
    }
  })();

  // ---------- Desktop panel (details) ----------
  (function initDesktopPanel(){
    const details = document.querySelectorAll('.item-details');
    details.forEach(d => {
      if (d.dataset.detailsReady === '1') return;
      d.dataset.detailsReady = '1';

      const summary = d.querySelector('.item-actions-summary');
      if (!summary) return;

      const refresh = () => {
        const open = d.hasAttribute('open');
        set(summary, 'aria-expanded', open ? 'true' : 'false');
      };
      d.addEventListener('toggle', refresh);
      refresh();
    });
  })();

  // ---------- Bottom sheet (mobile) ----------
  (function initBottomSheet(){
    const sheet    = document.querySelector('.archive-sheet');
    const backdrop = document.querySelector('.archive-sheet-backdrop');
    if (!sheet || !backdrop) return;

    const btnClose     = qs('.archive-sheet__close', sheet); // ← unica dichiarazione
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
      const desc  = panel ? qs('.item-summary', panel) : null;
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
      if (btnClose) btnClose.focus();

      // ESC e click backdrop
      const onKeyDown = (e) => { if (e.key === 'Escape') { e.preventDefault(); closeSheet(); } };
      document.addEventListener('keydown', onKeyDown);
      backdrop.addEventListener('click', closeSheet, { once: true });

      // Store remover per ESC in chiusura (in forma chiusa)
      openSheet._onKeyDown = onKeyDown;
    };

    const closeSheet = () => {
      sheet.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      document.body.classList.remove('is-sheet-open');
      set(sheet, 'aria-hidden', 'true');
      set(backdrop, 'aria-hidden', 'true');

      if (lastItem) lastItem.classList.remove('is-sheet-open');

      // Rimuovi ESC handler
      if (openSheet._onKeyDown) {
        document.removeEventListener('keydown', openSheet._onKeyDown);
        openSheet._onKeyDown = null;
      }

      if (lastTrigger && typeof lastTrigger.focus === 'function') {
        lastTrigger.focus();
      }
      lastTrigger = null;
      lastItem    = null;
    };

    // Bind ai chevron che aprono il bottom sheet SOLO su mobile
    const chevrons = qsa('.item-actions-summary');
    chevrons.forEach(btn => {
      if (btn.dataset.sheetBind === '1') return;
      btn.dataset.sheetBind = '1';

      btn.addEventListener('click', (e) => {
        const isDesktop = window.matchMedia(`(min-width: ${BP_DESKTOP}px)`).matches;
        if (isDesktop) return; // su desktop agisce <details>

        const item = btn.closest('.item');
        if (!item) return;

        const wasOpen = btn.getAttribute('aria-expanded') === 'true';
        e.preventDefault();

        // Se già aperto, chiudi
        if (wasOpen && document.body.classList.contains('is-sheet-open')) {
          closeSheet();
          return;
        }

        // Apri
        openSheet(item, btn);
      });
    });

    // Drag handle (mobile)
    (function initDrag(){
      if (!sheetHandle) return;

      let startY = 0;
      let startH = 0;
      let dragging = false;

      const onStart = (e) => {
        dragging = true;
        sheet.classList.add('is-dragging');
        startY = (e.touches?.[0]?.clientY ?? e.clientY);
        const r = sheet.getBoundingClientRect();
        startH = r.height;
        document.addEventListener('mousemove', onMove, { passive: true });
        document.addEventListener('touchmove', onMove, { passive: true });
        document.addEventListener('mouseup', onEnd, { passive: true, once: true });
        document.addEventListener('touchend', onEnd, { passive: true, once: true });
      };
      const onMove = (e) => {
        if (!dragging) return;
        const y = (e.touches?.[0]?.clientY ?? e.clientY);
        const dy = y - startY;
        const h = Math.max(160, startH - dy);
        sheet.style.setProperty('--sheet-height', h + 'px');
      };
      const onEnd = () => {
        dragging = false;
        sheet.classList.remove('is-dragging');
      };

      sheetHandle.addEventListener('mousedown', onStart, { passive: true });
      sheetHandle.addEventListener('touchstart', onStart, { passive: true });
    })();

    // Close button (usa la variabile dichiarata in alto)
    if (btnClose){
      btnClose.addEventListener('click', (e) => { e.preventDefault(); closeSheet(); });
    }
  })();

})();
