/**
 * archive/config.js
 * Configuration constants for archive page
 */

// DEBUG flag: enable console logs only on localhost or with ?debug=1
export const DEBUG = location.hostname === 'localhost' || location.search.includes('debug=1');

// UI Constants
export const MQ_SHEET = '(max-width: 767.98px)';  // mobile: sheet (tablet/desktop: pannello in-page)
export const MQ_PHONE = '(max-width: 767.98px)';  // placeholder breve "Cerca"

export const TRUE = 'true';
export const FALSE = 'false';

// Drag & swipe config (mobile bottom-sheet)
export const DRAG_CLOSE_THRESHOLD_PX = 16;    // soglia minima per chiudere sheet con drag
export const DRAG_OPACITY_DIVISOR = 300;      // divisore per calcolo opacità backdrop durante drag
export const HAPTIC_FEEDBACK_CLOSE_MS = 50;   // durata vibrazione haptic su chiusura
export const HAPTIC_FEEDBACK_SNAP_MS = 10;    // durata vibrazione haptic su snap back

// Pagination
export const DEFAULT_PAGE_SIZE = 12;          // item per pagina di default
export const MIN_PAGE_SIZE = 5;               // minimo item per pagina consentito
export const MAX_PAGE_SIZE = 24;              // massimo item per pagina consentito
export const ARIA_DESCRIPTION_MAX_CHARS = 60; // max caratteri descrizione in aria-label

// Fetch config (retry logic with exponential backoff)
export const FETCH_MAX_RETRIES = 3;           // massimo numero di retry
export const FETCH_INITIAL_DELAY_MS = 1000;   // delay iniziale prima del primo retry (ms)
export const FETCH_BACKOFF_MULTIPLIER = 2;    // moltiplicatore per exponential backoff

// Helper functions
export const qs = (sel, root = document) => root.querySelector(sel);
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));
export const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);
export const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
export const set = (el, name, val) => el && el.setAttribute(name, String(val));
export const trim = (str) => (str || '').trim();
export const lower = (str) => (str || '').toLowerCase();
export const text = (val) => String(val ?? '');
export const LIKE = (haystack, needle) => lower(haystack).includes(lower(needle));

// Media Query Listeners
export const mqSheet = window.matchMedia ? window.matchMedia(MQ_SHEET) : { matches: true, addEventListener(){} };
export const mqPhone = window.matchMedia ? window.matchMedia(MQ_PHONE) : { matches: false, addEventListener(){} };

// URL Utilities
export const getURL = () => new URL(window.location.href);
export const getParam = (name) => getURL().searchParams.get(name);
