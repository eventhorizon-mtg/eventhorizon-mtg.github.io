/**
 * archive/search.js
 * Task 2.4: Search UI with responsive placeholder
 * Extracted from monolithic archive.js
 */

import { qs, mqPhone } from './config.js';

/**
 * Initialize search UI
 * - Updates placeholder text based on viewport size
 * - Mobile: "Cerca" (short)
 * - Desktop: "Cerca per titolo, descrizione, tag" (descriptive)
 */
export function initSearchUI() {
  const form = qs('#archive-search-form');
  if (!form) return;

  const q = qs('#q', form);

  const onMQ = () => {
    if (!q) return;
    q.placeholder = mqPhone.matches ? 'Cerca' : 'Cerca per titolo, descrizione, tag';
  };

  onMQ();
  mqPhone.addEventListener && mqPhone.addEventListener('change', onMQ);
}
