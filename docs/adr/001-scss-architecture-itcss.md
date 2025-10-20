# ADR 001: SCSS Architecture using ITCSS Methodology

**Status:** ✅ Accepted
**Date:** 2025-10-20
**Decision Maker:** EventHorizon.mtg Team
**Context:** Level 1 Optimization (CSS Architecture Consolidation)

---

## Context and Problem Statement

The EventHorizon.mtg Hugo site needed a scalable, maintainable CSS architecture to:
- Manage growing complexity as features are added
- Prevent specificity wars and !important usage
- Enable easy collaboration and onboarding
- Support design system consistency
- Facilitate performance optimization

**Previous situation:**
- CSS files mixed without clear hierarchy
- No consistent naming convention
- Difficult to predict cascade effects
- Hard to locate specific styles
- Performance optimizations unclear where to apply

---

## Decision Drivers

1. **Scalability** - Architecture must support site growth without refactoring
2. **Maintainability** - New developers should understand structure quickly
3. **Predictability** - CSS cascade should follow logical rules
4. **Performance** - Enable critical CSS extraction and optimization
5. **Industry Standards** - Follow proven methodologies
6. **Hugo Integration** - Work seamlessly with Hugo Pipes

---

## Considered Options

### Option 1: ITCSS (Inverted Triangle CSS)
**Layers (least to most specific):**
1. Settings - Variables, design tokens
2. Tools - Mixins, functions
3. Generic - Reset, normalize
4. Elements - Bare HTML elements
5. Objects - Layout patterns (OOCSS)
6. Components - UI components (BEM)
7. Utilities - Helper classes (!important allowed)

**Pros:**
- ✅ Proven at scale (BBC, Sky, etc.)
- ✅ Natural specificity management
- ✅ Clear file organization
- ✅ Supports design tokens
- ✅ Easy critical CSS identification

**Cons:**
- ⚠️ Learning curve for team
- ⚠️ Requires discipline

### Option 2: Atomic CSS (Tailwind-style)
**Approach:** Utility-first with generated classes

**Pros:**
- Fast prototyping
- Minimal CSS bloat with PurgeCSS

**Cons:**
- ❌ Requires Node.js build tooling
- ❌ HTML gets cluttered
- ❌ Hugo Pipes doesn't support PostCSS well
- ❌ Harder to maintain custom designs

### Option 3: CSS Modules
**Approach:** Scoped CSS per component

**Pros:**
- No naming conflicts

**Cons:**
- ❌ Requires JavaScript bundler
- ❌ Not native to Hugo
- ❌ Overkill for static site

### Option 4: Flat Structure (Status Quo)
**Approach:** All CSS files at root level

**Pros:**
- Simple

**Cons:**
- ❌ Doesn't scale
- ❌ Specificity conflicts
- ❌ Hard to maintain

---

## Decision Outcome

**Chosen Option:** ITCSS (Option 1)

**Rationale:**
- Best fit for Hugo static site architecture
- No external dependencies required
- Proven methodology with extensive documentation
- Scales from small to enterprise projects
- Natural alignment with Hugo Pipes workflow

---

## Implementation

### Directory Structure

```
assets/style/
├── main.scss                    # Entry point
├── critical.scss                # Above-the-fold styles (Task 3.4)
├── 01-settings/
│   ├── _tokens.scss             # Design tokens (Task 2.1)
│   ├── _fonts.scss              # Font-face declarations
│   └── _mixins.scss             # SCSS mixins (Task 2.3)
├── 03-generic/
│   └── _reset.scss              # CSS reset
├── 04-elements/
│   └── _base.scss               # HTML element styles
├── 05-objects/
│   ├── _container.scss          # Layout container
│   └── _grid.scss               # Grid system
├── 06-components/
│   ├── _navbar.scss
│   ├── _hero.scss
│   ├── _cards-base.scss         # Task 1.2: Modularized
│   ├── _cards-variants.scss
│   ├── _cards-stack.scss
│   ├── _buttons.scss            # Task 2.5: With mixins
│   ├── _modal.scss
│   ├── _contacts.scss
│   ├── _links.scss
│   ├── _boxes.scss
│   └── _footer.scss
├── 07-pages/
│   ├── _homepage.scss
│   ├── _archive.scss
│   ├── _archive-hero.scss       # Task 2.3: Split from _archive.scss
│   ├── _archive-items.scss
│   ├── _archive-sheet.scss
│   └── _article.scss
└── 08-utilities/
    └── _utilities.scss
```

