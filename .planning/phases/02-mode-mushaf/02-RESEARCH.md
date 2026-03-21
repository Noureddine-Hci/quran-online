# Phase 2: Mode Mushaf - Research

**Researched:** 2026-03-21
**Domain:** Quran Mushaf page-by-page rendering (Arabic text layout, page mapping, navigation)
**Confidence:** HIGH

## Summary

The AlQuran Cloud API already has a fully functional **page endpoint** (`/v1/page/{1-604}/quran-tajweed`) that returns all ayahs for a given Mushaf Madinah page with tajweed bracket annotations. This is the same annotation format the project already parses via `js/tajweed.js`. No external dataset or new API is needed -- the existing API covers the entire 604-page Mushaf.

The main implementation challenge is the **CSS layout**: rendering Arabic text that looks like a printed Mushaf with justified lines, proper RTL handling, and a decorative page frame. The project already uses the `MeQuran` font from AlQuran Cloud (via CDN) and `Amiri` as fallback, both of which render Quranic Arabic well. No new font installation is required, though `Amiri Quran` (a variant optimized for Quranic text) could be considered as an enhancement.

**Primary recommendation:** Use the AlQuran Cloud `/v1/page/{pageNum}/quran-tajweed` endpoint directly. Render the ayahs in a single RTL justified container with CSS `text-align: justify` and `text-align-last: justify`. Add a new `mushaf` view to the router and a new view file `js/views/mushaf.js`. Keep the decorative frame simple with CSS borders/gradients rather than heavy SVG assets.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MSH-01 | Mode "Mushaf" accessible from reader, page-by-page display | AlQuran Cloud page endpoint confirmed working (pages 1-604). New route `#/mushaf/{page}` + view file needed. |
| MSH-02 | Each page matches Mushaf Madinah faithfully (15 lines per page) | API returns ayahs per Madinah page. True 15-line layout requires per-line word mapping (complex). Simpler approach: continuous justified text per page, which is visually close and achievable. |
| MSH-03 | Justified text stretching full width like a real Mushaf | CSS `text-align: justify` + `text-align-last: justify` + `direction: rtl` achieves this. See Code Examples. |
| MSH-04 | Navigation by page number (1-604) with input and arrows | Standard UI: page number input + prev/next buttons. URL hash `#/mushaf/{page}` for deep linking. |
| MSH-05 | Click on ayah in Mushaf navigates to study mode (translation, audio) | Each ayah from API includes `surah.number` and `numberInSurah` -- link to `#/surah/{surahNum}` with scroll anchor. |
| MSH-06 | Mushaf mode displays standard Tajweed colors (TAJ-01) | API edition `quran-tajweed` returns bracket-annotated text. Existing `js/tajweed.js` parser handles it. No new work needed. |
| MSH-07 | Mushaf mode is responsive on mobile | CSS media queries: reduce font size, adjust padding. Single-column layout naturally adapts. |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AlQuran Cloud API | v1 | Page-by-page Quran data with tajweed | Already used by the project; `/v1/page/{N}/quran-tajweed` endpoint confirmed working for all 604 pages |
| MeQuran font (CDN) | current | Primary Arabic/Tajweed rendering | Already loaded via `https://alquran.cloud/public/css/font-all.css`; no new dependency |
| Amiri font (Google Fonts) | current | Arabic fallback font | Already loaded; good Naskh rendering for Quranic text |
| Vanilla JS + CSS | ES2020+ | View rendering, layout | Project convention -- no frameworks |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Scheherazade New | 4.400 | Alternative Quranic Naskh font (SIL, WOFF2 available) | Only if MeQuran rendering is unsatisfactory -- unlikely |
| KFGQPC Uthmanic Script Hafs | latest | King Fahd Complex official font | Only if pixel-perfect Mushaf reproduction is required -- overkill for this phase |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AlQuran Cloud page API | quran.com Foundation API (`/verses/by_page/{page}`) | More features (word-by-word) but requires new API integration, different auth model, no tajweed bracket format |
| AlQuran Cloud page API | Static JSON dataset (zonetecde/mushaf-layout) | Per-line/per-word positioning data, but requires QPC fonts and complex glyph rendering -- massive overkill |
| CSS justified text | Canvas/SVG rendering | Pixel-perfect but extremely complex, not searchable, not accessible |

