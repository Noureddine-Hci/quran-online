# Architecture

**Analysis Date:** 2026-03-21

## Pattern Overview

**Overall:** Single-Page Application (SPA) with hash-based routing, no build step

**Key Characteristics:**
- Vanilla JavaScript ES Modules (native `import`/`export`, no bundler)
- Client-rendered views: all HTML is generated as template-literal strings and injected via a single `render()` primitive
- All persistent state lives in `localStorage` via the `storage` abstraction
- One global mutable state singleton shared across all modules
- PWA with Service Worker for offline support

## Layers

**Entry Point:**
- Purpose: Bootstraps the app, wires global UI behaviors, registers Service Worker
- Location: `js/main.js`
- Contains: `init()`, scroll handler, theme toggle, burger menu, bottom nav, OLED mode, lang selector
- Depends on: all other modules
- Used by: `index.html` via `<script type="module" src="js/main.js">`

**Router:**
- Purpose: Parses the URL hash and maps it to a named view; provides imperative navigation
- Location: `js/router.js`
- Contains: `getRoute()`, `navigate(path)`
- Depends on: nothing
- Used by: `js/main.js`, all view files

**State:**
- Purpose: Single shared mutable object for runtime data (surah list, reciters, active language, current surah ID, last search term)
- Location: `js/state.js`
- Contains: `state` object with a derived getter `selectedTranslationId`
- Depends on: `js/storage.js`, `js/i18n.js`
- Used by: all view files, `js/main.js`

**API Client:**
- Purpose: All network calls to `https://api.alquran.cloud/v1`; each function returns parsed data or a safe fallback
- Location: `js/api.js`
- Contains: `fetchSurahList`, `fetchSurahDetail`, `fetchTranslation`, `fetchAudio`, `fetchTransliteration`, `fetchTafsir`, `fetchReciters`
- Depends on: nothing (pure fetch calls)
- Used by: `js/main.js` (init), `js/views/reader.js`

**DOM Utility:**
- Purpose: Single rendering primitive; avoids `innerHTML` by using `DOMParser` to prevent inline script execution
- Location: `js/dom.js`
- Contains: `render(container, html)`, `showLoading()`, `app` (reference to `#app-view`)
- Depends on: nothing
- Used by: every view file and `js/main.js`

**Storage:**
- Purpose: Thin `localStorage` wrapper with JSON serialization and silent error swallowing
- Location: `js/storage.js`
- Contains: `storage.get(key, fallback)`, `storage.set(key, value)`
- Depends on: nothing
- Used by: `js/state.js`, all view files, `js/reminder.js`

**Internationalization:**
- Purpose: Static translation strings for FR/EN; maps language codes to API edition identifiers
- Location: `js/i18n.js`
- Contains: `i18n` object (FR and EN string maps), `langConfig` (lang → API edition ID)
- Depends on: nothing
- Used by: `js/state.js`, all view files, `js/reminder.js`

**Tajweed Parser:**
- Purpose: Parses bracket-encoded tajweed annotation from the `quran-tajweed` API edition into `<tajweed>` HTML elements with CSS class and data attributes
- Location: `js/tajweed.js`
- Contains: `Tajweed` class with `parse(text)` and `getMeta()` methods
- Depends on: nothing
- Used by: `js/views/reader.js`

**Views:**
- Purpose: Each view function renders HTML into `#app-view`, then attaches event listeners imperatively
- Location: `js/views/`
- Contains:
  - `js/views/list.js` — surah list with live search
  - `js/views/reader.js` — ayah-by-ayah reader with audio player, tajweed, bookmarks, stats tracking
  - `js/views/bookmarks.js` — bookmarked ayahs list; exports helper functions `isBookmarked`, `toggleBookmark` consumed by `reader.js`
  - `js/views/stats.js` — reading progress dashboard; exports `recordAyahRead` consumed by `reader.js`
- Depends on: `js/state.js`, `js/i18n.js`, `js/storage.js`, `js/router.js`, `js/dom.js`, `js/api.js` (reader only)
- Used by: `js/main.js` (dispatch in `handleRoute`)

**Service Worker:**
- Purpose: Offline caching with differentiated strategies per resource type
- Location: `sw.js`
- Contains: install (pre-cache static assets), activate (evict stale caches), fetch handler (Cache-First for static/long-lived API, Network-First for surah content/audio)
- Depends on: nothing
- Used by: browser automatically after registration in `js/main.js`

**Reminder:**
- Purpose: Daily reading reminder via Web Notifications API; uses `setTimeout` to fire at user-configured time
- Location: `js/reminder.js`
- Contains: `initReminder()`
- Depends on: `js/state.js`, `js/i18n.js`, `js/storage.js`
- Used by: `js/main.js`

