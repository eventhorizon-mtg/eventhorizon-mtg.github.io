/**
 * archive/renderer.js
 * Task 2.4: Data fetching, filtering, sorting, and rendering logic
 * Extracted from monolithic archive.js
 */

import {
  DEBUG,
  qs,
  getURL,
  getParam,
  text,
  lower,
  trim,
  LIKE,
  DEFAULT_PAGE_SIZE,
  MIN_PAGE_SIZE,
  MAX_PAGE_SIZE,
  ARIA_DESCRIPTION_MAX_CHARS,
  FETCH_MAX_RETRIES,
  FETCH_INITIAL_DELAY_MS,
  FETCH_BACKOFF_MULTIPLIER
} from './config.js';

/* ==========================
 * Render-specific Helpers
 * ========================== */

/** Escapes a string for safe HTML display */
const escapeHTML = (str) => text(str).replace(/[&<>"'`]/g, (c) => {
  return ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '`': '&#96;'
  })[c];
});

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
  const m = t.match(/\bbtn--[a-z0-9\-]+\b/); if (m) { if (m[0] === 'btn--teal') return 'btn--secondary'; if (m[0] === 'btn--base') return 'btn--primary'; if (m[0] === 'btn--gold') return 'btn--accent'; return m[0]; }
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
    // Helper to check for exact host or subdomains
    const isHostOrSub = (h, d) => h === d || h.endsWith('.' + d);
    if (isHostOrSub(host, 'youtube.com') || host === 'youtu.be') return 'btn--yt';
    if (isHostOrSub(host, 'scryfall.com')) return 'btn--scry';
    if (isHostOrSub(host, 'edhrec.com'))   return 'btn--edh';
    if (isHostOrSub(host, 'moxfield.com')) return 'btn--mox';
    if (isHostOrSub(host, 'archidekt.com'))return 'btn--archi';
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

  // Helper to escape attribute values for HTML context
  function escapeAttribute(val) {
    return String(val)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  const safeThumbSrc = escapeAttribute(thumbSrc);
  const safeTit = escapeAttribute(tit);
  const safePrimaryUrl = escapeAttribute(primaryUrl);

  const thumbHTML = primaryUrl
    ? `<a class="item-thumb" href="${safePrimaryUrl}" target="_blank" rel="noopener" aria-label="Apri: ${safeTit}">
         <img src="${safeThumbSrc}" alt="${safeTit}" width="720" height="1280" loading="lazy" decoding="async">
         ${thumbButtonHTML}
       </a>`
    : `<figure class="item-thumb">
         <img src="${safeThumbSrc}" alt="${safeTit}" width="720" height="1280" loading="lazy" decoding="async">
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
    p.innerHTML = `Nessun risultato per <em>${escapeHTML(qVal)}</em>.`;
    listOl.replaceWith(p);
    return;
  } else {
    // se c'è un vecchio <p.empty>, rimpiazzalo con un nuovo OL
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
    if (DEBUG) console.warn('[archive] Data is not an array, expected array of items');
    return [];
  }
  return data.filter((item, idx) => {
    // Validazione campi minimi richiesti
    const hasId = item && (item.id != null);
    const hasTitle = item && (typeof item.title === 'string');
    const hasKind = item && (typeof item.kind === 'string');

    if (!hasId || !hasTitle) {
      if (DEBUG) console.warn(`[archive] Item at index ${idx} missing required fields (id, title):`, item);
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
      if (DEBUG) console.warn(`[archive] HTTP ${response.status}, retry in ${delay}ms (${retries} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw new Error(`HTTP ${response.status}`);
  } catch (error) {
    // Network error o timeout - retry se disponibili
    if (retries > 0 && error.name !== 'AbortError') {
      const delay = FETCH_INITIAL_DELAY_MS * Math.pow(FETCH_BACKOFF_MULTIPLIER, FETCH_MAX_RETRIES - retries);
      if (DEBUG) console.warn(`[archive] Network error, retry in ${delay}ms (${retries} attempts left):`, error.message);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1);
    }

    throw error;
  }
};

/**
 * Bootstrap the archive functionality
 * Fetches data, filters, sorts, paginates and renders the archive
 */
export async function bootstrap() {
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
      if (DEBUG) console.error('[archive] JSON parse error:', parseError);
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

    // Parametri URL correnti
    const q  = trim(getParam('q') || '');
    const k  = (getParam('kind') || '').toLowerCase().trim();

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

    // Log solo in development
    if (DEBUG) console.error('[archive] dataset error:', err);
  }
}
