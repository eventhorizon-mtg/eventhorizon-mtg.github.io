/**
 * /script/archive.js – EventHorizon.mtg (Archivio)
 * - Layout uniforme su tutti i viewport (righe orizzontali compatte)
 * - Bottom-sheet mobile (overlay, focus-trap, drag handle) su mobile (<768px)
 * - Pannello espandibile in-page su tablet/desktop (≥768px)
 * - Search: reset e placeholder responsive
 * - Filter mobile: popover "Tutti/Video/Contenuti"
 */

(() => {
  'use strict';
  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return;

  /* ==========================
   * Config & helpers (UI)
   * ========================== */
  const MQ_SHEET = '(max-width: 767.98px)'; // mobile: sheet (tablet/desktop: pannello in-page)
  const MQ_PHONE = '(max-width: 767.98px)';     // placeholder breve "Cerca"

  const TRUE = 'true';
  const FALSE = 'false';

  // Configurazione drag & swipe (mobile bottom-sheet)
  const DRAG_CLOSE_THRESHOLD_PX = 16;   // soglia minima per chiudere sheet con drag (semplificata)
  const DRAG_OPACITY_DIVISOR = 300;     // divisore per calcolo opacità backdrop durante drag
  const HAPTIC_FEEDBACK_CLOSE_MS = 50;  // durata vibrazione haptic su chiusura
  const HAPTIC_FEEDBACK_SNAP_MS = 10;   // durata vibrazione haptic su snap back

  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on  = (el, ev, cb, opts) => el && el.addEventListener(ev, cb, opts);
  const set = (el, name, val) => el && el.setAttribute(name, String(val));

  const mqSheet = window.matchMedia ? window.matchMedia(MQ_SHEET) : { matches: true, addEventListener(){} };
  const mqPhone = window.matchMedia ? window.matchMedia(MQ_PHONE) : { matches: false, addEventListener(){} };

  const getURL = () => new URL(window.location.href);
  const getParam = (name) => getURL().searchParams.get(name);

  /* ==========================
   * 1) Bottom-sheet (mobile) + Focus Trap
   * ========================== */
  (() => {
    const sheet    = qs('.archive-sheet');
    const backdrop = qs('.archive-sheet-backdrop');
    if (!sheet || !backdrop) return; // fail-safe

    const btnClose = qs('.archive-sheet__close', sheet);
    const handle   = qs('.archive-sheet__handle', sheet);
    const titleEl  = qs('#archive-sheet-title', sheet);
    const content  = qs('.archive-sheet__content', sheet);
    const ctas     = qs('.archive-sheet__ctas', sheet);

    let lastFocus = null;
    let currentItem = null;

    const trapFocus = (ev) => {
      if (ev.key !== 'Tab') return;
      const focusables = qsa('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])', sheet)
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
      if (!focusables.length) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];
      if (ev.shiftKey && document.activeElement === first) { last.focus(); ev.preventDefault(); }
      else if (!ev.shiftKey && document.activeElement === last) { first.focus(); ev.preventDefault(); }
    };

  const openSheet = (payload, fromItem) => {
      if (!mqSheet.matches) return; // solo mobile/tablet
      lastFocus = document.activeElement;
      currentItem = fromItem || null;

      // Salva la posizione di scroll corrente per evitare jump
      const scrollY = window.scrollY;

      titleEl.textContent = payload.title || '';
      content.innerHTML   = payload.descHtml || '';
      ctas.innerHTML      = '';
      (payload.links || []).forEach(link => {
        const a = document.createElement('a');
        a.className   = link.cls || 'btn btn--primary btn--sm';
        a.href        = link.url;
        a.target      = '_blank';
        a.rel         = 'noopener';
        a.title       = link.lab || 'Apri';
        a.textContent = link.lab || 'Apri';
        ctas.appendChild(a);
      });

      // Applica classe del tipo (kind) allo sheet per stili condizionali
      const kind = payload.kind || 'content';
      sheet.classList.remove('is-kind-video', 'is-kind-content'); // Rimuovi vecchie classi
      sheet.classList.add(`is-kind-${kind}`); // Aggiungi nuova classe

      sheet.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      sheet.classList.add('is-open');
      backdrop.classList.add('is-open');
      document.body.classList.add('is-sheet-open');
      document.body.style.top = `-${scrollY}px`;
      if (currentItem) { try { currentItem.classList.add('is-sheet-open'); } catch(_) {} }

      // Rileva se il contenuto è scrollabile
      setTimeout(() => {
        if (sheet.scrollHeight > sheet.clientHeight) {
          sheet.classList.add('has-scroll');
        } else {
          sheet.classList.remove('has-scroll');
        }
      }, 100);

      sheet.addEventListener('keydown', trapFocus);
      (btnClose || sheet).focus({ preventScroll: true });
    };

    const closeSheet = () => {
      // Salva la posizione di scroll prima di chiudere
      const scrollY = document.body.style.top;
      const scrollPos = scrollY ? Math.abs(parseInt(scrollY || '0')) : 0;

      sheet.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      sheet.classList.remove('is-open');
      backdrop.classList.remove('is-open');
      // Reset di sicurezza per evitare stati "a metà" che causano problemi di z-index/interazioni
      sheet.classList.remove('is-dragging');
      sheet.style.transition = '';
      sheet.style.transform = '';
      backdrop.style.opacity = '';

      // Rimuovi classi del tipo (kind)
      sheet.classList.remove('is-kind-video', 'is-kind-content');

      document.body.classList.remove('is-sheet-open');
      document.body.style.top = '';

      // Ripristina la posizione SENZA scroll animato (instant)
      if (scrollPos > 0) {
        window.scrollTo({ top: scrollPos, behavior: 'instant' });
      }

      if (currentItem) { try { currentItem.classList.remove('is-sheet-open'); } catch(_) {} currentItem = null; }
      sheet.removeEventListener('keydown', trapFocus);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus({ preventScroll: true });
      }
    };

    on(btnClose, 'click', closeSheet);
    on(backdrop, 'click', closeSheet);

    // Enhanced draggable sheet - drag anywhere on sheet, not just handle
    let startY = null, currentY = null, isDragging = false;
    
    const onDragStart = (e) => {
      // Permetti drag solo se si inizia dall'handle o dall'header
      const target = e.target;
      const isHandle = target.closest('.archive-sheet__handle');
      const isHeader = target.closest('.archive-sheet__title');
      const isContent = target.closest('.archive-sheet__content');
      
      // Non iniziare drag se si è nel contenuto scrollabile
      if (isContent && !isHandle && !isHeader) return;
      
      if (!isHandle && !isHeader) return;
      
      startY = e.touches ? e.touches[0].clientY : e.clientY;
      currentY = startY;
      
      // Verifica se il contenuto è scrollato in alto
      const isAtTop = sheet.scrollTop <= 0;
      
      // Permetti drag solo se siamo in cima allo scroll
      if (isContent && !isAtTop) return;
      
      isDragging = true;
      sheet.classList.add('is-dragging');
      sheet.style.transition = 'none'; // Disabilita transizione durante il drag
    };
    
    const onDragMove = (e) => {
      if (!isDragging || startY == null) return;

      currentY = e.touches ? e.touches[0].clientY : e.clientY;
      const deltaY = currentY - startY;

      // Permetti solo drag verso il basso (chiusura) - NO drag verso l'alto
      if (deltaY > 0) {
        // Applica il movimento al sheet solo verso il basso
        sheet.style.transform = `translateY(${deltaY}px)`;

        // Riduci opacità del backdrop in base al drag
        const opacity = Math.max(0, 1 - (deltaY / DRAG_OPACITY_DIVISOR));
        backdrop.style.opacity = opacity;

        // Previeni scroll della pagina durante il drag verso il basso
        e.preventDefault();
      }
      // Drag verso l'alto: completamente ignorato, nessun effetto
    };
    
    const onDragEnd = () => {
      if (!isDragging) return;
      
      const deltaY = currentY - startY;
      
      // Reset transition e classe
      sheet.classList.remove('is-dragging');
      sheet.style.transition = '';
      backdrop.style.opacity = '';
      
      // Se drag > soglia, chiudi
      if (deltaY > DRAG_CLOSE_THRESHOLD_PX) {
        // Haptic feedback se disponibile
        if (navigator.vibrate) {
          navigator.vibrate(HAPTIC_FEEDBACK_CLOSE_MS);
        }
        // Pulisci il transform inline prima di chiudere
        sheet.style.transform = '';
        closeSheet();
      } else {
        // Altrimenti torna in posizione con animazione
        sheet.style.transform = '';
        // Haptic feedback leggero per "snap back"
        if (navigator.vibrate && deltaY > 20) {
          navigator.vibrate(HAPTIC_FEEDBACK_SNAP_MS);
        }
      }
      
      startY = null;
      currentY = null;
      isDragging = false;
    };
    
    // Touch events per mobile
    on(sheet, 'touchstart', onDragStart, { passive: false });
    on(sheet, 'touchmove', onDragMove, { passive: false });
    on(sheet, 'touchend', onDragEnd);
    on(sheet, 'touchcancel', onDragEnd);
    
    // Mouse events per desktop (testing)
    on(handle, 'mousedown', onDragStart);
    on(document, 'mousemove', (e) => { if (isDragging) onDragMove(e); });
    on(document, 'mouseup', onDragEnd);

    // BLOCCO GLOBALE: Impedisci qualsiasi interazione quando lo sheet è aperto (difesa in profondità)
    // IMPORTANTE: Blocca SEMPRE se lo sheet ha la classe is-open, indipendentemente dal suo stato (aperto a metà, completamente aperto, ecc.)
    const blockInteractions = (ev) => {
      // Se lo sheet è aperto (anche solo parzialmente), blocca TUTTI gli eventi TRANNE quelli su sheet/backdrop
      if (sheet.classList.contains('is-open') || document.body.classList.contains('is-sheet-open')) {
        const clickedSheet = ev.target && (ev.target.closest('.archive-sheet') || ev.target.closest('.archive-sheet-backdrop'));
        if (!clickedSheet) {
          ev.preventDefault();
          ev.stopPropagation();
          ev.stopImmediatePropagation();
          return false;
        }
      }
    };

    // Blocca click, touch e pointer events con capture phase per intercettare PRIMA
    document.addEventListener('click', blockInteractions, { capture: true, passive: false });
    document.addEventListener('touchstart', blockInteractions, { capture: true, passive: false });
    document.addEventListener('touchmove', blockInteractions, { capture: true, passive: false });
    document.addEventListener('touchend', blockInteractions, { capture: true, passive: false });
    document.addEventListener('pointerdown', blockInteractions, { capture: true, passive: false });
    document.addEventListener('mousedown', blockInteractions, { capture: true, passive: false });

    // Apertura (mobile) - click sull'area content (non thumbnail)
    document.addEventListener('click', (ev) => {
      if (!mqSheet.matches) return; // Solo su mobile

      // Se lo sheet è aperto, consenti interazioni DENTRO lo sheet (link, bottoni, ecc.)
      if (document.body.classList.contains('is-sheet-open')) {
        const withinSheet = ev.target && (ev.target.closest('.archive-sheet') || ev.target.closest('.archive-sheet-backdrop'));
        if (withinSheet) return; // lascia passare i click dentro lo sheet/backdrop
        // Altrimenti blocca l'interazione con il resto della pagina
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }
      
      // Ignora se clicca su un link dentro item-content
      const clickedLink = ev.target && ev.target.closest('a');
      if (clickedLink) return;
      
      // Ignora se clicca sulla thumbnail o suoi bottoni
      const clickedThumb = ev.target && ev.target.closest('.item-media, .item-thumb, .item-thumb-button');
      if (clickedThumb) return;

      // Verifica se ha cliccato nell'area content
      const itemContent = ev.target && ev.target.closest('.item-content');
      if (!itemContent) return;

      const article = itemContent.closest('.item');
      const li = article && article.closest('.archive-item');
      if (!li) return;

      const panel = li.querySelector('.item-panel');
      const desc  = panel ? panel.querySelector('.item-summary') : null;
      const contentExt = panel ? panel.querySelector('.item-content-extended') : null;
      const ctaEls = panel ? qsa('.item-ctas a', panel) : [];
      const title = article.querySelector('.item-title')?.textContent || '';

      // Estrai il tipo (kind) dall'article
      const kind = article.getAttribute('data-kind') || 'content';

      const links = ctaEls.map(a => ({
        url: a.getAttribute('href'),
        lab: a.textContent.trim(),
        cls: a.className
      }));

      // Build sheet content with separators (stesso formato del pannello)
      let sheetHtml = '';
      if (desc) {
        sheetHtml += `<p class="item-summary">${desc.textContent}</p>`;
      }
      if (contentExt) {
        if (sheetHtml) sheetHtml += `<hr class="item-separator">`;
        sheetHtml += `<div class="item-content-extended">${contentExt.innerHTML}</div>`;
      }

      // Aggiungi separator prima dei link se c'è altro contenuto
      if (links.length > 0 && sheetHtml) {
        sheetHtml += `<hr class="item-separator">`;
      }

      openSheet({
        title,
        descHtml: sheetHtml,
        links,
        kind // Passa il tipo allo sheet
      }, article);
      ev.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.getAttribute('aria-hidden') === 'false') closeSheet();
    });
  })();

  /* ==========================
   * 2) Pannello desktop (in-row) - ENHANCED: Intera card cliccabile
   * ========================== */
  (() => {
    const mqSheet2 = window.matchMedia ? window.matchMedia('(max-width: 767.98px)') : { matches: true };

    const togglePanel = (item, li) => {
      const panel = qs('.item-panel', li);
      const trigger = qs('.item-actions-summary', item);
      if (!panel || !trigger) return;

      const willOpen = !item.classList.contains('is-open');
      item.classList.toggle('is-open', willOpen);
      set(trigger, 'aria-expanded', willOpen ? TRUE : FALSE);

      // Toggle panel visibility
      if (willOpen) {
        panel.hidden = false;
        // Scroll into view if needed (smooth)
        setTimeout(() => {
          if (panel.scrollHeight > 400) {
            panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 150);
      } else {
        // Wait briefly before hiding
        setTimeout(() => {
          if (!item.classList.contains('is-open')) {
            panel.hidden = true;
          }
        }, 300);
      }
    };

    // Make entire card clickable on desktop (not on mobile where we use bottom sheet)
    document.addEventListener('click', (ev) => {
      // Skip on mobile/tablet - the mobile handler above will take care of it
      if (mqSheet2.matches) return;

      // BLOCCA se uno sheet è aperto (protezione aggiuntiva)
      if (document.body.classList.contains('is-sheet-open')) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }

      // Check if clicking on a link inside the card
      const clickedLink = ev.target && ev.target.closest('a.item-thumb, .item-ctas a');
      if (clickedLink) return; // Let the link work normally

      const item = ev.target && ev.target.closest('.item');
      if (!item) return;

      const li = item.closest('.archive-item');
      if (!li) return;

      ev.preventDefault();
      togglePanel(item, li);
    });

    // Keyboard accessibility: Enter/Space on card toggles panel
    document.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Enter' && ev.key !== ' ') return;
      if (mqSheet2.matches) return; // only desktop

      // BLOCCA se uno sheet è aperto
      if (document.body.classList.contains('is-sheet-open')) {
        ev.preventDefault();
        ev.stopPropagation();
        return;
      }

      const item = ev.target && ev.target.closest('.item');
      if (!item) return;

      const li = item.closest('.archive-item');
      if (!li) return;

      ev.preventDefault();
      togglePanel(item, li);
    });
  })();

  /* ==========================
   * 2.1) Unlock scroll con gradient overlay cliccabile (solo desktop, solo se overflow)
   * ========================== */
  (() => {
    const mqDesktop = window.matchMedia ? window.matchMedia('(min-width: 768px)') : { matches: false };
    const MAX_HEIGHT_COMPRESSED = 320; // Max height iniziale del pannello (deve matchare il CSS)

    // Funzione per verificare se il pannello ha overflow (contenuto troncato)
    const checkOverflow = (panel) => {
      if (!panel || !mqDesktop.matches) return false;

      // Ignora se già scrollable (stato espanso)
      if (panel.classList.contains('is-scrollable')) return false;

      // Verifica se il contenuto supera l'altezza massima compressa
      const hasOverflow = panel.scrollHeight > MAX_HEIGHT_COMPRESSED;

      // Aggiungi/rimuovi classe has-overflow
      panel.classList.toggle('has-overflow', hasOverflow);

      return hasOverflow;
    };

    // Click sul gradient overlay per attivare scroll
    document.addEventListener('click', (ev) => {
      // Solo su desktop
      if (!mqDesktop.matches) return;

      // Verifica se ha cliccato sul gradient overlay (::after pseudo-element)
      const panel = ev.target && ev.target.closest('.item-panel');
      if (!panel) return;

      // Ignora se il pannello è già scrollable o non ha overflow
      if (panel.classList.contains('is-scrollable') || !panel.classList.contains('has-overflow')) return;

      // Verifica se il click è nell'area del gradient (bottom 120px)
      const rect = panel.getBoundingClientRect();
      const clickY = ev.clientY - rect.top; // Click Y relativo al pannello
      const gradientStart = rect.height - 120; // Gradient overlay è alto 120px

      // Se il click è nell'area del gradient overlay
      if (clickY >= gradientStart) {
        ev.preventDefault();
        ev.stopPropagation();

        // Attiva lo scroll e rimuovi has-overflow (non serve più)
        panel.classList.add('is-scrollable');
        panel.classList.remove('has-overflow');

        // Scroll smooth al top del contenuto per dare feedback visivo
        panel.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // Osserva apertura/chiusura pannelli
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
          const panel = mutation.target;

          // Solo pannelli desktop
          if (!mqDesktop.matches) return;
          if (!panel || !panel.classList.contains('item-panel')) return;

          if (panel.hasAttribute('hidden')) {
            // CHIUSURA: ripristina stato compresso
            panel.classList.remove('is-scrollable', 'has-overflow');
            panel.scrollTop = 0; // Reset scroll position
          } else {
            // APERTURA: verifica overflow dopo un breve delay per permettere il rendering
            requestAnimationFrame(() => {
              setTimeout(() => checkOverflow(panel), 100);
            });
          }
        }
      });
    });

    // Osserva tutti i pannelli per intercettare apertura/chiusura
    const observePanels = () => {
      const panels = document.querySelectorAll('.item-panel');
      panels.forEach((panel) => {
        observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] });
      });
    };

    // Bootstrap: osserva pannelli già presenti
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', observePanels);
    } else {
      observePanels();
    }

    // Osserva anche pannelli aggiunti dinamicamente (dopo render)
    const bodyObserver = new MutationObserver(() => {
      observePanels();
    });

    if (document.body) {
      bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    // Ri-check overflow su resize (per sicurezza, con debounce)
    let resizeTimeout;
    window.addEventListener('resize', () => {
      if (!mqDesktop.matches) return;
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        document.querySelectorAll('.item-panel:not([hidden]):not(.is-scrollable)').forEach(checkOverflow);
      }, 200);
    });
  })();

  /* ==========================
   * 3) Search UI (placeholder responsive)
   * ========================== */
  (() => {
    const form = qs('#archive-search-form'); if (!form) return;
    const q = qs('#q', form);
    const onMQ = () => {
      if (!q) return;
      q.placeholder = mqPhone.matches ? 'Cerca' : 'Cerca per titolo, descrizione, tag';
    };
    onMQ();
    mqPhone.addEventListener && mqPhone.addEventListener('change', onMQ);
  })();

  /* ==========================
   * 4) Search Reset + Filter (popover mobile)
   * ========================== */
