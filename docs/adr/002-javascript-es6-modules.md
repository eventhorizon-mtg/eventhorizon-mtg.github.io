# ADR 002: JavaScript ES6 Modules Strategy

**Status:** ⏸️ Deferred
**Date:** 2025-10-20
**Decision Maker:** EventHorizon.mtg Team
**Context:** Task 2.4 (Postponed), Task 4.4 (Code Splitting Evaluation)

---

## Context and Problem Statement

The EventHorizon.mtg site has a monolithic `archive.js` file (1348 lines) that handles:
- Bottom sheet modal
- Search and filter functionality
- JSON data fetching and rendering
- Panel interactions

**Problems:**
- Difficult to maintain and test
- No code reusability
- Cannot use modern JS features (import/export)
- Hard to understand data flow
- No tree shaking or code splitting

**Question:** Should we modularize JavaScript using ES6 modules?

---

## Decision Drivers

1. **Maintainability** - Smaller, focused modules easier to understand
2. **Testability** - Unit testing requires modular code
3. **Reusability** - Shared utilities across files
4. **Modern JS** - Access to import/export syntax
5. **Bundle size** - Tree shaking removes unused code
6. **Code splitting** - Load only needed code per page
7. **Risk** - Must not break existing functionality

---

## Considered Options

### Option 1: ES6 Modules with esbuild (via Hugo js.Build)

**Architecture:**
```
assets/scripts/
├── main.js                 # Entry point
├── archive/
│   ├── config.js          # Constants and config
│   ├── sheet.js           # Bottom sheet modal
│   ├── panel.js           # Panel interactions
│   ├── search.js          # Search logic
│   ├── filter.js          # Filter logic
│   └── renderer.js        # DOM rendering
├── utils/
│   ├── dom.js             # DOM helpers
│   └── http.js            # Fetch utilities
└── ... (other files)
```

**Build process:**
```go-html-template
{{- $opts := dict
     "target" "es2017"
     "format" "iife"
     "minify" true
-}}
{{- $bundle := resources.Get "scripts/main.js"
               | js.Build $opts
               | resources.Fingerprint -}}
```

**Pros:**
- ✅ Modern ES6 syntax (import/export)
- ✅ Tree shaking (remove unused code)
- ✅ Code splitting potential
- ✅ Better maintainability (small, focused modules)
- ✅ Easier to test (unit tests per module)
- ✅ Reusable utilities
- ✅ Hugo native (js.Build)

**Cons:**
- ⚠️ Requires refactoring all JavaScript
- ⚠️ More complex build process
- ⚠️ Historical failure (commit d86045c → f77273d)
- ⚠️ Risk of breaking functionality
- ⚠️ Slower builds than simple concatenation

### Option 2: Keep Monolithic IIFEs (Status Quo)

**Current architecture:**
```
assets/scripts/
├── script.js          # Main initialization (IIFE)
├── links.js           # Links carousel (IIFE)
├── cards-carousel.js  # Cards carousel (IIFE)
├── archive.js         # Archive page (IIFE, 1348 lines)
└── privacy.js         # Privacy banner (IIFE)
```

**Build process:**
```go-html-template
{{- $bundle := ($parts | resources.Concat "script/bundle.js")
               | resources.Minify
               | resources.Fingerprint -}}
```

**Pros:**
- ✅ Simple and reliable
- ✅ No refactoring needed
- ✅ Fast builds
- ✅ Known to work (production-tested)
- ✅ Easy to debug

**Cons:**
- ❌ Difficult to maintain large files (archive.js = 1348 lines)
- ❌ No code reusability
- ❌ No tree shaking
- ❌ No code splitting
- ❌ Stuck with ES5 patterns
- ❌ Hard to unit test

### Option 3: Hybrid Approach

**Strategy:** Keep IIFEs but refactor internally using modern patterns

**Example (archive.js):**
```javascript
(function() {
  'use strict';

  // Internal modules using object pattern
  const Config = { ... };
  const Sheet = { ... };
  const Search = { ... };

  // Initialize
  Sheet.init();
  Search.init();
})();
```

**Pros:**
- ✅ No build changes needed
- ✅ Better organization within files
- ✅ Low risk

**Cons:**
- ⚠️ Still one large file
- ⚠️ No tree shaking
- ⚠️ Limited reusability

---

## Decision Outcome

**Chosen Option:** ⏸️ **Defer ES6 Modules** (Keep Option 2 for now)

