# Technology Stack

**Analysis Date:** 2026-03-21

## Languages

**Primary:**
- HTML5 - Single-page application shell (`index.html`)
- CSS3 - Styling, theming, animations (`style.css`)
- JavaScript (ES2020+) - All application logic (`js/`)

**Secondary:**
- None

## Runtime

**Environment:**
- Browser — no server-side runtime; fully static site
- Service Worker for offline caching (`sw.js`)

**Package Manager:**
- None — no `package.json`, no `node_modules`
- No lockfile (no build tooling at all)

## Frameworks

**Core:**
- None — vanilla JavaScript with ES modules (`type="module"`)
- Hash-based client-side routing implemented manually in `js/router.js`
- Simple mutable singleton state in `js/state.js`

**UI Rendering:**
- No framework — DOM manipulation via `innerHTML` / `render()` helper in `js/dom.js`
- Template literals used everywhere for HTML generation

**Testing:**
- None — no test framework detected

**Build/Dev:**
- None — no bundler, no transpiler, no build step
- Files served directly as static assets

## Key Dependencies

**External CSS/Fonts (CDN-loaded):**
- Google Fonts — `Inter` (UI sans-serif) and `Amiri` (Arabic fallback serif)
  - Source: `https://fonts.googleapis.com/css2?family=Amiri:...&family=Inter:...`
- AlQuran Cloud font bundle — `MeQuran` (primary Arabic/Tajweed font)
  - Source: `https://alquran.cloud/public/css/font-all.css`

**No npm/pip/cargo dependencies** — zero third-party JavaScript libraries bundled.

## Configuration

**Environment:**
- No environment variables — API base URL is hardcoded in `js/api.js`:
  `const BASE_URL = 'https://api.alquran.cloud/v1';`
- User preferences stored in `localStorage` via `js/storage.js`:
  - `theme` — `'dark'` (default) or `'light'`
  - `oled` — boolean OLED mode
  - `lang` — `'fr'` (default) or `'en'`
  - `reciter` — edition identifier (default `'ar.alafasy'`)
  - `tajweedOn` — boolean (default `true`)
  - `translitOn` — boolean (default `false`)
  - `audioSpeed` — playback speed (default `1`)
  - `memMode` — memorization mode (default `false`)
  - `reminderTime` — `HH:MM` string or `null`
  - `stats` — reading statistics object
  - Bookmarks and resume positions stored per-surah

**Build:**
- No build config files — source files are deployed as-is

## Platform Requirements

**Development:**
- Any static file server (or direct file open in browser)
- No Node.js, Python, or other server runtime required

**Production:**
- Static file hosting (GitHub Pages, Netlify, Vercel, any CDN)
- HTTPS required for Service Worker registration and Web Notifications API
- No server, database, or backend process needed

## PWA Features

**Progressive Web App:**
- `manifest.json` — standalone display mode, portrait orientation
- `sw.js` — Service Worker with two-cache strategy:
  - `quran-static-v3`: static assets (Cache-First)
  - `quran-api-v3`: API responses (Network-First for surah content, Cache-First for list/reciters)
- Offline fallback: returns HTTP 503 with text message

---

*Stack analysis: 2026-03-21*