(() => {
  const form   = qs('#archive-search-form');
  const qInput = qs('#q', form || document);
  const sel    = qs('#kind', form || document);
  const btn    = qs('.archive-search__filter-toggle', form || document);
  const mqMobile = window.matchMedia('(max-width: 767.98px)');

  // Stato iniziale (sincronizza URL → UI)
  const urlKind = (getParam('kind') || '').toLowerCase();
  if (sel) sel.value = (urlKind === 'video' || urlKind === 'content') ? urlKind : '';
  const active = !!(sel && sel.value !== '');
  if (btn) { 
    btn.classList.toggle('is-active', active);
    // Aggiungi classe specifica per tipo
    btn.classList.remove('is-active--video', 'is-active--content');
    if (urlKind === 'video') btn.classList.add('is-active--video');
    else if (urlKind === 'content') btn.classList.add('is-active--content');
    btn.setAttribute('aria-expanded', FALSE);
  }
  if (qInput) qInput.value = getParam('q') || '';

  // POPUP (desktop/tablet)
  let popoverEl = null;
  const closePopover = () => {
    if (popoverEl && popoverEl.parentNode) popoverEl.parentNode.removeChild(popoverEl);
    popoverEl = null;
    if (btn) btn.setAttribute('aria-expanded', FALSE);
    document.removeEventListener('click', onDocClick, true);
    document.removeEventListener('keydown', onKeyDown, true);
  };
  const onDocClick = (e) => {
    if (!popoverEl) return;
    if (!e.target || (!popoverEl.contains(e.target) && e.target !== btn)) closePopover();
  };
  const onKeyDown = (e) => { if (e.key === 'Escape') closePopover(); };

  // SHEET (mobile)
  let filterSheet = null, filterBackdrop = null, lastFocus = null;
  const closeFilterSheet = () => {
    if (filterSheet) filterSheet.remove();
    if (filterBackdrop) filterBackdrop.remove();
    filterSheet = null; filterBackdrop = null;
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus({ preventScroll: true });
  };

  const openFilterSheet = () => {
    if (filterSheet) return;
    filterSheet = document.createElement('div');
    filterSheet.className = 'archive-sheet archive-sheet--filters';
    filterSheet.innerHTML = `
      <div class="archive-sheet__handle" aria-hidden="true"></div>
      <div class="archive-sheet__content" role="dialog" aria-modal="true" aria-labelledby="filters-title">
        <div class="archive-sheet__header">
          <h3 id="filters-title">Filtra</h3>
        </div>
        <div class="archive-sheet__body">
          <label class="fld">
            <span>Tipo</span>
            <select id="kind-mobile" name="kind">
              <option value="">Tutti</option>
              <option value="content"${urlKind==='content'?' selected':''}>Contenuti</option>
              <option value="video"${urlKind==='video'?' selected':''}>Video</option>
            </select>
          </label>
        </div>
        <div class="archive-sheet__ctas">
          <button type="button" class="btn apply">Applica</button>
          <button type="button" class="btn clear">Pulisci</button>
          <button type="button" class="btn close">Chiudi</button>
        </div>
      </div>
    `;
    filterBackdrop = document.createElement('div');
    filterBackdrop.className = 'archive-sheet__backdrop';
    document.body.appendChild(filterSheet);
    document.body.appendChild(filterBackdrop);
    document.body.style.overflow = 'hidden';

    const select = qs('#kind-mobile', filterSheet);
    const btnApply = qs('.btn.apply', filterSheet);
    const btnClear = qs('.btn.clear', filterSheet);
    const btnClose = qs('.btn.close', filterSheet);

    lastFocus = document.activeElement;
    btnClose && btnClose.focus({ preventScroll: true });

    on(btnApply, 'click', () => {
      const k = select.value;
      const u = new URL(location.href);
      if (k) u.searchParams.set('kind', k); else u.searchParams.delete('kind');
      location.href = u.toString();
    });
    on(btnClear, 'click', () => {
      const u = new URL(location.href);
      u.searchParams.delete('kind');
      location.href = u.toString();
    });
    on(btnClose, 'click', closeFilterSheet);
    on(filterBackdrop, 'click', closeFilterSheet);
  };

  // Factory function per creare popover filter (DRY - evita duplicazione)
  const createFilterPopover = () => {
    if (popoverEl) { closePopover(); return; }

    popoverEl = document.createElement('div');
    popoverEl.className = 'filter-popover';
    popoverEl.innerHTML = `
      <ul class="filter-popover__list" role="listbox">
        <li><button type="button" class="filter-popover__item" role="option" data-value="" aria-checked="${!urlKind?'true':'false'}">Tutti</button></li>
        <li><button type="button" class="filter-popover__item" role="option" data-value="video" aria-checked="${urlKind==='video'?'true':'false'}">Video</button></li>
        <li><button type="button" class="filter-popover__item" role="option" data-value="content" aria-checked="${urlKind==='content'?'true':'false'}">Contenuti</button></li>
      </ul>
    `;
    btn.insertAdjacentElement('afterend', popoverEl);
    btn.setAttribute('aria-expanded', TRUE);

    // Click su un filtro - aggiorna URL e naviga
    popoverEl.addEventListener('click', (ev) => {
      const item = ev.target && ev.target.closest('.filter-popover__item');
      if (!item) return;
      const val = (item.getAttribute('data-value') || '').toLowerCase();

      const u = new URL(location.href);
      if (val) u.searchParams.set('kind', val);
      else u.searchParams.delete('kind');
      u.searchParams.delete('p'); // Reset pagina
      location.href = u.toString();
    });

    // Listeners per chiusura (Esc + click esterno)
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKeyDown, true);
  };

  // TOGGLE LOGICA (semplificato - riusa factory)
  on(btn, 'click', (e) => {
    e.preventDefault();
    createFilterPopover(); // Funziona sia su mobile che desktop
  });

  // Submit: riparti da pagina 1
  if (form) on(form, 'submit', () => {
    try { const u = new URL(form.action || window.location.href); u.searchParams.delete('p'); form.action = u.toString(); } catch {}
  });

  // Reset (delegato)
  document.addEventListener('click', (e) => {
    const resetBtn = e.target && e.target.closest('.archive-search__reset');
    if (!resetBtn) return;
    e.preventDefault();
    closePopover();

    const u = new URL(window.location.href);
    u.searchParams.delete('q');
    u.searchParams.delete('p');
    u.searchParams.delete('kind');

    if (qInput) qInput.value = '';
    if (sel)    sel.value = '';

    if (btn) {
      btn.setAttribute('aria-pressed', FALSE);
      btn.classList.remove('is-active');
      btn.setAttribute('aria-expanded', FALSE);
    }
    window.location.href = u.toString();
  });
})();
})();

