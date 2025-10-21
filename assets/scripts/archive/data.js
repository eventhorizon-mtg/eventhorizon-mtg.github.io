/**
 * Archive Data Layer
 * Data fetching, validation, filtering, sorting, and pagination logic
 * Espone: window.ArchiveData
 */

;(() => {
  'use strict'

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return

  // Import dependencies from global namespaces
  const { text, trim, lower, LIKE, getParam } = window.ArchiveShared
  const {
    DEFAULT_PAGE_SIZE,
    MIN_PAGE_SIZE,
    MAX_PAGE_SIZE,
    FETCH_MAX_RETRIES,
    FETCH_INITIAL_DELAY_MS,
    FETCH_BACKOFF_MULTIPLIER
  } = window.ArchiveConfig

  // Tag matching flessibile (token + frase)
  const makeTagsCSV = tagsArr => {
    const arr = Array.isArray(tagsArr) ? tagsArr : []
    const csv = arr.map(t => lower(t)).join(',')
    return `,${csv},`
  }

  const matchTagsFlexible = (tagsArr, q) => {
    const wrapped = makeTagsCSV(tagsArr)
    const qLower = lower(q).trim()
    if (!qLower) return false
    const tokens = qLower.split(/\s+/).filter(Boolean)
    for (let i = 0; i < tokens.length; i++) if (wrapped.includes(tokens[i])) return true
    if (wrapped.includes(qLower)) return true
    return false
  }

  // Pill mapping
  const normalizeBtnVariant = raw => {
    const t = lower(trim(raw))
    if (!t) return 'btn--primary'
    const m = t.match(/\bbtn--[a-z0-9-]+\b/)
    if (m) {
      if (m[0] === 'btn--teal') return 'btn--secondary'
      if (m[0] === 'btn--base') return 'btn--primary'
      if (m[0] === 'btn--gold') return 'btn--accent'
      return m[0]
    }
    const map = {
      magenta: 'btn--secondary',
      youtube: 'btn--yt',
      yt: 'btn--yt',
      scryfall: 'btn--scry',
      scry: 'btn--scry',
      edhrec: 'btn--edh',
      edh: 'btn--edh',
      moxfield: 'btn--mox',
      mox: 'btn--mox',
      archidekt: 'btn--archi',
      archi: 'btn--archi',
      indigostroke: 'btn--base',
      tealstroke: 'btn--base',
      alphab: 'btn--base',
      acid: 'btn--base',
      pink: 'btn--base',
      orange: 'btn--base',
      teal: 'btn--secondary',
      gold: 'btn--accent',
      accent: 'btn--accent',
      primary: 'btn--primary',
      indigo: 'btn--primary',
      base: 'btn--primary',
      default: 'btn--primary'
    }
    const parts = t.split(/\s+/)
    for (const p of parts) if (map[p]) return map[p]
    for (const k in map) if (t.includes(k)) return map[k]
    return 'btn--primary'
  }

  const variantFromUrl = url => {
    try {
      const host = new URL(url, window.location.origin).host.toLowerCase()
      const isHostOrSub = (h, d) => h === d || h.endsWith('.' + d)
      if (isHostOrSub(host, 'youtube.com') || host === 'youtu.be') return 'btn--yt'
      if (isHostOrSub(host, 'scryfall.com')) return 'btn--scry'
      if (isHostOrSub(host, 'edhrec.com')) return 'btn--edh'
      if (isHostOrSub(host, 'moxfield.com')) return 'btn--mox'
      if (isHostOrSub(host, 'archidekt.com')) return 'btn--archi'
    } catch {}
    return null
  }

  const pillClassFrom = (btnRaw, url) => {
    const raw = trim(btnRaw)
    if (/^btn--[a-z0-9-]+$/i.test(raw)) {
      return `btn ${raw} btn--sm`
    }
    let v = normalizeBtnVariant(raw)
    if (v === 'btn--base') {
      const u = variantFromUrl(url)
      if (u) v = u
    }
    return `btn ${v} btn--sm`
  }

  const pillLabel = (label, url) => {
    const L = trim(label)
    if (L) return L
    try {
      const host = new URL(url, window.location.origin).host
      return host || 'Apri'
    } catch {
      return 'Apri'
    }
  }

  // State/pager helpers
  const getPage = () => {
    const n = parseInt(getParam('p') || '1', 10)
    return isNaN(n) || n < 1 ? 1 : n
  }

  const getPageSize = () => {
    const attr = document.documentElement.getAttribute('data-archive-page-size')
    const n = parseInt(attr || String(DEFAULT_PAGE_SIZE), 10)
    return isNaN(n) ? DEFAULT_PAGE_SIZE : Math.max(MIN_PAGE_SIZE, Math.min(MAX_PAGE_SIZE, n))
  }

  /**
   * Filtra array di item per query e tipo
   */
  const filterItems = (arr, q, kind) => {
    const Q = lower(q).trim()
    const K = lower(kind)
    return arr.filter(it => {
      if (K && K !== lower(it.kind || '')) return false
      if (!Q) return true
      const inText = LIKE(it.title || '', Q) || LIKE(it.overline || '', Q) || LIKE(it.desc || '', Q)
      const inTags = matchTagsFlexible(it.tags || [], Q)
      return inText || inTags
    })
  }

  const parseDate = d => {
    const t = Date.parse(d)
    return isNaN(t) ? 0 : t
  }

  /**
   * Ordina item per data (desc) poi per ID (desc)
   */
  const sortItems = arr =>
    arr.slice().sort((a, b) => {
      const ad = parseDate(a.date)
      const bd = parseDate(b.date)
      if (ad !== bd) return bd - ad
      const aid = text(a.id)
      const bid = text(b.id)
      return aid < bid ? 1 : aid > bid ? -1 : 0
    })

  /**
   * Paginazione array con calcolo metadata
   */
  const paginate = (arr, page, pageSize) => {
    const total = arr.length
    const pages = Math.max(1, Math.ceil(total / pageSize))
    const p = Math.min(Math.max(1, page), pages)
    const start = (p - 1) * pageSize
    const end = start + pageSize
    return { total, pages, page: p, slice: arr.slice(start, end) }
  }

  /**
   * Validazione schema item archivio
   */
  const validateArchiveData = data => {
    if (!Array.isArray(data)) {
      const DEBUG = location.hostname === 'localhost' || location.search.includes('debug=1')
      if (DEBUG) console.warn('[archive] Data is not an array, expected array of items')
      return []
    }
    return data.filter((item, idx) => {
      const hasId = item && item.id != null
      const hasTitle = item && typeof item.title === 'string'
      const hasKind = item && typeof item.kind === 'string'

      if (!hasId || !hasTitle) {
        const DEBUG = location.hostname === 'localhost' || location.search.includes('debug=1')
        if (DEBUG)
          console.warn(`[archive] Item at index ${idx} missing required fields (id, title):`, item)
        return false
      }

      if (!hasKind) {
        item.kind = 'content'
      }

      return true
    })
  }

  /**
   * Fetch con retry automatico e exponential backoff
   */
  const fetchWithRetry = async (url, options = {}, retries = FETCH_MAX_RETRIES) => {
    try {
      const response = await fetch(url, options)

      if (response.ok) return response

      if (response.status >= 400 && response.status < 500) {
        throw new Error(`HTTP ${response.status}`)
      }

      if (retries > 0) {
        const delay =
          FETCH_INITIAL_DELAY_MS * Math.pow(FETCH_BACKOFF_MULTIPLIER, FETCH_MAX_RETRIES - retries)
        const DEBUG = location.hostname === 'localhost' || location.search.includes('debug=1')
        if (DEBUG)
          console.warn(
            `[archive] HTTP ${response.status}, retry in ${delay}ms (${retries} attempts left)`
          )
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchWithRetry(url, options, retries - 1)
      }

      throw new Error(`HTTP ${response.status}`)
    } catch (error) {
      if (retries > 0 && error.name !== 'AbortError') {
        const delay =
          FETCH_INITIAL_DELAY_MS * Math.pow(FETCH_BACKOFF_MULTIPLIER, FETCH_MAX_RETRIES - retries)
        const DEBUG = location.hostname === 'localhost' || location.search.includes('debug=1')
        if (DEBUG)
          console.warn(
            `[archive] Network error, retry in ${delay}ms (${retries} attempts left):`,
            error.message
          )
        await new Promise(resolve => setTimeout(resolve, delay))
        return fetchWithRetry(url, options, retries - 1)
      }

      throw error
    }
  }

  // Expose public API
  window.ArchiveData = {
    // Tag matching
    matchTagsFlexible,

    // Pill utilities
    pillClassFrom,
    pillLabel,
    normalizeBtnVariant,
    variantFromUrl,

    // State
    getPage,
    getPageSize,

    // Data processing
    filterItems,
    sortItems,
    paginate,
    validateArchiveData,

    // Fetch
    fetchWithRetry
  }
})()
