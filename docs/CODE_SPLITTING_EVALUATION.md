# Code Splitting Evaluation: Hugo Pipes vs esbuild

**Task 4.4** - Evaluating bundling strategies for EventHorizon.mtg

**Date:** 2025-10-20
**Decision Status:** DEFER (Keep Hugo Pipes for now)

---

## Current Implementation: Hugo Pipes

### Architecture

**File:** `layouts/partials/scripts.html`

**Strategy:** Concatenation-based bundling
```go-html-template
{{- $bundle := ($parts | resources.Concat "script/bundle.js")
               | resources.Minify
               | resources.Fingerprint -}}
```

**Files bundled (in order):**
1. `scripts/script.js` - Main initialization, navbar, image fallback
2. `scripts/links.js` - Links carousel (desktop drag)
3. `scripts/cards-carousel.js` - Homepage cards carousel
4. `scripts/archive.js` - Archive page (search, filter, bottom-sheet) [~1348 lines]
5. `scripts/privacy.js` - Privacy banner

### Current Metrics

- **Bundle size:** 41 KB (minified + fingerprinted)
- **Format:** ES5 (concatenated IIFEs)
- **Code splitting:** None (single bundle for all pages)
- **Tree shaking:** No
- **Modules:** No (monolithic files in IIFEs)

### Pros ✅

1. **Zero configuration** - Works out of the box with Hugo
2. **No external dependencies** - Pure Hugo Pipes
3. **Simple build process** - No Node.js required
4. **Proven reliability** - Stable, no breaking changes
5. **Fast builds** - Minimal processing overhead
6. **Cache-friendly** - Single bundle with fingerprinting

### Cons ⚠️

1. **No ES6 module support** - Cannot use `import`/`export`
2. **No tree shaking** - All code included even if unused
3. **No code splitting** - Entire bundle loads on every page
4. **Monolithic files** - archive.js is 1348 lines
5. **No modern JS features** - Stuck with ES5 patterns

---

## Alternative: esbuild via Hugo Pipes

### Architecture

**Method:** `js.Build` with esbuild

```go-html-template
{{- $opts := dict
     "target" "es2017"
     "format" "iife"
     "minify" true
     "splitting" false -}}
{{- $bundle := resources.Get "scripts/main.js"
               | js.Build $opts
               | resources.Fingerprint -}}
```

### Requirements

1. **Hugo Extended** with esbuild support (✅ already installed v0.150.0)
2. **Entry point** - Single main.js file importing others
3. **ES6 modules** - Requires Task 2.4 (archive.js modularization)

### Potential Benefits ✅

1. **ES6 modules** - Modern `import`/`export` syntax
2. **Tree shaking** - Eliminate unused code
3. **Code splitting** - Separate bundles per page (with `splitting: true`)
4. **Smaller bundles** - Remove dead code
5. **Better maintainability** - Modular architecture
6. **Modern JS** - Use ES2017+ features

### Trade-offs ⚠️

1. **More complex** - Requires module architecture
2. **Breaking change** - Needs Task 2.4 completion
3. **Historical failure** - Previous attempt caused critical site breakage (commit d86045c → rollback f77273d)
4. **Build time** - Slightly slower than concat
5. **Debugging** - Source maps needed for development

---

## Code Splitting Analysis

### Current Page Loads

**Homepage:**
- Needs: script.js, links.js, cards-carousel.js
- Gets: All 5 files (41 KB)
- Waste: ~20 KB (archive.js + privacy.js unused)

**Archive page:**
- Needs: script.js, archive.js
- Gets: All 5 files (41 KB)
- Waste: ~15 KB (links.js, cards-carousel.js, privacy.js unused)

**Article page:**
- Needs: script.js, privacy.js
- Gets: All 5 files (41 KB)
- Waste: ~35 KB (most files unused)

### Potential with Code Splitting

**Scenario: esbuild with splitting: true**

- **Common chunk:** ~10 KB (script.js base)
- **Homepage chunk:** +15 KB (links + carousel)
- **Archive chunk:** +20 KB (archive functionality)
- **Privacy chunk:** +2 KB (privacy banner)