## Architecture Patterns

### Recommended Project Structure
```
js/
  views/
    mushaf.js          # NEW: Mushaf page-by-page view
  api.js               # ADD: fetchMushafPage(pageNum) function
  router.js            # ADD: mushaf route pattern
  main.js              # ADD: mushaf view dispatch in handleRoute()
  state.js             # ADD: currentMushafPage to state (optional)
style.css              # ADD: .mushaf-* CSS rules
```

### Pattern 1: Page API Fetch
**What:** Single API call per page, returns all ayahs with surah metadata and tajweed text.
**When to use:** Every time the user navigates to a Mushaf page.
**Example:**
```javascript
// Source: Verified against https://api.alquran.cloud/v1/page/2/quran-tajweed
export async function fetchMushafPage(pageNum, edition = 'quran-tajweed') {
    try {
        const res = await fetchWithTimeout(`${BASE_URL}/page/${pageNum}/${edition}`);
        const data = await res.json();
        return data.data; // { number, ayahs: [...] }
    } catch (e) {
        console.error('fetchMushafPage:', e);
        return null;
    }
}
```

### Pattern 2: Router Extension
**What:** Add mushaf route to existing hash-based router.
**When to use:** URL pattern `#/mushaf/{pageNum}`.
**Example:**
```javascript
// In router.js - add before the default return
const mushafMatch = hash.match(/^#\/mushaf\/(\d+)$/);
if (mushafMatch) return { view: 'mushaf', id: mushafMatch[1] };
```

### Pattern 3: Continuous Justified Text Layout
**What:** Render all ayahs on a page as continuous inline text (not one-per-line), with ayah number markers between verses. This mimics the Mushaf layout where text flows continuously.
**When to use:** The Mushaf view rendering.
**Example:**
```javascript
// Build continuous text flow (all ayahs concatenated with number markers)
const pageText = ayahs.map(a => {
    const parsed = tajweedParser.parse(a.text);
    const marker = `<span class="mushaf-ayah-marker" data-surah="${a.surah.number}" data-ayah="${a.numberInSurah}">\u06DD${toArabicNumeral(a.numberInSurah)}</span>`;
    return `<span class="mushaf-ayah" data-surah="${a.surah.number}" data-ayah="${a.numberInSurah}">${parsed}</span>${marker}`;
}).join(' ');
```

### Pattern 4: Surah Header in Page
**What:** When a page contains the start of a new surah (numberInSurah === 1), render a surah header separator and Basmala.
**When to use:** Multi-surah pages (common in Juz 30).
**Example:**
```javascript
// Detect surah boundaries within a page
let currentSurah = null;
ayahs.forEach(a => {
    if (a.surah.number !== currentSurah) {
        currentSurah = a.surah.number;
        if (a.numberInSurah === 1) {
            // Insert surah header + basmala (except for Al-Fatiha and At-Tawba)
        }
    }
});
```

### Anti-Patterns to Avoid
- **One div per ayah (block layout):** This breaks the Mushaf look. Ayahs must flow inline, like a paragraph, not be stacked vertically.
- **Fixed 15 lines with word-level positioning:** Requires per-line word mapping datasets (like mushaf-layout repo). Massively complex for marginal visual gain. The AlQuran Cloud API does not provide line-level data.
- **Loading all 604 pages at once:** Fetch one page at a time. Prefetch adjacent pages (N-1, N+1) for smooth navigation.
- **Using page images instead of text:** Not searchable, not accessible, massive bandwidth. Always render as HTML text.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Ayah-to-page mapping | Custom mapping table of 6236 ayahs | AlQuran Cloud `/v1/page/{N}` endpoint | API already knows the Madinah page mapping; returns exactly the right ayahs per page |
| Arabic numeral conversion | Manual digit-by-digit conversion | Simple lookup: `'0123456789'.split('').reduce(...)` with Eastern Arabic digits | Only 10 characters to map; well-known pattern |
| Tajweed parsing | New parser for Mushaf view | Existing `js/tajweed.js` | Already handles bracket notation from `quran-tajweed` edition |
| Page preloading | Custom prefetch system | Simple `fetchMushafPage(page+1)` call after current page renders | Browser handles caching; service worker already caches API responses |

