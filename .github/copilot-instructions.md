# EventHorizon.mtg - AI Coding Instructions

Hugo-based Magic: The Gathering content site with data-driven archive system, mobile-first interactions, and strict asset integrity validation.

## Architecture Overview

**Dual Content Model:**
- **Articles** (`content/article/*.md`): Traditional Hugo markdown content → `/articles/:slug/`
- **Archive Items** (`data/archive/items/*.yml`): YAML data files → JSON API → client-side rendering

**Key Data Flow:**
1. YAML files in `data/archive/items/` → Hugo builds JSON at `/archive/list.json` via custom output format
2. `archive.js` fetches JSON, renders interactive timeline with mobile bottom-sheet and desktop expand panels
3. `baseof.html` injects `data-archive-ver` (appVer + max modtime) to trigger client-side cache invalidation

## Content Management

### Archive Items (Primary Content Type)
Create YAML in `data/archive/items/filename.yml` following `_schema.yml`:
```yaml
id: eh-0003
slug: unique-slug
kind: video  # or "content", "portal" (affects UI styling)
date: 2025-10-07
title: "Display Title"
overline: "YouTube · Commander"  # Category badge
desc: "Brief description (always visible)"
content: |  # Extended HTML content (shown in expanded view/sheet)
  <p>Rich HTML with <strong>formatting</strong></p>
thumb: /images/thumbs/image.webp
tags: ["commander", "tutorial"]
links:
  - label: Watch Video
    href: "https://youtube.com/..."
    btn_class: btn--yt btn--sm  # CSS class for button styling
    sort_order: 1
    primary: true
```
**Important:** `content` field supports HTML for rich expanded descriptions. Links are sorted by `sort_order` (ascending).

### Articles (Blog Posts)
```bash
hugo new article/my-post.md
```
- Archetype at `archetypes/article.md` provides front matter template
- Permalinks: `/articles/:slug/` (configured in `hugo.toml`)
- Cover images: `static/images/articles/slug/cover.webp` (reference as `images/articles/slug/cover.webp`)

### Tag Aliases
`data/archive/aliases.yml` maps search terms to canonical tags:
```yaml
edh: ["commander"]
phyrexia: ["yawgmoth", "new phyrexia"]
```

## Build Pipeline & Asset Integrity

### Cache Busting (Critical)
- **Images/JSON**: `?v={{ site.Params.appVer }}` via `versioned-url.html` partial
- **CSS/JS bundles**: Hugo Pipes fingerprinting (64-char SHA256 hashes in filename)
- **appVer**: Set via `HUGO_PARAMS_APPVER` env var (Git SHA in CI, fallback in `hugo.toml`)

### Local Development
```bash
hugo server --buildDrafts --buildFuture
# No cache-busting in dev (appVer defaults to "63ab118" from hugo.toml)
```

### Production Build (Windows PowerShell)
```powershell
# Set version from Git SHA
$env:HUGO_PARAMS_APPVER = (git rev-parse --short HEAD)
hugo --minify
```

### GitHub Actions Validation
`.github/workflows/build.yml` enforces:
1. `data-app-ver` attribute present in HTML
2. CSS/JS bundles use 64-char fingerprinted filenames
3. SRI integrity hashes match actual file content (Python validator)

**Fail fast:** Build fails if cache-busting or SRI validation fails.

## JavaScript Architecture

### Module Organization (`assets/scripts/`)
- `script.js`: Core utilities, smooth scroll, mobile menu
- `archive.js`: Archive page interactions (search, filter, bottom sheet, focus trap)
- `links.js`: External link handling
- `cards-carousel.js`: Card carousel interactions
- `privacy.js`: Privacy banner/consent

### Archive.js Key Patterns
- **Responsive behavior**: `matchMedia(MQ_SHEET)` toggles between mobile bottom-sheet and desktop expand panel
- **Feature gate**: `if (!document.querySelector('section.archive')) return;` (only runs on archive page)
- **Bottom sheet**: Draggable with haptic feedback, focus trap on open, scroll lock with position restoration
- **Endpoint discovery**: `window.__ARCHIVE_ENDPOINT__` set by `scripts.html` partial using `data-base-url` attribute

