/**
 * Archive Bootstrap
 * Entry point che orchestra tutti i moduli archive
 * Espone: window.ArchiveBootstrap
 */

;(() => {
  'use strict'

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return

  // Import dependencies from global namespaces
  const { trim, getParam } = window.ArchiveShared
  const { buildArchiveEndpoint } = window.ArchiveShared
  const {
    getPageSize,
    getPage,
    filterItems,
    sortItems,
    paginate,
    validateArchiveData,
    fetchWithRetry
  } = window.ArchiveData
  const { renderList, updatePager, updateHeroCount } = window.ArchiveRenderer

  // DEBUG flag: enable console logs only on localhost or with ?debug=1
  const DEBUG = location.hostname === 'localhost' || location.search.includes('debug=1')

  // Extract URL params for search and filter
  const q = trim(getParam('q') || '')
  const k = (getParam('kind') || '').toLowerCase().trim()

  /**
   * Bootstrap function - orchestrates data fetching, filtering, sorting, and rendering
   */
  const bootstrap = async () => {
    try {
      const appVer = trim(document.documentElement.getAttribute('data-app-ver') || '')
      // Preferisci una versione specifica dei dati (data-archive-ver) per il cache-busting dell'endpoint JSON
      const archiveVer =
        trim(document.documentElement.getAttribute('data-archive-ver') || '') || appVer
      const rawEndpoint =
        typeof window !== 'undefined' && window.__ARCHIVE_ENDPOINT__ != null
          ? window.__ARCHIVE_ENDPOINT__
          : ''
      const endpoint = buildArchiveEndpoint(rawEndpoint, archiveVer)
      const res = await fetchWithRetry(endpoint, { credentials: 'same-origin' })

      // Parsing JSON con gestione errori dedicata
      let rawData
      try {
        rawData = await res.json()
      } catch (parseError) {
        if (DEBUG) console.error('[archive] JSON parse error:', parseError)
        throw new Error('Dati archivio malformati')
      }

      // Validazione schema
      const data = validateArchiveData(rawData)

      if (data.length === 0 && Array.isArray(rawData) && rawData.length > 0) {
        // Tutti gli item erano invalidi
        throw new Error("Nessun item valido nell'archivio")
      }

      const pageSize = getPageSize()
      const curPage = getPage()

      const filtered = filterItems(data, q, k)
      const sorted = sortItems(filtered)
      const paged = paginate(sorted, curPage, pageSize)

      updateHeroCount(paged.total)
      renderList(paged.slice)
      updatePager(paged)
    } catch (err) {
      // Gestione errore: mostra messaggio user-friendly
      const sectionArchive = document.querySelector('section.archive')
      if (!sectionArchive) return
      const container = sectionArchive.querySelector('.container') || sectionArchive

      const errorMsg = document.createElement('div')
      errorMsg.className = 'archive-error'
      errorMsg.setAttribute('role', 'alert')
      errorMsg.setAttribute('aria-live', 'assertive')
      errorMsg.innerHTML = `
        <p><strong>Impossibile caricare l'archivio.</strong></p>
        <p>Riprova più tardi o <a href="${window.location.origin}">torna alla home</a>.</p>
      `
      container.appendChild(errorMsg)

      // Log solo in development
      if (DEBUG) console.error('[archive] dataset error:', err)
    }
  }

  // DOMContentLoaded handler
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap)
  } else {
    bootstrap()
  }

  // Expose public API
  window.ArchiveBootstrap = {
    bootstrap
  }
})()