## Data Flow

**Application Boot:**

1. `index.html` loads; an inline script reads `localStorage['theme']` and applies it immediately (prevents flash)
2. `js/main.js` imports all modules; IIFE setup functions run synchronously (theme, burger, bottom nav, scroll, OLED)
3. `init()` calls `showLoading()`, then fires `fetchSurahList()` and `fetchReciters()` in parallel via `Promise.all`
4. Results are stored in `state.surahs` and `state.reciters`
5. `handleRoute()` is called; `getRoute()` reads `window.location.hash` and dispatches to the appropriate view function
6. Service Worker is registered after the `load` event

**Navigation Flow:**

1. User clicks a link or button that calls `navigate(path)` → sets `window.location.hash`
2. `hashchange` event fires on `window`
3. `handleRoute()` reads the new hash via `getRoute()` and renders the matching view
4. The view calls `render(app, htmlString)` which replaces `#app-view` children via `DOMParser`
5. The view then attaches fresh event listeners to the newly-inserted DOM

**Surah Reader Flow:**

1. `renderSurahReader(id)` calls `showLoading()` then fires three API requests in parallel: Arabic text (`quran-tajweed` edition), translation (FR or EN from `state.selectedTranslationId`), transliteration
2. If tajweed is enabled, each ayah's raw text is processed by `tajweedParser.parse(text)` before HTML generation
3. A sticky audio player HTML block is inserted; audio management (play/pause/seek, loop, reciter switch, speed) is handled imperatively by event listeners attached after render
4. As the user scrolls through ayahs, `recordAyahRead(surahId, ayahNum, total)` writes to `localStorage['stats']`

**State Management:**

- `state` object is mutated directly from any module that imports it (no reactive system)
- Persistence is explicit: callers call `storage.set(key, value)` after mutations that should survive page reload
- Keys: `lang`, `theme`, `oled`, `bookmarks`, `stats`, `lastRead`, `reciter`, `tajweedOn`, `translitOn`, `audioSpeed`, `memMode`, `reminderTime`

## Key Abstractions

**`render(container, html)`:**
- Purpose: Single safe rendering primitive; all views use it exclusively to inject HTML
- File: `js/dom.js`
- Pattern: `render(app, templateLiteralString)` — never use `innerHTML` directly

**`storage.get / storage.set`:**
- Purpose: All reads and writes to `localStorage` go through this object
- File: `js/storage.js`
- Pattern: `storage.get('key', defaultValue)` always provides a fallback; `storage.set('key', value)` is silent on quota errors

**`state` singleton:**
- Purpose: Runtime data shared across views without prop-drilling
- File: `js/state.js`
- Pattern: Import and mutate properties directly — `state.currentLang = 'en'`; no setter functions

**Route object:**
- Purpose: Normalized view descriptor returned by `getRoute()`
- File: `js/router.js`
- Pattern: `{ view: 'list' | 'reader' | 'bookmarks' | 'stats', id?: string }`

## Entry Points

**`index.html`:**
- Location: `index.html`
- Triggers: browser load
- Responsibilities: Static shell (nav, `#app-view`, bottom nav, footer), theme-flash prevention inline script, loading `js/main.js` as ES module

**`js/main.js`:**
- Location: `js/main.js`
- Triggers: module load
- Responsibilities: Global UI wiring, app initialization, route dispatch

**`sw.js`:**
- Location: `sw.js`
- Triggers: Service Worker install/activate/fetch events
- Responsibilities: Offline caching for static assets and API responses

## Error Handling

**Strategy:** Silent graceful degradation — API failures return empty arrays or `null`; the UI shows an inline error message rather than crashing

**Patterns:**
- Every `api.js` function wraps its fetch in `try/catch`, logs to `console.error`, and returns `[]` or `null`
- `fetchWithTimeout` uses `AbortController` with a 10-second deadline
- `init()` in `main.js` wraps the boot sequence in `try/catch` and shows a user-visible message on fatal error
- `storage.get/set` silently swallows exceptions (private/incognito mode safety)
- View renders guard against null API responses: `if (!arabicData || !translationData) { render(app, errorHTML); return; }`

## Cross-Cutting Concerns

**Logging:** `console.error('[context] message', error)` in API catch blocks only; no structured logger
**Validation:** Input validation is inline and minimal (regex for time format in reminder, number range checks)
**Authentication:** None — fully public, no user accounts
**Accessibility:** ARIA roles and labels on nav, grid, cards; keyboard support on surah cards (`Enter`/`Space`); `lang="ar"` on Arabic text nodes
**Offline:** Service Worker provides full offline access after first visit; API responses cached with Network-First strategy for surah content

---

*Architecture analysis: 2026-03-21*
