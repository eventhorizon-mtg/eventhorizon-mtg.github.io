/**
 * Archive Renderer
 * HTML rendering for archive items, list, pager, and hero count
 * Espone: window.ArchiveRenderer
 */

;(() => {
  'use strict'

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return

  // Import dependencies from global namespaces
  const {
    text,
    trim,
    lower,
    escapeHTML,
    escapeAttribute,
    sanitizeHTML,
    qs,
    bustIfLocal,
    getParam,
    getURL,
    debugLog
  } = window.ArchiveShared
  const { ARIA_DESCRIPTION_MAX_CHARS } = window.ArchiveConfig
  const { pillClassFrom, pillLabel } = window.ArchiveData

  /**
   * Render singolo item archivio come DOM element
   */
  const renderItem = (it, index, total) => {
    const idStr = text(it.id)
    const kindClass = lower(text(it.kind) || 'content')
    // Numerazione discendente: primo item = total, ultimo = 1
    const itemNumber = total - index
    const over = trim(it.overline || '')
    const tit = trim(it.title || '')
    const desc = trim(it.desc || '')
    const content = trim(it.content || '') // Extended content field

    const appVer = document.documentElement.getAttribute('data-app-ver') || ''
    // Thumbnail for Archive items: reuse 'thumb' field (fallback to placeholder)
    const thumbWeb = trim(it.thumb || '')
    const thumbSrc = bustIfLocal(thumbWeb || 'images/cards/fblthp_placeholder.webp', appVer)

    // Links ordinati e detection robusta del "primary"
    const links = Array.isArray(it.links)
      ? it.links.slice().sort((a, b) => (a?.sort_order ?? 0) - (b?.sort_order ?? 0))
      : []

    // 1) Preferisci link marcato come "primary" in qualsiasi campo di classe
    let primaryIndex = null
    for (let i = 0; i < links.length; i++) {
      const cls = lower((links[i]?.btn_class || links[i]?.class || '').trim())
      if (cls && /\bprimary\b/i.test(cls)) {
        primaryIndex = i
        break
      }
    }
    // 2) Fallback: primo link con href valido
    if (primaryIndex == null) {
      for (let i = 0; i < links.length; i++) {
        const href = trim(links[i]?.href || '')
        if (href) {
          primaryIndex = i
          break
        }
      }
    }
    const primaryUrl =
      primaryIndex != null && links[primaryIndex] ? trim(links[primaryIndex].href || '') : ''
    const otherPills = []
    for (let i = 0; i < links.length; i++) {
      if (i === primaryIndex) continue
      const L = links[i]
      const url = trim(L?.href || '')
      if (!url) continue
      otherPills.push({
        url,
        lab: pillLabel(L?.label || '', url),
        cls: pillClassFrom(L?.btn_class || '', url)
      })
    }

    const linksId = `links-${idStr.replace(/[^a-zA-Z0-9_-]+/g, '-')}`
    const otherCount = otherPills.length
    const hasDropdown = !!desc || !!content || otherCount > 0
    const summaryLabel = otherCount > 0 ? `Dettagli e link (${otherCount})` : 'Dettagli'

    // Build expanded panel content with separators (sanitize HTML to prevent XSS)
    let panelContent = ''
    if (desc) {
      panelContent += `<p class="item-summary">${sanitizeHTML(desc)}</p>`
    }
    if (content) {
      if (panelContent) panelContent += `<hr class="item-separator">`
      panelContent += `<div class="item-content-extended">${sanitizeHTML(content)}</div>`
    }
    if (otherCount > 0) {
      if (panelContent) panelContent += `<hr class="item-separator">`
      // Buttons already have btn--sm class from pillClassFrom
      panelContent += `<div class="item-ctas" role="group" aria-label="Collegamenti">
        ${otherPills.map(P => `<a class="${P.cls}" href="${P.url}" target="_blank" rel="noopener" title="${P.lab}">${P.lab}</a>`).join('')}
      </div>`
    }

    // Background image per-item via CSS var handled elsewhere

    const li = document.createElement('li')
    li.className = `archive-item is-${kindClass}`
    // Imposta il numero come data attribute per il CSS counter
    li.style.setProperty('--item-number', String(itemNumber))
    li.setAttribute('data-item-number', String(itemNumber))
    // Imposta immagine di sfondo riga (leggera): riusa il thumbnail
    if (thumbSrc) {
      try {
        li.style.setProperty('--item-bg', `url("${thumbSrc}")`)
      } catch (e) {
        debugLog('Renderer', 'Failed to set item background image', e)
      }
    }

    // Overlay on thumbnail (desktop). Hidden on mobile via CSS.
    let thumbButtonHTML = ''
    if (primaryUrl) {
      if (kindClass === 'video') {
        thumbButtonHTML = `<span class="item-thumb-button" aria-hidden="true">
          <svg class="item-thumb-button-icon" viewBox="0 0 68 48" xmlns="http://www.w3.org/2000/svg">
            <path class="item-thumb-button-shape" d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"></path>
            <path class="item-thumb-button-symbol" d="M 45,24 27,14 27,34"></path>
          </svg>
        </span>`
      } else {
        thumbButtonHTML = `<span class="item-thumb-button" aria-hidden="true">Apri</span>`
      }
    }

    // Use shared escapeAttribute for HTML attributes
    const safeThumbSrc = escapeAttribute(thumbSrc)
    const safeTit = escapeAttribute(tit)
    const safePrimaryUrl = escapeAttribute(primaryUrl)

    const thumbHTML = primaryUrl
      ? `<a class="item-thumb" href="${safePrimaryUrl}" target="_blank" rel="noopener" aria-label="Apri: ${safeTit}">
           <img src="${safeThumbSrc}" alt="${safeTit}" width="720" height="1280" loading="lazy" decoding="async">
           ${thumbButtonHTML}
         </a>`
      : `<figure class="item-thumb">
           <img src="${safeThumbSrc}" alt="${safeTit}" width="720" height="1280" loading="lazy" decoding="async">
         </figure>`

    const mediaHTML = `<div class="item-media">
      ${thumbHTML}
    </div>`

    // Content section
    const kindLabel = kindClass === 'video' ? 'Video' : 'Contenuto'
    const contentHTML = `<div class="item-content">
      <div class="item-header">
        <div class="item-overline">
          ${over ? `${over}` : ''}
          <span class="item-badge">${kindLabel}</span>
        </div>
        <h2 class="item-title">${tit}</h2>
      </div>
      ${desc ? `<p class="item-desc-preview">${desc}</p>` : ''}
      ${
        hasDropdown
          ? `<button class="item-actions-summary" type="button" aria-controls="${linksId}" aria-expanded="false">
        <span class="sr-only">${summaryLabel}</span>
      </button>`
          : ''
      }
    </div>`

    // Kebab trigger (mobile: apre sheet). Resta presente ma lo possiamo nascondere su desktop via CSS
    const kebabHTML = hasDropdown
      ? `<button class="item-kebab" type="button" aria-controls="${linksId}" aria-label="Dettagli e link" title="Dettagli">
           <svg class="item-kebab__icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
             <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
           </svg>
         </button>`
      : ''

    // Costruzione aria-label descrittivo e accessibile
    const ariaLabel = `Apri ${kindLabel.toLowerCase()}: ${tit}${over ? ' - ' + over : ''}${desc ? '. ' + desc.substring(0, ARIA_DESCRIPTION_MAX_CHARS) + (desc.length > ARIA_DESCRIPTION_MAX_CHARS ? '...' : '') : ''}`

    li.innerHTML = `
      <article class="item" data-item-id="${idStr}" data-kind="${kindClass}" role="button" tabindex="0" aria-label="${ariaLabel.replace(/"/g, '&quot;')}" ${desc ? `aria-describedby="${linksId}-desc"` : ''}>
        ${mediaHTML}
        ${contentHTML}
        ${kebabHTML}
      </article>
      ${
        hasDropdown
          ? `<div class="item-panel" id="${linksId}" hidden>
             ${panelContent}
           </div>`
          : ''
      }
    `

    // Intera riga cliccabile sul primary URL (mobile); overlay link con z-index basso rispetto al kebab
    if (primaryUrl) {
      const rowLink = document.createElement('a')
      rowLink.className = 'item-row-link'
      rowLink.href = safePrimaryUrl
      rowLink.target = '_blank'
      rowLink.rel = 'noopener'
      rowLink.setAttribute('aria-hidden', 'true')
      rowLink.tabIndex = -1
      li.querySelector('article.item')?.appendChild(rowLink)
    }
    return li
  }

  /**
   * Update pager UI
   */
  const updatePager = state => {
    const pager = qs('.archive-pager')
    if (!pager) return
    const url = getURL()
    const { page, pages } = state
    const prevA = pager.querySelector('a[rel="prev"]')
    const nextA = pager.querySelector('a[rel="next"]')
    const curr = pager.querySelector('.curr')

    const setHref = (a, target) => {
      if (!a) return
      const u = new URL(url)
      u.searchParams.set('p', target)
      const qVal = getParam('q')
      const kVal = getParam('kind')
      if (qVal) u.searchParams.set('q', qVal)
      else u.searchParams.delete('q')
      if (kVal) u.searchParams.set('kind', kVal)
      else u.searchParams.delete('kind')
      a.href = u.toString()
    }

    const prevDisabled = page <= 1
    if (prevA) {
      prevA.classList.toggle('disabled', prevDisabled)
      prevA.setAttribute('aria-disabled', prevDisabled ? 'true' : 'false')
      setHref(prevA, prevDisabled ? 1 : page - 1)
      prevA.rel = 'prev'
    }
    if (curr) curr.textContent = `Pag. ${page} / ${pages}`
    const nextDisabled = page >= pages
    if (nextA) {
      nextA.classList.toggle('disabled', nextDisabled)
      nextA.setAttribute('aria-disabled', nextDisabled ? 'true' : 'false')
      setHref(nextA, nextDisabled ? pages : page + 1)
      nextA.rel = 'next'
    }
  }

  /**
   * Update hero count
   */
  const updateHeroCount = n => {
    const strong = qs('.archive-hero .filter-note strong')
    if (strong) strong.textContent = new Intl.NumberFormat('it-IT').format(n)
  }

  /**
   * Render lista (confinato nel container Archivio)
   */
  const renderList = arr => {
    const sectionArchive = document.querySelector('section.archive')
    if (!sectionArchive) return // safety
    const container = sectionArchive.querySelector('.container') || sectionArchive

    // assicurati che esista l'OL
    let listOl = container.querySelector('ol.archive-timeline')
    if (!listOl) {
      listOl = document.createElement('ol')
      listOl.className = 'archive-timeline'
      container.appendChild(listOl)
    }

    // If skeletons are present, replace in-place to avoid CLS
    const skeletons = Array.from(listOl.querySelectorAll('li.archive-item.skeleton'))
    if (skeletons.length && arr.length) {
      const fragExtra = document.createDocumentFragment()
      const total = arr.length
      const count = Math.min(skeletons.length, arr.length)
      for (let i = 0; i < count; i++) {
        const real = renderItem(arr[i], i, total)
        try {
          listOl.replaceChild(real, skeletons[i])
        } catch (_) {
          listOl.appendChild(real)
        }
      }
      for (let i = count; i < arr.length; i++) {
        fragExtra.appendChild(renderItem(arr[i], i, total))
      }
      if (fragExtra.childNodes.length) listOl.appendChild(fragExtra)
      // remove leftover skeletons
      for (let i = count; i < skeletons.length; i++) {
        skeletons[i]?.remove()
      }
      return
    }

    // If SSR placeholders are present (have .archive-item but lack dynamic controls), replace them in-place
    const ssrPlaceholders = Array.from(
      listOl.querySelectorAll('li.archive-item:not(.skeleton)')
    ).filter(li => !li.querySelector('.item-panel') && !li.querySelector('.item-actions-summary'))
    if (ssrPlaceholders.length && arr.length) {
      const total = arr.length
      const count = Math.min(ssrPlaceholders.length, arr.length)
      for (let i = 0; i < count; i++) {
        const real = renderItem(arr[i], i, total)
        try {
          listOl.replaceChild(real, ssrPlaceholders[i])
        } catch (_) {
          listOl.appendChild(real)
        }
      }
      for (let i = count; i < ssrPlaceholders.length; i++) {
        ssrPlaceholders[i]?.remove()
      }
      if (arr.length > count) {
        const fragExtra = document.createDocumentFragment()
        for (let i = count; i < arr.length; i++) fragExtra.appendChild(renderItem(arr[i], i, total))
        if (fragExtra.childNodes.length) listOl.appendChild(fragExtra)
      }
      return
    }

    // otherwise: clear and render
    listOl.innerHTML = ''
    if (!arr.length) {
      // mostra messaggio e rimuovi l'OL
      const p = document.createElement('p')
      p.className = 'empty'
      p.setAttribute('role', 'status')
      p.setAttribute('aria-live', 'polite')
      const qVal = trim(getParam('q') || '')
      p.innerHTML = `Nessun risultato per <em>${escapeHTML(qVal)}</em>.`
      listOl.replaceWith(p)
      return
    } else {
      // se c'è un vecchio <p.empty>, rimpiazzalo con un nuovo OL
      const oldEmpty = container.querySelector('p.empty')
      if (oldEmpty) {
        oldEmpty.remove()
        listOl = document.createElement('ol')
        listOl.className = 'archive-timeline'
        container.appendChild(listOl)
      }
    }

    const frag = document.createDocumentFragment()
    const total = arr.length
    for (let i = 0; i < arr.length; i++) {
      frag.appendChild(renderItem(arr[i], i, total))
    }
    listOl.appendChild(frag)
  }

  // Expose public API
  window.ArchiveRenderer = {
    renderItem,
    renderList,
    updatePager,
    updateHeroCount
  }
})()
