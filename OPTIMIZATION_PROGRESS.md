# 🚀 EventHorizon MTG - Repository Optimization Workflow (UNIFIED)

**Versione Workflow**: 2.1.0 (Unified + Critical Safety Rules)
**Baseline Commit**: `e21f290` (2025-10-19 16:11:49 +0200)
**Start Date**: 2025-10-19
**Timeline Totale**: 15-17 giorni (Livello 4 opzionale)
**Strategy**: Commit per livello su `main` | Testing locale obbligatorio
**Stato generale**: NOT STARTED
**Livello critico problemi**: **NESSUNO ✓**

---

## 📋 Indice Rapido

1. [Panoramica e Obiettivi](#panoramica-e-obiettivi)
2. [Timeline Visuale](#timeline-visuale)
3. [Metriche Baseline](#metriche-baseline)
4. [LIVELLO 1 - Performance Critica](#livello-1---performance-critica-giorni-1-3)
5. [LIVELLO 2 - Maintainability](#livello-2---maintainability--modularizzazione-giorni-4-7)
6. [LIVELLO 3 - SEO & Performance Avanzata](#livello-3---seo--performance-avanzata-giorni-8-11)
7. [LIVELLO 4 - Testing & Future-proofing](#livello-4---testing--future-proofing-giorni-12-17-opzionale)
8. [Dependencies e Prerequisiti](#dependencies-e-prerequisiti)
9. [Rollback Strategy](#rollback-strategy)
10. [Metriche Finali e KPI](#metriche-finali-e-kpi)
11. [Comandi Utili](#comandi-utili)
12. [Issue Tracker](#issue-tracker)

---

## 🎯 Panoramica e Obiettivi

### Stato Attuale del Repository
- **Architettura**: Hugo Static Site Generator v0.150.0 + ITCSS + Vanilla JavaScript ES6
- **Qualità codice**: Production-ready, **nessun problema critico identificato**
- **Performance baseline**: Buona (stimato FCP ~1.2-1.5s, LCP ~2.0-2.5s)
- **Bundle size**: JS 44 KB (minified), CSS 136 KB (minified)
- **Compatibilità browser**: Modern browsers (ES6+), auto fallback per older browsers

### Obiettivi del Workflow Unificato
1. **Primario**: Ottimizzare performance e Core Web Vitals (FCP, LCP, CLS)
2. **Secondario**: Migliorare manutenibilità e scalabilità del codebase
3. **Terziario**: Implementare SEO avanzato e accessibility compliant WCAG 2.1 AAA
4. **Quaternario** (opzionale): Setup testing automatico e quality assurance

### Approccio Strategico
Questo workflow unifica due approcci complementari:
- **Performance-first** (quick wins visibili agli utenti)
- **Architecture-first** (modularizzazione per long-term maintainability)

**Risultato**: Miglioramenti progressivi e non-breaking con rollback strategy robusta.

---

## 🚨 REGOLE CRITICHE E WARNING

### REGOLA #1: PRESERVAZIONE CONTENUTI ⚠️
**PRIORITÀ ASSOLUTA: I contenuti del sito NON devono MAI essere alterati**

**Cosa NON può essere modificato**:
- ❌ Testo visibile agli utenti (titoli, descrizioni, labels, button text, alt text)
- ❌ Struttura HTML semantica che cambia il DOM content visibile
- ❌ Attributi `id` usati come anchor links (`#cards`, `#contacts`, `#links`)
- ❌ Front matter YAML nei file data (titoli, descrizioni, date)
- ❌ Contenuto markdown degli articoli

**Cosa PUÒ essere modificato**:
- ✅ Attributi tecnici (`class`, `data-*`, `aria-*`, `width`, `height`, `loading`, `decoding`)
- ✅ Struttura CSS (refactoring, modularizzazione, design tokens)
- ✅ JavaScript logic e modularizzazione (senza cambiare output DOM)
- ✅ Meta tags SEO (`<meta>`, `<link>`, Schema.org JSON-LD)
- ✅ Build configuration (Hugo config, asset pipeline)

**⚠️ PROCEDURA OBBLIGATORIA per Task 1.4 (Fix CLS)**:
Quando aggiungi `width`/`height` alle immagini:
- ✅ SOLO aggiungere attributi dimensionali
- ❌ NON modificare attributo `alt` esistente
- ❌ NON cambiare `src` path
- ✅ Se `alt=""` (decorativa), lasciare vuoto
- ✅ Se `alt="text esistente"`, NON cambiare il testo

**Esempio CORRETTO**:
```html
<!-- BEFORE -->
<img src="images/logo.webp" alt="Logo EventHorizon.mtg">

<!-- AFTER (Task 1.4) -->
<img src="images/logo.webp"
     alt="Logo EventHorizon.mtg"
     width="140"
     height="140"
     loading="lazy"
     decoding="async">
```

**Esempio SBAGLIATO**:
```html
<!-- BEFORE -->
<img src="images/logo.webp" alt="Logo EventHorizon.mtg">

<!-- ❌ AFTER - NON FARE MAI QUESTO -->
<img src="images/logo.webp"
     alt="Logo del sito EventHorizon MTG" <!-- ❌ Testo cambiato! -->
     width="140"
     height="140">
```

---

### REGOLA #2: FUNZIONAMENTO !important - ANALISI OBBLIGATORIA ⚠️

**33 flag `!important` in _cards.scss NON sono tutti rimovibili**

#### Categorie di !important per Funzionalità Critica:

##### A. **Reset Border-Radius (2x !important - CRITICI)**
```scss
/* Lines 1099, 829 */
.card__img {
  border-radius: 0 !important;
}
```
**Motivo**: Override globale `var(--radius-xl)` applicato da theme
**Rimozione**: Layout panels ROTTO (bordi arrotondati indesiderati su card stack)
**Azione**: **MANTENERE**

##### B. **Mobile Layout Horizontal (13x !important - CRITICI)**
```scss
/* Lines 1515-1562: Forcing writing-mode: horizontal-tb su mobile */
.card:not(.is-expanded) .card__overline,
.card:not(.is-expanded) .card__title,
.card:not(.is-expanded) .card__desc {
  writing-mode: horizontal-tb !important;
  text-orientation: mixed !important;
  transform: none !important;
  /* ... altri 10 override correlati ... */
}
```
**Motivo**: Desktop usa `writing-mode: vertical-rl` per testo verticale nei collapsed cards
Mobile DEVE forzare `horizontal-tb` per leggibilità
**Rimozione**: Layout mobile ROTTO (testo verticale illeggibile su schermo piccolo)
**Azione**: **MANTENERE TUTTI I 13 FLAG**

##### C. **Display Override per Background Images (1x !important - CRITICO)**
```scss
/* Line 1353 */
.card.is-expanded[data-bg-url] .card__img {
  display: none !important;
}
```
**Motivo**: Quando card usa background-image, nascondere `<img>` duplicata
**Rimozione**: Immagine duplicata visibile (regressione visiva)
**Azione**: **MANTENERE**

##### D. **Flex-basis Layout (3x !important - MEDIA PRIORITÀ)**
```scss
/* Lines 1395, 1694, 1721 */
.cards--panels .card {
  flex-basis: 25% !important;
}
```
**Motivo**: Override per forzare layout 4 cards su riga
**Rimozione**: Layout grid rotto (cards sizing errato)
**Azione**: **VALUTARE** - potenzialmente sostituibile con :where()

##### E. **Altri Override Specificity (14x !important - BASSA PRIORITÀ)**
Padding, margin, z-index per stati hover/active
**Azione**: **RIMOVIBILI** con tecniche CSS avanzate

#### Target Realistico Task 1.3:
- **Baseline**: 33 !important in _cards.scss
- **Critici NON rimovibili**: 20 flag (A+B+C categorie)
- **Rimovibili con refactoring**: 13 flag (D+E categorie)
- **Target realistico Livello 1**: 33 → **25** flag (-24%)
- **Target finale Livello 4**: 25 → **20** flag (solo critici)

**⚠️ REGOLA CRITICA**:
Prima di rimuovere QUALSIASI `!important`, testare su:
- ✅ Desktop 1920px (writing-mode vertical)
- ✅ Mobile 375px (writing-mode horizontal)
- ✅ Card expanded state
- ✅ Card collapsed state (panels)

---

### REGOLA #3: VIEWPORT E BREAKPOINT - OVERLAPS IDENTIFICATI ⚠️

**Problema**: Breakpoint attuali hanno OVERLAPS e GAPS che creano comportamenti inconsistenti

#### Overlaps Identificati:
```scss
/* OVERLAP #1: Mobile range duplicato */
@media (max-width: 47.999rem) { /* 767.98px */ }
@media (max-width: 768px)      { /* 768px - OVERLAP! */ }
/* Risultato: range 767.98px-768px coperto da ENTRAMBE le regole */

/* OVERLAP #2: Tablet definizioni multiple */
@media (max-width: 1023px) { /* 1023px */ }
@media (max-width: 64rem)  { /* 1024px (64*16) */ }
/* Risultato: 1023px vs 1024px inconsistente */
```

#### Gaps Identificati:
```scss
/* GAP #1: Manca range intermedio */
@media (max-width: 30rem)  { /* 480px */ }
@media (min-width: 48rem)  { /* 768px */ }
/* Risultato: range 481px-767px NON coperto esplicitamente */

/* GAP #2: Custom breakpoint isolato */
@media (max-width: 600px) { /* Custom intermediate */ }
/* Risultato: non allineato con altri breakpoint */
```

#### Problemi Caused by Overlaps/Gaps:
1. **Specificità conflicts**: Due regole applicano stile diverso allo stesso elemento
2. **Cascade bugs**: Ordine CSS determina quale vince (non prevedibile)
3. **Manutenzione difficile**: Developer deve ricordare 18+ breakpoint
4. **Testing overhead**: Impossibile testare tutti gli edge cases

#### Soluzione (Task 2.3):
**Standardizzare a 6 breakpoint senza overlap**:
```scss
/* Mobile (0-767px) */
@include bp-down(sm) { /* max-width: 47.9375rem (767px) */ }

/* Tablet (768px-1023px) */
@include bp(sm) { /* min-width: 48rem (768px) */ }
@include bp-down(md) { /* max-width: 63.9375rem (1023px) */ }

/* Desktop (1024px+) */
@include bp(md) { /* min-width: 64rem (1024px) */ }
```

**⚠️ VERIFICA OBBLIGATORIA dopo Task 2.3**:
```bash
# Nessun hardcoded breakpoint rimanente
grep -r "@media" assets/style/ | grep -v "bp(" | grep -v "bp-down" | wc -l
# Target: 0

# Test rendering su edge cases
# - 767px (max mobile)
# - 768px (min tablet)
# - 1023px (max tablet)
# - 1024px (min desktop)
```

---

## 📅 Timeline Visuale

```
┌──────────────────────────────────────────────────────────────────────────┐
│  LIVELLO 1: Performance Critica + Quick Wins                             │
│  ├─ Lazy load archive.js                         [1h]                    │
│  ├─ Refactor _cards.scss → 4 moduli              [3h]                    │
│  ├─ Rimozione console.log (6 occorrenze)         [30min]                 │
│  ├─ Rimozione !important strategica               [4h]                    │
│  ├─ Fix Cumulative Layout Shift                  [2h]                    │
│  └─ CI/CD optimization (fetch-depth)             [15min]                 │
│  ⏱️  TOTALE: ~11h → 1.5-2 giorni  │ PRIORITÀ: ⚠️ ALTA                    │
├──────────────────────────────────────────────────────────────────────────┤
│  LIVELLO 2: Maintainability + Modularizzazione                           │
│  ├─ Partial url-to-abs.html                      [1.5h]                  │
│  ├─ Design tokens colori (40+ hardcoded)         [3h]                    │
│  ├─ Breakpoint standardizzazione + mixins        [4h]                    │
│  ├─ Split archive.js → moduli ES6                [5h]                    │
│  ├─ Buttons.scss mixins consolidamento           [3h]                    │
│  └─ Favicon consolidation                        [1h]                    │
│  ⏱️  TOTALE: ~17.5h → 2-3 giorni  │ PRIORITÀ: 🔶 ALTA                    │
├──────────────────────────────────────────────────────────────────────────┤
│  LIVELLO 3: SEO + Performance Avanzata                                   │
│  ├─ Open Graph dinamico                          [2h]                    │
│  ├─ Schema.org esteso + BreadcrumbList           [3h]                    │
│  ├─ ARIA live regions                            [1.5h]                  │
│  ├─ Critical CSS extraction (Hugo Pipes)         [4h]                    │
│  ├─ Lighthouse CI in GitHub Actions              [2h]                    │
│  ├─ Inline styles refactoring                    [1h]                    │
│  └─ Template cleanup (taxonomy.html, terms.html) [30min]                 │
│  ⏱️  TOTALE: ~14h → 2-3 giorni  │ PRIORITÀ: 🔷 MEDIA                     │
├──────────────────────────────────────────────────────────────────────────┤
│  LIVELLO 4: Testing + Future-proofing [OPZIONALE]                        │
│  ├─ Vitest setup + unit tests (coverage >60%)    [6h]                    │
│  ├─ Axe-core accessibility tests automatici      [3h]                    │
│  ├─ Image optimization pipeline (WebP srcset)    [3h]                    │
│  ├─ Code splitting evaluation (esbuild vs Hugo)  [2h]                    │
│  ├─ Architecture Decision Records (ADR)          [2h]                    │
│  └─ E2E tests workflow critici (Playwright)      [4h] [EXTRA]            │
│  ⏱️  TOTALE: ~16-20h → 2-4 giorni  │ PRIORITÀ: 💡 BASSA (opzionale)      │
└──────────────────────────────────────────────────────────────────────────┘

TIMELINE CUMULATIVA:
├─ Core essenziale (L1+L2+L3): 7-10 giorni
└─ Completa con testing (L1+L2+L3+L4): 15-17 giorni
```

---

## 📊 Metriche Baseline

### Valori Attuali (Pre-Ottimizzazione)

| Metrica | Baseline | Metodo Misurazione | File/Path |
|---------|----------|-------------------|-----------|
| **JavaScript Bundle** | 44 KB | Minified size in `public/script/` | [bundle.min.*.js](public/script/bundle.min.32d3bb352f6d936efe3a33e618dbd1b919e27dcb05f97de5ba0c2e1c9c89ca8a.js) |
| **CSS Bundle** | 136 KB | Minified size in `public/style/` | [bundle.min.*.css](public/style/bundle.min.fd86808b78ec192db65d41decf8483f88757a82d3fba5d92e0c181e6ae2a8ddc.css) |
| **JavaScript Source** | 2,555 righe | Total lines across 5 modules | [assets/scripts/](assets/scripts/) |
| **CSS Source** | ~4,300 righe | Total SCSS lines (21 files) | [assets/style/](assets/style/) |
| **Media Queries** | 119 occorrenze | `@media` grep count | SCSS files |
| **Console Logs** | 6 statements | `console.*` grep in JS | [archive.js](assets/scripts/archive.js) |
| **Flag !important** | 51 occorrenze | Total across SCSS | [_cards.scss](assets/style/06-components/_cards.scss) (33), [_archive.scss](assets/style/07-pages/_archive.scss) (14) |
| **Hugo Partials** | 6 partials | File count | [layouts/partials/](layouts/partials/) |
| **_cards.scss Lines** | 1,770 righe | Single monolithic file | [_cards.scss](assets/style/06-components/_cards.scss) |
| **archive.js Lines** | 1,347 righe | Single monolithic file | [archive.js](assets/scripts/archive.js) |
| **Build Time (CI/CD)** | ~3 min | GitHub Actions estimate | [.github/workflows/build.yml](.github/workflows/build.yml) |

### Target Post-Ottimizzazione Completa

| Metrica | Target L1 | Target L2 | Target L3 | Target L4 | Delta Totale |
|---------|-----------|-----------|-----------|-----------|--------------|
| **JavaScript Bundle** | 24 KB | 22 KB | 20 KB | 18 KB | **-59%** ✅ |
| **CSS Bundle** | 130 KB | 120 KB | 110 KB | 105 KB | **-23%** ✅ |
| **Media Queries** | <110 | <95 | <90 | <90 | **-24%** |
| **Console Logs** | 0 (prod) | 0 | 0 | 0 | **-100%** |
| **Flag !important** | ~43 | ~30 | ~25 | ~20 | **-60%** (realistico, 20 sono critici) |
| **Hugo Partials** | 7 | 10 | 11 | 12 | **+100%** (modularità) |
| **_cards.scss** | 4 files (~450 ea) | 4 files | 4 files | 4 files | **Modularizzato** ✅ |
| **archive.js** | 1 file (gated) | 5 moduli ES6 | 5 moduli | 5 moduli | **Modularizzato** ✅ |
| **Build Time (CI/CD)** | ~1.5 min | ~1.5 min | ~1.5 min | ~2 min | **-50%** (L1-L3) |
| **Lighthouse Performance** | 90+ | 92+ | 95+ | 95+ | **+10-12%** |
| **CLS Score** | <0.1 | <0.1 | <0.05 | <0.05 | **-67%** |
| **SEO Score** | ~88 | ~90 | 95+ | 95+ | **+8%** |
| **Accessibility Score** | ~92 | ~94 | 98+ | 100 | **+9%** |
| **Test Coverage** | - | - | - | >60% | **NEW** |

---

## 🎯 LIVELLO 1 - PERFORMANCE CRITICA (Giorni 1-3)

**Obiettivo**: Miglioramenti immediati visibili agli utenti (Core Web Vitals) + Quick wins tecnici
**Rischio**: Basso
**Impatto**: Alto (percezione utente immediata)
**Commit finale**: `feat(level-1): optimize performance - lazy load JS, refactor cards CSS, fix CLS, remove debug code`

---

### Task 1.1: Lazy Load archive.js ⚡ [PRIORITÀ CRITICA]

- [ ] **Completato**

**Problema identificato**:
`archive.js` (1.347 righe, 52% del bundle totale) viene caricato su **tutte le pagine** ma eseguito solo su `/archive/`. Spreco di 20+ KB su homepage e articoli.

**File da modificare**:
- [`layouts/partials/scripts.html`](layouts/partials/scripts.html)

**Implementazione**:

```html
<!-- BEFORE: Caricamento incondizionato -->
{{ $bundle := resources.Concat "bundle.js" ... }}

<!-- AFTER: Caricamento condizionale -->
{{ if eq .Section "archive" }}
  {{ $bundle := resources.Concat "bundle-archive.js" (slice ... "archive.js") }}
{{ else }}
  {{ $bundle := resources.Concat "bundle.js" (slice ... /* no archive.js */) }}
{{ end }}
```

**Strategia**:
1. Verificare che `archive.js` ha già gate check interno (linea 13: `if (!document.querySelector('section.archive')) return;`) ✓
2. Opzione A: Mantener gate esistente + aggiungere `<script>` tag condizionale in layout `archive/single.html`
3. Opzione B: Rimuovere da bundle globale, caricare separatamente solo su pagina archive
4. **Raccomandato**: Opzione B (massima riduzione bundle)

**Tempo stimato**: 1 ora

**Verifica**:
```bash
# 1. Build locale
hugo server

# 2. Test homepage: verificare bundle.js NON contiene archive.js
# Apri DevTools → Network → bundle.js → cercare "archive-sheet"
# Risultato atteso: NOT FOUND

# 3. Test /archive/: verificare funzionalità complete
# - Bottom-sheet mobile (drag, close)
# - Ricerca con autocomplete
# - Filtro tipo contenuto
# - Paginazione
# - Focus trap e ARIA

# 4. Misurare bundle size
ls -lh public/script/*.js
# Atteso: bundle.js ~24 KB (da 44 KB)
```

**Best Practice Applicata**:
- ✅ Code splitting per route
- ✅ Riduzione First Load JS
- ✅ Preserva funzionalità esistente (no breaking change)

**Note**:
```
[Data completamento]: __________
[Bundle size prima]: 44 KB
[Bundle size dopo]: _____ KB
[Riduzione]: _____ KB (_____ %)
[Verifica funzionalità archive]: ☐ Passed
[Verifica homepage non impattata]: ☐ Passed
```

---

### Task 1.2: Refactoring _cards.scss → 4 Moduli 📦 [PRIORITÀ ALTA]

- [ ] **Completato**

**Problema identificato**:
File monolitico [`_cards.scss`](assets/style/06-components/_cards.scss) con 1.770 righe (40% del CSS totale), difficile da mantenere, con 33 flag `!important` e logiche duplicate.

**File da creare**:
1. `assets/style/06-components/_cards-base.scss` (~400 righe)
2. `assets/style/06-components/_cards-variants.scss` (~500 righe)
3. `assets/style/06-components/_cards-stack.scss` (~600 righe)
4. `assets/style/06-components/_cards-responsive.scss` (~270 righe)

**File da modificare**:
- [`assets/style/main.scss`](assets/style/main.scss) - aggiungere import dei nuovi moduli
- [`assets/style/06-components/_cards.scss`](assets/style/06-components/_cards.scss) - eliminare (contenuto splittato)

**Strategia di Split**:

#### **_cards-base.scss** (Stili core e layout grid)
```scss
/* Contenuto da estrarre dalle righe 1-450 circa */
- .cards (sezione container)
- .cards__inner
- .cards__header, .cards__title, .cards__view-all
- .cards__grid
- .card (base styles: border, border-radius, background)
- .card__media, .card__img
- .card__body, .card__overline, .card__title, .card__desc
- .card__footer, .card__actions, .card__meta
```

#### **_cards-variants.scss** (Varianti tipo contenuto)
```scss
/* Contenuto da estrarre dalle righe 450-950 circa */
- .card--video (specifico per video cards)
- .card--content (specifico per articoli)
- .card--portal (specifico per portali esterni)
- .card--stack-item (item dentro carousel/stack)
- .card__play (icona play video)
- .card__badge (badge "Nuovo", "Featured", etc.)
- Hover states per varianti
```

#### **_cards-stack.scss** (Layout panels/stack con ID selectors)
```scss
/* Contenuto da estrarre dalle righe 950-1550 circa */
- #cards.cards--stack (container ID-based)
- #cards.cards--panels (layout specifico)
- .cards--panels .card (override specifici)
- .is-expanded, .is-active (stati interattivi)
- Panel positioning e z-index
- Mobile bottom-sheet integration styles
```

#### **_cards-responsive.scss** (Media queries consolidate)
```scss
/* Contenuto da estrarre dalle righe 1550-1770 circa */
- @media (max-width: 47.999rem) { /* mobile overrides */ }
- @media (min-width: 48rem) { /* tablet */ }
- @media (min-width: 64rem) { /* desktop */ }
- @media (min-width: 80rem) { /* xl desktop */ }
- Mobile-specific: writing-mode overrides, absolute positioning
```

**Tempo stimato**: 3 ore

**Procedimento**:
1. ⚠️ **BACKUP OBBLIGATORIO**: `cp _cards.scss _cards.scss.backup` (locale, non committare)
2. Creare 4 nuovi file vuoti
3. Copiare blocchi di codice nei rispettivi file seguendo la strategia sopra
4. Verificare che ogni selettore appaia SOLO UNA VOLTA (no duplicati)
5. Aggiornare `main.scss`:
   ```scss
   /* BEFORE */
   @import "06-components/cards";

   /* AFTER */
   @import "06-components/cards-base";
   @import "06-components/cards-variants";
   @import "06-components/cards-stack";
   @import "06-components/cards-responsive";
   ```
6. **Build test**: `hugo server` → verificare 0 errori SCSS
7. **Screenshot comparison**: Prima/dopo su homepage e /archive/
8. Eliminare `_cards.scss` originale solo dopo verifica completa

**Verifica**:
```bash
# 1. Build senza errori
hugo server
# Verificare console: 0 SCSS errors

# 2. Confronto visivo pixel-by-pixel
# Homepage:
#   - Cards grid layout identico
#   - Hover states funzionanti
#   - Spacing/padding invariato
#
# /archive/ page:
#   - Stack panels layout identico
#   - Expanded state corretto
#   - Mobile bottom-sheet rendering OK

# 3. Screenshot comparison (manuale o tool)
# - Prima: Screenshot homepage + archive
# - Dopo: Confrontare pixel-by-pixel
# - Tool: https://www.diffchecker.com/image-diff/

# 4. Verificare file sizes
wc -l assets/style/06-components/_cards-*.scss
# Output atteso:
#  400 _cards-base.scss
#  500 _cards-variants.scss
#  600 _cards-stack.scss
#  270 _cards-responsive.scss
# 1770 total
```

**⚠️ ATTENZIONE - Analisi !important Richiesta**:
Prima di rimuovere `!important` (Task 1.3), documentare perché esiste:

```scss
/* ESEMPIO ANALISI */
/* BEFORE: .card { color: red !important; } */
/* WHY: Necessario per override .cards--panels .card { color: blue; }
   che ha specificità maggiore per via di #cards ID selector */
/* SOLUZIONE Task 1.3: Aumentare specificità o rimuovere ID selector */
```

**Note**:
```
[Data completamento]: __________
[Righe per file]:
  - _cards-base.scss: _____ righe
  - _cards-variants.scss: _____ righe
  - _cards-stack.scss: _____ righe
  - _cards-responsive.scss: _____ righe
  - TOTALE: _____ righe (target: 1770)
[Build errors]: _____ (target: 0)
[Visual regression]: ☐ None detected
[Verifica visiva utente]: ☐ Approvato ⚠️ CRITICO
```

---

### Task 1.3: Rimozione Strategica flag !important 🎯 [PRIORITÀ ALTA]

- [ ] **Completato**

**Problema identificato**:
51 flag `!important` totali nel CSS (33 in _cards.scss, 14 in _archive.scss, 4 in _reset.scss). Anti-pattern che rende difficile l'override e indica problemi di specificità.

**File da modificare**:
- [`assets/style/06-components/_cards-base.scss`](assets/style/06-components/_cards-base.scss) (nuovo)
- [`assets/style/06-components/_cards-stack.scss`](assets/style/06-components/_cards-stack.scss) (nuovo)
- [`assets/style/07-pages/_archive.scss`](assets/style/07-pages/_archive.scss)
- **NON toccare**: `_reset.scss` (4 flag sono CSS reset legittimi)

**Target** (aggiornati in base ad analisi approfondita - vedi REGOLA #2):
- **Livello 1**: Da 51 → ~43 flag totali (-16%) [33→25 in _cards.scss, 14→13 in _archive.scss]
- **Livello 2**: 43 → ~30 flag (-30%)
- **Livello 3**: 30 → ~25 flag (-41%)
- **Livello 4**: 25 → ~20 flag (-60%) [solo !important critici funzionali]

**⚠️ NOTA CRITICA**: 20 dei 33 flag in _cards.scss sono FUNZIONALMENTE NECESSARI (vedi REGOLA #2 sopra).
Rimozione completa impossibile senza rompere layout mobile (writing-mode) e panels.

**Metodologia**:

#### Fase A: Analisi e Documentazione (1h)
Per ogni `!important` esistente:
1. Identificare il selettore che forza l'override
2. Documentare la causa root (ID selector? Specificità errata?)
3. Proporre soluzione senza `!important`

Esempio template:
```scss
/* ============================================
   IMPORTANT FLAG ANALYSIS #1
   ============================================
   LOCATION: _cards-stack.scss line 145

   BEFORE:
   .card { padding: 0 !important; }

   WHY NEEDED:
   Override viene da #cards.cards--panels .card { padding: 1rem; }
   ID selector #cards ha specificità (1,0,0) che batte class (0,1,0)

   ROOT CAUSE:
   Uso di ID selector invece di class per container

   SOLUTION:
   Opzione A: Aumentare specificità senza !important
     #cards.cards--panels .card.is-active { padding: 0; }
   Opzione B: Rimuovere ID selector (breaking change risk)
     .cards.cards--panels .card { padding: 1rem; }
   Opzione C: Usare :where() per ridurre specificità parent
     :where(#cards).cards--panels .card { padding: 1rem; }

   CHOSEN: Opzione A (safe, non-breaking)
   ============================================ */
```

#### Fase B: Implementazione (3h)
1. Applicare soluzioni una per volta
2. Testare rendering dopo ogni rimozione
3. Rollback immediato se visual regression

**Tecniche di Rimozione**:

**Tecnica 1**: Aumentare specificità parent
```scss
/* BEFORE */
.card { color: red !important; }

/* AFTER */
.cards--panels .card { color: red; } /* Più specifico */
```

**Tecnica 2**: Usare `:where()` per abbassare specificità
```scss
/* BEFORE */
#cards.cards--panels .card { padding: 1rem; }
.card { padding: 0 !important; } /* Override necessario */

/* AFTER */
:where(#cards).cards--panels .card { padding: 1rem; } /* Specificità (0,2,0) */
.card.is-active { padding: 0; } /* Ora funziona senza !important */
```

**Tecnica 3**: Riordinare regole CSS (cascade)
```scss
/* BEFORE */
.card { color: blue; }
.card--special { color: red !important; } /* Forzato */

/* AFTER (se stesso peso specificità) */
.card--special { color: red; } /* Vince per ordine */
.card { color: blue; }
```

**Tecnica 4**: Usare `:where()` per preservare ID (mantiene anchor links)
```scss
/* BEFORE - ID ha alta specificità che forza !important */
#cards.cards--panels .card { padding: 1rem; }  /* (1,2,1) specificità */
.card { padding: 0 !important; }  /* Necessario per override */

/* AFTER - :where() riduce specificità mantenendo ID */
:where(#cards).cards--panels .card { padding: 1rem; }  /* (0,2,1) specificità */
.card.is-active { padding: 0; }  /* Ora funziona senza !important */

/* ⚠️ VANTAGGI:
   - ID rimane in HTML (anchor link #cards funziona)
   - Specificità ridotta permette override senza !important
   - No breaking change in template */
```

**⚠️ TECNICA RIMOSSA**: NON cambiare `id="cards"` a `class` - romperebbe anchor navigation `/#cards`

**Tempo stimato**: 4 ore totali (1h analisi + 3h implementazione)

**Verifica**:
```bash
# 1. Contare !important rimanenti
grep -r "!important" assets/style/06-components/_cards-*.scss assets/style/07-pages/_archive.scss | wc -l
# Target: <30 (da 51)

# 2. Build senza errori
hugo server

# 3. Test visivo approfondito
# - Cards stack panels (mobile/desktop)
# - Expanded state
# - Hover states
# - Archive bottom-sheet
# - Tutti i breakpoint (375px, 768px, 1024px, 1440px)

# 4. Screenshot comparison
# CRITICO: Verificare identico rendering pixel-by-pixel
```

**⚠️ REGOLE CRITICHE**:
- ✅ Rimuovere `!important` SOLO se rendering identico
- ✅ Testare su tutti i breakpoint
- ✅ Documentare OGNI rimozione con commento
- ❌ NON rimuovere `!important` da _reset.scss (CSS reset legittimi)
- ❌ NON fare refactoring ID → class in questo livello (troppo rischioso)

**Note**:
```
[Data completamento]: __________
[!important count prima]: 51 (33 in _cards.scss, 14 in _archive.scss, 4 in _reset.scss)
[!important count dopo]: _____ (target: ~43, di cui ~25 in _cards.scss)
[!important rimossi]: _____ (target realistico: ~8)
[!important documentati ma MANTENUTI (critici)]: _____ (expected: ~20 in _cards.scss)
[Visual regression detected]: ☐ None ☐ Minor ☐ Major
[Verifica visiva utente]: ☐ Approvato ⚠️ CRITICO
[Rollback necessario]: ☐ Yes ☐ No
[Test writing-mode mobile (375px)]: ☐ Horizontal text readable
[Test writing-mode desktop (1920px)]: ☐ Vertical text in collapsed cards
```

---

### Task 1.4: Fix Cumulative Layout Shift (CLS) 📐 [PRIORITÀ ALTA]

- [ ] **Completato**

**🚨 REGOLA CRITICA - PRESERVAZIONE CONTENUTI**:
**Questa task aggiunge SOLO attributi tecnici (`width`, `height`, `loading`, `decoding`)**
**NON modificare MAI**:
- ❌ Attributo `alt` esistente (anche se sembra "migliorabile")
- ❌ Attributo `src` path
- ❌ Testo visibile o semantica HTML

Vedere **REGOLA #1** sopra per esempi CORRETTO vs SBAGLIATO.

---

**Problema identificato**:
Immagini senza attributi `width`/`height` espliciti causano layout shift durante caricamento. CLS score stimato ~0.15 (target: <0.1).

**File da modificare**:
- [`layouts/index.html`](layouts/index.html)
- [`layouts/_default/list.html`](layouts/_default/list.html)
- [`layouts/article/single.html`](layouts/article/single.html) (se presente)
- [`layouts/partials/meta-head.html`](layouts/partials/meta-head.html) (hero preload)

**Implementazione**:

```html
<!-- BEFORE: Missing dimensions -->
<img src="{{ $imageURL }}" alt="{{ $altText }}" loading="lazy">

<!-- AFTER: Explicit dimensions -->
<img src="{{ $imageURL }}"
     alt="{{ $altText }}"
     width="720"
     height="1280"
     loading="lazy"
     decoding="async">
```

**Strategia**:

#### 1. Hero Images (index.html)
```html
<!-- Line ~25: Hero background -->
<img class="hero__bg"
     src="{{ $heroBg }}"
     alt="Background hero section"
     width="1920"
     height="1080"
     fetchpriority="high"  <!-- ⚠️ Non lazy! -->
     decoding="async">
```

#### 2. Cards Thumbnails (index.html righe ~220)
```html
<!-- Card image placeholder -->
<img class="card__img"
     src="images/cards/fblthp_placeholder.webp"
     width="720"
     height="1280"
     alt="Placeholder immagine contenuto"  <!-- ⚠️ Era vuoto! -->
     loading="lazy"
     decoding="async">
```

#### 3. Archive Items (list.html)
Verificare se images rendered in HTML o via JavaScript:
- Se HTML: aggiungere width/height
- Se JS (probabile da archive.js): aggiungere in `renderItem()` function

```javascript
// In archive.js renderItem() function
const img = document.createElement('img');
img.src = item.thumb;
img.width = 720;
img.height = 1280;
img.loading = 'lazy';
img.decoding = 'async';
```

#### 4. Article Cover Images (se presente)
```html
<img class="article__cover"
     src="{{ .Params.cover }}"
     width="1200"
     height="630"  <!-- OG image ratio -->
     alt="{{ .Params.coverAlt | default .Title }}"
     loading="lazy">
```

**Tempo stimato**: 2 ore

**Verifica**:
```bash
# 1. Build locale
hugo server

# 2. Lighthouse audit (Chrome DevTools)
# - Apri homepage in incognito
# - DevTools → Lighthouse → Mobile
# - Run audit
# - Verificare CLS < 0.1 (target: <0.05 ideale)

# 3. Test Network Throttling
# DevTools → Network → Slow 3G
# Ricaricare homepage
# Verificare: NO layout shift durante caricamento immagini

# 4. Verificare attributi applicati
# DevTools → Elements → Cercare <img> tags
# Confermare: TUTTI hanno width + height
```

**Best Practices Applicate**:
- ✅ `width`/`height` preservano aspect ratio (non forzano dimensione effettiva)
- ✅ CSS `img { max-width: 100%; height: auto; }` rende responsive
- ✅ `fetchpriority="high"` su hero (LCP optimization)
- ✅ `loading="lazy"` su below-fold images
- ✅ `decoding="async"` previene blocking del main thread

**Metriche Target**:
- CLS: da ~0.15 → <0.1 (ideale <0.05)
- LCP: miglioramento ~10-15% (hero ottimizzato)

**Note**:
```
[Data completamento]: __________
[Immagini modificate]: _____ immagini
[CLS score prima]: _____ (stimato ~0.15)
[CLS score dopo]: _____ (target: <0.1)
[Lighthouse Performance score]: _____
[Visual regression]: ☐ None detected
[Verifica Lighthouse]: ☐ Passed (CLS < 0.1)
```

---

### Task 1.5: Rimozione console.log Statements 🧹 [QUICK WIN]

- [ ] **Completato**

**Problema identificato**:
6 `console.log` statements in produzione ([`archive.js`](assets/scripts/archive.js)). Debug code che non dovrebbe essere in bundle production.

**File da modificare**:
- [`assets/scripts/archive.js`](assets/scripts/archive.js)

**Strategia**:

#### Opzione A: Rimozione Diretta (Semplice)
```javascript
// BEFORE
console.log('Archive initialized', data);

// AFTER
// Rimosso completamente
```

#### Opzione B: Debug Flag Condizionale (Raccomandato)
```javascript
// All'inizio di archive.js (dopo line 12)
const DEBUG = window.location.hostname === 'localhost' || window.location.search.includes('debug=true');

// Sostituire ogni console.log
// BEFORE
console.log('Archive initialized', data);

// AFTER
if (DEBUG) console.log('Archive initialized', data);
```

**Vantaggi Opzione B**:
- ✅ Mantiene debug capability in development
- ✅ Zero output in produzione
- ✅ Attivabile via query param `?debug=true` su prod se necessario

**Locations esatte** (da grep output):
```
archive.js - 6 occorrenze totali
Cercare pattern: console.(log|warn|error|info|debug)
```

**Tempo stimato**: 30 minuti

**Verifica**:
```bash
# 1. Rimuovere tutte le occorrenze
# Metodo automatico:
# sed -i '/console\.\(log\|warn\|info\|debug\)/d' assets/scripts/archive.js
# ⚠️ ATTENZIONE: Fare backup prima!

# Metodo manuale (raccomandato):
# Aprire archive.js, cercare "console.", rimuovere/wrappare

# 2. Verificare 0 occorrenze
grep -n "console\." assets/scripts/archive.js
# Output atteso: (vuoto) o solo wrapper con DEBUG flag

# 3. Build e test
hugo server

# 4. Test funzionalità archive
# - Aprire /archive/
# - Aprire Console DevTools
# - Verificare: 0 console output (se opzione A)
# - Verificare: output presente solo se localhost (se opzione B)

# 5. Test production build
hugo --minify
# Verificare bundle.min.js non contiene "console.log"
grep "console\.log" public/script/bundle.min.*.js
# Output atteso: (vuoto)
```

**Note**:
```
[Data completamento]: __________
[Opzione scelta]: ☐ A (rimozione diretta) ☐ B (debug flag)
[console.* rimossi]: 6
[Verifica grep]: ☐ 0 occorrenze
[Bundle production check]: ☐ Clean
```

---

### Task 1.6: Ottimizzazione CI/CD Workflow ⚙️ [QUICK WIN]

- [ ] **Completato**

**Problema identificato**:
GitHub Actions workflow usa `fetch-depth: 0` che clona l'intera cronologia Git (~50-100 commit inutili). Rallenta build CI/CD di ~1-1.5 min.

**File da modificare**:
- [`.github/workflows/build.yml`](.github/workflows/build.yml)

**Implementazione**:

```yaml
# BEFORE
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 0  # ❌ Clona TUTTA la cronologia

# AFTER
- name: Checkout
  uses: actions/checkout@v4
  with:
    fetch-depth: 1  # ✅ Solo ultimo commit (shallow clone)
```

**⚠️ VERIFICA PREREQUISITI**:
Assicurarsi che il workflow NON usi:
- ❌ `git log` per generare changelog (necessita cronologia)
- ❌ `git describe --tags` (necessita tag history)
- ❌ Comparazione tra commit (diff multi-commit)

Se usa queste feature, `fetch-depth: 1` può romperle.

**Alternativa Sicura**:
```yaml
fetch-depth: 5  # Ultimi 5 commit (compromesso)
```

**Tempo stimato**: 15 minuti

**Verifica**:
```bash
# 1. Modificare file localmente
# Edit .github/workflows/build.yml line ~20

# 2. Commit e push
git add .github/workflows/build.yml
git commit -m "ci: optimize checkout fetch-depth for faster builds"
git push

# 3. Monitorare GitHub Actions
# Aprire: https://github.com/eventhorizon-mtg/eventhorizon-mtg.github.io/actions
# Verificare workflow run

# 4. Verificare tempi di build
# BEFORE: ~3 min (stimato)
# AFTER: ~1.5 min (target)

# 5. Verificare build success
# ✅ Deploy completato senza errori
# ✅ Sito funzionante su GitHub Pages
```

**Metriche**:
- Build time reduction: ~50% (da 3min → 1.5min)
- Git clone time: ~80% riduzione
- Network data transfer: -90%

**Note**:
```
[Data completamento]: __________
[Build time prima]: _____ min (verificare da Actions history)
[Build time dopo]: _____ min
[Riduzione]: _____ min (_____ %)
[CI/CD run URL]: __________
[Build status]: ☐ Success ☐ Failed
```

---

### ✅ Checkpoint Livello 1

**Completamento Prerequisiti**:

- [ ] **Tutte le task 1.1 - 1.6 completate e verificate**
- [ ] **Build produzione senza errori**: `hugo --minify` → exit code 0
- [ ] **Test visivo approvato dall'utente** (screenshot comparison homepage + archive)
- [ ] **Lighthouse audit eseguito**: Performance >90, CLS <0.1
- [ ] **Bundle size verificato**: JS <25 KB, CSS <130 KB
- [ ] **No console errors** in DevTools (tutte le pagine)
- [ ] **Cross-browser test**: Chrome, Firefox, Safari (mobile + desktop)

**Git Workflow**:

```bash
# 1. Verificare stato clean
git status
# Output atteso: modified files only (no untracked)

# 2. Stage all changes
git add .

# 3. Commit finale livello 1
git commit -m "feat(level-1): optimize performance - lazy load JS, refactor cards CSS, fix CLS, remove debug code

CHANGES:
- Lazy load archive.js (bundle -20 KB on homepage)
- Refactor _cards.scss into 4 modules (improved maintainability)
- Remove 21 !important flags (from 51 to 30)
- Fix Cumulative Layout Shift (CLS <0.1)
- Remove 6 console.log statements
- Optimize CI/CD fetch-depth (build time -50%)

METRICS:
- JS bundle: 44 KB → 24 KB (-45%)
- CSS bundle: 136 KB → 130 KB (-4%)
- Build time: ~3 min → ~1.5 min (-50%)
- CLS score: ~0.15 → ~0.05 (-67%)
- Lighthouse Performance: ~85 → 90+

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Creare tag snapshot
git tag -a v1.0-optimization-level-1 -m "Optimization Level 1 Complete - Performance Critical"

# 5. Push con tags
git push origin main
git push origin v1.0-optimization-level-1

# 6. Verificare deploy GitHub Pages
# URL: https://eventhorizon-mtg.github.io/
# Controlli:
# - Sito caricato correttamente
# - Nessun errore console
# - Performance percepita migliorata
```

**Metriche Finali Livello 1** (da compilare):

| Metrica | Baseline | Target L1 | Effettivo L1 | ✅/❌ |
|---------|----------|-----------|--------------|-------|
| JS Bundle | 44 KB | 24 KB | _____ KB | ☐ |
| CSS Bundle | 136 KB | 130 KB | _____ KB | ☐ |
| Build Time CI/CD | ~3 min | ~1.5 min | _____ min | ☐ |
| CLS Score | ~0.15 | <0.1 | _____ | ☐ |
| Lighthouse Performance | ~85 | 90+ | _____ | ☐ |
| !important count | 51 | ~30 | _____ | ☐ |
| console.log count | 6 | 0 | _____ | ☐ |

**Date**:
- Inizio previsto: __________
- Completamento previsto: __________ (2-3 giorni da inizio)
- Completamento effettivo: __________

---

## 🔶 LIVELLO 2 - MAINTAINABILITY + MODULARIZZAZIONE (Giorni 4-7)

**Obiettivo**: Migliorare manutenibilità, ridurre duplicazione, applicare DRY principles
**Rischio**: Medio (refactoring strutturale)
**Impatto**: Alto (scalabilità long-term)
**Commit finale**: `feat(level-2): improve maintainability - DRY principles, design tokens, SCSS architecture, JS modularization`

---

### Task 2.1: Partial url-to-abs.html 🔗 [DRY PRINCIPLE]

- [ ] **Completato**

**Problema identificato**:
Pattern di normalizzazione URL (absolute vs relative) duplicato 5+ volte in template diversi.

**Occorrenze duplicate**:
1. [`layouts/index.html`](layouts/index.html) - linee 77-81, 123, 254-257, 309, 318
2. [`layouts/partials/meta-head.html`](layouts/partials/meta-head.html) - linea 23
3. [`layouts/partials/schema-org.html`](layouts/partials/schema-org.html) - linee 18-20
4. [`layouts/partials/versioned-url.html`](layouts/partials/versioned-url.html) - linea 26 (simile)

**Pattern duplicato**:
```html
{{ if hasPrefix $url "http" }}
  {{ $absURL = $url }}
{{ else }}
  {{ $absURL = ($url | absURL) }}
{{ end }}
```

**File da creare**:
- `layouts/partials/helpers/url-to-abs.html`

**Implementazione**:

```html
{{- /*
  Partial: url-to-abs.html
  Normalizes URL to absolute format.

  Usage:
    {{ $absURL := partial "helpers/url-to-abs.html" "images/hero.webp" }}
    {{ $absURL := partial "helpers/url-to-abs.html" .Params.thumbnail }}

  Input: String (URL che può essere relativa o già assoluta)
  Output: String (URL sempre assoluta)
*/ -}}

{{- $input := . -}}
{{- $output := "" -}}

{{- if $input -}}
  {{- $inputStr := printf "%v" $input -}}
  {{- $lowerInput := lower $inputStr -}}

  {{- if or (hasPrefix $lowerInput "http://") (hasPrefix $lowerInput "https://") -}}
    {{- /* Already absolute */ -}}
    {{- $output = $inputStr -}}
  {{- else if hasPrefix $lowerInput "//" -}}
    {{- /* Protocol-relative URL */ -}}
    {{- $output = printf "https:%s" $inputStr -}}
  {{- else -}}
    {{- /* Relative URL - make absolute */ -}}
    {{- $output = $inputStr | absURL -}}
  {{- end -}}
{{- end -}}

{{- return $output -}}
```

**Refactoring Templates**:

#### index.html (5 occorrenze)
```html
<!-- BEFORE (line 77-81) -->
{{ $thumbURL := "" }}
{{ if hasPrefix $t "http" }}{{ $thumbURL = $t }}{{ else }}{{ $thumbURL = ($t | absURL) }}{{ end }}

<!-- AFTER -->
{{ $thumbURL := partial "helpers/url-to-abs.html" $t }}
```

#### meta-head.html
```html
<!-- BEFORE (line 23) -->
{{ if hasPrefix .Params.ogImage "http" }}
  {{ $ogImage = .Params.ogImage }}
{{ else }}
  {{ $ogImage = (.Params.ogImage | absURL) }}
{{ end }}

<!-- AFTER -->
{{ $ogImage := partial "helpers/url-to-abs.html" .Params.ogImage }}
```

#### schema-org.html
```html
<!-- BEFORE (lines 18-20) -->
{{ if hasPrefix .Params.image "http" }}{{ $image = .Params.image }}{{ else }}{{ $image = (.Params.image | absURL) }}{{ end }}

<!-- AFTER -->
{{ $image := partial "helpers/url-to-abs.html" .Params.image }}
```

**Tempo stimato**: 1.5 ore

**Verifica**:
```bash
# 1. Creare partial
mkdir -p layouts/partials/helpers
# Creare file url-to-abs.html

# 2. Refactoring template (uno alla volta)
# Sostituire occorrenze in index.html
# Build test: hugo server → verificare 0 errori

# 3. Sostituire in meta-head.html
# Build test: hugo server

# 4. Sostituire in schema-org.html
# Build test: hugo server

# 5. Verificare rendering identico
# - Homepage: immagini cards caricate correttamente
# - View-source: meta og:image URL assoluto
# - Schema.org: image URL assoluto

# 6. Test edge cases
# URL già assoluto: "https://example.com/image.jpg" → invariato
# URL relativo: "images/hero.webp" → "https://eventhorizon-mtg.github.io/images/hero.webp"
# Protocol-relative: "//cdn.example.com/image.jpg" → "https://cdn.example.com/image.jpg"
```

**Benefici**:
- ✅ DRY: codice duplicato ridotto da 5+ occorrenze a 1 partial
- ✅ Manutenibilità: modifiche future in un solo punto
- ✅ Testabilità: logica isolata e riutilizzabile
- ✅ Leggibilità: template più puliti

**Note**:
```
[Data completamento]: __________
[Occorrenze sostituite]: _____ / 5+
[Build errors]: _____ (target: 0)
[Rendering verifica]: ☐ Identico
```

---

### Task 2.2: Design System - Mappatura Colori Hardcoded 🎨 [DESIGN TOKENS]

- [ ] **Completato**

**Problema identificato**:
40+ colori hardcoded (hex values) in [`_buttons.scss`](assets/style/06-components/_buttons.scss) bypassano il design system. Inconsistenza e difficoltà manutenzione brand colors.

**File da modificare**:
1. [`assets/style/01-settings/_tokens.scss`](assets/style/01-settings/_tokens.scss) - aggiungere sezione brand colors
2. [`assets/style/06-components/_buttons.scss`](assets/style/06-components/_buttons.scss) - sostituire hex con token

**Colori Hardcoded Identificati** (da analisi precedente):

#### YouTube Button
```scss
/* CURRENT (_buttons.scss lines ~106-115) */
.btn--yt {
  --btn-bg: #b90025;      /* YouTube red */
  --btn-color: #ffffff;   /* White */
  --btn-border: #212121;  /* Dark gray */
}
```

#### Scryfall Button (palette completa)
```scss
/* CURRENT (_buttons.scss lines ~120-135) */
.btn--scryfall {
  /* 5 colori hex hardcoded */
  background: linear-gradient(135deg, #786076, #947a92, #ae7f9c, #bc979d, #d2d2d2);
}
```

#### Moxfield Button
```scss
/* CURRENT (_buttons.scss lines ~140-150) */
.btn--moxfield {
  /* Gradient con 2 colori */
  background: linear-gradient(135deg, #3c2161, #d44071);
}
```

#### Archidekt Button
```scss
/* CURRENT (_buttons.scss lines ~155-170) */
.btn--archidekt {
  /* 6 colori hex hardcoded */
  --btn-bg: #d9d9d9;
  --btn-bg-hover: #cbcbcb;
  --btn-accent: #ffa90a;
  --btn-accent-hover: #f79c00;
  --btn-color: #333333;
  --btn-border: #292929;
}
```

#### Teal/Primary Variants
```scss
/* CURRENT (_buttons.scss lines ~180-200) */
.btn--teal {
  --btn-bg: #14b8a6;  /* Hardcoded teal */
}
```

**Implementazione**:

#### Step 1: Aggiungere Brand Tokens (_tokens.scss)

```scss
/* ============================================
   BRAND COLORS - External Platforms
   Colori ufficiali per integrazioni terze parti
   ============================================ */

/* YouTube */
--color-brand-youtube-red: #b90025;
--color-brand-youtube-dark: #212121;

/* Scryfall */
--color-brand-scryfall-1: #786076;
--color-brand-scryfall-2: #947a92;
--color-brand-scryfall-3: #ae7f9c;
--color-brand-scryfall-4: #bc979d;
--color-brand-scryfall-5: #d2d2d2;

/* Moxfield */
--color-brand-moxfield-dark: #3c2161;
--color-brand-moxfield-pink: #d44071;

/* Archidekt */
--color-brand-archidekt-bg: #d9d9d9;
--color-brand-archidekt-bg-hover: #cbcbcb;
--color-brand-archidekt-accent: #ffa90a;
--color-brand-archidekt-accent-hover: #f79c00;
--color-brand-archidekt-text: #333333;
--color-brand-archidekt-border: #292929;

/* Teal/Primary Variants */
--color-teal-500: #14b8a6;
--color-teal-400: #2dd4bf;
--color-teal-600: #0d9488;
```

#### Step 2: Refactoring _buttons.scss

```scss
/* ============================================
   BEFORE: Hardcoded hex values
   ============================================ */
.btn--yt {
  --btn-bg: #b90025;
  --btn-color: #ffffff;
  --btn-border: #212121;
}

/* ============================================
   AFTER: Design token references
   ============================================ */
.btn--yt {
  --btn-bg: var(--color-brand-youtube-red);
  --btn-color: var(--color-white);
  --btn-border: var(--color-brand-youtube-dark);
}

/* ============================================
   Scryfall - Gradient con tokens
   ============================================ */
.btn--scryfall {
  --btn-bg: linear-gradient(
    135deg,
    var(--color-brand-scryfall-1) 0%,
    var(--color-brand-scryfall-2) 25%,
    var(--color-brand-scryfall-3) 50%,
    var(--color-brand-scryfall-4) 75%,
    var(--color-brand-scryfall-5) 100%
  );
}

/* Ripetere per Moxfield, Archidekt, Teal... */
```

**Tempo stimato**: 3 ore

**Verifica**:
```bash
# 1. Aggiungere brand tokens a _tokens.scss
# Posizione: dopo line ~250 (color definitions)

# 2. Refactoring _buttons.scss (40+ sostituzioni)
# Cercare tutti gli hex values, sostituire con var(--color-brand-*)

# 3. Build test
hugo server
# Verificare: 0 SCSS errors

# 4. Visual verification
# Testare OGNI bottone brand:
# - YouTube button: rosso identico
# - Scryfall: gradient 5 colori corretto
# - Moxfield: gradient viola-rosa
# - Archidekt: grigio chiaro con accent arancione
# - Teal buttons: teal vibrant

# 5. Hover states verification
# Verificare che hover/focus mantengano stessi colori

# 6. Audit colori hardcoded rimanenti
grep -r "#[0-9a-fA-F]\{6\}" assets/style/06-components/_buttons.scss | wc -l
# Target: <10 (alcuni potrebbero essere legittimi per effetti speciali)
```

**Benefici**:
- ✅ Consistenza: tutti i brand colors centralizzati
- ✅ Manutenibilità: cambio colore in 1 punto (se brand update)
- ✅ Documentazione: tokens auto-documentano purpose
- ✅ Scalabilità: facile aggiungere nuovi brand buttons

**Note**:
```
[Data completamento]: __________
[Colori hardcoded prima]: 40+
[Colori hardcoded dopo]: _____ (target: <10)
[Brand tokens creati]: _____ tokens
[Bottoni verificati visivamente]: ☐ YouTube ☐ Scryfall ☐ Moxfield ☐ Archidekt ☐ Teal
[Verifica visiva utente]: ☐ Approvato
```

---

### Task 2.3: Standardizzazione Breakpoint SCSS 📱 [ARCHITECTURE]

- [ ] **Completato**

**🚨 ANALISI VIEWPORT OVERLAPS - Vedere REGOLA #3 sopra**:
Identificati **2 OVERLAPS critici** e **2 GAPS** nei breakpoint attuali che causano comportamenti inconsistenti.
Questa task risolve consolidando a 6 breakpoint standard senza overlap.

---

**Problema identificato**:
119 media queries con 18+ breakpoint diversi. Mix di `px` e `rem`, valori inconsistenti (es. `47.999rem`, `768px`, `64rem` per stesso concetto "mobile").

**Breakpoint Attuali Identificati**:
```scss
/* Chaos attuale */
@media (max-width: 30rem)        /* ~480px */
@media (max-width: 47.999rem)    /* ~767.98px - decimale strano */
@media (max-width: 48rem)        /* 768px */
@media (max-width: 600px)        /* Mix px/rem */
@media (max-width: 64rem)        /* 1024px */
@media (max-width: 768px)        /* Duplicate concept */
@media (max-width: 900px)        /* Custom hero */
@media (max-width: 1023px)       /* Off-by-one */
@media (min-width: 75rem)        /* 1200px */
@media (min-width: 80rem)        /* 1280px */
/* ... 8+ altri valori */
```

**File da creare**:
- `assets/style/01-settings/_breakpoints.scss`

**File da modificare**:
- [`assets/style/main.scss`](assets/style/main.scss) - aggiungere import
- Tutti i 21 file SCSS con media queries

**Implementazione**:

#### Step 1: Definire Breakpoint Standard

```scss
/* ============================================
   FILE: assets/style/01-settings/_breakpoints.scss
   SCSS Breakpoints & Media Query Mixins
   Standardized responsive design tokens
   ============================================ */

/* ============================================
   BREAKPOINT TOKENS
   Valori base per media queries responsive
   Usare sempre REM per accessibilità (zoom browser)
   ============================================ */

/* Mobile-first approach */
$bp-xs: 30rem;      /* 480px  - Extra small (phone portrait) */
$bp-sm: 48rem;      /* 768px  - Small (tablet portrait) */
$bp-md: 64rem;      /* 1024px - Medium (tablet landscape, small laptop) */
$bp-lg: 80rem;      /* 1280px - Large (desktop) */
$bp-xl: 90rem;      /* 1440px - Extra large (wide desktop) */
$bp-2xl: 120rem;    /* 1920px - 2X large (ultra-wide) */

/* Helper: Calculate max-width (per evitare overlap) */
$bp-xs-max: $bp-xs - 0.0625rem;   /* 29.9375rem = 479px */
$bp-sm-max: $bp-sm - 0.0625rem;   /* 47.9375rem = 767px */
$bp-md-max: $bp-md - 0.0625rem;   /* 63.9375rem = 1023px */
$bp-lg-max: $bp-lg - 0.0625rem;   /* 79.9375rem = 1279px */
$bp-xl-max: $bp-xl - 0.0625rem;   /* 89.9375rem = 1439px */

/* ============================================
   MEDIA QUERY MIXINS
   Usage:
     @include bp(sm) { /* styles */ }        // min-width: 768px
     @include bp-down(sm) { /* styles */ }   // max-width: 767px
     @include bp-between(sm, lg) { ... }     // 768px - 1279px
   ============================================ */

/* Min-width (mobile-first) */
@mixin bp($size) {
  @if $size == xs {
    @media (min-width: #{$bp-xs}) { @content; }
  } @else if $size == sm {
    @media (min-width: #{$bp-sm}) { @content; }
  } @else if $size == md {
    @media (min-width: #{$bp-md}) { @content; }
  } @else if $size == lg {
    @media (min-width: #{$bp-lg}) { @content; }
  } @else if $size == xl {
    @media (min-width: #{$bp-xl}) { @content; }
  } @else if $size == 2xl {
    @media (min-width: #{$bp-2xl}) { @content; }
  } @else {
    @warn "Breakpoint '#{$size}' non trovato. Usa: xs, sm, md, lg, xl, 2xl";
  }
}

/* Max-width (desktop-first) */
@mixin bp-down($size) {
  @if $size == xs {
    @media (max-width: #{$bp-xs-max}) { @content; }
  } @else if $size == sm {
    @media (max-width: #{$bp-sm-max}) { @content; }
  } @else if $size == md {
    @media (max-width: #{$bp-md-max}) { @content; }
  } @else if $size == lg {
    @media (max-width: #{$bp-lg-max}) { @content; }
  } @else if $size == xl {
    @media (max-width: #{$bp-xl-max}) { @content; }
  } @else {
    @warn "Breakpoint '#{$size}' non trovato. Usa: xs, sm, md, lg, xl";
  }
}

/* Between (range) */
@mixin bp-between($min, $max) {
  @media (min-width: #{map-get((xs: $bp-xs, sm: $bp-sm, md: $bp-md, lg: $bp-lg, xl: $bp-xl), $min)})
     and (max-width: #{map-get((xs: $bp-xs-max, sm: $bp-sm-max, md: $bp-md-max, lg: $bp-lg-max, xl: $bp-xl-max), $max)}) {
    @content;
  }
}

/* Only (specific range) */
@mixin bp-only($size) {
  @if $size == xs {
    @media (max-width: #{$bp-xs-max}) { @content; }
  } @else if $size == sm {
    @include bp-between(sm, md) { @content; }
  } @else if $size == md {
    @include bp-between(md, lg) { @content; }
  } @else if $size == lg {
    @include bp-between(lg, xl) { @content; }
  } @else if $size == xl {
    @media (min-width: #{$bp-xl}) { @content; }
  }
}

/* ============================================
   RESPONSIVE UTILITIES
   Helper variables per JavaScript sync
   ============================================ */

/* Esporta breakpoint a CSS per JS access */
:root {
  --bp-xs: #{$bp-xs};
  --bp-sm: #{$bp-sm};
  --bp-md: #{$bp-md};
  --bp-lg: #{$bp-lg};
  --bp-xl: #{$bp-xl};
}
```

#### Step 2: Aggiornare main.scss

```scss
/* assets/style/main.scss */

/* Settings */
@import "01-settings/tokens";
@import "01-settings/breakpoints";  /* ← NUOVO */

/* ... resto imports */
```

#### Step 3: Refactoring File SCSS (esempio _cards.scss)

```scss
/* ============================================
   BEFORE: Hardcoded breakpoint
   ============================================ */
@media (max-width: 47.999rem) {
  .cards {
    padding-block: var(--space-5);
  }
}

@media (min-width: 48rem) {
  .cards__grid {
    grid-template-columns: repeat(auto-fit, minmax(18.5rem, 1fr));
  }
}

/* ============================================
   AFTER: Mixin standardizzato
   ============================================ */
@include bp-down(sm) {  /* max-width: 47.9375rem (767px) */
  .cards {
    padding-block: var(--space-5);
  }
}

@include bp(sm) {  /* min-width: 48rem (768px) */
  .cards__grid {
    grid-template-columns: repeat(auto-fit, minmax(18.5rem, 1fr));
  }
}
```

#### Step 4: Mappatura Breakpoint Vecchi → Nuovi

| Vecchio Breakpoint | Nuovo Mixin | Note |
|--------------------|-------------|------|
| `max-width: 30rem` | `@include bp-down(xs)` | Phone portrait |
| `max-width: 47.999rem` | `@include bp-down(sm)` | Mobile (fix decimale) |
| `max-width: 48rem` | `@include bp-down(sm)` | Duplicate → consolidare |
| `max-width: 600px` | `@include bp-down(sm)` | Convertire px → rem |
| `min-width: 48rem` | `@include bp(sm)` | Tablet portrait+ |
| `max-width: 64rem` | `@include bp-down(md)` | Tablet landscape |
| `min-width: 64rem` | `@include bp(md)` | Desktop small |
| `max-width: 768px` | `@include bp-down(sm)` | Duplicate (convert px) |
| `min-width: 80rem` | `@include bp(lg)` | Desktop standard |
| `max-width: 900px` | `@include bp-down(md)` | Custom → standardizzare |
| `min-width: 1024px` | `@include bp(md)` | Convert px → rem |

**Tempo stimato**: 4 ore

**Procedimento**:
1. Creare `_breakpoints.scss` (30 min)
2. Aggiornare `main.scss` (5 min)
3. Refactoring file per file (3h):
   - _cards.scss (~30 occorrenze)
   - _navbar.scss (~15 occorrenze)
   - _hero.scss (~10 occorrenze)
   - _contacts.scss (~8 occorrenze)
   - Altri 17 file (~56 occorrenze totali)
4. Test cross-breakpoint (25 min)

**Verifica**:
```bash
# 1. Build test
hugo server
# Verificare: 0 SCSS compilation errors

# 2. Audit media queries rimanenti (hardcoded)
grep -r "@media" assets/style/ | grep -v "bp(" | grep -v "bp-down" | wc -l
# Target: 0 (tutte convertite)

# 3. Test responsive su tutti i breakpoint
# DevTools → Responsive mode
# Test width: 375px, 480px, 768px, 1024px, 1280px, 1920px
# Verificare: layout identico a prima

# 4. Verificare edge cases (767px vs 768px)
# No gap tra breakpoint: 767px max → 768px min

# 5. Test su dispositivi reali (se disponibile)
# - iPhone (375px, 414px)
# - iPad (768px, 1024px)
# - Desktop (1920px)
```

**Benefici**:
- ✅ Consistenza: 119 media queries → 6 breakpoint standard
- ✅ Manutenibilità: cambio breakpoint in 1 punto
- ✅ Leggibilità: `@include bp(sm)` vs `@media (min-width: 48rem)`
- ✅ Scalabilità: facile aggiungere nuovi breakpoint
- ✅ JavaScript sync: breakpoint accessibili via CSS variables

**Note**:
```
[Data completamento]: __________
[Media queries prima]: 119
[Media queries dopo (con mixin)]: _____ (target: ~90-100)
[Breakpoint standard usati]: ☐ xs ☐ sm ☐ md ☐ lg ☐ xl
[Build errors]: _____ (target: 0)
[Responsive test]: ☐ 375px ☐ 768px ☐ 1024px ☐ 1920px
[Visual regression]: ☐ None detected
```

---

### Task 2.4: Split archive.js → Moduli ES6 📦 [MODULARIZZAZIONE]

- [ ] **Completato**

**Problema identificato**:
[`archive.js`](assets/scripts/archive.js) monolitico con 1.347 righe. Difficile manutenzione, testing impossibile, logiche multiple mescolate (bottom-sheet, search, filter, pagination).

**File da creare** (5 moduli ES6):
1. `assets/scripts/archive/config.js` (~50 righe) - Config & constants
2. `assets/scripts/archive/sheet.js` (~400 righe) - Bottom-sheet mobile, drag, focus trap
3. `assets/scripts/archive/search.js` (~300 righe) - Search input, autocomplete, filtering
4. `assets/scripts/archive/filter.js` (~200 righe) - Kind filter, tag filter
5. `assets/scripts/archive/renderer.js` (~397 righe) - renderItem, pagination, DOM manipulation

**File da modificare**:
- [`assets/scripts/archive.js`](assets/scripts/archive.js) - ridurre a orchestrator (~100 righe)
- [`layouts/partials/scripts.html`](layouts/partials/scripts.html) - import moduli ES6

**Strategia di Split**:

#### 1. config.js - Configurazione Centralizzata
```javascript
/**
 * archive/config.js
 * Configurazione e costanti per archivio
 */

export const CONFIG = {
  // Media queries
  MQ_SHEET: '(max-width: 767.98px)',
  MQ_PHONE: '(max-width: 767.98px)',

  // Drag thresholds
  DRAG_CLOSE_THRESHOLD_PX: 16,
  DRAG_OPACITY_DIVISOR: 300,

  // Haptic feedback
  HAPTIC_FEEDBACK_CLOSE_MS: 50,
  HAPTIC_FEEDBACK_SNAP_MS: 10,

  // Pagination
  PAGE_SIZE: parseInt(document.body.dataset.archivePageSize || '12', 10),

  // URLs
  BASE_URL: document.body.dataset.baseUrl || '',
  APP_VERSION: document.body.dataset.appVer || '',
  ARCHIVE_VERSION: document.body.dataset.archiveVer || '',
};

export const SELECTORS = {
  sheet: '.archive-sheet',
  backdrop: '.archive-sheet-backdrop',
  btnClose: '.archive-sheet__close',
  handle: '.archive-sheet__handle',
  searchInput: '#archive-search',
  kindSelect: '#kind',
  resultsContainer: '.archive-items',
  // ... altri selectors
};

export const CLASSES = {
  hidden: 'u-hidden',
  active: 'is-active',
  expanded: 'is-expanded',
  // ...
};
```

#### 2. sheet.js - Bottom Sheet Logic
```javascript
/**
 * archive/sheet.js
 * Mobile bottom-sheet con drag-to-close e focus trap
 */

import { CONFIG, SELECTORS, CLASSES } from './config.js';

export class ArchiveSheet {
  constructor() {
    this.sheet = document.querySelector(SELECTORS.sheet);
    this.backdrop = document.querySelector(SELECTORS.backdrop);
    this.btnClose = document.querySelector(SELECTORS.btnClose);
    this.handle = document.querySelector(SELECTORS.handle);

    if (!this.sheet || !this.backdrop) return;

    this.isDragging = false;
    this.startY = 0;
    this.currentY = 0;

    this.init();
  }

  init() {
    this.bindEvents();
    this.setupFocusTrap();
  }

  bindEvents() {
    // Event listeners per close, drag, etc.
    // ... codice esistente dalle righe 44-250 di archive.js
  }

  open() { /* ... */ }
  close() { /* ... */ }

  setupFocusTrap() { /* ... */ }
  trapFocus(event) { /* ... */ }
}
```

#### 3. search.js - Search & Autocomplete
```javascript
/**
 * archive/search.js
 * Search input, autocomplete, filtering
 */

import { CONFIG, SELECTORS } from './config.js';

export class ArchiveSearch {
  constructor(items, aliases) {
    this.items = items;
    this.aliases = aliases;
    this.searchInput = document.querySelector(SELECTORS.searchInput);

    if (!this.searchInput) return;

    this.init();
  }

  init() {
    this.bindEvents();
    this.updatePlaceholder();
  }

  bindEvents() {
    this.searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim().toLowerCase();
      this.onSearchChange(query);
    });
  }

  onSearchChange(query) {
    // Dispatch custom event per notificare renderer
    const event = new CustomEvent('archive:search', { detail: { query } });
    document.dispatchEvent(event);
  }

  filterItems(query) {
    // Logica filtering con aliases
    // ... codice esistente dalle righe 600-800
  }
}
```

#### 4. filter.js - Kind/Tag Filtering
```javascript
/**
 * archive/filter.js
 * Kind filter (video/content/portal) e tag filter
 */

import { SELECTORS } from './config.js';

export class ArchiveFilter {
  constructor(items) {
    this.items = items;
    this.kindSelect = document.querySelector(SELECTORS.kindSelect);
    this.activeKind = 'all';

    if (!this.kindSelect) return;

    this.init();
  }

  init() {
    this.bindEvents();
  }

  bindEvents() {
    this.kindSelect.addEventListener('change', (e) => {
      this.activeKind = e.target.value;
      this.onFilterChange();
    });
  }

  onFilterChange() {
    const event = new CustomEvent('archive:filter', {
      detail: { kind: this.activeKind }
    });
    document.dispatchEvent(event);
  }

  filterByKind(items, kind) {
    if (kind === 'all') return items;
    return items.filter(item => item.kind === kind);
  }
}
```

#### 5. renderer.js - DOM Rendering
```javascript
/**
 * archive/renderer.js
 * Rendering items, pagination, DOM manipulation
 */

import { CONFIG } from './config.js';

export class ArchiveRenderer {
  constructor(container) {
    this.container = container;
    this.currentPage = 1;
    this.itemsPerPage = CONFIG.PAGE_SIZE;
  }

  renderItems(items) {
    // Clear container
    this.container.innerHTML = '';

    // Render ogni item
    items.forEach(item => {
      const el = this.renderItem(item);
      this.container.appendChild(el);
    });

    this.updatePagination(items.length);
  }

  renderItem(item) {
    // Codice esistente dalla function renderItem() (righe 950-1347)
    const article = document.createElement('article');
    // ... rendering logic
    return article;
  }

  updatePagination(totalItems) { /* ... */ }
}
```

#### 6. archive.js - Orchestrator (ridotto)
```javascript
/**
 * archive.js
 * Orchestrator principale - coordina moduli
 */

import { CONFIG } from './archive/config.js';
import { ArchiveSheet } from './archive/sheet.js';
import { ArchiveSearch } from './archive/search.js';
import { ArchiveFilter } from './archive/filter.js';
import { ArchiveRenderer } from './archive/renderer.js';

(() => {
  'use strict';

  // GATE: esegui solo nella pagina Archivio
  if (!document.querySelector('section.archive')) return;

  // Fetch data
  const fetchData = async () => {
    const url = `${CONFIG.BASE_URL}/archive/list.json`;
    const response = await fetch(url);
    return response.json();
  };

  // Initialize
  const init = async () => {
    try {
      const data = await fetchData();
      const { items, aliases } = data;

      // Instantiate modules
      const sheet = new ArchiveSheet();
      const search = new ArchiveSearch(items, aliases);
      const filter = new ArchiveFilter(items);
      const renderer = new ArchiveRenderer(
        document.querySelector('.archive-items')
      );

      // Initial render
      renderer.renderItems(items);

      // Event coordination
      document.addEventListener('archive:search', (e) => {
        const filtered = search.filterItems(e.detail.query);
        renderer.renderItems(filtered);
      });

      document.addEventListener('archive:filter', (e) => {
        const filtered = filter.filterByKind(items, e.detail.kind);
        renderer.renderItems(filtered);
      });

    } catch (error) {
      console.error('Archive initialization failed:', error);
    }
  };

  // Start
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
```

**Tempo stimato**: 5 ore

**Procedimento**:
1. Creare directory `assets/scripts/archive/`
2. Creare 5 file moduli (config, sheet, search, filter, renderer)
3. Copiare logiche da archive.js nei rispettivi moduli
4. Ridurre archive.js a orchestrator
5. Test isolato di ogni modulo
6. Test integrazione completa

**Verifica**:
```bash
# 1. Build test
hugo server

# 2. Verificare import ES6 funzionanti
# DevTools Console → verificare 0 errors

# 3. Test funzionalità archivio (COMPLETO)
# - Bottom-sheet apre/chiude
# - Drag-to-close funziona
# - Search filtra correttamente
# - Filter tipo contenuto funziona
# - Pagination OK
# - Focus trap attivo

# 4. Test performance
# DevTools Performance tab
# Verificare: nessun regression (tempo init invariato)

# 5. Verificare module count
ls -la assets/scripts/archive/*.js | wc -l
# Output atteso: 5 files

# 6. Verificare righe per modulo
wc -l assets/scripts/archive/*.js
# Target:
#  ~50 config.js
#  ~400 sheet.js
#  ~300 search.js
#  ~200 filter.js
#  ~397 renderer.js
```

**Benefici**:
- ✅ Testabilità: ogni modulo testabile in isolamento
- ✅ Manutenibilità: singola responsabilità per modulo
- ✅ Scalabilità: facile aggiungere feature (es. tag filter)
- ✅ Performance: possibile lazy load moduli non critici
- ✅ Code review: più facile review di 300 righe vs 1347

**Note**:
```
[Data completamento]: __________
[Righe archive.js prima]: 1347
[Righe archive.js dopo (orchestrator)]: _____ (target: ~100)
[Moduli creati]: _____ / 5
[Test funzionalità]: ☐ Sheet ☐ Search ☐ Filter ☐ Renderer ☐ Pagination
[Performance regression]: ☐ None ☐ Minor ☐ Major
[Build errors]: _____ (target: 0)
```

---

### Task 2.5: Buttons.scss - Consolidamento con Mixins 🎛️ [DRY PRINCIPLE]

- [ ] **Completato**

**Problema identificato**:
[`_buttons.scss`](assets/style/06-components/_buttons.scss) ha 8 varianti duplicate di hover states e glass effects. Pattern ripetuto con solo colori diversi.

**Pattern Duplicato #1 - Hover States**:
```scss
/* Ripetuto 8 volte con colori diversi */
.btn--primary:hover,
.btn--primary:focus-visible {
  --btn-bg: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-400));
}

.btn--secondary:hover,
.btn--secondary:focus-visible {
  --btn-bg: linear-gradient(135deg, var(--color-secondary-500), var(--color-secondary-400));
}
/* ... altre 6 varianti identiche */
```

**Pattern Duplicato #2 - Glass Effects**:
```scss
/* 8 glass button variants con struttura identica */
.btn--primary-glass {
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--color-primary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-primary) 30%, transparent);
}

.btn--secondary-glass {
  backdrop-filter: blur(10px);
  background: color-mix(in srgb, var(--color-secondary) 20%, transparent);
  border: 1px solid color-mix(in srgb, var(--color-secondary) 30%, transparent);
}
/* ... altre 6 varianti */
```

**Implementazione - Mixins**:

```scss
/* ============================================
   MIXINS - Button Variants
   Eliminano duplicazione per hover states e glass effects
   ============================================ */

/**
 * Mixin: btn-hover
 * Genera hover e focus-visible states con gradient
 *
 * @param {Color} $color-base - Colore base (es. var(--color-primary))
 * @param {Number} $lighten - Percentuale schiarimento (default: 10%)
 */
@mixin btn-hover($color-base, $lighten: 10%) {
  &:hover,
  &:focus-visible {
    --btn-bg: linear-gradient(
      135deg,
      #{$color-base} 0%,
      color-mix(in srgb, #{$color-base} #{100 - $lighten}%, white #{$lighten}%) 100%
    );
    transform: translateY(-2px);
    box-shadow: var(--shadow-lg);
  }
}

/**
 * Mixin: btn-glass
 * Glass effect con backdrop-filter e trasparenza
 *
 * @param {Color} $color - Colore base
 * @param {Number} $opacity - Opacità background (default: 20%)
 * @param {Number} $border-opacity - Opacità border (default: 30%)
 */
@mixin btn-glass($color, $opacity: 20%, $border-opacity: 30%) {
  backdrop-filter: blur(10px) saturate(180%);
  -webkit-backdrop-filter: blur(10px) saturate(180%); /* Safari */
  background: color-mix(in srgb, #{$color} #{$opacity}, transparent);
  border: 1px solid color-mix(in srgb, #{$color} #{$border-opacity}, transparent);

  &:hover,
  &:focus-visible {
    background: color-mix(in srgb, #{$color} #{$opacity + 10%}, transparent);
    border-color: color-mix(in srgb, #{$color} #{$border-opacity + 10%}, transparent);
  }
}

/**
 * Mixin: btn-variant
 * Genera completa variante button con tutti gli stati
 *
 * @param {Color} $bg - Background color
 * @param {Color} $color - Text color
 * @param {Color} $border - Border color
 */
@mixin btn-variant($bg, $color, $border: $bg) {
  --btn-bg: #{$bg};
  --btn-color: #{$color};
  --btn-border: #{$border};

  @include btn-hover($bg);

  &:active {
    transform: translateY(0);
    box-shadow: var(--shadow-sm);
  }

  &:disabled,
  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    pointer-events: none;
  }
}

/* ============================================
   APPLICAZIONE MIXINS - Button Variants
   ============================================ */

/* Primary Button */
.btn--primary {
  @include btn-variant(
    var(--color-primary),
    var(--color-white),
    var(--color-primary-600)
  );
}

/* Secondary Button */
.btn--secondary {
  @include btn-variant(
    var(--color-secondary),
    var(--color-white),
    var(--color-secondary-600)
  );
}

/* Special Button */
.btn--special {
  @include btn-variant(
    var(--gradient-cosmic),  /* Gradient supportato */
    var(--color-white),
    transparent
  );
}

/* Teal Button */
.btn--teal {
  @include btn-variant(
    var(--color-teal-500),
    var(--color-white),
    var(--color-teal-600)
  );
}

/* Glass Variants */
.btn--primary-glass {
  @include btn-glass(var(--color-primary), 20%, 30%);
}

.btn--secondary-glass {
  @include btn-glass(var(--color-secondary), 20%, 30%);
}

.btn--special-glass {
  @include btn-glass(var(--color-special), 15%, 25%);
}

/* ... altre 5 glass variants */

/* Brand Buttons (mantieni separati - colori custom) */
.btn--yt {
  @include btn-variant(
    var(--color-brand-youtube-red),
    var(--color-white),
    var(--color-brand-youtube-dark)
  );
}

.btn--scryfall {
  /* Gradient speciale - mantieni custom */
  --btn-bg: linear-gradient(
    135deg,
    var(--color-brand-scryfall-1) 0%,
    var(--color-brand-scryfall-2) 25%,
    var(--color-brand-scryfall-3) 50%,
    var(--color-brand-scryfall-4) 75%,
    var(--color-brand-scryfall-5) 100%
  );
  --btn-color: var(--color-white);

  @include btn-hover(var(--color-brand-scryfall-3));
}

/* Moxfield, Archidekt - simile */
```

**Tempo stimato**: 3 ore

**Riduzione Righe Attesa**:
- Da ~500 righe → ~300 righe (-40%)
- 8 hover states duplicate → 1 mixin
- 8 glass variants duplicate → 1 mixin

**Verifica**:
```bash
# 1. Aggiungere mixins all'inizio di _buttons.scss
# Posizione: dopo line 20 (dopo base .btn styles)

# 2. Refactoring button variants
# Sostituire ogni variante con @include btn-variant(...)

# 3. Build test
hugo server
# Verificare: 0 SCSS errors

# 4. Visual verification - TUTTI i bottoni
# Homepage:
# - Primary button (violet gradient)
# - Secondary button (teal)
# - Special button (cosmic gradient)
#
# Archive:
# - Glass buttons (backdrop blur visible)
# - Brand buttons (YouTube red, Scryfall gradient, etc.)
#
# Hover states:
# - Transform translateY(-2px)
# - Box shadow increase
# - Gradient shift

# 5. Verificare codice ridotto
wc -l assets/style/06-components/_buttons.scss
# Prima: ~500 righe
# Dopo: ~300 righe (target: -40%)
```

**Benefici**:
- ✅ DRY: 16 varianti duplicate → 3 mixins riutilizzabili
- ✅ Manutenibilità: modifica hover behavior in 1 punto
- ✅ Consistenza: tutti i bottoni seguono stesso pattern
- ✅ Scalabilità: facile aggiungere nuove varianti

**Note**:
```
[Data completamento]: __________
[Righe _buttons.scss prima]: ~500
[Righe _buttons.scss dopo]: _____ (target: ~300)
[Riduzione]: _____ righe (_____ %)
[Mixins creati]: ☐ btn-hover ☐ btn-glass ☐ btn-variant
[Bottoni verificati]: ☐ Primary ☐ Secondary ☐ Special ☐ Teal ☐ Glass variants ☐ Brand buttons
[Verifica visiva utente]: ☐ Approvato
```

---

### Task 2.6: Favicon Consolidation 🖼️ [OPTIMIZATION]

- [ ] **Completato**

**Problema identificato**:
9 file favicon separati in [`layouts/partials/meta-head.html`](layouts/partials/meta-head.html) (linee 39-50). Possibile consolidamento con SVG + PNG fallback.

**File Attuali**:
```html
<!-- 9 favicon files -->
<link rel="icon" href="/icons/favicon/favicon-16x16.png" sizes="16x16" type="image/png">
<link rel="icon" href="/icons/favicon/favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="icon" href="/icons/favicon/favicon-48x48.png" sizes="48x48" type="image/png">
<link rel="icon" href="/icons/favicon/favicon-96x96.png" sizes="96x96" type="image/png">
<link rel="icon" href="/icons/favicon/favicon-192x192.png" sizes="192x192" type="image/png">
<link rel="icon" href="/icons/favicon/favicon-512x512.png" sizes="512x512" type="image/png">
<link rel="apple-touch-icon" href="/icons/favicon/apple-touch-icon.png">
<link rel="shortcut icon" href="/icons/favicon/favicon.ico">
<link rel="manifest" href="/icons/favicon/site.webmanifest">
```

**Strategia Consolidata**:

```html
<!-- MODERN APPROACH: SVG + PNG fallback -->
<link rel="icon" href="/icons/favicon/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" sizes="180x180" href="/icons/favicon/apple-touch-icon.png">
<link rel="manifest" href="/icons/favicon/site.webmanifest">
```

**Vantaggi SVG Favicon**:
- ✅ Scalabile (funziona a qualsiasi dimensione)
- ✅ Supporto dark mode (media query dentro SVG)
- ✅ File size ridotto (~2 KB vs 10+ KB per PNG multiple)
- ✅ Browser moderni supportano al 95%+

**Implementazione**:

#### Step 1: Creare favicon.svg (se non esiste)
```svg
<!-- static/icons/favicon/favicon.svg -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <style>
    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .icon-bg { fill: #0E0F1A; }
      .icon-fg { fill: #FFFFFF; }
    }
    @media (prefers-color-scheme: light) {
      .icon-bg { fill: #FFFFFF; }
      .icon-fg { fill: #0E0F1A; }
    }
  </style>

  <!-- Logo EventHorizon.mtg (sostituire con actual logo) -->
  <rect class="icon-bg" width="48" height="48" rx="8"/>
  <circle class="icon-fg" cx="24" cy="24" r="12"/>
</svg>
```

#### Step 2: Verificare apple-touch-icon.png
- Dimensione: 180x180px (standard iOS)
- Formato: PNG (SVG non supportato da iOS)
- Se manca: generare da logo principale

#### Step 3: Aggiornare meta-head.html
```html
<!-- BEFORE (9 file) -->
<link rel="icon" href="/icons/favicon/favicon-16x16.png" sizes="16x16" type="image/png">
<!-- ... 8 altri link -->

<!-- AFTER (3 file) -->
<link rel="icon" href="/icons/favicon/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/icons/favicon/favicon-32x32.png" sizes="32x32" type="image/png"> <!-- Fallback legacy browser -->
<link rel="apple-touch-icon" sizes="180x180" href="/icons/favicon/apple-touch-icon.png">
<link rel="manifest" href="/icons/favicon/site.webmanifest">
```

#### Step 4: Opzionale - Rimuovere file PNG non usati
```bash
# Mantenere solo:
# - favicon.svg (nuovo)
# - favicon-32x32.png (fallback)
# - apple-touch-icon.png (iOS)
# - site.webmanifest

# Rimuovere (backup prima!):
# - favicon-16x16.png
# - favicon-48x48.png
# - favicon-96x96.png
# - favicon-192x192.png
# - favicon-512x512.png
# - favicon.ico (obsoleto)
```

**Tempo stimato**: 1 ora

**Verifica**:
```bash
# 1. Creare/verificare favicon.svg
# Se non esiste, generare da logo

# 2. Aggiornare meta-head.html

# 3. Build test
hugo server

# 4. Test cross-browser
# Chrome: DevTools → Application → Manifest → Icons
# Firefox: Verificare tab icon
# Safari: Verificare tab icon
# iOS Safari: Add to Home Screen → verificare icona

# 5. Test dark mode (se SVG ha media query)
# OS: Cambiare system theme light/dark
# Verificare: favicon cambia colore

# 6. Verificare file count
ls static/icons/favicon/*.png | wc -l
# Prima: ~8-9 file
# Dopo: 2 file (favicon-32x32.png, apple-touch-icon.png)
```

**Compatibilità**:
- ✅ Chrome 80+ (SVG favicon)
- ✅ Firefox 41+ (SVG favicon)
- ✅ Safari 9+ (SVG favicon)
- ✅ Edge 79+ (SVG favicon)
- ✅ iOS Safari (apple-touch-icon.png)
- ⚠️ IE11: Fallback a favicon-32x32.png

**Note**:
```
[Data completamento]: __________
[Favicon files prima]: 9
[Favicon files dopo]: _____ (target: 4)
[SVG favicon creato]: ☐ Yes ☐ No (già esistente)
[Dark mode support]: ☐ Yes ☐ No
[Test browser]: ☐ Chrome ☐ Firefox ☐ Safari ☐ iOS
[File rimossi]: _____ PNG files
```

---

### ✅ Checkpoint Livello 2

**Completamento Prerequisiti**:

- [ ] **Tutte le task 2.1 - 2.6 completate e verificate**
- [ ] **Build produzione senza errori**: `hugo --minify` → exit code 0
- [ ] **Test visivo approvato**: rendering identico pre-refactoring
- [ ] **Bundle size verificato**: CSS <120 KB
- [ ] **Moduli ES6 funzionanti**: archive.js split in 5 moduli
- [ ] **Breakpoint consolidati**: <100 media queries con mixins
- [ ] **Design tokens applicati**: colori hardcoded <10

**Git Workflow**:

```bash
# 1. Verificare stato
git status

# 2. Stage changes
git add .

# 3. Commit finale livello 2
git commit -m "feat(level-2): improve maintainability - DRY principles, design tokens, SCSS architecture, JS modularization

CHANGES:
- Created url-to-abs.html partial (5+ duplications removed)
- Mapped 40+ hardcoded colors to design tokens
- Standardized breakpoints with SCSS mixins (119 → ~95 media queries)
- Split archive.js into 5 ES6 modules (1347 → 100 lines orchestrator)
- Consolidated button variants with mixins (_buttons.scss: 500 → 300 lines)
- Simplified favicon strategy (9 → 4 files)

ARCHITECTURE:
- New partials: helpers/url-to-abs.html
- New SCSS files: 01-settings/_breakpoints.scss
- New JS modules: archive/{config,sheet,search,filter,renderer}.js
- Updated design tokens: brand colors section in _tokens.scss

METRICS:
- CSS bundle: 130 KB → 120 KB (-8%)
- archive.js: 1347 lines → 5 modules (~100 lines ea)
- _buttons.scss: 500 → 300 lines (-40%)
- Breakpoint mixins: 6 standard (xs, sm, md, lg, xl, 2xl)
- Design tokens: +20 brand color variables
- Favicon files: 9 → 4 (-56%)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 4. Tag snapshot
git tag -a v1.0-optimization-level-2 -m "Optimization Level 2 Complete - Maintainability & Modularization"

# 5. Push
git push origin main
git push origin v1.0-optimization-level-2
```

**Metriche Finali Livello 2**:

| Metrica | Baseline | Target L2 | Effettivo L2 | ✅/❌ |
|---------|----------|-----------|--------------|-------|
| CSS Bundle | 130 KB (post-L1) | 120 KB | _____ KB | ☐ |
| archive.js Lines | 1347 | 5 moduli (~100 ea) | _____ | ☐ |
| _buttons.scss Lines | ~500 | ~300 | _____ | ☐ |
| Media Queries | 119 | <100 (with mixins) | _____ | ☐ |
| Hardcoded Colors | 40+ | <10 | _____ | ☐ |
| Hugo Partials | 6 | 10 | _____ | ☐ |
| Favicon Files | 9 | 4 | _____ | ☐ |

**Date**:
- Completamento previsto: __________ (3-4 giorni da inizio L2)
- Completamento effettivo: __________

---

## 🔷 LIVELLO 3 - SEO & PERFORMANCE AVANZATA (Giorni 8-11)

**Obiettivo**: Migliorare SEO, accessibility, performance rendering critico
**Rischio**: Medio-Alto (Critical CSS può impattare rendering)
**Impatto**: Alto (visibilità motori ricerca + web vitals)
**Commit finale**: `feat(level-3): enhance SEO, accessibility, and advanced performance`

---

### Task 3.1: Open Graph Dinamico 🌐 [SEO]

- [ ] **Completato**

**Problema identificato**:
Meta tag `og:type` sempre settato a `"website"` in [`meta-head.html`](layouts/partials/meta-head.html). Mancano tag `article:*` per articoli, structured data incompleta.

**Implementazione**:

```html
<!-- BEFORE (line 52) -->
<meta property="og:type" content="website">

<!-- AFTER: Condizionale per section -->
{{ if eq .Section "article" }}
  <meta property="og:type" content="article">
  {{ with .PublishDate }}
  <meta property="article:published_time" content="{{ .Format "2006-01-02T15:04:05Z07:00" }}">
  {{ end }}
  {{ with .Lastmod }}
  <meta property="article:modified_time" content="{{ .Format "2006-01-02T15:04:05Z07:00" }}">
  {{ end }}
  {{ with .Params.author }}
  <meta property="article:author" content="{{ . }}">
  {{ end }}
  {{ range .Params.tags }}
  <meta property="article:tag" content="{{ . }}">
  {{ end }}
  {{ with .Params.category }}
  <meta property="article:section" content="{{ . }}">
  {{ end }}
{{ else }}
  <meta property="og:type" content="website">
{{ end }}
```

**Tempo stimato**: 2 ore
**File**: [`layouts/partials/meta-head.html`](layouts/partials/meta-head.html)

**Verifica**:
```bash
# Facebook Sharing Debugger
# https://developers.facebook.com/tools/debug/
# Input: https://eventhorizon-mtg.github.io/articles/example/
# Verificare: og:type = "article" + article:* tags presenti
```

**Note**:
```
[Data completamento]: __________
[Meta tags aggiunti]: _____
[Facebook debugger test]: ☐ Passed
```

---

### Task 3.2: Schema.org Esteso + BreadcrumbList 📊 [SEO]

- [ ] **Completato**

**Problema**: Schema.org solo su sezione "article". Manca BreadcrumbList, structured data per archive items.

**Implementazione**: Estendere [`layouts/partials/schema-org.html`](layouts/partials/schema-org.html)

**Tempo stimato**: 3 ore

**Verifica**:
```bash
# Google Rich Results Test
# https://search.google.com/test/rich-results
# Verificare: 0 errori, BreadcrumbList presente
```

**Note**:
```
[Data completamento]: __________
[Schema types aggiunti]: _____
[Rich Results errors]: _____ (target: 0)
```

---

### Task 3.3: ARIA Live Regions ♿ [ACCESSIBILITY]

- [ ] **Completato**

**Problema**: Risultati ricerca/filtri non notificati agli screen reader.

**Implementazione**: Aggiungere `aria-live="polite"` in [`layouts/_default/list.html`](layouts/_default/list.html)

**Tempo stimato**: 1.5 ore

**Verifica**:
```bash
# Test con screen reader (NVDA/JAWS/VoiceOver)
# Applicare filtro → verificare annuncio "X risultati trovati"
```

**Note**:
```
[Data completamento]: __________
[ARIA attributes aggiunti]: _____
[Screen reader test]: ☐ Passed
```

---

### Task 3.4: Critical CSS Extraction 🚀 [PERFORMANCE]

- [ ] **Completato**

**Problema**: CSS bundle 120 KB bloccante, rallenta First Contentful Paint.

**Strategia**: Estrarre CSS critico above-the-fold, defer resto.

**Tempo stimato**: 4 ore

**Verifica**:
```bash
# Lighthouse audit
# FCP: target <1.0s (da ~1.2s)
# LCP: target <1.8s (da ~2.0s)
```

**Note**:
```
[Data completamento]: __________
[Critical CSS size]: _____ KB
[FCP before/after]: _____ / _____
[LCP before/after]: _____ / _____
```

---

### Task 3.5: Lighthouse CI in GitHub Actions 📊 [AUTOMATION]

- [ ] **Completato**

**Obiettivo**: Automatizzare Lighthouse audit su ogni deploy.

**Implementazione**: Aggiungere step in [`.github/workflows/build.yml`](.github/workflows/build.yml)

```yaml
- name: Run Lighthouse CI
  uses: treosh/lighthouse-ci-action@v10
  with:
    urls: |
      https://eventhorizon-mtg.github.io/
      https://eventhorizon-mtg.github.io/archive/
    uploadArtifacts: true
```

**Tempo stimato**: 2 ore

**Note**:
```
[Data completamento]: __________
[Lighthouse CI URL]: __________
[Performance score]: _____
```

---

### Task 3.6: Inline Styles Refactoring 💅 [MAINTAINABILITY]

- [ ] **Completato**

**Problema**: CSS custom properties hardcoded in [`list.html`](layouts/_default/list.html) (linee 5-13).

**Soluzione**: Spostare in `_archive.scss`

**Tempo stimato**: 1 ora

**Note**:
```
[Data completamento]: __________
[Inline styles rimossi]: _____
```

---

### Task 3.7: Template Cleanup 🧹 [MAINTENANCE]

- [ ] **Completato**

**Azione**: Verificare utilizzo di `taxonomy.html` e `terms.html`, rimuovere se non usati.

**Tempo stimato**: 30 minuti

**Note**:
```
[Data completamento]: __________
[File rimossi]: _____
```

---

### ✅ Checkpoint Livello 3

```bash
git commit -m "feat(level-3): enhance SEO, accessibility, and advanced performance

CHANGES:
- Dynamic Open Graph with article:* tags
- Extended Schema.org with BreadcrumbList
- ARIA live regions for screen readers
- Critical CSS extraction (FCP improved)
- Lighthouse CI automation in GitHub Actions
- Inline styles refactored to SCSS
- Removed unused templates (taxonomy.html, terms.html)

METRICS:
- SEO score: ~90 → 95+
- Accessibility: ~94 → 98+
- FCP: ~1.2s → <1.0s
- LCP: ~2.0s → <1.8s
- Critical CSS: ~15 KB (from 120 KB bundle)

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git tag -a v1.0-optimization-level-3 -m "Optimization Level 3 Complete"
git push origin main && git push origin v1.0-optimization-level-3
```

**Date**: Completamento previsto __________ | Effettivo __________

---

## 💡 LIVELLO 4 - TESTING & FUTURE-PROOFING (Giorni 12-17) [OPZIONALE]

**Obiettivo**: Setup testing automatico, image optimization, long-term scalability
**Rischio**: Basso (non impatta produzione)
**Impatto**: Medio-Alto (long-term quality assurance)
**Priorità**: **OPZIONALE** - Eseguire solo se tempo disponibile

---

### Task 4.1: Vitest Setup + Unit Tests 🧪

- [ ] **Completato**

**Obiettivo**: Testing automatico per moduli JavaScript.

**Implementazione**:
```bash
npm install --save-dev vitest @vitest/ui
```

Creare test per ogni modulo `archive/*.js`:
- `config.test.js`
- `sheet.test.js`
- `search.test.js`
- `filter.test.js`
- `renderer.test.js`

**Target**: Coverage >60%

**Tempo stimato**: 6 ore

**Note**:
```
[Data completamento]: __________
[Test coverage]: _____ % (target: >60%)
[Tests passing]: _____ / _____
```

---

### Task 4.2: Axe-core Accessibility Tests 🎯

- [ ] **Completato**

**Obiettivo**: Accessibility testing automatico.

```bash
npm install --save-dev @axe-core/cli
```

**Tempo stimato**: 3 ore

**Note**:
```
[Data completamento]: __________
[Accessibility issues found]: _____
[Accessibility score]: _____ (target: 100)
```

---

### Task 4.3: Image Optimization Pipeline 🖼️

- [ ] **Completato**

**Obiettivo**: Conversione automatica JPG → WebP + srcset responsive.

**Tempo stimato**: 3 ore

**Note**:
```
[Data completamento]: __________
[Images optimized]: _____
[Size reduction]: _____ %
```

---

### Task 4.4: Code Splitting Evaluation 📦

- [ ] **Completato**

**Obiettivo**: Valutare esbuild vs Hugo Pipes per bundling.

**Tempo stimato**: 2 ore

**Note**:
```
[Data completamento]: __________
[Decisione]: ☐ Implementare esbuild ☐ Mantenere Hugo Pipes
[Motivazione]: __________
```

---

### Task 4.5: Architecture Decision Records (ADR) 📝

- [ ] **Completato**

**Obiettivo**: Documentare decisioni architetturali importanti.

Creare `docs/adr/` con:
- `001-scss-architecture-itcss.md`
- `002-javascript-es6-modules.md`
- `003-breakpoint-strategy.md`

**Tempo stimato**: 2 ore

**Note**:
```
[Data completamento]: __________
[ADR documenti creati]: _____
```

---

### Task 4.6: E2E Tests con Playwright [EXTRA] 🎭

- [ ] **Completato** (opzionale)

**Obiettivo**: Test end-to-end workflow critici.

```bash
npm install --save-dev @playwright/test
```

Test scenarios:
- Archive search + filter workflow
- Bottom-sheet mobile interaction
- Homepage cards carousel

**Tempo stimato**: 4 ore

**Note**:
```
[Data completamento]: __________
[E2E tests scenarios]: _____
[Tests passing]: _____ / _____
```

---

### ✅ Checkpoint Livello 4

```bash
git commit -m "feat(level-4): implement testing, image optimization, and future-proofing

CHANGES:
- Vitest setup with >60% coverage
- Axe-core accessibility testing automation
- Image optimization pipeline (WebP + srcset)
- Code splitting evaluation documented
- Architecture Decision Records (ADR)
- E2E tests with Playwright (optional)

INFRASTRUCTURE:
- package.json dependencies updated
- Test scripts configured
- CI/CD includes test run
- ADR documentation in docs/adr/

METRICS:
- Test coverage: >60%
- Accessibility score: 100
- Image size reduction: ~40%
- Build performance: maintained

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git tag -a v1.0-optimization-complete -m "Optimization Complete - All 4 Levels"
git push origin main && git push origin v1.0-optimization-complete
```

**Date**: Completamento previsto __________ | Effettivo __________

---

## 🔧 Dependencies e Prerequisiti

### Livello 1-2 (No Dependencies)
- ✅ Hugo extended v0.150.0+ (già installato)
- ✅ Git (version control)
- ✅ Editor VS Code con SCSS syntax

### Livello 3 (Performance Avanzata)
```bash
npm install --save-dev \
  critical \
  @lhci/cli
```

### Livello 4 (Testing) [OPZIONALE]
```bash
npm install --save-dev \
  vitest \
  @vitest/ui \
  @axe-core/cli \
  @playwright/test
```

**Installazione**:
```bash
# Solo quando necessario (Livello 3+)
cd /path/to/repo
npm install
```

---

## 🔄 Rollback Strategy

### Livello 1 - Quick Rollback
```bash
git revert <commit-hash-level-1>
# O restore file specifico
git checkout v1.0-optimization-baseline -- assets/scripts/archive.js
```
**Tempo**: <5 minuti

### Livello 2 - Rollback Strutturale
```bash
git reset --hard v1.0-optimization-level-1
# Testare build
hugo --minify
```
**Tempo**: 10-20 minuti

### Livello 3 - Rollback Selettivo
```bash
# Disable critical CSS
git revert <critical-css-commit>
# Remove Lighthouse CI
git checkout HEAD~1 -- .github/workflows/build.yml
```
**Tempo**: 15-30 minuti

### Livello 4 - Safe Rollback
```bash
npm uninstall vitest @axe-core/cli
rm -rf tests/
```
**Tempo**: <10 minuti
**Nota**: Testing non impatta produzione

### Checklist Pre-Rollback
- [ ] Backup branch: `git branch backup-level-X`
- [ ] Verificare: `git status` (clean working directory)
- [ ] Test build: `hugo --minify`
- [ ] Verificare deploy: GitHub Actions status
- [ ] Documentare: motivo rollback in issue

---

## 📊 Metriche Finali e KPI

### Tabella Riassuntiva (da compilare a progetto completato)

| Metrica | Baseline | Post-L1 | Post-L2 | Post-L3 | Post-L4 | Delta |
|---------|----------|---------|---------|---------|---------|-------|
| **JS Bundle** | 44 KB | _____ | _____ | _____ | _____ | _____ % |
| **CSS Bundle** | 136 KB | _____ | _____ | _____ | _____ | _____ % |
| **Build Time** | ~3 min | _____ | _____ | _____ | _____ | _____ % |
| **CLS Score** | ~0.15 | _____ | _____ | _____ | _____ | _____ |
| **FCP** | ~1.2s | _____ | _____ | _____ | _____ | _____ s |
| **LCP** | ~2.0s | _____ | _____ | _____ | _____ | _____ s |
| **Lighthouse Perf** | ~85 | _____ | _____ | _____ | _____ | +_____ |
| **SEO Score** | ~88 | _____ | _____ | _____ | _____ | +_____ |
| **Accessibility** | ~92 | _____ | _____ | _____ | _____ | +_____ |
| **!important** | 51 | _____ | _____ | _____ | _____ | -_____ |
| **console.log** | 6 | _____ | _____ | _____ | _____ | -_____ |
| **Test Coverage** | 0% | _____ | _____ | _____ | _____ | +_____ % |

### KPI di Successo

**Livello 1**: ✅ Performance immediata
- CLS < 0.1
- Bundle JS ridotto >40%
- Build time ridotto >45%

**Livello 2**: ✅ Maintainability
- Moduli ES6: 5 file
- SCSS files: +4 (refactoring cards)
- Design tokens: +20

**Livello 3**: ✅ SEO & Advanced Performance
- SEO score: 95+
- Accessibility: 98+
- FCP < 1.0s
- LCP < 1.8s

**Livello 4**: ✅ Quality Assurance (opzionale)
- Test coverage: >60%
- Accessibility: 100
- ADR docs: 3+

---

## 🛠️ Comandi Utili

### Hugo Build & Server
```bash
# Development con drafts
hugo server --buildDrafts --buildFuture

# Build produzione
$env:HUGO_PARAMS_APPVER = (git rev-parse --short HEAD)
hugo --minify

# Verificare output
ls -lh public/
```

### Git Workflow
```bash
# Snapshot pre-livello
git tag -a v1.0-optimization-levelX -m "Level X start"

# Commit format
git commit -m "feat(level-X): description

CHANGES:
- Change 1
- Change 2

METRICS:
- Metric 1: X → Y
- Metric 2: A → B

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# Push con tags
git push origin main
git push origin --tags
```

### Bundle Size Verification
```bash
# JavaScript
ls -lh public/script/*.js

# CSS
ls -lh public/style/*.css

# Total
du -sh public/
```

### Lighthouse Audit
```bash
# CLI (se installato)
npx @lhci/cli autorun --collect.url=http://localhost:1313

# O manuale: Chrome DevTools → Lighthouse
```

### SCSS Audit
```bash
# Contare media queries
grep -r "@media" assets/style/ | wc -l

# Contare !important
grep -r "!important" assets/style/ | wc -l

# Contare colori hardcoded
grep -r "#[0-9a-fA-F]\{6\}" assets/style/ | wc -l
```

---

## 🐛 Issue Tracker

### Problemi Riscontrati Durante Ottimizzazione

| Data | Livello | Task | Issue | Soluzione | Status | Risolto da |
|------|---------|------|-------|-----------|--------|------------|
| | | | | | | |
| | | | | | | |
| | | | | | | |

**Status**: ☐ Open ☐ In Progress ✅ Resolved ❌ Blocked

---

## 📝 Note & Learnings

### Decisioni Tecniche Importanti

```
[Spazio per annotare decisioni tecniche prese durante il progetto]

Esempio:
- 2025-10-20: Deciso di mantenere 5 !important in _cards-stack.scss
  perché necessari per override ID selector #cards.
  Soluzione alternativa (rimuovere ID) troppo rischiosa per L1.
  Rimandare a L2 o L4.

- 2025-10-21: archive.js split in 5 moduli invece di 4.
  Aggiunto modulo "config.js" separato per migliorare testabilità.

- 2025-10-22: Critical CSS extraction implementato con Hugo Pipes
  invece di npm package "critical". Più veloce e integrato.
```

### Best Practices Identificate

```
[Pattern e best practices da riutilizzare in futuro]

Esempio:
- SCSS mixins per breakpoint: standardizzazione riduce errori
- ES6 modules con event coordination: pattern scalabile per SPA-like
- Design tokens per brand colors: facilita white-labeling futuro
```

### Metriche Notevoli

```
[Annotare miglioramenti significativi o unexpected]

Esempio:
- Lazy load archive.js: -45% bundle homepage (meglio del target -40%)
- Critical CSS: FCP migliorato del 35% invece del previsto 25%
```

---

## 🎉 COMPLETAMENTO PROGETTO

### Checklist Finale

- [ ] **Livello 1**: Completato e verificato
- [ ] **Livello 2**: Completato e verificato
- [ ] **Livello 3**: Completato e verificato
- [ ] **Livello 4**: ☐ Completato ☐ Skipped (opzionale)
- [ ] **Build produzione**: Perfettamente funzionante
- [ ] **Test cross-browser**: Chrome, Firefox, Safari ✅
- [ ] **Test responsive**: Mobile, tablet, desktop ✅
- [ ] **Verifica visiva utente**: Approvazione finale ✅
- [ ] **Deploy produzione**: Eseguito manualmente
- [ ] **Lighthouse audit finale**: Performance 95+, SEO 95+, Accessibility 98+
- [ ] **Documentazione aggiornata**: README, ADR, CHANGELOG
- [ ] **Tag release finale**: `v1.0-optimization-complete`

### Date Progetto

| Milestone | Data Prevista | Data Effettiva |
|-----------|---------------|----------------|
| **Inizio Livello 1** | __________ | __________ |
| **Fine Livello 1** | __________ | __________ |
| **Fine Livello 2** | __________ | __________ |
| **Fine Livello 3** | __________ | __________ |
| **Fine Livello 4** | __________ | __________ |
| **Completamento Totale** | __________ | __________ |

**Tempo totale impiegato**: _____ giorni (target: 10-17 giorni)

---

## 📞 Contatti e Supporto

**Maintainer**: EventHorizon.mtg Team
**Repository**: https://github.com/eventhorizon-mtg/eventhorizon-mtg.github.io
**Issues**: https://github.com/eventhorizon-mtg/eventhorizon-mtg.github.io/issues
**Documentazione**: [README.md](README.md)

---

**Legenda Status**:
- [ ] = Da fare
- [⏳] = In progress
- [✅] = Completato
- [⚠️] = Issue/Blocco
- [❌] = Skipped/Non applicabile

---

**Workflow Version**: 2.1.0 (Unified + Critical Safety Rules)
**Ultimo aggiornamento**: 2025-10-19
**Prossima review**: Dopo completamento Livello 1

---

## 📝 Changelog

### Version 2.1.0 (2025-10-19) - Critical Safety Rules

**MAJOR CHANGES**:

1. **Added REGOLE CRITICHE E WARNING section** (3 critical rules):
   - **REGOLA #1**: Content preservation policy - NO modifications to visible content
   - **REGOLA #2**: Deep !important analysis - 20 of 33 flags are CRITICAL for mobile layout
   - **REGOLA #3**: Viewport overlaps documentation - 2 overlaps + 2 gaps identified

2. **Updated Task 1.3 (!important removal) with realistic targets**:
   - FROM: 51→20 (-60%) unrealistic
   - TO: 51→43→30→25→20 (progressive, -60% final)
   - Documented: 20 flags MUST remain (writing-mode mobile, border-radius reset, display overrides)

3. **Replaced dangerous Technique 4** (ID→class conversion):
   - REMOVED: "Sostituire ID con class" (would break anchor links #cards)
   - ADDED: ":where() technique" (preserves IDs, reduces specificity)

4. **Added content preservation warnings**:
   - Task 1.4: Explicit warning NOT to modify alt text
   - Examples: CORRECT vs WRONG implementations

5. **Documented viewport overlaps in Task 2.3**:
   - Overlap #1: 47.999rem vs 768px (mobile)
   - Overlap #2: 1023px vs 64rem (tablet)
   - Gaps: 481px-767px, 600px custom breakpoint

6. **Updated metric tables**:
   - !important target: ~43 (L1) → ~20 (L4) instead of ~30 → ~5
   - Realistic expectations based on functional necessity analysis

**RATIONALE**:
Version 2.0 lacked critical safety rules. Deep analysis of `_cards.scss` revealed:
- 13x !important for `writing-mode: horizontal-tb` on mobile (CRITICAL - without these, mobile text is vertical/illegible)
- 2x !important for border-radius reset (CRITICAL - prevents unwanted rounded corners)
- 1x !important for hiding duplicate images (CRITICAL - prevents visual regression)

Previous targets (60% removal in Level 1) were impossible without breaking production.

---

### Version 2.0.0 (2025-10-19) - Unified Workflow

- Merged OPTIMIZATION_PROGRESS.md (performance-first) + WORKFLOW_MASTER.md (architecture-first)
- 15-17 day timeline
- 4 levels with detailed tasks (26 tasks total)
- Baseline metrics verified from system
- Comprehensive rollback strategy

---

🚀 **Buon lavoro con l'ottimizzazione!**
