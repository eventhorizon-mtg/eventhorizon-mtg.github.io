/**
 * Archive Shared Utilities
 * Funzioni di utilità condivise tra tutti i moduli archive
 * Espone: window.ArchiveShared
 */

;(() => {
  'use strict'

  // Expose shared utilities via global namespace (compatible with resources.Concat)
  window.ArchiveShared = {
    // DOM utilities
    qs: (sel, root = document) => root.querySelector(sel),
    qsa: (sel, root = document) => Array.from(root.querySelectorAll(sel)),
    on: (el, ev, cb, opts) => el && el.addEventListener(ev, cb, opts),
    set: (el, name, val) => el && el.setAttribute(name, String(val)),

    // String utilities
    text: v => (v == null ? '' : String(v)),
    trim: v => (v == null ? '' : String(v)).trim(),
    lower: v => (v == null ? '' : String(v)).toLowerCase(),

    // HTML escaping
    escapeHTML: str => {
      const s = str == null ? '' : String(str)
      return s.replace(/[&<>"'`]/g, c => {
        return {
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          '`': '&#96;'
        }[c]
      })
    },

    // URL utilities
    getURL: () => new URL(window.location.href),
    getParam: name => new URL(window.location.href).searchParams.get(name),

    // Search helpers
    LIKE: (haystack, needle) => {
      const h = haystack == null ? '' : String(haystack).toLowerCase()
      const n = needle == null ? '' : String(needle).toLowerCase()
      return h.includes(n)
    },

    // URL helpers
    isAbsolute: u => /^(data:|https?:|\/\/)/i.test(u),

    getBaseURL: () => {
      const b = (document.documentElement.getAttribute('data-base-url') || '').trim()
      return b.replace(/\/$/, '')
    },

    toSiteURL: u => {
      if (!u) return ''
      const isAbs = /^(data:|https?:|\/\/)/i.test(u)
      if (isAbs) return u
      const base = window.ArchiveShared.getBaseURL()
      const clean = String(u).replace(/^\/+/, '')
      return base ? `${base}/${clean}` : `/${clean}`
    },

    bustIfLocal: (u, ver) => {
      const src = window.ArchiveShared.toSiteURL(u)
      if (!ver) return src
      const sep = src.includes('?') ? '&' : '?'
      return `${src}${sep}v=${ver}`
    },

    buildArchiveEndpoint: (base, version) => {
      const trim = window.ArchiveShared.trim
      const cleanBase = trim(base || '')
      const finalBase = cleanBase || '/archive/list.json'
      const ver = trim(version || '')
      if (!ver) return finalBase
      try {
        const url = new URL(finalBase, window.location.origin)
        url.searchParams.set('v', ver)
        return url.toString()
      } catch {
        const sep = finalBase.includes('?') ? '&' : '?'
        return `${finalBase}${sep}v=${ver}`
      }
    }
  }
})()