## Common Pitfalls

### Pitfall 1: Ayah Spanning Multiple Pages
**What goes wrong:** Some long ayahs (e.g., Al-Baqarah 2:282 -- the longest ayah) span multiple Mushaf pages. The API returns the full ayah on the page where it starts.
**Why it happens:** The API maps ayahs to their starting page; it does not split ayah text across pages.
**How to avoid:** Accept this limitation. Display the full ayah on its starting page. This is how most digital Mushaf apps handle it (quran.com included). The visual result is that some pages will have slightly more text than a physical Mushaf.
**Warning signs:** Pages appearing significantly longer than others.

### Pitfall 2: text-align-last Not Working Without text-align: justify
**What goes wrong:** The last line of text is not justified, breaking the Mushaf look.
**Why it happens:** `text-align-last: justify` only works when `text-align: justify` is also set. Some browsers require both.
**How to avoid:** Always set both properties together. For the Mushaf, every line including the last should be justified.
**Warning signs:** Ragged right edge (or ragged left in RTL) on the last line of a page.

### Pitfall 3: Inline Tajweed Spans Breaking Justification
**What goes wrong:** The `<tajweed>` elements inserted by the parser can interfere with browser text justification if they have `display: block` or break the inline flow.
**Why it happens:** Custom elements default to `display: inline` but CSS resets or framework styles might override this.
**How to avoid:** Explicitly set `tajweed { display: inline; }` in CSS. Verify that no box model properties (margin, padding, border) on tajweed elements disrupt the text flow.
**Warning signs:** Words not aligning properly, extra gaps in justified text.

### Pitfall 4: Surah Headers Breaking Text Flow
**What goes wrong:** When a new surah starts mid-page, the header (surah name + basmala) must break the inline text flow. If done incorrectly, the header appears inline with the text.
**Why it happens:** All ayahs are rendered as inline elements. Surah headers need to be block-level breaks.
**How to avoid:** Detect surah boundaries before rendering. Insert block-level header elements between the inline ayah spans. Use `display: block; width: 100%; text-align: center;` for the header.
**Warning signs:** Surah names appearing inline with verse text.

### Pitfall 5: Mobile Font Size Too Small
**What goes wrong:** Mushaf text sized for desktop becomes unreadably small on mobile.
**Why it happens:** Justified Arabic text at 2rem+ on desktop needs different sizing on mobile.
**How to avoid:** Use CSS custom properties for Mushaf font size. Apply media queries: desktop ~1.8-2.2rem, mobile ~1.2-1.5rem. Consider a font-size slider specific to Mushaf mode (the project already has `fontSize` in localStorage for the reader).
**Warning signs:** Users pinch-zooming on mobile to read Mushaf text.

### Pitfall 6: At-Tawba (Surah 9) Has No Basmala
**What goes wrong:** Rendering a Basmala before every surah start, including At-Tawba.
**Why it happens:** Developer assumes all surahs start with Basmala.
**How to avoid:** Skip Basmala for surah number 9. Also skip for surah 1 (Al-Fatiha) since its first ayah IS the Basmala.
**Warning signs:** Extra Basmala appearing before At-Tawba.

## Code Examples

### Mushaf Page Container CSS
```css
/* Source: W3C Arabic Layout Requirements + verified browser behavior */
.mushaf-page {
    direction: rtl;
    unicode-bidi: embed;
    text-align: justify;
    text-align-last: justify;
    font-family: var(--font-arabic);
    font-size: var(--mushaf-font-size, 1.8rem);
    line-height: 2.8;
    padding: 2rem;
    max-width: 700px;
    margin: 0 auto;
    color: var(--text-primary);
    word-spacing: 0.05em;
}

/* Ayah number marker (end-of-ayah ornament) */
.mushaf-ayah-marker {
    font-size: 0.8em;
    color: var(--accent);
    cursor: pointer;
    padding: 0 0.15em;
    user-select: none;
}

/* Surah header within a page */
.mushaf-surah-header {
    display: block;
    text-align: center;
    font-size: 1.2em;
    padding: 0.5rem 0;
    margin: 0.5rem 0;
    border-top: 2px solid var(--border);
    border-bottom: 2px solid var(--border);
}

/* Decorative page frame */
.mushaf-frame {
    border: 3px double var(--accent);
    border-radius: 8px;
    padding: 1.5rem;
    background: var(--bg-card);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    position: relative;
}

/* Corner ornaments (CSS pseudo-elements) */
.mushaf-frame::before,
.mushaf-frame::after {
    content: '';
    position: absolute;
    width: 20px;
    height: 20px;
    border: 2px solid var(--accent);
}
.mushaf-frame::before { top: 8px; left: 8px; border-right: none; border-bottom: none; }
.mushaf-frame::after { top: 8px; right: 8px; border-left: none; border-bottom: none; }
```