**Rationale:**

1. **Historical failure** - Previous attempt (Task 2.4, commit d86045c) caused critical site breakage:
   - Hero image not visible
   - Cards component broken
   - Archive page not rendering
   - Emergency rollback required (commit f77273d)

2. **Risk vs reward** - Current bundle (41 KB) is acceptable:
   - Estimated savings: 10-20 KB with tree shaking
   - Marginal performance gain
   - High risk of breaking functionality

3. **Time investment** - Task 2.4 estimated at ~5 hours:
   - Refactor archive.js into 6 modules
   - Set up js.Build configuration
   - Extensive testing required
   - Potential debugging time unknown

4. **Current system works** - Hugo Pipes concatenation is:
   - Simple and reliable
   - Fast builds
   - Production-tested
   - Easy to debug

5. **Code splitting evaluation** (Task 4.4) concluded:
   - Defer esbuild until bundle > 100 KB
   - Keep Hugo Pipes for stability

---

## Implementation Plan (When Reconsidered)

### Prerequisites
- [ ] Bundle size exceeds 100 KB
- [ ] Team confident with ES6 modules
- [ ] Comprehensive test suite in place
- [ ] Rollback plan documented

### Phase 1: Preparation
1. Set up Vitest for unit testing (Task 4.1)
2. Write tests for current functionality
3. Document current behavior

### Phase 2: Migration
1. Start with smallest file (privacy.js)
2. Refactor to ES6 module
3. Test thoroughly
4. Repeat for other files

### Phase 3: archive.js Modularization
1. Create module structure:
   ```
   archive/
   ├── config.js
   ├── sheet.js
   ├── panel.js
   ├── search.js
   ├── filter.js
   └── renderer.js
   ```
2. Extract each module with tests
3. Integration testing
4. Performance benchmarking

### Phase 4: Build Setup
1. Configure js.Build in `layouts/partials/scripts.html`
2. Test in development
3. Preview deployment
4. Monitor production

### Rollback Plan
```bash
# If build fails
git revert <es6-modules-commit>

# If runtime errors
git checkout HEAD~1 -- assets/scripts/
hugo server  # Verify working

# Emergency: Full rollback
git reset --hard <last-working-commit>
```

---

## Consequences

### By Deferring (Current State)

**Positive:**
- ✅ Stable, proven system
- ✅ Fast builds
- ✅ Low risk
- ✅ Easy debugging

**Negative:**
- ❌ Difficult to maintain large files
- ❌ No modern JS features
- ❌ No tree shaking
- ❌ Hard to unit test

### When Implemented (Future State)

**Positive:**
- ✅ Better maintainability
- ✅ Modern JS (import/export)
- ✅ Tree shaking (~10-20 KB savings)
- ✅ Code splitting potential
- ✅ Easier testing
- ✅ Reusable utilities

**Negative:**
- ⚠️ More complex builds
- ⚠️ Requires team training
- ⚠️ Migration effort

---

## Related Decisions

- **ADR 001:** SCSS Architecture (ITCSS) - Similar modular approach for CSS
- **ADR 003:** Breakpoint Strategy - Design tokens pattern
- **Task 2.4:** archive.js Modularization (Postponed)
- **Task 4.1:** Vitest Setup (Skipped - requires ES6 modules)
- **Task 4.4:** Code Splitting Evaluation (Defer esbuild)
- **docs/CODE_SPLITTING_EVALUATION.md:** Full analysis

---

## Review Triggers

Reconsider ES6 modules when **ANY** of these occur:

1. ✅ **Bundle size > 100 KB** (currently 41 KB)
2. ✅ **Adding npm packages** (requires module system)
3. ✅ **Unit testing required** (hard without modules)
4. ✅ **archive.js > 2000 lines** (currently 1348)
5. ✅ **Team requests it** (developer experience)
6. ✅ **Performance issues** (tree shaking needed)

---

## References

- [Hugo js.Build docs](https://gohugo.io/hugo-pipes/js/)
- [esbuild documentation](https://esbuild.github.io/)
- [ES6 Modules MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- Previous attempt: Commits d86045c (failed) → f77273d (rollback)
- Code splitting analysis: docs/CODE_SPLITTING_EVALUATION.md

---

**Last Updated:** 2025-10-20
**Author:** EventHorizon.mtg Team
**Status:** ⏸️ Deferred - Review when triggers met
**Next Review:** When bundle > 100 KB or Q2 2026
