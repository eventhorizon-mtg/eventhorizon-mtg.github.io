# ADR 003: Responsive Breakpoint Strategy

**Status:** ✅ Accepted & Implemented
**Date:** 2025-10-20
**Decision Maker:** EventHorizon.mtg Team
**Context:** Task 2.3 - Breakpoint Standardization with Mixins

---

## Context and Problem Statement

The EventHorizon.mtg site needed a consistent responsive design strategy:
- Multiple screen sizes to support (mobile, tablet, desktop, large screens)
- Inconsistent breakpoint values across files
- Verbose media queries duplicated everywhere
- Hard to maintain and update breakpoint values
- No single source of truth for responsive behavior

**Before Task 2.3:**
```scss
// Inconsistent breakpoints scattered across files
@media (min-width: 768px) { ... }   // Sometimes 768px
@media (min-width: 760px) { ... }   // Sometimes 760px
@media (min-width: 48rem) { ... }   // Sometimes 48rem
```

**Problems:**
- Magic numbers throughout codebase
- Inconsistent units (px vs rem)
- Difficult to refactor
- No semantic names
- Copy-paste errors

---

## Decision Drivers

1. **Consistency** - Same breakpoints across all files
2. **Maintainability** - Single source of truth
3. **Readability** - Semantic names (sm, md, lg)
4. **DRY Principle** - No repeated media query boilerplate
5. **Mobile-First** - Min-width approach
6. **Performance** - No runtime overhead
7. **Industry Standard** - Align with common frameworks

---

## Considered Options

### Option 1: SCSS Mixins with Design Tokens (Chosen)

**Implementation:**

**Breakpoint tokens** (`01-settings/_tokens.scss`):
```scss
:root {
  --bp-sm: 640px;   /* 40rem */
  --bp-md: 768px;   /* 48rem */
  --bp-lg: 1024px;  /* 64rem */
  --bp-xl: 1280px;  /* 80rem */
  --bp-2xl: 1536px; /* 96rem */
}
```

**Mixin** (`01-settings/_mixins.scss`):
```scss
@mixin bp($breakpoint) {
  @if $breakpoint == 'sm' {
    @media (min-width: 40rem) { @content; }
  }
  @else if $breakpoint == 'md' {
    @media (min-width: 48rem) { @content; }
  }
  @else if $breakpoint == 'lg' {
    @media (min-width: 64rem) { @content; }
  }
  @else if $breakpoint == 'xl' {
    @media (min-width: 80rem) { @content; }
  }
  @else if $breakpoint == '2xl' {
    @media (min-width: 96rem) { @content; }
  }
}
```

**Usage:**
```scss
.card {
  width: 100%;

  @include bp(md) {
    width: 50%;
  }

  @include bp(lg) {
    width: 33.333%;
  }
}
```

**Pros:**
- ✅ Clean, semantic syntax
- ✅ Single source of truth
- ✅ Easy to update (change mixin, affects all)
- ✅ No runtime overhead (compile-time)
- ✅ Familiar to developers (Tailwind-like)
- ✅ Works natively with Hugo Pipes SCSS
- ✅ Design tokens for documentation

**Cons:**
- ⚠️ Requires SCSS (not plain CSS)
- ⚠️ Must import mixins file

### Option 2: CSS Custom Properties with @media

**Implementation:**
```scss
@media (min-width: var(--bp-md)) {
  .card { width: 50%; }
}
```

**Pros:**
- Dynamic (can change at runtime)

**Cons:**
- ❌ Limited browser support for custom properties in @media
- ❌ More verbose
- ❌ Doesn't work reliably

### Option 3: Sass Variables Only

**Implementation:**
```scss
$bp-sm: 640px;
$bp-md: 768px;

@media (min-width: $bp-md) {
  .card { width: 50%; }
}
```

**Pros:**
- Simple

**Cons:**
- ❌ Still verbose
- ❌ Repeated @media boilerplate
- ❌ No semantic names in usage

### Option 4: Framework (Bootstrap, Tailwind)

**Pros:**
- Battle-tested
- Extensive utilities

**Cons:**
- ❌ Requires Node.js build tooling
- ❌ Large bundle size
- ❌ Opinionated design system
- ❌ Overkill for this project

---

## Decision Outcome

**Chosen Option:** SCSS Mixins with Design Tokens (Option 1)

**Rationale:**
- Best balance of simplicity and power
- Works natively with Hugo Pipes
- No external dependencies
- Clean, readable syntax
- Easy to maintain
- Industry-standard naming (sm, md, lg, xl)

---

## Implementation Details

### Breakpoint Values

Based on common device widths and industry standards (Tailwind CSS, Bootstrap):

| Name | Value | Rem | Target Devices |
|------|-------|-----|----------------|
| `sm` | 640px | 40rem | Large phones (landscape), small tablets |
| `md` | 768px | 48rem | Tablets (portrait) |
| `lg` | 1024px | 64rem | Tablets (landscape), small laptops |
| `xl` | 1280px | 80rem | Laptops, desktops |
| `2xl` | 1536px | 96rem | Large desktops, external monitors |

**Why rem units?**
- Respects user font-size preferences (accessibility)
- 1rem = 16px (browser default)
- 48rem = 768px at default settings

### Mobile-First Approach

All breakpoints use `min-width` (not max-width):

