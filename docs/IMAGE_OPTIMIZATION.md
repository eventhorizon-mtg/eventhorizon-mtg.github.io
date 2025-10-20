# Image Optimization Guide

This document outlines the image optimization strategy for EventHorizon.mtg.

## Current Status

### Image Inventory (15 total files)

**Already Optimized (WebP format):**
- `bg_image.webp` (922 KB) - Hero background
- `logo.webp` (39 KB) - Site logo
- Cards: `card5.webp`, `card6.webp`, `card7.webp`, `card_A.webp`, `fblthp_placeholder.webp`
- Links: `boose_logo.webp`

**Could be optimized:**
- JPG files (2): `amh1-14-yawgmoth-thran-physician.jpg` (116 KB), `amkm-21-niv-mizzet-guildpact.jpg` (123 KB)
- PNG files (4): Various logos in `static/images/links/` (3.5-90 KB)

### External Images
Archive hero images are hosted on **Contentful CDN** which provides automatic:
- Format optimization (WebP/AVIF)
- Responsive images
- CDN caching

## Optimization Recommendations

### 1. Convert Remaining JPGs to WebP

**Manual conversion with online tools:**
- [Squoosh.app](https://squoosh.app/) - Google's image optimization tool
- [CloudConvert](https://cloudconvert.com/jpg-to-webp)

**Settings recommendation:**
- Quality: 80-85%
- Effort: 4-5 (balance speed/size)

**Command-line (if you install sharp):**
```bash
npm install --save-dev sharp-cli
npx sharp -i static/images/cards/*.jpg -o static/images/cards/ -f webp -q 85
```

### 2. Logo Files (PNG)

**Keep as PNG when:**
- File size < 50 KB
- Need transparency
- Simple graphics/logos

**Consider WebP when:**
- File size > 100 KB
- Photography-like images

Current logos (3.5-90 KB) are fine as PNG.

### 3. Responsive Images Strategy

#### Current Implementation
```html
<img src="logo.webp?v=hash"
     srcset="logo.webp?v=hash 1x, logo.webp?v=hash 2x">
```

**Issue:** Same file used for both densities.

#### Recommended Implementation

**Option A: Density descriptors** (for logos)
```html
<img src="logo.webp"
     srcset="logo.webp 1x, logo@2x.webp 2x"
     alt="Logo">
```

**Option B: Width descriptors** (for content images)
```html
<img src="hero-800.webp"
     srcset="hero-400.webp 400w,
             hero-800.webp 800w,
             hero-1200.webp 1200w,
             hero-1600.webp 1600w"
     sizes="(max-width: 768px) 100vw,
            (max-width: 1200px) 80vw,
            1200px"
     alt="Hero">
```

### 4. Hugo Image Processing

Hugo has built-in image processing capabilities:

```go-html-template
{{ $img := resources.Get "images/hero.jpg" }}
{{ $small := $img.Resize "400x webp q85" }}
{{ $medium := $img.Resize "800x webp q85" }}
{{ $large := $img.Resize "1200x webp q85" }}

<img src="{{ $medium.RelPermalink }}"
     srcset="{{ $small.RelPermalink }} 400w,
             {{ $medium.RelPermalink }} 800w,
             {{ $large.RelPermalink }} 1200w"
     sizes="..." alt="...">
```

**Benefit:** Automatic generation of multiple sizes.

### 5. Lazy Loading

Already implemented correctly:
```html
loading="{{ if eq $i 0 }}eager{{ else }}lazy{{ end }}"
fetchpriority="{{ if eq $i 0 }}high{{ else }}low{{ end }}"
```

## Quick Wins

### Immediate Actions (No Build Changes)

1. **Convert 2 JPG cards to WebP**
   - ~40% size reduction expected
   - Total savings: ~100 KB

2. **Optimize heavy WebP files**
   - `bg_image.webp` (922 KB) → Could be ~600 KB at Q80
   - `card6.webp` (765 KB) → Could be ~500 KB at Q80
   - `card7.webp` (826 KB) → Could be ~550 KB at Q80
   - **Total potential savings: ~850 KB**

3. **Create @2x versions for logo**
   - Current: Same file for 1x and 2x
   - Better: logo.webp (39 KB) + logo@2x.webp (~80 KB)

### Future Enhancements

1. **Implement Hugo Image Processing** for automatic responsive images
2. **Add AVIF support** alongside WebP (better compression, ~30% smaller)
3. **Optimize on upload** with GitHub Actions workflow

## Tools & Resources

### Online Tools
- [Squoosh](https://squoosh.app/) - Best for manual optimization
- [TinyPNG](https://tinypng.com/) - Good for PNG compression
- [ImageOptim](https://imageoptim.com/) - Mac app for batch optimization

### Command-Line Tools
```bash
# Install sharp (Node.js)
npm install --save-dev sharp-cli

# Batch convert JPG → WebP
npx sharp -i "static/images/**/*.jpg" -o static/images/ -f webp -q 85

# Batch optimize WebP
npx sharp -i "static/images/**/*.webp" -o static/images-optimized/ -f webp -q 80
```

### Hugo Pipes
See [Hugo Image Processing docs](https://gohugo.io/content-management/image-processing/)

## Testing

After optimization, verify:
```bash
# Check file sizes
find static/images -type f -exec ls -lh {} \;

# Build and test
hugo server

# Lighthouse audit
npm run test:a11y:ci
```

## Metrics

**Current state:**
- Total images: 15 files
- WebP adoption: 60% (9/15 files)
- Avg file size: ~320 KB
- Largest file: 922 KB (bg_image.webp)

**Target state:**
- WebP adoption: 87% (13/15 files, keep 2 small PNGs)
- Avg file size: ~200 KB (37% reduction)
- Largest file: <600 KB

**Expected improvements:**
- Total size reduction: ~1.5 MB → ~1 MB (33% smaller)
- Faster LCP for hero images
- Better mobile performance

---

**Last updated:** 2025-10-20
**Task:** 4.3 - Image Optimization Pipeline