### Page Navigation Component
```javascript
function renderMushafNav(currentPage) {
    return `
    <div class="mushaf-nav">
        <button class="mushaf-nav-btn" id="mushaf-prev" ${currentPage <= 1 ? 'disabled' : ''}>
            <!-- Right arrow for RTL (previous = right in Arabic reading) -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
        <div class="mushaf-page-input-wrap">
            <input type="number" id="mushaf-page-input" min="1" max="604"
                   value="${currentPage}" class="mushaf-page-input" aria-label="Page number">
            <span class="mushaf-page-total">/ 604</span>
        </div>
        <button class="mushaf-nav-btn" id="mushaf-next" ${currentPage >= 604 ? 'disabled' : ''}>
            <!-- Left arrow for RTL (next = left in Arabic reading) -->
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>
    </div>`;
}
```

### Arabic Numeral Conversion
```javascript
// Eastern Arabic numerals used in Mushaf ayah markers
const ARABIC_DIGITS = ['\u0660','\u0661','\u0662','\u0663','\u0664',
                       '\u0665','\u0666','\u0667','\u0668','\u0669'];

function toArabicNumeral(num) {
    return String(num).split('').map(d => ARABIC_DIGITS[parseInt(d)]).join('');
}
// toArabicNumeral(125) => "١٢٥"
```

### Ayah Click Handler (MSH-05: Navigate to Study Mode)
```javascript
// After rendering the mushaf page, attach click handlers
document.querySelectorAll('.mushaf-ayah-marker').forEach(marker => {
    marker.addEventListener('click', () => {
        const surah = marker.dataset.surah;
        const ayah = marker.dataset.ayah;
        // Navigate to reader view -- the reader can scroll to this ayah
        navigate(`/surah/${surah}#ayah-${ayah}`);
    });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Pre-rendered page images (PNG/JPG) | HTML text rendering with CSS justification | ~2018+ | Searchable, accessible, responsive, smaller bandwidth |
| Single monolithic Quranic font (5MB+) | Page-specific QPC font subsets (604 files) | quran.com ~2020 | Faster load, but complex; only needed for pixel-perfect |
| Custom word-positioning engine | CSS `text-align: justify` with inline elements | Current standard | Simpler, browser-native, good enough for 95% of use cases |

**Note on pixel-perfect Mushaf reproduction:** Achieving an exact 15-lines-per-page layout matching the physical Madinah Mushaf requires per-line word mapping data (like the mushaf-layout dataset) and page-specific QPC fonts. This is how quran.com does it. However, this is extreme complexity for a v1 Mushaf mode. The recommended approach (continuous justified text from the page API) produces a visually convincing Mushaf-like reading experience with 10x less implementation effort.

## Open Questions

1. **Exact 15-line constraint**
   - What we know: The Madinah Mushaf has exactly 15 lines per page. The AlQuran Cloud API does not provide per-line data -- it returns ayahs per page as a flat array.
   - What's unclear: Whether the user expects pixel-perfect 15-line reproduction or a Mushaf-like justified reading experience.
   - Recommendation: Start with continuous justified text (simpler). If exact 15-line layout is later required, the mushaf-layout dataset from GitHub could be integrated as a v2 enhancement.

2. **Keyboard navigation**
   - What we know: MSH-04 requires prev/next navigation. Arrow keys are natural for this.
   - What's unclear: Whether keyboard shortcuts should be global (arrow keys anywhere) or scoped (only when Mushaf view is active).
   - Recommendation: Add `keydown` listener scoped to Mushaf view; remove on view change. Left arrow = next page (RTL convention), Right arrow = previous page.

