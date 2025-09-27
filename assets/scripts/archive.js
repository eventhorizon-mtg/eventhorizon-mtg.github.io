/**
 * /script/archive.js — EventHorizon.mtg (Archivio)
 * - Bottom-sheet mobile (overlay, focus-trap, drag handle)
 * - Chevron: sheet su mobile, pannello full-width su desktop
 * - Search: reset e placeholder responsive
 * - Filter mobile: mostra il select (non applica subito); bottone attivo se kind ≠ ""
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

  const mqSheet = window.matchMedia ? window.matchMedia(MQ_SHEET) : { matches: true, addEventListener(){} };
  const mqPhone = window.matchMedia ? window.matchMedia(MQ_PHONE) : { matches: false, addEventListener(){} };

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

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

    const trapFocus = (ev) => {
      if (ev.key !== 'Tab') return;
      const focusables = qsa('a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])', sheet)
        .filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true');
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last  = focusables[focusables.length - 1];

      if (ev.shiftKey && document.activeElement === first) {
        last.focus(); ev.preventDefault();
      } else if (!ev.shiftKey && document.activeElement === last) {
        first.focus(); ev.preventDefault();
      }
    };

    const openSheet = (payload) => {
      if (!mqSheet.matches) return; // solo mobile/tablet
      lastFocus = document.activeElement;

      // contenuti
      titleEl.textContent = payload.title || '';
      content.innerHTML   = payload.descHtml || '';
      ctas.innerHTML      = '';
      (payload.links || []).forEach(link => {
        const a = document.createElement('a');
        a.className = link.cls || 'pill btn--base';
        a.href      = link.url;
        a.target    = '_blank';
        a.rel       = 'noopener';
        a.title     = link.lab || 'Apri';
        a.textContent = link.lab || 'Apri';
        ctas.appendChild(a);
      });

      sheet.setAttribute('aria-hidden', 'false');
      backdrop.setAttribute('aria-hidden', 'false');
      document.body.classList.add('no-scroll');

      sheet.addEventListener('keydown', trapFocus);
      (btnClose || sheet).focus();
    };

    const closeSheet = () => {
      sheet.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      sheet.removeEventListener('keydown', trapFocus);
      if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
    };

    on(btnClose, 'click', closeSheet);
    on(backdrop, 'click', closeSheet);

    // Drag to close
    let startY = null, lastY = null;
    const onStart = (e) => { startY = (e.touches ? e.touches[0].clientY : e.clientY); lastY = startY; };
    const onMove  = (e) => { if (startY == null) return; lastY = (e.touches ? e.touches[0].clientY : e.clientY); };
    const onEnd   = () => {
      if (startY != null && lastY != null && (lastY - startY) > 60) closeSheet();
      startY = lastY = null;
    };
    on(handle, 'mousedown', onStart);
    on(handle, 'mousemove', onMove);
    on(handle, 'mouseup',   onEnd);
    on(handle, 'touchstart', onStart, { passive: true });
    on(handle, 'touchmove',  onMove,  { passive: true });
    on(handle, 'touchend',   onEnd);

    // Delego apertura: click su summary dell'item -> apri sheet (mobile)
    document.addEventListener('click', (ev) => {
      const btn = ev.target && ev.target.closest('.item-actions-summary');
      if (!btn || !mqSheet.matches) return;

      const article = btn.closest('.item');
      const li = article && article.closest('.archive-item');
      if (!li) return;

      const panel = li.querySelector('.item-panel');
      const desc  = panel ? panel.querySelector('.item-summary') : null;
      const ctaEls = panel ? qsa('.item-ctas a', panel) : [];
      const title = article.querySelector('.item-title')?.textContent || '';

      const links = ctaEls.map(a => ({
        url: a.getAttribute('href'),
        lab: a.textContent.trim(),
        cls: a.className
      }));

      openSheet({
        title,
        descHtml: desc ? `<p class="item-summary">${desc.textContent}</p>` : '',
        links
      });
      ev.preventDefault();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.getAttribute('aria-hidden') === 'false') closeSheet();
    });
  })();

  /* ==========================
   * 2) Pannello desktop (in-row)
   * ========================== */
  (() => {
    const onDesktopToggle = (ev) => {
      if (mqSheet.matches) return; // solo desktop
      const item = ev.target && ev.target.closest('.item');
      if (!item) return;
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

    document.addEventListener('click', (ev) => {
      const btn = ev.target && ev.target.closest('.item-actions-summary');
      if (!btn) return;
      if (!mqSheet.matches) onDesktopToggle(ev);
    });
  })();

  /* ==========================
   * 3) Search UI (placeholder responsive)
   * ========================== */
  (() => {
    const form = qs('#archive-search-form');
    if (!form) return;
    const q = qs('#q', form);
    const onMQ = () => {
      if (!q) return;
      q.placeholder = mqPhone.matches
        ? 'Cerca'
        : 'Cerca per titolo, descrizione o tag…';
    };
    onMQ();
    mqPhone.addEventListener && mqPhone.addEventListener('change', onMQ);
  })();

  /* ==========================
   * 4) Search Reset + Filter Toggle (mobile)
   * ========================== */
  (() => {
    const form   = qs('#archive-search-form');
    const qInput = qs('#q', form || document);
    const sel    = qs('#kind', form || document);
    const btn    = qs('.archive-search__filter-toggle', form || document);

    // Stato iniziale del bottone filtro (in base alla URL)
    const initFilterButtonState = () => {
      if (!btn || !sel) return;
      const urlKind = (getParam('kind') || '').toLowerCase();
      // sincronizza select con URL
      if (urlKind === 'video' || urlKind === 'content') sel.value = urlKind;
      else sel.value = '';
      const active = sel.value !== '';
      btn.setAttribute('aria-pressed', active ? TRUE : FALSE);
      btn.classList.toggle('is-active', active);
      // sincronizza q visivamente
      if (qInput) qInput.value = getParam('q') || '';
    };
    initFilterButtonState();

    // Filter toggle (mobile-first): mostra il select (non applica subito)
    document.addEventListener('click', (e) => {
      const t = e.target && e.target.closest('.archive-search__filter-toggle');
      if (!t) return;
      e.preventDefault();

      if (!sel) return;
      const isMobile = mqSheet.matches;

      if (isMobile) {
        // Apri/chiudi come menù: mostra il select e focus
        const willOpen = t.getAttribute('aria-expanded') !== TRUE;
        t.setAttribute('aria-expanded', willOpen ? TRUE : FALSE);
        if (willOpen) {
          sel.removeAttribute('hidden');
          sel.style.display = 'block';      // robusto rispetto a display:none nel CSS
          sel.focus({ preventScroll: true });
        } else {
          sel.setAttribute('hidden', '');
          sel.style.display = '';
        }
      } else {
        // Su desktop puoi semplicemente lasciare il select visibile (no-op)
        // oppure togglarlo come in mobile se desideri lo stesso comportamento.
        const willOpen = t.getAttribute('aria-expanded') !== TRUE;
        t.setAttribute('aria-expanded', willOpen ? TRUE : FALSE);
        if (willOpen) {
          sel.removeAttribute('hidden');
          sel.style.display = '';
          sel.focus({ preventScroll: true });
        } else {
          sel.setAttribute('hidden', '');
          sel.style.display = '';
        }
      }
    });

    // Alla selezione di un valore, NON applica subito:
    // - chiude il menù su mobile/tablet
    // - aggiorna lo stato del bottone (attivo se kind ≠ "")
    document.addEventListener('change', (e) => {
      if (!sel) return;
      const isKind = e.target && e.target === sel;
      if (!isKind) return;

      const isMobile = mqSheet.matches;
      if (isMobile) {
        const t = btn;
        if (t) {
          t.setAttribute('aria-expanded', FALSE);
        }
        sel.setAttribute('hidden', '');
        sel.style.display = '';
      }

      const active = sel.value !== '';
      if (btn) {
        btn.setAttribute('aria-pressed', active ? TRUE : FALSE);
        btn.classList.toggle('is-active', active);
      }
      // Non navighiamo: l'applicazione avviene alla submit del form
    });

    // Submit del form: rimuovi sempre 'p' per ripartire dalla pagina 1
    if (form) {
      on(form, 'submit', (e) => {
        // Lasciamo che il browser costruisca l'URL con i soli campi del form.
        // (Non includerà 'p' se non c'è un input 'p' nel form)
        // Qui possiamo comunque ripulire la URL corrente per sicurezza:
        try {
          const u = new URL(form.action || window.location.href);
          // NB: non forziamo 'kind', 'q': li invia il form
          u.searchParams.delete('p');
          form.action = u.toString();
        } catch {}
      });
    }

    // Reset: unica sorgente di verità (delegato, robusto)
    document.addEventListener('click', (e) => {
      const resetBtn = e.target && e.target.closest('.archive-search__reset');
      if (!resetBtn) return;
      e.preventDefault();

      const u = new URL(window.location.href);
      u.searchParams.delete('q');
      u.searchParams.delete('p');
      u.searchParams.delete('kind');

      // Pulisce i campi del form se presenti
      if (qInput) qInput.value = '';
      if (sel)    sel.value = '';

      // Aggiorna stato bottone filtro
      if (btn) {
        btn.setAttribute('aria-pressed', FALSE);
        btn.classList.remove('is-active');
        btn.setAttribute('aria-expanded', FALSE);
      }
      // Naviga alla versione "pulita" della pagina
      window.location.href = u.toString();
    });
  })();
})();

