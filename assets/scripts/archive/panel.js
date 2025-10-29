/**
 * Archive Desktop Panel
 * Desktop in-row expandable panel with gradient overlay unlock
 * Espone: window.ArchivePanel
 */

;(() => {
  'use strict'

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return

  // Import dependencies from global namespaces
  const { qs, set } = window.ArchiveShared
  const { TRUE, FALSE, PANEL_COMPRESSED } = window.ArchiveConfig

  const mqSheet2 = window.matchMedia
    ? window.matchMedia('(max-width: 767.98px)')
    : { matches: true }

  const mqDesktop = window.matchMedia ? window.matchMedia('(min-width: 768px)') : { matches: false }

  const togglePanel = (item, li) => {
    const panel = qs('.item-panel', li)
    const trigger = qs('.item-actions-summary', item)
    if (!panel || !trigger) return

    const willOpen = !item.classList.contains('is-open')
    item.classList.toggle('is-open', willOpen)
    set(trigger, 'aria-expanded', willOpen ? TRUE : FALSE)

    // Toggle panel visibility
    if (willOpen) {
      // Cancel any pending hide animation
      const tid = panel.dataset.hideTid
      if (tid) {
        clearTimeout(Number(tid))
        delete panel.dataset.hideTid
      }
      // If collapsing, stop and show immediately
      panel.classList.remove('is-collapsing')
      panel.hidden = false
      // Proactively (re)compute overflow on open, even if the panel wasn't hidden before
      requestAnimationFrame(() => {
        setTimeout(() => checkOverflow(panel), 120)
      })
      // Scroll into view if needed (smooth)
      setTimeout(() => {
        if (panel.scrollHeight > 400) {
          panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 150)
    } else {
      // Start smooth collapse animation
      panel.classList.remove('is-scrollable', 'has-overflow')
      panel.scrollTop = 0
      panel.classList.add('is-collapsing')

      const onEnd = ev => {
        if (ev && ev.target !== panel) return
        panel.removeEventListener('transitionend', onEnd)
        panel.hidden = true
        panel.classList.remove('is-collapsing')
      }
      panel.addEventListener('transitionend', onEnd)
      // Fallback in case transitionend doesn't fire
      const fallbackTid = setTimeout(() => {
        panel.removeEventListener('transitionend', onEnd)
        panel.hidden = true
        panel.classList.remove('is-collapsing')
        delete panel.dataset.hideTid
      }, 400)
      panel.dataset.hideTid = String(fallbackTid)
    }
  }

  // Make entire card clickable on desktop (not on mobile where we use bottom sheet)
  document.addEventListener('click', ev => {
    // Skip on mobile/tablet - the mobile handler above will take care of it
    if (mqSheet2.matches) return

    // BLOCCA se uno sheet è aperto (protezione aggiuntiva)
    if (document.body.classList.contains('is-sheet-open')) {
      ev.preventDefault()
      ev.stopPropagation()
      return
    }

    // Check if clicking on a link inside the card
    const clickedLink = ev.target && ev.target.closest('a.item-thumb, .item-ctas a')
    if (clickedLink) return // Let the link work normally

    const item = ev.target && ev.target.closest('.item')
    if (!item) return

    const li = item.closest('.archive-item')
    if (!li) return

    ev.preventDefault()
    togglePanel(item, li)
  })

  // Keyboard accessibility: Enter/Space on card toggles panel
  document.addEventListener('keydown', ev => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return
    if (mqSheet2.matches) return // only desktop

    // BLOCCA se uno sheet è aperto
    if (document.body.classList.contains('is-sheet-open')) {
      ev.preventDefault()
      ev.stopPropagation()
      return
    }

    const item = ev.target && ev.target.closest('.item')
    if (!item) return

    const li = item.closest('.archive-item')
    if (!li) return

    ev.preventDefault()
    togglePanel(item, li)
  })

  // ===========================
  // Gradient Overlay Unlock (solo desktop, solo se overflow)
  // ===========================

  // Funzione per verificare se il pannello ha overflow (contenuto troncato)
  const checkOverflow = panel => {
    if (!panel || !mqDesktop.matches) return false

    // Ignora se già scrollable (stato espanso)
    if (panel.classList.contains('is-scrollable')) return false

    // Verifica se il contenuto supera l'altezza massima compressa
    const hasOverflow = panel.scrollHeight > PANEL_COMPRESSED

    // Aggiungi/rimuovi classe has-overflow
    panel.classList.toggle('has-overflow', hasOverflow)

    return hasOverflow
  }

  // Click sul gradient overlay per attivare scroll
  document.addEventListener('click', ev => {
    // Solo su desktop
    if (!mqDesktop.matches) return

    // Verifica se ha cliccato sul gradient overlay (::after pseudo-element)
    const panel = ev.target && ev.target.closest('.item-panel')
    if (!panel) return

    // Ignora se il pannello è già scrollable o non ha overflow
    if (panel.classList.contains('is-scrollable') || !panel.classList.contains('has-overflow'))
      return

    // Verifica se il click è nell'area del gradient (bottom 120px)
    const rect = panel.getBoundingClientRect()
    const clickY = ev.clientY - rect.top // Click Y relativo al pannello
    const gradientStart = rect.height - 120 // Gradient overlay è alto 120px

    // Se il click è nell'area del gradient overlay
    if (clickY >= gradientStart) {
      ev.preventDefault()
      ev.stopPropagation()

      // Attiva lo scroll e rimuovi has-overflow (non serve più)
      panel.classList.add('is-scrollable')
      panel.classList.remove('has-overflow')

      // Scroll smooth al top del contenuto per dare feedback visivo
      panel.scrollTo({ top: 0, behavior: 'smooth' })
    }
  })

  // Osserva apertura/chiusura pannelli
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'hidden') {
        const panel = mutation.target

        // Solo pannelli desktop
        if (!mqDesktop.matches) return
        if (!panel || !panel.classList.contains('item-panel')) return

        if (panel.hasAttribute('hidden')) {
          // CHIUSURA: ripristina stato compresso
          panel.classList.remove('is-scrollable', 'has-overflow')
          panel.scrollTop = 0 // Reset scroll position
        } else {
          // APERTURA: verifica overflow dopo un breve delay per permettere il rendering
          requestAnimationFrame(() => {
            setTimeout(() => checkOverflow(panel), 100)
          })
        }
      }
    })
  })

  // Osserva tutti i pannelli per intercettare apertura/chiusura
  const observePanels = () => {
    const panels = document.querySelectorAll('.item-panel')
    panels.forEach(panel => {
      observer.observe(panel, { attributes: true, attributeFilter: ['hidden'] })
    })
  }

  // ResizeObserver: re-check overflow when panel content size changes (images/fonts load)
  const resizeObserver =
    typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(entries => {
          entries.forEach(entry => {
            const panel = entry.target
            // Only when visible, not already scrollable
            if (!panel.hasAttribute('hidden') && !panel.classList.contains('is-scrollable')) {
              checkOverflow(panel)
            }
          })
        })
      : null

  const observePanelSize = () => {
    if (!resizeObserver) return
    document.querySelectorAll('.item-panel').forEach(p => resizeObserver.observe(p))
  }

  // Bootstrap: osserva pannelli già presenti
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observePanels()
      observePanelSize()
    })
  } else {
    observePanels()
    observePanelSize()
  }

  // Osserva anche pannelli aggiunti dinamicamente (dopo render)
  const bodyObserver = new MutationObserver(() => {
    observePanels()
    observePanelSize()
  })

  if (document.body) {
    bodyObserver.observe(document.body, { childList: true, subtree: true })
  }

  // Ri-check overflow su resize (per sicurezza, con debounce)
  let resizeTimeout
  window.addEventListener('resize', () => {
    if (!mqDesktop.matches) return
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      document
        .querySelectorAll('.item-panel:not([hidden]):not(.is-scrollable)')
        .forEach(checkOverflow)
    }, 200)
  })

  // Expose public API
  window.ArchivePanel = {
    toggle: togglePanel,
    checkOverflow
  }
})()