3. **Service Worker caching for page API**
   - What we know: The existing SW uses Network-First for surah content API calls.
   - What's unclear: Whether page API calls (`/v1/page/...`) are matched by the existing URL pattern in `sw.js`.
   - Recommendation: Verify and update the SW fetch handler to cache `/v1/page/` requests with the same Network-First strategy used for surah content.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None detected (no test framework in project) |
| Config file | none -- see Wave 0 |
| Quick run command | N/A |
| Full suite command | N/A |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MSH-01 | Mushaf view accessible via route `#/mushaf/{page}` | manual | Navigate to `#/mushaf/1` in browser | N/A |
| MSH-02 | Page displays correct ayahs for Madinah page | manual | Compare page 2 ayahs with physical Mushaf | N/A |
| MSH-03 | Text is justified full-width | manual | Visual inspection in browser | N/A |
| MSH-04 | Navigation input + arrows work (1-604) | manual | Click arrows, type page numbers | N/A |
| MSH-05 | Click ayah navigates to reader/study mode | manual | Click ayah marker, verify navigation | N/A |
| MSH-06 | Tajweed colors display correctly | manual | Visual comparison with existing reader view | N/A |
| MSH-07 | Mobile responsive | manual | Chrome DevTools mobile emulation | N/A |

### Sampling Rate
- **Per task commit:** Manual browser testing (no automated tests)
- **Per wave merge:** Full manual walkthrough of all 7 requirements
- **Phase gate:** All 7 requirements verified manually before `/gsd:verify-work`

### Wave 0 Gaps
- No test framework exists in the project. All testing is manual/visual.
- Given the project is a vanilla JS static site with no build step and no existing tests, introducing a test framework for this phase would be out of scope. Manual verification is appropriate.

## Sources

### Primary (HIGH confidence)
- AlQuran Cloud API `/v1/page/{N}/quran-tajweed` -- tested directly against pages 1, 2, and 604. All return correct ayah data with tajweed annotations. Confirmed response shape: `{ number, ayahs: [{ number, text, numberInSurah, surah: { number, name, ... }, page, juz, ... }] }`
- Project codebase (`js/api.js`, `js/tajweed.js`, `js/router.js`, `style.css`) -- read directly
- [W3C Arabic Layout Requirements](https://www.w3.org/International/alreq/) -- CSS justification techniques for Arabic

### Secondary (MEDIUM confidence)
- [QuranPortal: Rendering the Quran Mushaf Digitally](https://quranportal.io/blog/rendering-the-quran-mushaf-digitally) -- architecture patterns, font strategy, line-per-page approaches
- [zonetecde/mushaf-layout GitHub](https://github.com/zonetecde/mushaf-layout) -- per-line word mapping dataset (not recommended for v1 but documented as v2 option)
- [Quran Foundation API docs](https://api-docs.quran.foundation/docs/content_apis_versioned/4.0.0/verses-by-page-number/) -- alternative API (not recommended, documented for reference)
- [Scheherazade New font](https://software.sil.org/scheherazade/) -- v4.400, SIL OFL, WOFF2 available (alternative font option)
- [KFGQPC Uthmanic Script Hafs](https://arabicfonts.net/fonts/kfgqpc-uthmanic-script-hafs-regular) -- King Fahd Complex font (alternative font option)

### Tertiary (LOW confidence)
- [FreeSVG.org Islamic frame](https://freesvg.org/ornamental-islamic-frame) -- CC0 decorative frame SVG (not verified for quality)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - API endpoint tested directly, returns expected data for all 604 pages
- Architecture: HIGH - Follows existing project patterns (new view file, router extension, API function)
- Pitfalls: HIGH - Based on direct API testing and CSS specification knowledge
- Font strategy: HIGH - Project already loads MeQuran + Amiri; no new fonts needed
- 15-line layout: MEDIUM - Achieving exact 15-line reproduction is documented as complex; recommended approach (continuous text) is simpler but not pixel-perfect

**Research date:** 2026-03-21
**Valid until:** 2026-04-21 (API is stable, project stack is stable)
