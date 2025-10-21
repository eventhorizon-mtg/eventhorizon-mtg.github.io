/**
 * Archive Configuration
 * Costanti e configurazione globale per tutti i moduli archive
 * Espone: window.ArchiveConfig
 */

;(() => {
  'use strict'

  window.ArchiveConfig = {
    // Media queries
    MQ_SHEET: '(max-width: 767.98px)', // mobile: sheet (tablet/desktop: pannello in-page)
    MQ_PHONE: '(max-width: 767.98px)', // placeholder breve "Cerca"
    MQ_DESKTOP: '(min-width: 768px)', // desktop layout

    // Boolean constants
    TRUE: 'true',
    FALSE: 'false',

    // Drag & swipe configuration (mobile bottom-sheet)
    DRAG_CLOSE_THRESHOLD_PX: 16, // soglia minima per chiudere sheet con drag
    DRAG_OPACITY_DIVISOR: 300, // divisore per calcolo opacità backdrop durante drag
    HAPTIC_FEEDBACK_CLOSE_MS: 50, // durata vibrazione haptic su chiusura
    HAPTIC_FEEDBACK_SNAP_MS: 10, // durata vibrazione haptic su snap back

    // Pagination configuration
    DEFAULT_PAGE_SIZE: 12, // item per pagina di default
    MIN_PAGE_SIZE: 5, // minimo item per pagina consentito
    MAX_PAGE_SIZE: 24, // massimo item per pagina consentito
    ARIA_DESCRIPTION_MAX_CHARS: 60, // max caratteri descrizione in aria-label

    // Fetch retry configuration
    FETCH_MAX_RETRIES: 3, // massimo numero di retry
    FETCH_INITIAL_DELAY_MS: 1000, // delay iniziale prima del primo retry (ms)
    FETCH_BACKOFF_MULTIPLIER: 2, // moltiplicatore per exponential backoff

    // Desktop panel configuration
    MAX_HEIGHT_COMPRESSED: 320, // Max height iniziale del pannello (deve matchare il CSS)

    // Media Query objects (with polyfill fallback)
    get mqSheet() {
      return window.matchMedia
        ? window.matchMedia(this.MQ_SHEET)
        : { matches: true, addEventListener() {} }
    },

    get mqPhone() {
      return window.matchMedia
        ? window.matchMedia(this.MQ_PHONE)
        : { matches: false, addEventListener() {} }
    },

    get mqDesktop() {
      return window.matchMedia
        ? window.matchMedia(this.MQ_DESKTOP)
        : { matches: false, addEventListener() {} }
    }
  }
})()
