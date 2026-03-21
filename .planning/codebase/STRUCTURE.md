# Codebase Structure

**Analysis Date:** 2026-03-21

## Directory Layout

```
Quran Online/           # Project root
├── index.html          # App shell — only HTML file; single-page application
├── style.css           # All styles (41 KB) — single flat stylesheet
├── sw.js               # Service Worker — offline caching
├── manifest.json       # PWA manifest
├── icon.svg            # App icon (SVG, used as favicon and PWA icon)
├── README.md
├── LICENSE
├── .gitignore
├── js/                 # All JavaScript source
│   ├── main.js         # Entry point — app boot, global UI, route dispatch
│   ├── state.js        # Global mutable state singleton
│   ├── router.js       # Hash router — getRoute(), navigate()
│   ├── dom.js          # Rendering primitive — render(), showLoading()
│   ├── api.js          # API client — all fetch calls to alquran.cloud
│   ├── storage.js      # localStorage wrapper
│   ├── i18n.js         # FR/EN translation strings and API edition mapping
│   ├── tajweed.js      # Tajweed annotation parser (class Tajweed)
│   ├── reminder.js     # Daily notification reminder feature
│   └── views/          # View modules — one export per route
│       ├── list.js     # Surah list with search (route: /)
│       ├── reader.js   # Surah reader with audio + tajweed (route: /surah/:id)
│       ├── bookmarks.js # Bookmarks view + isBookmarked/toggleBookmark helpers
│       └── stats.js    # Reading stats view + recordAyahRead helper
└── .planning/          # GSD planning documents (not shipped)
    └── codebase/
```

## Directory Purposes

**`js/` (root modules):**
- Purpose: Application infrastructure — shared by all views
- Contains: state management, routing, DOM rendering, API calls, persistence, localization, utility classes
- Key files: `js/main.js` (entry), `js/state.js` (shared data), `js/api.js` (network), `js/dom.js` (rendering)

**`js/views/`:**
- Purpose: Route-level view modules — each corresponds to one navigable screen
- Contains: One exported async/sync render function per file, plus helper exports shared with other views
- Key files: `js/views/reader.js` (largest, ~1000 lines — audio player, tajweed, bookmarks, stats integration)

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell; loads `js/main.js` as ES module; contains static nav, `#app-view` mount point, bottom nav, footer
- `js/main.js`: JavaScript entry; wires global behaviors, calls `init()`, registers Service Worker

**Configuration:**
- `manifest.json`: PWA metadata (name, icons, theme color, display mode)
- `sw.js`: Cache version string `CACHE_VERSION = 'v3'` — bump this to invalidate all caches
- `js/i18n.js`: `langConfig` maps language codes to AlQuran Cloud API edition IDs; add new languages here

**Core Logic:**
- `js/api.js`: All external API calls; base URL `https://api.alquran.cloud/v1`
- `js/router.js`: Hash patterns: `#/` → list, `#/surah/:id` → reader, `#/bookmarks`, `#/stats`
- `js/state.js`: Runtime state shape and `selectedTranslationId` derived getter

**Styles:**
- `style.css`: Single file, ~41 KB — all CSS custom properties (design tokens), layout, component styles, responsive breakpoints, tajweed color classes, dark/light/OLED theme variants

**Testing:**
- Not present — no test files, no test runner configuration

## Naming Conventions

**Files:**
- camelCase for JS modules: `main.js`, `router.js`, `tajweed.js`
- Lowercase single-word for views: `list.js`, `reader.js`, `bookmarks.js`, `stats.js`
- All filenames lowercase; no underscores

**Directories:**
- Lowercase, single-word: `js/`, `views/`

**JavaScript identifiers:**
- Functions: camelCase — `renderSurahList`, `fetchSurahDetail`, `initReminder`
- Constants/singletons: camelCase — `state`, `storage`, `i18n`, `langConfig`
- Classes: PascalCase — `Tajweed`
- Module-level constants: UPPER_SNAKE_CASE for config values — `BASE_URL`, `CACHE_VERSION`, `STATIC_CACHE`
- SVG icon constants: UPPER_SNAKE prefixed with `ICON_` — `ICON_PLAY`, `ICON_PAUSE`

**CSS classes:**
- kebab-case BEM-lite: `.surah-card`, `.ayah-card`, `.glass`, `.nav-icon-btn`, `.bookmark-group-header`
- Tajweed rule classes use shorthand: `.ham_wasl`, `.madda_normal`, `.qlq`, `.ghn`

## Where to Add New Code

**New route/view:**
1. Create `js/views/myview.js` exporting `renderMyView()`
2. Import it in `js/main.js`
3. Add a hash pattern to `js/router.js` → `getRoute()`
4. Add a dispatch branch in `handleRoute()` in `js/main.js`
5. Add navigation buttons in `index.html` and wire click handlers in `js/main.js`
6. Add the new file to `STATIC_ASSETS` in `sw.js`

**New API call:**
- Add a named async export to `js/api.js`
- Follow the pattern: `fetchWithTimeout` for non-critical calls, plain `fetch` only if fast response is guaranteed
- Always return a safe fallback (`null`, `[]`) in the catch block

**New user preference (persisted setting):**
- Choose a storage key (document in `js/storage.js` comments or inline)
- Read with `storage.get('key', defaultValue)` at view init time
- Write with `storage.set('key', value)` on user action
- If it should apply on initial load before paint (like `theme`), add a small inline script to `index.html`

**New translation string:**
- Add the key to both `i18n.fr` and `i18n.en` objects in `js/i18n.js`
- Access via `i18n[state.currentLang].myKey` in view code

**New CSS component:**
- Add rules to `style.css`; follow the existing section comment pattern (`/* ── Section name ── */`)
- Use existing CSS custom properties: `--accent`, `--text`, `--text-muted`, `--glass-border`, `--bg`, etc.

**Feature module (non-view):**
- Add a new file in `js/` (same level as `reminder.js`, `tajweed.js`)
- Export named functions; import in `js/main.js` if it needs global initialization

## Special Directories

**`.planning/`:**
- Purpose: GSD planning and codebase analysis documents
- Generated: No (written by Claude)
- Committed: Optional (project-specific decision)

**`.claude/worktrees/`:**
- Purpose: Git worktrees created by Claude Code for parallel branch work
- Generated: Yes (by Claude Code tooling)
- Committed: No (`.gitignore` should cover these)

---

*Structure analysis: 2026-03-21*
