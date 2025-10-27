/* ============================================================
   Privacy Modal Script
   ============================================================ */
;(function () {
  'use strict'

  const modal = document.getElementById('privacy-modal')
  if (!modal) return

  const triggers = document.querySelectorAll('[data-privacy-modal]')
  const closeTriggers = modal.querySelectorAll('[data-privacy-close]')
  const modalContent = modal.querySelector('.privacy-modal__content')

  let lastFocusedElement = null

  // Apertura modal
  function openModal(event) {
    if (event) event.preventDefault()

    lastFocusedElement = document.activeElement
    modal.removeAttribute('hidden')

    // Focus sul pulsante chiudi
    const closeBtn = modal.querySelector('.privacy-modal__close')
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 100)
    }

    // Previeni scroll del body e html (desktop + mobile)
    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
  }

  // Chiusura modal
  function closeModal() {
    modal.setAttribute('hidden', '')

    // Ripristina scroll del body e html
    document.documentElement.style.overflow = ''
    document.body.style.overflow = ''

    // Ripristina focus
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
      lastFocusedElement.focus()
    }
    lastFocusedElement = null
  }

  // Focus trap
  function trapFocus(event) {
    if (event.key !== 'Tab') return

    const focusableElements = modal.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    )

    if (!focusableElements.length) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  // Event listeners
  triggers.forEach(trigger => {
    trigger.addEventListener('click', openModal)
  })

  closeTriggers.forEach(trigger => {
    trigger.addEventListener('click', closeModal)
  })

  // Chiudi con ESC
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
      closeModal()
    }
  })

  // Focus trap quando modal aperto
  modal.addEventListener('keydown', event => {
    if (!modal.hasAttribute('hidden')) {
      trapFocus(event)
    }
  })

  // Previeni chiusura click sul contenuto
  if (modalContent) {
    modalContent.addEventListener('click', event => {
      event.stopPropagation()
    })
  }
})()
