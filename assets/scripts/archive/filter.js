/**
 * archive/filter.js
 * Task 2.4: Filter management with popover (desktop) and sheet (mobile)
 * Extracted from monolithic archive.js
 */

import { qs, on, getParam, TRUE, FALSE } from './config.js';

/**
 * Initialize filter and reset functionality
 * - Desktop: Popover with filter options
 * - Mobile: Bottom sheet with filter options (legacy support)
 * - Reset button clears all filters and search
 */
export function initFilter() {
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
}