/* ============================================================
 * /script/archive.js — Data & Render layer (append non invasivo)
 * Replica WHERE/ORDER BY/LIMIT/OFFSET del legacy (PHP+DB)
 * ============================================================ */
(() => {
  'use strict';

  // Helpers locali
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const text = (v) => (v == null ? '' : String(v));
  const lower = (v) => text(v).toLowerCase();
  const trim = (v) => text(v).trim();
  const getURL = () => new URL(window.location.href);
  const getParam = (name) => getURL().searchParams.get(name);
  const LIKE = (haystack, needle) => lower(haystack).includes(lower(needle));
  const isAbsolute = (u) => /^(data:|https?:|\/\/)/i.test(u);
  const bustIfLocal = (u, ver) => (isAbsolute(u) ? u : (u + (ver ? `?v=${ver}` : '')));

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
    for (let i = 0; i < tokens.length; i++) {
      if (wrapped.includes(tokens[i])) return true;
    }
    if (wrapped.includes(qLower)) return true;
    return false;
  };

  // Pill mapping (come legacy)
  const normalizeBtnVariant = (raw) => {
    const t = lower(trim(raw));
    if (!t) return 'btn--base';
    const m = t.match(/\bbtn--[a-z0-9\-]+\b/);
    if (m) return m[0];
    const map = {
      'youtube': 'btn--yt', 'yt': 'btn--yt',
      'scryfall': 'btn--scry', 'scry': 'btn--scry',
      'edhrec': 'btn--edh', 'edh': 'btn--edh',
      'moxfield': 'btn--mox', 'mox': 'btn--mox',
      'archidekt': 'btn--archi', 'archi': 'btn--archi',
      'teal': 'btn--teal', 'gold': 'btn--gold',
      'primary': 'primary',
      'indigo': 'btn--base', 'base': 'btn--base', 'default': 'btn--base',
    };
    const parts = t.split(/\s+/);
    for (const p of parts) if (map[p]) return map[p];
    for (const k in map) if (t.includes(k)) return map[k];
    return 'btn--base';
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
    let v = normalizeBtnVariant(btnRaw);
    if (v === 'btn--base') {
      const fromUrl = variantFromUrl(url);
      if (fromUrl) v = fromUrl;
    }
    return `pill ${v}`;
  };
  const pillLabel = (label, url) => {
    const L = trim(label);
    if (L) return L;
    try {
      const host = new URL(url, window.location.origin).host;
      return host || 'Apri';
    } catch { return 'Apri'; }
  };

  // Stato/pager
  const getPage = () => {
    const n = parseInt(getParam('p') || '1', 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };
  const PAGE_SIZE_DEFAULT = 12;
  const getPageSize = () => {
    const rootAttr = document.documentElement.getAttribute('data-archive-page-size');
    if (rootAttr) {
      const n = parseInt(rootAttr, 10);
      if (!isNaN(n) && n > 0 && n <= 24) return n;
    }
    if (window.__ARCHIVE_PAGE_SIZE__ && Number.isInteger(window.__ARCHIVE_PAGE_SIZE__)) {
      return Math.max(5, Math.min(24, window.__ARCHIVE_PAGE_SIZE__));
    }
    return PAGE_SIZE_DEFAULT;
  };

  // Elementi DOM essenziali
  const sectionArchive = qs('section.archive');
  const ensureList = () => {
    let ol = qs('ol.archive-timeline', sectionArchive);
    if (!ol) {
      ol = document.createElement('ol');
      ol.className = 'archive-timeline';
      const container = qs('.container', sectionArchive) || sectionArchive;
      container.appendChild(ol);
    }
    return ol;
  };

  // Parametri URL
  const qRaw  = getParam('q') || '';
  const q     = trim(qRaw);
  const kind  = lower(trim(getParam('kind') || ''));

  // Sincronizza form UI (q/kind) e bottone filtro
  const syncFormUI = () => {
    const form   = qs('#archive-search-form');
    const qInput = qs('#q', form || document);
    const sel    = qs('#kind', form || document);
    const btn    = qs('.archive-search__filter-toggle', form || document);

    if (qInput) qInput.value = q;
    if (sel) {
      if (kind === 'video' || kind === 'content') sel.value = kind;
      else sel.value = '';
    }
    if (btn && sel) {
      const active = sel.value !== '';
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-expanded', 'false');
    }
  };

  // Render di un singolo item (markup identico al template)
  const renderItem = (it) => {
    const idStr = text(it.id);
    const kindClass = lower(text(it.kind) || 'content');
    const over  = trim(it.overline || '');
    const tit   = trim(it.title || '');
    const desc  = trim(it.desc || '');

    // Thumb
    let thumbWeb = trim(it.thumb || '');
    if (thumbWeb && !isAbsolute(thumbWeb)) thumbWeb = '/' + thumbWeb.replace(/^\/+/, '');
    const appVer = document.documentElement.getAttribute('data-app-ver') || '';
    const thumbSrc = bustIfLocal(thumbWeb || '/assets/cards/fblthp_placeholder.webp', appVer);

    // Links
    const links = Array.isArray(it.links) ? it.links.slice().sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : [];

    // primary via token dentro btn_class
    let primaryIndex = null;
    for (let i = 0; i < links.length; i++) {
      const raw = lower(links[i]?.btn_class || '');
      if (raw && /\bprimary\b/.test(raw)) { primaryIndex = i; break; }
    }
    const primaryUrl = (primaryIndex != null) ? trim(links[primaryIndex].href || '') : '';

    // pills extra
    const otherPills = [];
    for (let i = 0; i < links.length; i++) {
      if (i === primaryIndex) continue;
      const L = links[i];
      const url = trim(L?.href || '');
      if (!url) continue;
      otherPills.push({
        url,
        lab: pillLabel(L?.label || '', url),
        cls: pillClassFrom(L?.btn_class || '', url),
      });
    }

    const linksId = `links-${idStr.replace(/[^a-zA-Z0-9_\-]+/g, '-')}`;
    let otherCount = otherPills.length;
    let hasDropdown = (!!desc) || (otherCount > 0);
    let summaryLabel = (otherCount > 0) ? `Dettagli e link (${otherCount})` : 'Dettagli';

    if (primaryUrl) {
      hasDropdown = (!!desc) || (otherCount > 0);
      summaryLabel = (otherCount > 0) ? `Dettagli e link (${otherCount})` : 'Dettagli';
    }

    const li = document.createElement('li');
    li.className = `archive-item is-${kindClass}`;
    li.innerHTML = `
      <article class="item" data-item-id="${idStr}" data-kind="${kindClass}">
        <header class="item-head">
          ${over ? `<p class="item-overline">${over}</p>` : ''}
          <h2 class="item-title">${tit}</h2>
        </header>
        ${
          primaryUrl
          ? `<a class="item-thumb${primaryUrl && /\bprimary\b/.test(lower(links[primaryIndex]?.btn_class || '')) ? ' primary' : ''}"
                href="${primaryUrl}" target="_blank" rel="noopener" aria-label="Apri: ${tit}">
               <img src="${thumbSrc}" alt="Anteprima: ${tit}" loading="lazy" decoding="async">
             </a>`
          : `<figure class="item-thumb">
               <img src="${thumbSrc}" alt="Anteprima: ${tit}" loading="lazy" decoding="async">
             </figure>`
        }
        ${ hasDropdown
            ? `<button class="item-actions-summary" type="button" aria-controls="${linksId}" aria-expanded="false">
                 <span class="sr-only">${summaryLabel}</span>
               </button>`
            : ''
        }
      </article>
      ${
        hasDropdown
        ? `<div class="item-panel" id="${linksId}" hidden>
             ${desc ? `<div class="item-descbar"><p class="item-summary">${desc}</p></div>` : ''}
             ${otherCount > 0
                ? `<div class="item-ctas" role="group" aria-label="Collegamenti">
                     ${otherPills.map(P => (
                       `<a class="${P.cls}" href="${P.url}" target="_blank" rel="noopener" title="${P.lab}">${P.lab}</a>`
                    )).join('')}
                   </div>`
                : ''
             }
           </div>`
        : ''
      }
    `;
    return li;
  };

  // Filtro come nel legacy
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

  // Ordinamento legacy: date DESC, id DESC
  const parseDate = (d) => { const t = Date.parse(d); return isNaN(t) ? 0 : t; };
  const sortItems = (arr) => arr.slice().sort((a, b) => {
    const ad = parseDate(a.date), bd = parseDate(b.date);
    if (ad !== bd) return bd - ad;
    const aid = text(a.id), bid = text(b.id);
    return (aid < bid) ? 1 : (aid > bid ? -1 : 0);
  });

  // Paginazione
const paginate = (arr, page, pageSize) => {
  const total = arr.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const p = Math.min(Math.max(1, page), pages);
  const start = (p - 1) * pageSize;
  const end = start + pageSize;
  return { total, pages, page: p, slice: arr.slice(start, end) };
};

  // Pager UI
  const updatePager = (state) => {
    const pager = qs('.archive-pager');
    if (!pager) return;

    const url = getURL();
    const { page, pages } = state;

    const prevA = qs('a[rel="prev"]', pager);
    const nextA = qs('a[rel="next"]', pager);
    const currSpan = qs('.curr', pager);

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
    if (currSpan) currSpan.textContent = `Pag. ${page} / ${pages}`;
    const nextDisabled = page >= pages;
    if (nextA) {
      nextA.classList.toggle('disabled', nextDisabled);
      nextA.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false');
      setHref(nextA, nextDisabled ? pages : (page + 1));
      nextA.rel = 'next';
    }
  };

  const updateHeroCount = (n) => {
    const heroCount = qs('.archive-hero .filter-note strong');
    if (heroCount) heroCount.textContent = new Intl.NumberFormat('it-IT').format(n);
  };

  // Render lista
  const renderList = (arr) => {
    let listOl = ensureList();
    // Svuota OL
    listOl.innerHTML = '';
    if (!arr.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.setAttribute('role', 'status');
      p.setAttribute('aria-live', 'polite');
      const qVal = trim(getParam('q') || '');
      p.innerHTML = `Nessun risultato per <em>${qVal}</em>.`;
      listOl.replaceWith(p);
      return;
    } else {
      const sectionArchive = qs('section.archive');
      const existingEmpty = qs('p.empty', sectionArchive);
      if (existingEmpty) {
        existingEmpty.remove();
        listOl = ensureList();
      }
    }
    // Append items
    const frag = document.createDocumentFragment();
    for (const it of arr) frag.appendChild(renderItem(it));
    listOl.appendChild(frag);
  };

  // Bootstrap
  const bootstrap = async () => {
    try {
      // Sync UI form con query attuale
      syncFormUI();

      const appVer = document.documentElement.getAttribute('data-app-ver') || '';
      const ver = appVer ? `?v=${appVer}` : '';
      const res = await fetch(`/archive/list.json${ver}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // [{id, kind, date, title, overline, desc, thumb, tags, links}]
      const pageSize = (() => {
        const attr = document.documentElement.getAttribute('data-archive-page-size');
        const n = parseInt(attr || '12', 10);
        return (isNaN(n) ? 12 : Math.max(5, Math.min(24, n)));
      })();
      const curPage  = getPage();

      const filtered = filterItems(data, q, kind);
      const sorted   = sortItems(filtered);
      const paged    = paginate(sorted, curPage, pageSize);

      updateHeroCount(paged.total);
      renderList(paged.slice);
      updatePager(paged);
    } catch (err) {
      console.error('[archive] dataset error:', err);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
