/**
 * /script/archive.js – EventHorizon.mtg (Archivio)
 * Task 2.4: Refactored into ES6 modules for better maintainability
 *
 * Main orchestrator that initializes all archive components:
 * - Bottom-sheet mobile (overlay, focus-trap, drag handle) on mobile (<768px)
 * - Desktop panel expansion in-page on tablet/desktop (≥768px)
 * - Search UI with responsive placeholder
 * - Filter popover (desktop) and sheet (mobile)
 * - Data fetching, filtering, sorting, and rendering
 */

import { initBottomSheet } from './archive/sheet.js';
import { initDesktopPanel, initUnlockScroll } from './archive/panel.js';
import { initSearchUI } from './archive/search.js';
import { initFilter } from './archive/filter.js';
import { bootstrap } from './archive/renderer.js';

(() => {
  'use strict';

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return;

  // Initialize all components
  initBottomSheet();    // Mobile bottom sheet with drag-to-close
  initDesktopPanel();   // Desktop panel toggle on card click
  initUnlockScroll();   // Unlock scroll for tall desktop panels
  initSearchUI();       // Responsive search placeholder
  initFilter();         // Filter popover and reset button

  // Bootstrap data layer (fetch + render)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }
})();