/* ============================================================
 * Data & Render layer â€” Replica WHERE/ORDER BY/LIMIT/OFFSET del legacy
 * ============================================================ */
(() => {
  'use strict';
  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return;

  // Configurazione paginazione
  const DEFAULT_PAGE_SIZE = 12;       // item per pagina di default
  const MIN_PAGE_SIZE = 5;             // minimo item per pagina consentito
  const MAX_PAGE_SIZE = 24;            // massimo item per pagina consentito
  const ARIA_DESCRIPTION_MAX_CHARS = 60; // max caratteri descrizione in aria-label

  // Configurazione retry fetch
  const FETCH_MAX_RETRIES = 3;         // massimo numero di retry
  const FETCH_INITIAL_DELAY_MS = 1000; // delay iniziale prima del primo retry (ms)
  const FETCH_BACKOFF_MULTIPLIER = 2;  // moltiplicatore per exponential backoff

  // Helpers (Data)
  /** @param {string} sel - Selettore CSS @param {Document|Element} [root=document] - Root element @returns {Element|null} */
  const qs  = (sel, root = document) => root.querySelector(sel);
  /** @param {*} v - Valore da convertire @returns {string} */
  const text = (v) => (v == null ? '' : String(v));
  /** @param {*} v - Valore da convertire in lowercase @returns {string} */
  const lower = (v) => text(v).toLowerCase();
  /** @param {*} v - Valore da trimmare @returns {string} */
  const trim = (v) => text(v).trim();
  /** @returns {URL} */
  const getURL = () => new URL(window.location.href);
  /** @param {string} name - Nome parametro URL @returns {string|null} */
  const getParam = (name) => getURL().searchParams.get(name);
  const LIKE = (haystack, needle) => lower(haystack).includes(lower(needle));
  const isAbsolute = (u) => /^(data:|https?:|\/\/)/i.test(u);
  const getBaseURL = () => {
    const b = (document.documentElement.getAttribute('data-base-url') || '').trim();
    return b.replace(/\/$/, '');
  };
  const toSiteURL = (u) => {
    if (!u) return '';
    if (isAbsolute(u)) return u;
    const base = getBaseURL();
    const clean = String(u).replace(/^\/+/, '');
    return base ? `${base}/${clean}` : `/${clean}`;
  };
  const bustIfLocal = (u, ver) => {
    const src = toSiteURL(u);
    if (!ver) return src;
    const sep = src.includes('?') ? '&' : '?';
    return `${src}${sep}v=${ver}`;
  };
  const buildArchiveEndpoint = (base, version) => {
    const cleanBase = trim(base || '');
    const finalBase = cleanBase || '/archive/list.json';
    const ver = trim(version || '');
    if (!ver) return finalBase;
    try {
      const url = new URL(finalBase, window.location.origin);
      url.searchParams.set('v', ver);
      return url.toString();
    } catch {
      const sep = finalBase.includes('?') ? '&' : '?';
      return `${finalBase}${sep}v=${ver}`;
    }
  };

  // Tag matching flessibile (token + frase)
  const makeTagsCSV = (tagsArr) => {
    const arr = Array.isArray(tagsArr) ? tagsArr : [];
    const csv = arr.map((t) => lower(t)).join(',');
    return `,${csv},`;
  };
  const matchTagsFlexible = (tagsArr, q) => {
    const wrapped = makeTagsCSV(tagsArr);
    const qLower  = lower(q).trim();
    if (!qLower) return false;
    const tokens = qLower.split(/\s+/).filter(Boolean);
    for (let i = 0; i < tokens.length; i++) if (wrapped.includes(tokens[i])) return true;
    if (wrapped.includes(qLower)) return true;
    return false;
  };

  // Pill mapping
  const normalizeBtnVariant = (raw) => {
    const t = lower(trim(raw));
    if (!t) return 'btn--primary';
    const m = t.match(/\\bbtn--[a-z0-9\\-]+\\b/); if (m) { if (m[0] === 'btn--teal') return 'btn--secondary'; if (m[0] === 'btn--base') return 'btn--primary'; if (m[0] === 'btn--gold') return 'btn--accent'; return m[0]; }
    const map = {
      'magenta':'btn--secondary',
      'youtube':'btn--yt','yt':'btn--yt',
      'scryfall':'btn--scry','scry':'btn--scry',
      'edhrec':'btn--edh','edh':'btn--edh',
      'moxfield':'btn--mox','mox':'btn--mox',
      
      'archidekt':'btn--archi','archi':'btn--archi',
      'indigostroke':'btn--base','tealstroke':'btn--base','alphab':'btn--base','acid':'btn--base','pink':'btn--base','orange':'btn--base',
      'teal':'btn--secondary','gold':'btn--accent','accent':'btn--accent',
      'primary':'btn--primary', // Normalizzato con prefisso
      'indigo':'btn--primary','base':'btn--primary','default':'btn--primary',
    };
    const parts = t.split(/\s+/);
    for (const p of parts) if (map[p]) return map[p];
    for (const k in map) if (t.includes(k)) return map[k];
    return 'btn--primary';
  };
  const variantFromUrl = (url) => {
    try {
      const host = new URL(url, window.location.origin).host.toLowerCase();
      if (host.includes('youtube.com') || host.includes('youtu.be')) return 'btn--yt';
      if (host.includes('scryfall.com')) return 'btn--scry';
      if (host.includes('edhrec.com'))   return 'btn--edh';
      if (host.includes('moxfield.com')) return 'btn--mox';
      if (host.includes('archidekt.com'))return 'btn--archi';
    } catch {}
    return null;
  };
  const pillClassFrom = (btnRaw, url) => {
    const raw = trim(btnRaw);

    // Se è già una classe CSS completa (btn--xxx o btn--xxx-yyy), usala così com'è
    if (/^btn--[a-z0-9\-]+$/i.test(raw)) {
      return `btn ${raw} btn--sm`;
    }

    // Altrimenti normalizza keyword legacy (es. "youtube", "teal", ecc.)
    let v = normalizeBtnVariant(raw);
    if (v === 'btn--base') {
      const u = variantFromUrl(url);
      if (u) v = u;
    }
    // Usa sempre btn e btn--sm (non pill)
    return `btn ${v} btn--sm`;
  };
  const pillLabel = (label, url) => {
    const L = trim(label);
    if (L) return L;
    try { const host = new URL(url, window.location.origin).host; return host || 'Apri'; }
    catch { return 'Apri'; }
  };

  // Stato/pager
  const getPage = () => {
    const n = parseInt(getParam('p') || '1', 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };
  const getPageSize = () => {
    const attr = document.documentElement.getAttribute('data-archive-page-size');
    const n = parseInt(attr || String(DEFAULT_PAGE_SIZE), 10);
    return (isNaN(n) ? DEFAULT_PAGE_SIZE : Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, n)));
  };

  // Parametri URL correnti
  const q  = trim(getParam('q') || '');
  const k  = (getParam('kind') || '').toLowerCase().trim();

  // Render item (markup identico)
  const renderItem = (it, index, total) => {
    const idStr = text(it.id);
    const kindClass = lower(text(it.kind) || 'content');
    // Numerazione discendente: primo item = total, ultimo = 1
    const itemNumber = total - index;
    const over  = trim(it.overline || '');
    const tit   = trim(it.title || '');
    const desc  = trim(it.desc || '');
    const content = trim(it.content || ''); // Extended content field

    const appVer = document.documentElement.getAttribute('data-app-ver') || '';
    // Thumbnail for Archive items: reuse 'thumb' field (fallback to placeholder)
    let thumbWeb = trim(it.thumb || '');
    const thumbSrc = bustIfLocal(thumbWeb || 'images/cards/fblthp_placeholder.webp', appVer);

    // Links ordinati e detection robusta del "primary"
    const links = Array.isArray(it.links)
      ? it.links.slice().sort((a,b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
      : [];
  
    // 1) Preferisci link marcato come "primary" in qualsiasi campo di classe
    let primaryIndex = null;
    for (let i = 0; i < links.length; i++) {
      const cls = lower((links[i]?.btn_class || links[i]?.class || '').trim());
      if (cls && /\bprimary\b/i.test(cls)) { primaryIndex = i; break; }
    }
    // 2) Fallback: primo link con href valido
    if (primaryIndex == null) {
      for (let i = 0; i < links.length; i++) {
        const href = trim(links[i]?.href || '');
        if (href) { primaryIndex = i; break; }
      }
    }
    const primaryUrl = (primaryIndex != null && links[primaryIndex])
      ? trim(links[primaryIndex].href || '')
      : '';
    const otherPills = [];
    for (let i = 0; i < links.length; i++) {
      if (i === primaryIndex) continue;
      const L = links[i]; const url = trim(L?.href || ''); if (!url) continue;
      otherPills.push({ url, lab: pillLabel(L?.label || '', url), cls: pillClassFrom(L?.btn_class || '', url) });
    }

    const linksId = `links-${idStr.replace(/[^a-zA-Z0-9_\-]+/g, '-')}`;
    const otherCount = otherPills.length;
    const hasDropdown = (!!desc) || (!!content) || (otherCount > 0);
    const summaryLabel = otherCount > 0 ? `Dettagli e link (${otherCount})` : 'Dettagli';

    // Build expanded panel content with separators
    let panelContent = '';
    if (desc) {
      panelContent += `<p class="item-summary">${desc}</p>`;
    }
    if (content) {
      if (panelContent) panelContent += `<hr class="item-separator">`;
      panelContent += `<div class="item-content-extended">${content}</div>`;
    }
    if (otherCount > 0) {
      if (panelContent) panelContent += `<hr class="item-separator">`;
      // Buttons already have btn--sm class from pillClassFrom
      panelContent += `<div class="item-ctas" role="group" aria-label="Collegamenti">
        ${otherPills.map(P => `<a class="${P.cls}" href="${P.url}" target="_blank" rel="noopener" title="${P.lab}">${P.lab}</a>`).join('')}
      </div>`;
    }

    // Background image support
    let bgImageStyle = '';
    const bgImage = trim(it.background_image || '');
    if (bgImage) {
      const bgImageSrc = bustIfLocal(bgImage, appVer);
      bgImageStyle = ` style="background-image: url('${bgImageSrc}'); background-size: cover; background-position: center;"`;
    }

    const li = document.createElement('li');
    li.className = `archive-item is-${kindClass}`;
    // Imposta il numero come data attribute per il CSS counter
    li.style.setProperty('--item-number', String(itemNumber));
    // Debug: aggiungi anche come data-attribute per verifica
    li.setAttribute('data-item-number', String(itemNumber));

    // Media section with thumbnail and primary button overlay (esattamente come cards)
    let thumbButtonHTML = '';
    if (primaryUrl) {
      if (kindClass === 'video') {
        // Video: SVG play button YouTube
        thumbButtonHTML = `<span class="item-thumb-button" aria-hidden="true">
          <svg class="item-thumb-button-icon" viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg">
            <path class="item-thumb-button-shape" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"></path>
            <path class="item-thumb-button-symbol" d="M 45,24 27,14 27,34"></path>
          </svg>
        </span>`;
      } else {
        // Content: pill button con testo
        thumbButtonHTML = `<span class="item-thumb-button" aria-hidden="true">Apri</span>`;
      }
    }

    const thumbHTML = primaryUrl
      ? `<a class="item-thumb" href="${primaryUrl}" target="_blank" rel="noopener" aria-label="Apri: ${tit}">
           <img src="${thumbSrc}" alt="${tit}" loading="lazy" decoding="async">
           ${thumbButtonHTML}
         </a>`
      : `<figure class="item-thumb">
           <img src="${thumbSrc}" alt="${tit}" loading="lazy" decoding="async">
         </figure>`;

    const mediaHTML = `<div class="item-media">
      ${thumbHTML}
    </div>`;

    // Content section
    const kindLabel = kindClass === 'video' ? 'Video' : 'Contenuto';
    const contentHTML = `<div class="item-content">
      <div class="item-header">
        <div class="item-overline">
          ${over ? `${over}` : ''}
          <span class="item-badge">${kindLabel}</span>
        </div>
        <h2 class="item-title">${tit}</h2>
      </div>
      ${desc ? `<p class="item-desc-preview">${desc}</p>` : ''}
      ${hasDropdown ? `<button class="item-actions-summary" type="button" aria-controls="${linksId}" aria-expanded="false">
        <span class="sr-only">${summaryLabel}</span>
      </button>` : ''}
    </div>`;

    // Costruzione aria-label descrittivo e accessibile (riusa kindLabel già definito)
    const ariaLabel = `Apri ${kindLabel.toLowerCase()}: ${tit}${over ? ' - ' + over : ''}${desc ? '. ' + desc.substring(0, ARIA_DESCRIPTION_MAX_CHARS) + (desc.length > ARIA_DESCRIPTION_MAX_CHARS ? '...' : '') : ''}`;

    li.innerHTML = `
      <article class="item" data-item-id="${idStr}" data-kind="${kindClass}" role="button" tabindex="0" aria-label="${ariaLabel.replace(/"/g, '&quot;')}" ${desc ? `aria-describedby="${linksId}-desc"` : ''}>
        ${mediaHTML}
        ${contentHTML}
      </article>
      ${
        hasDropdown
        ? `<div class="item-panel" id="${linksId}" hidden>
             ${panelContent}
           </div>`
        : ''
      }
    `;
    return li;
  };

  /**
   * Filtra item archivio per query text e tipo (kind)
   * @param {Array<Object>} arr - Array di item archivio
   * @param {string} q - Query di ricerca (cerca in title, overline, desc, tags)
   * @param {string} kind - Tipo item ("video" | "content" | "")
   * @returns {Array<Object>} Array filtrato
   */
  const filterItems = (arr, q, kind) => {
    const Q = lower(q).trim();
    const K = lower(kind);
    return arr.filter((it) => {
      if (K && K !== lower(it.kind || '')) return false;
      if (!Q) return true;
      const inText = LIKE(it.title || '', Q) || LIKE(it.overline || '', Q) || LIKE(it.desc || '', Q);
      const inTags = matchTagsFlexible(it.tags || [], Q);
      return inText || inTags;
    });
  };

  /** @param {string} d - Data string @returns {number} Timestamp o 0 */
  const parseDate = (d) => { const t = Date.parse(d); return isNaN(t) ? 0 : t; };

  /**
   * Ordina item per data (desc) poi per ID (desc)
   * @param {Array<Object>} arr - Array di item
   * @returns {Array<Object>} Array ordinato (copia)
   */
  const sortItems = (arr) => arr.slice().sort((a, b) => {
    const ad = parseDate(a.date), bd = parseDate(b.date);
    if (ad !== bd) return bd - ad;
    const aid = text(a.id), bid = text(b.id);
    return (aid < bid) ? 1 : (aid > bid ? -1 : 0);
  });

  /**
   * Paginazione array con calcolo metadata
   * @param {Array<Object>} arr - Array da paginare
   * @param {number} page - Numero pagina corrente (1-based)
   * @param {number} pageSize - Item per pagina
   * @returns {{total: number, pages: number, page: number, slice: Array<Object>}}
   */
  const paginate = (arr, page, pageSize) => {
    const total = arr.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const p = Math.min(Math.max(1, page), pages);
    const start = (p - 1) * pageSize;
    const end = start + pageSize;
    return { total, pages, page: p, slice: arr.slice(start, end) };
  };

  // Pager & count UI
  const updatePager = (state) => {
    const pager = qs('.archive-pager');
    if (!pager) return;
    const url = getURL();
    const { page, pages } = state;
    const prevA = pager.querySelector('a[rel="prev"]');
    const nextA = pager.querySelector('a[rel="next"]');
    const curr  = pager.querySelector('.curr');

    const setHref = (a, target) => {
      if (!a) return;
      const u = new URL(url);
      u.searchParams.set('p', target);
      const qVal = getParam('q'); const kVal = getParam('kind');
      if (qVal) u.searchParams.set('q', qVal); else u.searchParams.delete('q');
      if (kVal) u.searchParams.set('kind', kVal); else u.searchParams.delete('kind');
      a.href = u.toString();
    };

    const prevDisabled = page <= 1;
    if (prevA) {
      prevA.classList.toggle('disabled', prevDisabled);
      prevA.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false');
      setHref(prevA, prevDisabled ? 1 : (page - 1));
      prevA.rel = 'prev';
    }
    if (curr) curr.textContent = `Pag. ${page} / ${pages}`;
    const nextDisabled = page >= pages;
    if (nextA) {
      nextA.classList.toggle('disabled', nextDisabled);
      nextA.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false');
      setHref(nextA, nextDisabled ? pages : (page + 1));
      nextA.rel = 'next';
    }
  };
  const updateHeroCount = (n) => {
    const strong = qs('.archive-hero .filter-note strong');
    if (strong) strong.textContent = new Intl.NumberFormat('it-IT').format(n);
  };

  // Render lista (confinato nel container Archivio)
  const renderList = (arr) => {
    const sectionArchive = document.querySelector('section.archive');
    if (!sectionArchive) return; // safety
    const container = sectionArchive.querySelector('.container') || sectionArchive;

    // assicurati che esista l'OL
    let listOl = container.querySelector('ol.archive-timeline');
    if (!listOl) {
      listOl = document.createElement('ol');
      listOl.className = 'archive-timeline';
      container.appendChild(listOl);
    }

    // svuota e renderizza
    listOl.innerHTML = '';
    if (!arr.length) {
      // mostra messaggio e rimuovi l'OL
      const p = document.createElement('p');
      p.className = 'empty';
      p.setAttribute('role', 'status');
      p.setAttribute('aria-live', 'polite');
      const qVal = trim(getParam('q') || '');
      p.innerHTML = `Nessun risultato per <em>${qVal}</em>.`;
      listOl.replaceWith(p);
      return;
    } else {
      // se c'Ã¨ un vecchio <p.empty>, rimpiazzalo con un nuovo OL
      const oldEmpty = container.querySelector('p.empty');
      if (oldEmpty) {
        oldEmpty.remove();
        listOl = document.createElement('ol');
        listOl.className = 'archive-timeline';
        container.appendChild(listOl);
      }
    }

    const frag = document.createDocumentFragment();
    const total = arr.length;
    for (let i = 0; i < arr.length; i++) {
      frag.appendChild(renderItem(arr[i], i, total));
    }
    listOl.appendChild(frag);
  };

  // Validazione schema item archivio (robusta)
  const validateArchiveData = (data) => {
    if (!Array.isArray(data)) {
      console.warn('[archive] Data is not an array, expected array of items');
      return [];
    }
    return data.filter((item, idx) => {
      // Validazione campi minimi richiesti
      const hasId = item && (item.id != null);
      const hasTitle = item && (typeof item.title === 'string');
      const hasKind = item && (typeof item.kind === 'string');

      if (!hasId || !hasTitle) {
        console.warn(`[archive] Item at index ${idx} missing required fields (id, title):`, item);
        return false; // Scarta item invalido
      }

      // kind opzionale ma normalizzabile
      if (!hasKind) {
        item.kind = 'content'; // Default fallback
      }

      return true; // Item valido
    });
  };

  /**
   * Fetch con retry automatico e exponential backoff
   * @param {string} url - URL da fetchare
   * @param {RequestInit} options - Opzioni fetch
   * @param {number} retries - Numero di retry rimanenti
   * @returns {Promise<Response>}
   */
  const fetchWithRetry = async (url, options = {}, retries = FETCH_MAX_RETRIES) => {
    try {
      const response = await fetch(url, options);

      // Se la risposta è OK, ritorna
      if (response.ok) return response;

      // Se è un errore client (4xx), non fare retry
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}`);
      }

      // Se è un errore server (5xx) e ci sono retry disponibili, riprova
      if (retries > 0) {
        const delay = FETCH_INITIAL_DELAY_MS * Math.pow(FETCH_BACKOFF_MULTIPLIER, FETCH_MAX_RETRIES - retries);
        console.warn(`[archive] HTTP ${response.status}, retry in ${delay}ms (${retries} attempts left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1);
      }

      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      // Network error o timeout - retry se disponibili
      if (retries > 0 && error.name !== 'AbortError') {
        const delay = FETCH_INITIAL_DELAY_MS * Math.pow(FETCH_BACKOFF_MULTIPLIER, FETCH_MAX_RETRIES - retries);
        console.warn(`[archive] Network error, retry in ${delay}ms (${retries} attempts left):`, error.message);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1);
      }

      throw error;
    }
  };

  // Bootstrap
  const bootstrap = async () => {
    try {
      const appVer = trim(document.documentElement.getAttribute('data-app-ver') || '');
      // Preferisci una versione specifica dei dati (data-archive-ver) per il cache-busting dell'endpoint JSON
      const archiveVer = trim(document.documentElement.getAttribute('data-archive-ver') || '') || appVer;
      const rawEndpoint = (typeof window !== 'undefined' && window.__ARCHIVE_ENDPOINT__ != null)
        ? window.__ARCHIVE_ENDPOINT__
        : '';
      const endpoint = buildArchiveEndpoint(rawEndpoint, archiveVer);
      const res = await fetchWithRetry(endpoint, { credentials: 'same-origin' });

      // Parsing JSON con gestione errori dedicata
      let rawData;
      try {
        rawData = await res.json();
      } catch (parseError) {
        console.error('[archive] JSON parse error:', parseError);
        throw new Error('Dati archivio malformati');
      }

      // Validazione schema
      const data = validateArchiveData(rawData);

      if (data.length === 0 && Array.isArray(rawData) && rawData.length > 0) {
        // Tutti gli item erano invalidi
        throw new Error('Nessun item valido nell\'archivio');
      }

      const pageSize = getPageSize();
      const curPage  = getPage();

      const filtered = filterItems(data, q, k);
      const sorted   = sortItems(filtered);
      const paged    = paginate(sorted, curPage, pageSize);

      updateHeroCount(paged.total);
      renderList(paged.slice);
      updatePager(paged);
    } catch (err) {
      // Gestione errore: mostra messaggio user-friendly
      const sectionArchive = document.querySelector('section.archive');
      if (!sectionArchive) return;
      const container = sectionArchive.querySelector('.container') || sectionArchive;

      const errorMsg = document.createElement('div');
      errorMsg.className = 'archive-error';
      errorMsg.setAttribute('role', 'alert');
      errorMsg.setAttribute('aria-live', 'assertive');
      errorMsg.innerHTML = `
        <p><strong>Impossibile caricare l'archivio.</strong></p>
        <p>Riprova più tardi o <a href="${window.location.origin}">torna alla home</a>.</p>
      `;
      container.appendChild(errorMsg);

      // Log solo in development (se presente flag data-debug)
      if (document.documentElement.hasAttribute('data-debug')) {
        console.error('[archive] dataset error:', err);
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