### Bundle Process (`layouts/partials/scripts.html`)
Hugo Pipes concatenates → minifies → fingerprints → adds SRI integrity. Order matters:
```javascript
script.js → links.js → cards-carousel.js → archive.js → privacy.js
```

## SCSS/Styling Conventions

### ITCSS Layer Structure (`assets/style/main.scss`)
```
01-settings (tokens, fonts) → 03-generic (reset) → 04-elements (base HTML) 
→ 05-objects (layout) → 06-components (UI) → 07-pages → 08-utilities
```

### Design Tokens (`01-settings/_tokens.scss`)
- **Color scheme**: Dark theme (`color-scheme: dark`)
- **Typography**: Perfect Fourth scale (1.333 ratio) with fluid `clamp()` sizing
- **Spacing**: Fluid system using CSS custom properties
- **Fonts**: Self-hosted with WOFF2 preloading (see `hugo.toml` `params.fonts.preload`)

### BEM Naming
Components use BEM: `.archive-sheet__handle`, `.btn--yt`, `.card--expanded`

## Template Patterns

### Custom Output Format (Critical)
`content/archive/_index.md` declares:
```yaml
outputs:
  - HTML
  - ArchiveList  # Triggers layouts/archive/list.archivelist.json
```
Defined in `hugo.toml`:
```toml
[outputFormats.ArchiveList]
mediaType = "application/json"
baseName = "list"
```

### Dynamic Data Attributes (`baseof.html`)
```html
<html data-archive-page-size="12" 
      data-app-ver="{{ site.Params.appVer }}" 
      data-base-url="{{ strings.TrimSuffix "/" .Site.BaseURL }}"
      data-archive-ver="{{ appVer }}-{{ maxModTime }}">
```
JavaScript reads these for configuration and cache invalidation.

### Versioned URLs (`layouts/partials/versioned-url.html`)
```go-html-template
{{ partial "versioned-url.html" "images/bg.webp" }}
<!-- Outputs: /images/bg.webp?v=63ab118 -->
```

## Project-Specific Conventions

1. **Archive Items = Data, Not Content**: Use YAML in `data/archive/items/`, not markdown in `content/`
2. **No Server-Side Search**: All filtering happens client-side in `archive.js`
3. **Mobile-First Bottom Sheet**: Archive detail view is a draggable bottom sheet on mobile (<768px), expands in-page on desktop
4. **Focus Management**: Archive sheet traps focus when open, restores on close
5. **SRI is Non-Negotiable**: CI fails if integrity hashes mismatch (enforced in build validation)
6. **Absolute Image Paths**: Use `/images/...` (relative to `static/`), not `../images/...`

## Common Tasks

**Add new archive video:**
```yaml
# data/archive/items/new-video.yml
id: eh-0010
slug: new-video
kind: video
date: 2025-10-15
title: "New Video Title"
overline: "YouTube · Commander"
desc: "Short description"
thumb: /images/thumbs/new-video.webp
tags: ["commander", "gameplay"]
links:
  - label: Watch
    href: "https://youtube.com/watch?v=..."
    btn_class: btn--yt btn--sm
    sort_order: 1
    primary: true
```

**Add new article:**
```bash
hugo new article/my-article.md
# Edit content/article/my-article.md
# Add images to static/images/articles/my-article/
```

**Test cache busting locally:**
```powershell
$env:HUGO_PARAMS_APPVER = "test123"
hugo server
# Check HTML for data-app-ver="test123"
```

## Critical Files Reference

- `hugo.toml`: Custom output formats, permalinks, font preloading
- `layouts/_default/baseof.html`: Data attribute injection, cache invalidation logic
- `layouts/archive/list.archivelist.json`: Transforms `site.Data.archive.items` to JSON
- `data/archive/_schema.yml`: Archive item data contract
- `assets/scripts/archive.js`: Mobile bottom-sheet, search, filter logic (1173 lines)
- `.github/workflows/build.yml`: SRI validation, cache-busting verification, deployment
- `layouts/partials/versioned-url.html`: Cache-busting helper for images/assets
- `assets/style/01-settings/_tokens.scss`: Design system foundation (400 lines)