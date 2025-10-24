/**
 * Archive Bottom-Sheet (Mobile)
 * Mobile bottom-sheet with drag-to-close, focus trap, and scroll lock
 * Espone: window.ArchiveSheet
 */

;(() => {
  'use strict'

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return

  // Import dependencies from global namespaces
  const { qs, qsa, on } = window.ArchiveShared
  const {
    mqSheet,
    DRAG_CLOSE_THRESHOLD_PX,
    DRAG_OPACITY_DIVISOR,
    HAPTIC_FEEDBACK_CLOSE_MS,
    HAPTIC_FEEDBACK_SNAP_MS
  } = window.ArchiveConfig

  // DOM elements
  const sheet = qs('.archive-sheet')
  const backdrop = qs('.archive-sheet-backdrop')
  if (!sheet || !backdrop) return // fail-safe

  const btnClose = qs('.archive-sheet__close', sheet)
  const handle = qs('.archive-sheet__handle', sheet)
  const titleEl = qs('#archive-sheet-title', sheet)
  const content = qs('.archive-sheet__content', sheet)
  const ctas = qs('.archive-sheet__ctas', sheet)

  let lastFocus = null
  let currentItem = null

  const trapFocus = ev => {
    if (ev.key !== 'Tab') return
    const focusables = qsa(
      'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      sheet
    ).filter(el => !el.hasAttribute('disabled') && el.getAttribute('aria-hidden') !== 'true')
    if (!focusables.length) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (ev.shiftKey && document.activeElement === first) {
      last.focus()
      ev.preventDefault()
    } else if (!ev.shiftKey && document.activeElement === last) {
      first.focus()
      ev.preventDefault()
    }
  }

  const openSheet = (payload, fromItem) => {
    if (!mqSheet.matches) return // solo mobile/tablet
    lastFocus = document.activeElement
    currentItem = fromItem || null

    // Salva la posizione di scroll corrente per evitare jump
    const scrollY = window.scrollY

    titleEl.textContent = payload.title || ''
    content.innerHTML = '' // Clear first
    if (payload.descHtml) {
      if (payload.descHtml instanceof Node) {
        content.appendChild(payload.descHtml)
      } else {
        content.innerHTML = payload.descHtml // Fallback for string type, if necessary
      }
    }
    ctas.innerHTML = ''
    ;(payload.links || []).forEach(link => {
      const a = document.createElement('a')
      a.className = link.cls || 'btn btn--primary btn--sm'
      a.href = link.url
      a.target = '_blank'
      a.rel = 'noopener'
      a.title = link.lab || 'Apri'
      a.textContent = link.lab || 'Apri'
      ctas.appendChild(a)
    })

    // Applica classe del tipo (kind) allo sheet per stili condizionali
    const kind = payload.kind || 'content'
    sheet.classList.remove('is-kind-video', 'is-kind-content') // Rimuovi vecchie classi
    sheet.classList.add(`is-kind-${kind}`) // Aggiungi nuova classe

    // Imposta background dell'header dello sheet riusando il thumbnail dell'item
    try {
      const img = fromItem && fromItem.querySelector('.item-thumb img')
      const src = img && (img.currentSrc || img.src || img.getAttribute('src'))
      if (src) sheet.style.setProperty('--sheet-bg', `url("${src}")`)
    } catch (_) {}

    // Calcola in percentuale il punto di inizio fade sotto al contenitore del titolo
    const computeFadeStart = () => {
      try {
        const sheetRect = sheet.getBoundingClientRect()
        const titleRect = titleEl.getBoundingClientRect()
        const headerPx = Math.min(Math.max(window.innerHeight * 0.28, 120), 220) // clamp(120px, 28vh, 220px)
        const offset = Math.max(0, Math.min(headerPx, titleRect.bottom - sheetRect.top + 8)) // +8px padding
        const pct = Math.max(0, Math.min(100, (offset / headerPx) * 100))
        sheet.style.setProperty('--sheet-fade-start', pct.toFixed(2) + '%')
      } catch (_) {}
    }

    sheet.setAttribute('aria-hidden', 'false')
    backdrop.setAttribute('aria-hidden', 'false')
    sheet.classList.add('is-open')
    backdrop.classList.add('is-open')
    document.body.classList.add('is-sheet-open')
    document.body.style.top = `-${scrollY}px`
    if (currentItem) {
      try {
        currentItem.classList.add('is-sheet-open')
      } catch (_) {}
    }

    // Rileva se il contenuto è scrollabile
    setTimeout(() => {
      const sc = content
      if (sc && sc.scrollHeight > sc.clientHeight) {
        sheet.classList.add('has-scroll')
      } else {
        sheet.classList.remove('has-scroll')
      }
      try {
        computeFadeStart()
      } catch (_) {}
    }, 100)

    sheet.addEventListener('keydown', trapFocus)
    ;(btnClose || sheet).focus({ preventScroll: true })
  }

  const closeSheet = () => {
    // Salva la posizione di scroll prima di chiudere
    const scrollY = document.body.style.top
    const scrollPos = scrollY ? Math.abs(parseInt(scrollY || '0')) : 0

    sheet.setAttribute('aria-hidden', 'true')
    backdrop.setAttribute('aria-hidden', 'true')
    sheet.classList.remove('is-open')
    backdrop.classList.remove('is-open')
    // Reset di sicurezza per evitare stati "a metà" che causano problemi di z-index/interazioni
    sheet.classList.remove('is-dragging')
    sheet.style.transition = ''
    sheet.style.transform = ''
    backdrop.style.opacity = ''
    try {
      sheet.style.removeProperty('--sheet-bg')
    } catch (_) {}

    // Rimuovi classi del tipo (kind)
    sheet.classList.remove('is-kind-video', 'is-kind-content')

    document.body.classList.remove('is-sheet-open')
    document.body.style.top = ''

    // Ripristina la posizione SENZA scroll animato (instant)
    if (scrollPos > 0) {
      window.scrollTo({ top: scrollPos, behavior: 'instant' })
    }

    if (currentItem) {
      try {
        currentItem.classList.remove('is-sheet-open')
      } catch (_) {}
      currentItem = null
    }
    sheet.removeEventListener('keydown', trapFocus)
    if (lastFocus && typeof lastFocus.focus === 'function') {
      lastFocus.focus({ preventScroll: true })
    }
  }

  on(btnClose, 'click', closeSheet)
  on(backdrop, 'click', closeSheet)

  // Enhanced draggable sheet - drag anywhere on sheet, not just handle
  let startY = null
  let currentY = null
  let isDragging = false

  const onDragStart = e => {
    // Permetti drag solo se si inizia dall'handle o dall'header
    const target = e.target
    const isHandle = target.closest('.archive-sheet__handle')
    const isHeader = target.closest('.archive-sheet__title')
    const isContent = target.closest('.archive-sheet__content')

    // Non iniziare drag se si è nel contenuto scrollabile
    if (isContent && !isHandle && !isHeader) return

    if (!isHandle && !isHeader) return

    startY = e.touches ? e.touches[0].clientY : e.clientY
    currentY = startY

    // Verifica se il contenuto è scrollato in alto
    const isAtTop = content ? content.scrollTop <= 0 : true

    // Permetti drag solo se siamo in cima allo scroll
    if (isContent && !isAtTop) return

    isDragging = true
    sheet.classList.add('is-dragging')
    sheet.style.transition = 'none' // Disabilita transizione durante il drag
  }

  const onDragMove = e => {
    if (!isDragging || startY == null) return

    currentY = e.touches ? e.touches[0].clientY : e.clientY
    const deltaY = currentY - startY

    // Permetti solo drag verso il basso (chiusura) - NO drag verso l'alto
    if (deltaY > 0) {
      // Applica il movimento al sheet solo verso il basso
      sheet.style.transform = `translateY(${deltaY}px)`

      // Riduci opacità del backdrop in base al drag
      const opacity = Math.max(0, 1 - deltaY / DRAG_OPACITY_DIVISOR)
      backdrop.style.opacity = opacity

      // Previeni scroll della pagina durante il drag verso il basso
      e.preventDefault()
    }
    // Drag verso l'alto: completamente ignorato, nessun effetto
  }

  const onDragEnd = () => {
    if (!isDragging) return

    const deltaY = currentY - startY

    // Reset transition e classe
    sheet.classList.remove('is-dragging')
    sheet.style.transition = ''
    backdrop.style.opacity = ''

    // Se drag > soglia, chiudi
    if (deltaY > DRAG_CLOSE_THRESHOLD_PX) {
      // Haptic feedback se disponibile
      if (navigator.vibrate) {
        navigator.vibrate(HAPTIC_FEEDBACK_CLOSE_MS)
      }
      // Pulisci il transform inline prima di chiudere
      sheet.style.transform = ''
      closeSheet()
    } else {
      // Altrimenti torna in posizione con animazione
      sheet.style.transform = ''
      // Haptic feedback leggero per "snap back"
      if (navigator.vibrate && deltaY > 20) {
        navigator.vibrate(HAPTIC_FEEDBACK_SNAP_MS)
      }
    }

    startY = null
    currentY = null
    isDragging = false
  }

  // Touch events per mobile
  on(sheet, 'touchstart', onDragStart, { passive: false })
  on(sheet, 'touchmove', onDragMove, { passive: false })
  on(sheet, 'touchend', onDragEnd)
  on(sheet, 'touchcancel', onDragEnd)

  // Mouse events per desktop (testing)
  on(handle, 'mousedown', onDragStart)
  on(document, 'mousemove', e => {
    if (isDragging) onDragMove(e)
  })
  on(document, 'mouseup', onDragEnd)

  // BLOCCO GLOBALE: Impedisci qualsiasi interazione quando lo sheet è aperto (difesa in profondità)
  // IMPORTANTE: Blocca SEMPRE se lo sheet ha la classe is-open, indipendentemente dal suo stato (aperto a metà, completamente aperto, ecc.)
  const blockInteractions = ev => {
    // Se lo sheet è aperto (anche solo parzialmente), blocca TUTTI gli eventi TRANNE quelli su sheet/backdrop
    if (sheet.classList.contains('is-open') || document.body.classList.contains('is-sheet-open')) {
      const clickedSheet =
        ev.target &&
        (ev.target.closest('.archive-sheet') || ev.target.closest('.archive-sheet-backdrop'))
      if (!clickedSheet) {
        ev.preventDefault()
        ev.stopPropagation()
        ev.stopImmediatePropagation()
        return false
      }
    }
  }

  // Blocca click, touch e pointer events con capture phase per intercettare PRIMA
  document.addEventListener('click', blockInteractions, { capture: true, passive: false })
  document.addEventListener('touchstart', blockInteractions, { capture: true, passive: false })
  document.addEventListener('touchmove', blockInteractions, { capture: true, passive: false })
  document.addEventListener('touchend', blockInteractions, { capture: true, passive: false })
  document.addEventListener('pointerdown', blockInteractions, { capture: true, passive: false })
  document.addEventListener('mousedown', blockInteractions, { capture: true, passive: false })

  // Apertura (mobile) - click sull'area content (non thumbnail)
  document.addEventListener('click', ev => {
    if (!mqSheet.matches) return // Solo su mobile

    // Se lo sheet è aperto, consenti interazioni DENTRO lo sheet (link, bottoni, ecc.)
    if (document.body.classList.contains('is-sheet-open')) {
      const withinSheet =
        ev.target &&
        (ev.target.closest('.archive-sheet') || ev.target.closest('.archive-sheet-backdrop'))
      if (withinSheet) return // lascia passare i click dentro lo sheet/backdrop
      // Altrimenti blocca l'interazione con il resto della pagina
      ev.preventDefault()
      ev.stopPropagation()
      return
    }

    // Ignora se clicca su un link dentro item-content
    const clickedLink = ev.target && ev.target.closest('a')
    if (clickedLink) return

    // Ignora se clicca sulla thumbnail o suoi bottoni
    const clickedThumb =
      ev.target && ev.target.closest('.item-media, .item-thumb, .item-thumb-button')
    if (clickedThumb) return

    // Verifica se ha cliccato nell'area content
    const itemContent = ev.target && ev.target.closest('.item-content')
    if (!itemContent) return

    const article = itemContent.closest('.item')
    const li = article && article.closest('.archive-item')
    if (!li) return

    const panel = li.querySelector('.item-panel')
    const desc = panel ? panel.querySelector('.item-summary') : null
    const contentExt = panel ? panel.querySelector('.item-content-extended') : null
    const ctaEls = panel ? qsa('.item-ctas a', panel) : []
    const title = article.querySelector('.item-title')?.textContent || ''

    // Estrai il tipo (kind) dall'article
    const kind = article.getAttribute('data-kind') || 'content'

    const links = ctaEls.map(a => ({
      url: a.getAttribute('href'),
      lab: a.textContent.trim(),
      cls: a.className
    }))

    // Build sheet content with separators (stesso formato del pannello)
    // Build sheet content as DOM nodes to avoid text escaping issues
    const sheetFragment = document.createDocumentFragment()
    if (desc) {
      const p = document.createElement('p')
      p.className = 'item-summary'
      p.textContent = desc.textContent
      sheetFragment.appendChild(p)
    }
    if (contentExt) {
      if (desc) {
        const hr = document.createElement('hr')
        hr.className = 'item-separator'
        sheetFragment.appendChild(hr)
      }
      const extContainer = document.createElement('div')
      extContainer.className = 'item-content-extended'
      // Assume contentExt.innerHTML is safe/trusted; if not, sanitize it here
      extContainer.innerHTML = contentExt.innerHTML
      sheetFragment.appendChild(extContainer)
    }
    // Add separator before links if sheetFragment is not empty and there are links
    if (links.length > 0 && sheetFragment.childNodes.length > 0) {
      const hr = document.createElement('hr')
      hr.className = 'item-separator'
      sheetFragment.appendChild(hr)
    }

    openSheet(
      {
        title,
        descHtml: sheetFragment, // Now passing DOM Fragment, not string
        links,
        kind // Passa il tipo allo sheet
      },
      article
    )
    ev.preventDefault()
  })

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && sheet.getAttribute('aria-hidden') === 'false') closeSheet()
  })

  // Expose public API
  window.ArchiveSheet = {
    open: openSheet,
    close: closeSheet
  }
})()
