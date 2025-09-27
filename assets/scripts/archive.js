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
    const openers  = qsa('.item .item-actions-summary'); // delega anche dopo render dinamico
    if (!sheet || !backdrop) return; // fail-safe: se manca il backdrop, il modulo non parte

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
        last.focus();
        ev.preventDefault();
      } else if (!ev.shiftKey && document.activeElement === last) {
        first.focus();
        ev.preventDefault();
      }
    };

    const openSheet = (payload) => {
      if (!mqSheet.matches) return; // solo mobile/tablet
      lastFocus = document.activeElement;

      // popola contenuti
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

      // focus management
      sheet.addEventListener('keydown', trapFocus);
      (btnClose || sheet).focus();
    };

    const closeSheet = () => {
      sheet.setAttribute('aria-hidden', 'true');
      backdrop.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('no-scroll');
      sheet.removeEventListener('keydown', trapFocus);
      if (lastFocus && typeof lastFocus.focus === 'function') {
        lastFocus.focus();
      }
    };

    // Click chiusura
    on(btnClose, 'click', closeSheet);
    on(backdrop, 'click', closeSheet);

    // Drag to close (semplice)
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

    // Delego apertura: click su summary dell'item -> apre sheet con contenuto dal pannello
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

    // Chiudi con ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && sheet.getAttribute('aria-hidden') === 'false') {
        closeSheet();
      }
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
      if (!mqSheet.matches) { // desktop
        onDesktopToggle(ev);
      }
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
   * 4) Search Reset + Filter Toggle
   * ========================== */
  (() => {
    // Filter toggle (apre/chiude il select su mobile)
    document.addEventListener('click', (e) => {
      const t = e.target && e.target.closest('.archive-search__filter-toggle');
      if (!t) return;
      e.preventDefault();
      const sel = qs('#kind');
      if (!sel) return;
      const expanded = t.getAttribute('aria-expanded') === TRUE;
      set(t, 'aria-expanded', expanded ? FALSE : TRUE);
      // toggle hidden con attribute
      if (expanded) sel.setAttribute('hidden', '');
      else sel.removeAttribute('hidden');
    });

    // Reset: unica sorgente di verità (delegato, robusto)
    document.addEventListener('click', (e) => {
      const btn = e.target && e.target.closest('.archive-search__reset');
      if (!btn) return;
      e.preventDefault();

      const u = new URL(window.location.href);
      u.searchParams.delete('q');
      u.searchParams.delete('p');
      u.searchParams.delete('kind');

      // Pulisce i campi del form se presenti
      const form  = qs('.archive-search__form');
      const q     = qs('#q', form || document);
      const kind  = qs('#kind', form || document);
      if (q)    q.value = '';
      if (kind) kind.value = '';

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

  // Helpers locali (non interferiscono col blocco esistente)
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const text = (v) => (v == null ? '' : String(v));
  const lower = (v) => text(v).toLowerCase();
  const trim = (v) => text(v).trim();

  const getURL = () => new URL(window.location.href);
  const getParam = (name) => getURL().searchParams.get(name);

  const LIKE = (haystack, needle) => lower(haystack).includes(lower(needle));

  // Emula il matching tag “flessibile” del legacy (token + frase intera)
  // list.archivelist.json esporta "tags": [] => normalizzo in CSV per emulare CONCAT(',', lower(tags_csv), ',')
  const makeTagsCSV = (tagsArr) => {
    const arr = Array.isArray(tagsArr) ? tagsArr : [];
    const csv = arr.map((t) => lower(t)).join(',');
    return `,${csv},`; // wrapped
  };
  const matchTagsFlexible = (tagsArr, q) => {
    const wrapped = makeTagsCSV(tagsArr);     // ",foo,bar baz,"
    const qLower  = lower(q).trim();
    if (!qLower) return false;

    // tokenizzazione (spazio) + frase intera
    const tokens = qLower.split(/\s+/).filter(Boolean);

    // Per ogni token: match entro singolo tag (LIKE) + fallback plain (qui è equivalente)
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      // entro “singolo tag”: basta LIKE su wrapped (emulazione)
      if (wrapped.includes(tok)) return true;
    }

    // Fallback: frase intera
    if (wrapped.includes(qLower)) return true;

    return false;
  };

  // Mappatura classi pill come nel legacy
  const normalizeBtnVariant = (raw) => {
    const t = lower(trim(raw));
    if (!t) return 'btn--base';
    // già valorizzato? es. "btn--yt"
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

  const isAbsolute = (u) => /^(data:|https?:|\/\/)/i.test(u);
  const bustIfLocal = (u, ver) => (isAbsolute(u) ? u : (u + (ver ? `?v=${ver}` : '')));

  // Stato/pager
  const getPage = () => {
    const n = parseInt(getParam('p') || '1', 10);
    return isNaN(n) || n < 1 ? 1 : n;
  };
  const PAGE_SIZE_DEFAULT = 12;

  // Se c’è un data attr o una var globale, usiamola, altrimenti fallback 12
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
  const listOl         = qs('ol.archive-timeline', sectionArchive) || (() => {
    const ol = document.createElement('ol');
    ol.className = 'archive-timeline';
    const container = qs('.container', sectionArchive) || sectionArchive;
    container.appendChild(ol);
    return ol;
  })();

  const heroCount = qs('.archive-hero .filter-note strong');
  const pager     = qs('.archive-pager');
  const prevA     = pager ? qs('a[rel="prev"]', pager) : null;
  const nextA     = pager ? qs('a[rel="next"]', pager) : null;
  const currSpan  = pager ? qs('.curr', pager) : null;

  // Parametri URL
  const qRaw  = getParam('q') || '';
  const q     = trim(qRaw);
  const kind  = lower(trim(getParam('kind') || ''));

  // Leggi appVer (se presente) per cache-busting
  const appVer = document.documentElement.getAttribute('data-app-ver') || '';

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
    const thumbSrc = bustIfLocal(thumbWeb || '/assets/cards/fblthp_placeholder.webp', appVer);

    // Links
    const links = Array.isArray(it.links) ? it.links.slice().sort((a,b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)) : [];

    // primary via token dentro btn_class (come legacy)
    let primaryIndex = null;
    for (let i = 0; i < links.length; i++) {
      const raw = lower(links[i]?.btn_class || '');
      if (raw && /\bprimary\b/.test(raw)) { primaryIndex = i; break; }
    }
    const primaryUrl = (primaryIndex != null) ? trim(links[primaryIndex].href || '') : '';

    // pills (tutte le altre)
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

    // aria-controls id
    const linksId = `links-${idStr.replace(/[^a-zA-Z0-9_\-]+/g, '-')}`;

    // hasDropdown
    let otherCount = otherPills.length;
    let hasDropdown = (!!desc) || (otherCount > 0);
    let summaryLabel = (otherCount > 0) ? `Dettagli e link (${otherCount})` : 'Dettagli';

    // Regola: se c'è primary -> niente pill sul thumb; sheet solo per la descrizione/pills extra
    if (primaryUrl) {
      // manteniamo comunque pills extra nel dropdown
      hasDropdown = (!!desc) || (otherCount > 0);
      summaryLabel = (otherCount > 0) ? `Dettagli e link (${otherCount})` : 'Dettagli';
    }

    // Costruzione DOM
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
  const parseDate = (d) => {
    const t = Date.parse(d);
    return isNaN(t) ? 0 : t;
  };
  const sortItems = (arr) => {
    return arr.slice().sort((a, b) => {
      const ad = parseDate(a.date), bd = parseDate(b.date);
      if (ad !== bd) return bd - ad; // desc
      const aid = text(a.id), bid = text(b.id);
      return (aid < bid) ? 1 : (aid > bid ? -1 : 0); // id DESC
    });
  };

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

    // prev
    const prevDisabled = page <= 1;
    if (prevA) {
      prevA.classList.toggle('disabled', prevDisabled);
      prevA.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false');
      setHref(prevA, prevDisabled ? 1 : (page - 1));
      prevA.rel = 'prev';
    }
    // curr
    if (currSpan) currSpan.textContent = `Pag. ${page} / ${pages}`;
    // next
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
    const sectionArchive = qs('section.archive');
    let listOl = qs('ol.archive-timeline', sectionArchive);
    if (!listOl) {
      listOl = document.createElement('ol');
      listOl.className = 'archive-timeline';
      const container = qs('.container', sectionArchive) || sectionArchive;
      container.appendChild(listOl);
    }

    // Svuota OL
    listOl.innerHTML = '';
    if (!arr.length) {
      const p = document.createElement('p');
      p.className = 'empty';
      p.setAttribute('role', 'status');
      p.setAttribute('aria-live', 'polite');
      const qVal = trim(getParam('q') || '');
      p.innerHTML = `Nessun risultato per <em>${qVal}</em>.`;
      // Sostituisci l'OL con il messaggio
      listOl.replaceWith(p);
      return;
    } else {
      // Se era stato sostituito da <p.empty>, ripristina OL (no-op se già presente)
      const existingEmpty = qs('p.empty', sectionArchive);
      if (existingEmpty) {
        existingEmpty.remove();
        const newOl = document.createElement('ol');
        newOl.className = 'archive-timeline';
        const container = qs('.container', sectionArchive) || sectionArchive;
        container.appendChild(newOl);
        listOl = newOl;
      }
    }
    // Append items
    const frag = document.createDocumentFragment();
    for (const it of arr) frag.appendChild(renderItem(it));
    listOl.appendChild(frag);
  };

  // Bootstrap: fetch dati, filtra, pagina, render
  const bootstrap = async () => {
    try {
      const appVer = document.documentElement.getAttribute('data-app-ver') || '';
      const ver = appVer ? `?v=${appVer}` : '';
      const res = await fetch(`/archive/list.json${ver}`, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json(); // [{id, kind, date, title, overline, desc, thumb, tags, links}]
      const pageSize = getPageSize();
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

  // Avvio appena possibile
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
