;(() => {
  if (typeof document === 'undefined') return

  const root = document.querySelector('#cards.cards--stack.cards--panels')
  if (!root) return

  const stack = root.querySelector('.cards__stack')
  if (!stack) return

  const cards = Array.from(stack.querySelectorAll('.card'))
  if (!cards.length) return

  // Consider content areas as non-activators to avoid expanding when clicking/pressing on description
  const interactiveSelector =
    'a, button, input, textarea, select, .card__body, .card__desc, .card__content, .card__actions'
  const activatorSelector = '.card__media, .card__header, .card__title'
  // Esteso a 1023px per includere tablet nel comportamento carousel
  const mediaQuery = window.matchMedia('(max-width: 1023px)')
  const isMobile = () => mediaQuery.matches

  const updateCardAccessibility = () => {
    cards.forEach(card => {
      if (isMobile()) {
        card.removeAttribute('role')
        card.removeAttribute('tabindex')
      } else {
        card.tabIndex = 0
        card.setAttribute('role', 'button')
      }
    })
  }

  let pager = null
  let dots = []
  let activeIndex = 0
  let pointerActive = false
  let pointerStartX = 0
  // Touch gesture support (for scrollable content areas)
  let touchActive = false
  let touchStartX = 0
  let touchStartY = 0
  let touchLock = null // 'x' | 'y' | null

  const clampIndex = index => {
    const total = cards.length
    if (total === 0) return 0
    const normalized = index % total
    return normalized < 0 ? normalized + total : normalized
  }

  function destroyPager() {
    if (pager) {
      pager.remove()
      pager = null
    }
    dots = []
    stack.style.height = ''
    cards.forEach(card => card.classList.remove('is-active'))
  }

  function updateDots() {
    if (!dots.length) return
    dots.forEach((dot, index) => {
      dot.setAttribute('aria-current', index === activeIndex ? 'true' : 'false')
    })
  }

  function updateStackHeight() {
    if (!isMobile()) {
      stack.style.height = ''
      return
    }
    const activeCard = cards[activeIndex]
    if (!activeCard) return
    requestAnimationFrame(() => {
      stack.style.height = `${activeCard.offsetHeight}px`
    })
  }

  function applyActiveCard() {
    if (!isMobile()) return
    cards.forEach((card, index) => {
      const isActive = index === activeIndex
      card.classList.remove('is-expanded', 'is-collapsed')
      card.setAttribute('aria-expanded', isActive ? 'true' : 'false')
      card.setAttribute('aria-selected', isActive ? 'true' : 'false')
      card.classList.toggle('is-active', isActive)
    })
    updateDots()
    updateStackHeight()
  }

  function setActiveIndex(index) {
    if (!isMobile()) return
    activeIndex = clampIndex(index)
    applyActiveCard()
  }

  function buildPager() {
    pager = document.createElement('nav')
    pager.className = 'cards__pager'
    pager.setAttribute('aria-label', 'Seleziona card da visualizzare')

    dots = cards.map((card, index) => {
      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'cards__dot'
      button.setAttribute('aria-label', `Mostra card ${index + 1}`)
      button.addEventListener('click', () => setActiveIndex(index))
      pager.appendChild(button)
      return button
    })

    stack.after(pager)
  }

  function ensureMobileUI() {
    if (!isMobile()) {
      destroyPager()
      return
    }

    if (!pager) buildPager()
    applyActiveCard()
    updateCardAccessibility()
  }

  function setEqual() {
    root.classList.add('cards--equal')

    cards.forEach(card => {
      card.classList.remove('is-expanded', 'is-collapsed')
      card.setAttribute('aria-expanded', 'false')
      card.setAttribute('aria-selected', 'false')
    })

    activeIndex = clampIndex(activeIndex)

    if (isMobile()) {
      applyActiveCard()
    } else {
      destroyPager()
    }
  }

  function expand(target) {
    if (!target || isMobile()) return

    root.classList.remove('cards--equal')

    cards.forEach(card => {
      const isActive = card === target

      card.classList.toggle('is-expanded', isActive)
      card.classList.toggle('is-collapsed', !isActive)
      card.setAttribute('aria-expanded', isActive ? 'true' : 'false')
      card.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })

    const index = cards.indexOf(target)
    if (index >= 0) {
      activeIndex = index
    }
  }

  function handleActivate(event, card) {
    // Do not activate if interaction originates inside non-activating content areas
    if (event.target && event.target.closest(interactiveSelector)) return
    // Only activate when interaction is within the intended activation zones
    if (!event.target || !event.target.closest(activatorSelector)) return

    if (isMobile()) return

    event.preventDefault()
    expand(card)
  }

  function handleMediaChange(event) {
    if (event.matches) {
      setEqual()
      ensureMobileUI()
    } else {
      destroyPager()
      setEqual()
    }
    updateCardAccessibility()
  }

  function handlePointerDown(event) {
    if (!isMobile()) return
    if (event.pointerType === 'touch') return
    pointerActive = true
    pointerStartX = event.clientX ?? 0
  }

  function handlePointerUp(event) {
    if (!pointerActive) return
    if (event.pointerType === 'touch') {
      pointerActive = false
      return
    }
    pointerActive = false
    const currentX = event.clientX ?? 0
    const delta = currentX - pointerStartX

    if (Math.abs(delta) > 40) {
      setActiveIndex(activeIndex + (delta < 0 ? 1 : -1))
    }
  }

  function handlePointerCancel(event) {
    if (event && event.pointerType === 'touch') return
    pointerActive = false
  }

  // Touch handlers: detect primarily horizontal gestures and prevent vertical scroll only when needed
  function handleTouchStart(e) {
    if (!isMobile()) return
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    touchActive = true
    touchStartX = t.clientX
    touchStartY = t.clientY
    touchLock = null
  }

  function handleTouchMove(e) {
    if (!touchActive || !isMobile()) return
    const t = e.touches && e.touches[0]
    if (!t) return
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    if (touchLock == null) {
      if (absDx > absDy && absDx > 18) {
        touchLock = 'x'
      } else if (absDy > absDx && absDy > 18) {
        touchLock = 'y'
      }
    } else if (touchLock === 'y') {
      if (absDx > absDy * 1.25 && absDx > 28) {
        touchLock = 'x'
      }
    }

    if (touchLock === 'x') {
      try {
        e.preventDefault()
      } catch (_) {}
    }
  }

  function handleTouchEnd(e) {
    if (!touchActive) return
    const t = (e.changedTouches && e.changedTouches[0]) || null
    const endX = t ? t.clientX : touchStartX
    const dx = endX - touchStartX
    const absDx = Math.abs(dx)
    const shouldSwipe = touchLock === 'x' ? absDx > 32 : !touchLock && absDx > 56
    if (shouldSwipe) {
      setActiveIndex(activeIndex + (dx < 0 ? 1 : -1))
    }
    touchActive = false
    touchLock = null
  }

  setEqual()
  ensureMobileUI()
  updateCardAccessibility()

  cards.forEach(card => {
    card.addEventListener('click', event => {
      handleActivate(event, card)
    })

    card.addEventListener('keydown', event => {
      const key = event.key
      if (key === 'Enter' || key === ' ' || key === 'Space' || key === 'Spacebar') {
        // Avoid when focus is in non-activating areas (links, buttons, content)
        if (event.target && event.target.closest(interactiveSelector)) return
        if (isMobile()) return
        event.preventDefault()
        expand(card)
      }
    })
  })

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      setEqual()
      ensureMobileUI()
    } else if (isMobile()) {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex(activeIndex + 1)
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex(activeIndex - 1)
      }
    }
  })

  document.addEventListener('click', event => {
    if (isMobile()) return

    const target = event.target
    const clickedInsideRoot = root.contains(target)
    const clickedInsideStack = stack.contains(target)

    if (!clickedInsideRoot || (clickedInsideRoot && !clickedInsideStack)) {
      setEqual()
    }
  })

  stack.addEventListener('pointerdown', handlePointerDown, { passive: true })
  stack.addEventListener('pointerup', handlePointerUp)
  stack.addEventListener('pointercancel', handlePointerCancel)
  stack.addEventListener('pointerleave', handlePointerCancel)

  // Touch events (support Safari and scrollable body area)
  stack.addEventListener('touchstart', handleTouchStart, { passive: true })
  stack.addEventListener('touchmove', handleTouchMove, { passive: false })
  stack.addEventListener('touchend', handleTouchEnd, { passive: true })

  // Debounced resize handler per performance
  let resizeTimeout
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      if (isMobile()) {
        updateStackHeight()
      }
    }, 150) // Debounce per ridurre ricalcoli durante resize
  })

  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', handleMediaChange)
  } else if (typeof mediaQuery.addListener === 'function') {
    mediaQuery.addListener(handleMediaChange)
  }

  // ============================================================
  // OVERFLOW DETECTION & MODAL SYSTEM (Desktop only)
  // ============================================================

  function checkBodyOverflow(card) {
    if (isMobile()) return

    const body = card.querySelector('.card__body')
    if (!body) return

    const content = card.querySelector('.card__content')
    if (!content || content.textContent.trim() === '') {
      body.classList.remove('has-overflow')
      return
    }

    // Check if content overflows the body panel
    const hasOverflow = body.scrollHeight > body.clientHeight
    body.classList.toggle('has-overflow', hasOverflow)
  }

  function openModal(card) {
    const content = card.querySelector('.card__content')
    if (!content) return

    // Create modal
    const modal = document.createElement('div')
    modal.className = 'card-modal'
    modal.setAttribute('role', 'dialog')
    modal.setAttribute('aria-modal', 'true')
    modal.setAttribute('aria-labelledby', 'modal-title')

    const modalContent = document.createElement('div')
    modalContent.className = 'card-modal__content'

    const closeButton = document.createElement('button')
    closeButton.className = 'card-modal__close'
    closeButton.setAttribute('type', 'button')
    closeButton.setAttribute('aria-label', 'Chiudi')
    closeButton.innerHTML = '&times;'

    const contentClone = content.cloneNode(true)

    modalContent.appendChild(closeButton)
    modalContent.appendChild(contentClone)
    modal.appendChild(modalContent)
    document.body.appendChild(modal)

    // Lock body scroll
    document.body.style.overflow = 'hidden'

    // Open modal
    requestAnimationFrame(() => {
      modal.classList.add('is-open')
    })

    // Close handlers
    const closeModal = () => {
      modal.classList.remove('is-open')
      setTimeout(() => {
        modal.remove()
        document.body.style.overflow = ''
      }, 300)
    }

    closeButton.addEventListener('click', closeModal)
    modal.addEventListener('click', e => {
      if (e.target === modal) closeModal()
    })

    // ESC key
    const handleEsc = e => {
      if (e.key === 'Escape') {
        closeModal()
        document.removeEventListener('keydown', handleEsc)
      }
    }
    document.addEventListener('keydown', handleEsc)

    // Focus trap
    closeButton.focus()
  }

  // Add ellipsis click handlers
  cards.forEach(card => {
    const body = card.querySelector('.card__body')
    if (!body) return

    // Create ellipsis element
    const ellipsis = document.createElement('button')
    ellipsis.className = 'card__ellipsis'
    ellipsis.setAttribute('type', 'button')
    ellipsis.setAttribute('aria-label', 'Leggi tutto')
    ellipsis.textContent = '⋯'
    ellipsis.addEventListener('click', e => {
      e.stopPropagation()
      openModal(card)
    })

    body.appendChild(ellipsis)
  })

  // Monitor card expansion via MutationObserver
  if (!isMobile() && typeof MutationObserver !== 'undefined') {
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const card = mutation.target
          if (card.classList.contains('is-expanded')) {
            setTimeout(() => {
              checkBodyOverflow(card)
            }, 100)
          } else {
            const body = card.querySelector('.card__body')
            if (body) body.classList.remove('has-overflow')
          }
        }
      })
    })

    cards.forEach(card => {
      observer.observe(card, { attributes: true, attributeFilter: ['class'] })
    })
  }
})()