### Naming Conventions

**BEM (Block Element Modifier)** for components:
```scss
.card { }                    // Block
.card__title { }             // Element
.card--featured { }          // Modifier
.card__title--large { }      // Element + Modifier
```

**Design Tokens** (Task 2.1):
```scss
--color-primary-500
--space-4
--text-lg
--radius-md
```

**Breakpoint Mixins** (Task 2.3):
```scss
@include bp(md) { ... }      // 768px
@include bp(lg) { ... }      // 1024px
```

### Hugo Pipes Integration

**Entry point:** `assets/style/main.scss`

```go-html-template
{{- $sassOpts := dict
    "targetPath"      "style/bundle.min.css"
    "outputStyle"     "compressed"
    "enableSourceMap" false
-}}
{{- with resources.Get "style/main.scss" -}}
  {{- $mainCss := . | css.Sass $sassOpts | resources.Fingerprint -}}
  <link rel="stylesheet" href="{{ $mainCss.RelPermalink }}">
{{- end -}}
```

**Critical CSS:** `assets/style/critical.scss`
Inlined in `<head>` for optimal FCP (Task 3.4)

---

## Consequences

### Positive

1. **Maintainability** ↑↑
   - Clear file organization (ITCSS layers)
   - Predictable specificity
   - Easy to locate and modify styles

2. **Scalability** ↑↑
   - Supports project growth without refactoring
   - New components fit naturally into 06-components/
   - Design tokens enable global changes

3. **Performance** ↑
   - Critical CSS extraction straightforward (01-settings → 06-components)
   - Unused styles easy to identify
   - Build optimizations transparent

4. **Collaboration** ↑
   - Industry-standard methodology
   - Extensive documentation available
   - Onboarding simplified

5. **Design System** ↑
   - Design tokens in 01-settings/
   - Reusable patterns in 05-objects/
   - Consistent components

### Negative

1. **Learning Curve** ↓
   - Team must understand ITCSS principles
   - BEM naming requires discipline
   - More files to navigate initially

2. **File Count** ↓
   - More files than flat structure
   - Requires imports in main.scss
   - (Mitigated: Better organization outweighs cost)

### Neutral

- **No runtime overhead** - Compiles to same CSS
- **Hugo native** - No external tooling required
- **Refactoring effort** - One-time cost already paid (Level 1)

---

## Related Decisions

- **ADR 002:** JavaScript ES6 Modules (similar modular approach)
- **ADR 003:** Breakpoint Strategy (implements ITCSS mixins)
- **Task 1.2:** Cards Component Modularization
- **Task 2.1:** Design Tokens Consolidation
- **Task 2.3:** Breakpoint Standardization
- **Task 2.5:** Buttons SCSS Mixins
- **Task 3.4:** Critical CSS Extraction

---

## References

- [ITCSS Official](https://www.xfive.co/blog/itcss-scalable-maintainable-css-architecture/)
- [Harry Roberts - CSS Architecture](https://csswizardry.com/2015/08/bemit-taking-the-bem-naming-convention-a-step-further/)
- [Hugo Sass/SCSS docs](https://gohugo.io/hugo-pipes/scss-sass/)
- [BEM Methodology](http://getbem.com/)

---

**Last Updated:** 2025-10-20
**Author:** EventHorizon.mtg Team
**Status:** Living document - evolves with codebase