```scss
// Base styles (mobile)
.card {
  width: 100%;
  padding: 1rem;
}

// Tablet
@include bp(md) {
  .card {
    width: 50%;
    padding: 1.5rem;
  }
}

// Desktop
@include bp(lg) {
  .card {
    width: 33.333%;
    padding: 2rem;
  }
}
```

**Benefits:**
- Progressive enhancement
- Better for performance (mobile-first CSS is smaller)
- Aligns with responsive design best practices

### Range Queries (Optional)

For targeting specific ranges:

```scss
// Only tablet
@media (min-width: 48rem) and (max-width: calc(64rem - 0.0625rem)) {
  .card { border: 2px solid blue; }
}
```

Or using mixin helper:
```scss
@mixin bp-only($breakpoint) {
  @if $breakpoint == 'sm' {
    @media (min-width: 40rem) and (max-width: calc(48rem - 0.0625rem)) {
      @content;
    }
  }
  // ... etc
}
```

### Max-Width Queries (Rare)

When needed (usually for mobile-only styles):

```scss
@media (max-width: calc(48rem - 0.0625rem)) {
  .mobile-menu { display: block; }
}
```

---

## Migration (Task 2.3 Completed)

### Files Updated

**Standardized:**
- `06-components/_navbar.scss` - 8 inconsistent breakpoints → 3 mixins
- `06-components/_cards-stack.scss` - 6 inconsistent → 4 mixins
- `07-pages/_archive-hero.scss` - 2 inconsistent → 2 mixins
- `07-pages/_homepage.scss` - 4 inconsistent → 4 mixins

**Total reduction:**
- Before: ~20 verbose media queries
- After: 13 clean mixin calls
- Lines saved: ~40 lines
- Consistency: 100%

### Example Migration

**Before:**
```scss
@media screen and (min-width: 760px) {
  .nav {
    display: flex;
  }
}

@media screen and (min-width: 768px) {
  .nav__item {
    padding: 1rem;
  }
}
```

**After:**
```scss
@include bp(md) {
  .nav {
    display: flex;
  }

  .nav__item {
    padding: 1rem;
  }
}
```

---

## Consequences

### Positive

1. **Consistency** ↑↑
   - All breakpoints use same values
   - Predictable responsive behavior

2. **Maintainability** ↑↑
   - Single source of truth in mixins
   - Easy to add/modify breakpoints
   - Clear, semantic names

3. **Readability** ↑↑
   - `@include bp(md)` vs `@media (min-width: 768px)`
   - Self-documenting code

4. **Productivity** ↑
   - Faster to write responsive styles
   - Less copy-paste errors
   - IntelliSense suggestions

5. **Accessibility** ↑
   - Rem units respect user preferences
   - Mobile-first approach

### Negative

1. **Learning Curve** ↓
   - Team must understand mixin syntax
   - Need to know breakpoint names
   - (Mitigated: Very simple, well-documented)

2. **Import Requirement** ↓
   - Must import mixins in main.scss
   - (Mitigated: Done once in entry point)

### Neutral

- **Compile time** - Negligible impact
- **Bundle size** - Same output CSS
- **Browser support** - Works everywhere (compiles to media queries)

---

## Usage Guidelines

### Do's ✅

```scss
// Clean, semantic
@include bp(md) {
  .element { width: 50%; }
}

// Group related styles
@include bp(lg) {
  .element {
    width: 33.333%;
    padding: 2rem;
    margin: 1rem;
  }
}

// Nest breakpoints
.card {
  width: 100%;

  @include bp(md) { width: 50%; }
  @include bp(lg) { width: 33.333%; }
}
```

### Don'ts ❌

```scss
// Don't use magic numbers
@media (min-width: 720px) { } // ❌

// Don't use max-width for base styles
@media (max-width: 768px) { } // ❌ (use min-width)

// Don't create custom breakpoints
@media (min-width: 900px) { } // ❌ (use existing breakpoints)

// Don't forget to import mixins
// (Will fail silently or error)
```

---

## Future Enhancements

### Container Queries (Future)

When browser support improves:
```scss
@container (min-width: 48rem) {
  .card { width: 50%; }
}
```

Could add mixin: `@include container(md) { ... }`

### Orientation Queries

Could add if needed:
```scss
@mixin landscape {
  @media (orientation: landscape) { @content; }
}
```

### Prefers-* Queries

For accessibility:
```scss
@mixin reduced-motion {
  @media (prefers-reduced-motion: reduce) { @content; }
}
```

---

## Related Decisions

- **ADR 001:** SCSS Architecture (ITCSS) - Mixins live in 01-settings/
- **ADR 002:** JavaScript ES6 Modules - No direct relation
- **Task 2.1:** Design Tokens Consolidation - Breakpoint values as tokens
- **Task 2.3:** Breakpoint Standardization - Implementation of this ADR

---

## References

- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/responsive-design)
- [Bootstrap Breakpoints](https://getbootstrap.com/docs/5.0/layout/breakpoints/)
- [MDN: Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries/Using_media_queries)
- [CSS-Tricks: Approaches to Media Queries in Sass](https://css-tricks.com/approaches-media-queries-sass/)

---

**Last Updated:** 2025-10-20
**Author:** EventHorizon.mtg Team
**Status:** ✅ Implemented & Proven
**Review Date:** When adding new breakpoints or devices