**Homepage load:** 25 KB (vs 41 KB) - **39% reduction**
**Archive load:** 30 KB (vs 41 KB) - **27% reduction**
**Article load:** 12 KB (vs 41 KB) - **71% reduction**

### Bundle Size After Tree Shaking

Estimated dead code in current bundle:
- Unused utility functions: ~5 KB
- Duplicate code: ~3 KB
- Verbose IIFE wrappers: ~2 KB

**Potential savings:** ~10 KB (24% reduction)

**New bundle sizes:**
- Current: 41 KB
- With tree shaking: ~31 KB
- With splitting + tree shaking: 10-30 KB per page (avg ~20 KB)

---

## Decision Matrix

| Criterion | Hugo Pipes | esbuild | Weight | Winner |
|-----------|------------|---------|--------|--------|
| **Simplicity** | 10/10 | 6/10 | 20% | Hugo Pipes |
| **Bundle size** | 6/10 | 9/10 | 25% | esbuild |
| **Maintainability** | 5/10 | 9/10 | 20% | esbuild |
| **Reliability** | 10/10 | 7/10 | 15% | Hugo Pipes |
| **Modern features** | 3/10 | 10/10 | 10% | esbuild |
| **Build speed** | 10/10 | 8/10 | 10% | Hugo Pipes |
| **Score** | **7.3** | **7.9** | | **esbuild** |

Despite esbuild scoring slightly higher, **Hugo Pipes is recommended** due to:
- Lower risk
- No breaking changes
- Already working well
- 41 KB is acceptable for modern web

---

## Recommendation

### ⏸️ DEFER esbuild implementation

**Rationale:**

1. **Current bundle is acceptable** - 41 KB is reasonable for a full-featured site
2. **Risk vs reward** - Previous modularization attempt caused critical failures
3. **Time investment** - Requires completing Task 2.4 first (~5h)
4. **Marginal gains** - ~10-20 KB savings not critical for this project
5. **Maintenance burden** - Adds complexity to build process

### ✅ Keep Hugo Pipes

**For now, because:**
- Simple and reliable
- No configuration needed
- Proven track record
- Fast builds
- Easy to debug

### 🔮 Future Migration Path

**When to reconsider esbuild:**

1. ✅ Task 2.4 completed successfully (archive.js modularized)
2. ✅ JS bundle exceeds 100 KB
3. ✅ Adding more JavaScript-heavy features
4. ✅ Team comfortable with ES6 modules
5. ✅ Need for npm packages integration

**Migration checklist:**
- [ ] Complete Task 2.4 (ES6 modularization)
- [ ] Test js.Build in development
- [ ] Verify all features work
- [ ] Measure actual bundle size reduction
- [ ] Update build documentation
- [ ] Test in production preview
- [ ] Create rollback plan

### 📝 Interim Optimizations

**Without switching to esbuild:**

1. **Manual code review** - Remove unused functions
2. **Split privacy.js** - Load only when needed
3. **Conditional loading** - Already done for archive.js endpoint
4. **Minification review** - Ensure optimal settings
5. **Defer non-critical** - Already using `defer` attribute

---

## Historical Context

### Previous Attempt (Task 2.4)

**Commit:** `d86045c feat(task-2.4): refactor archive.js into ES6 modules`

**Approach:**
- Split archive.js into 6 modules (config, sheet, panel, search, filter, renderer)
- Attempted to use js.Build with esbuild

**Result:** ❌ Critical failure
- Hero image not visible
- Cards component broken (desktop + mobile)
- Archive page not rendering

**Root cause:** Hugo Pipes resources.Concat doesn't support ES6 import/export

**Rollback:** `f77273d revert: rollback Task 2.4 ES6 modularization (critical errors)`

**Lesson learned:** esbuild requires careful planning and testing

---

## Conclusion

**Decision:** Maintain Hugo Pipes for current release
**Reason:** Stability over optimization
**Review date:** After Task 2.4 completion or when bundle exceeds 100 KB

**Status:** ✅ Documented, ⏸️ Deferred

---

**Author:** EventHorizon.mtg optimization team
**Last updated:** 2025-10-20
**Related:** Task 2.4 (ES6 modularization - postponed)
