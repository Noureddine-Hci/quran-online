# Coding Conventions

**Analysis Date:** 2026-03-21

## Naming Patterns

**Files:**
- `camelCase` for JS modules: `api.js`, `dom.js`, `storage.js`, `tajweed.js`
- `camelCase` for view files: `js/views/reader.js`, `js/views/list.js`, `js/views/bookmarks.js`, `js/views/stats.js`
- Flat names — no prefixes, no index files

**Functions:**
- `camelCase` for all functions: `fetchSurahList`, `renderSurahReader`, `toggleBookmark`, `setupScrollHandler`
- Render functions are prefixed `render`: `renderSurahList`, `renderBookmarks`, `renderStats`
- Fetch functions are prefixed `fetch`: `fetchSurahDetail`, `fetchTranslation`, `fetchAudio`
- Init functions are prefixed `init` or `setup`: `init`, `initReminder`, `setupScrollHandler`, `setupTheme`, `setupBurger`
- Helper functions use descriptive names: `stripDiacritics`, `filterSurahs`, `msUntil`, `scheduleReminder`

**Variables:**
- `camelCase` throughout: `savedReciter`, `translitOn`, `memMode`, `tajweedOn`
- Short locals for translation objects: `const t = i18n[state.currentLang]` (always `t` or `tr`)
- UPPER_SNAKE_CASE for module-level constants: `BASE_URL`, `STATIC_CACHE`, `API_CACHE`, `CACHE_VERSION`, `TAJWEED_LEGEND`, `ICON_PLAY`, `ICON_PAUSE`
- Alignment padding with spaces in multi-assignment blocks (visual alignment):
  ```js
  const savedReciter     = storage.get('reciter', 'ar.alafasy');
  const savedReciterName = state.reciters.find(r => r.identifier === savedReciter)?.name || '...';
  const revType          = arabicData.revelationType === 'Meccan' ? t.meccan : t.medinan;
  ```

**Types/Classes:**
- PascalCase for classes: `class Tajweed` (`js/tajweed.js`)
- No TypeScript — plain ES Modules only

**Exports:**
- Named exports only — no default exports anywhere
- Each module exports only what other modules need

## Code Style

**Formatting:**
- No automated formatter detected (no `.prettierrc`, no `biome.json`, no `eslint.config`)
- Indentation: 4 spaces consistently
- Trailing commas not present
- Semicolons used
- Single quotes for strings; template literals for HTML generation

**Alignment:**
- Multi-variable `const` declarations aligned with spaces for readability (visual columns)
- Import statements aligned with spaces: `import { state }    from './state.js';`

**Linting:**
- No linting config detected

## Import Organization

**Order:**
1. State: `import { state } from '../state.js'`
2. i18n: `import { i18n } from '../i18n.js'`
3. Storage: `import { storage } from '../storage.js'`
4. Router: `import { navigate } from '../router.js'`
5. DOM utilities: `import { app, render } from '../dom.js'`
6. API: `import { fetch* } from '../api.js'`
7. Cross-view helpers: `import { isBookmarked } from './bookmarks.js'`

**Path Aliases:**
- None — only relative paths used (`../state.js`, `./views/reader.js`)

**Module System:**
- Native ES Modules (`type="module"` in HTML, `.js` extensions required in imports)

## Section Comments

Section dividers are used consistently throughout all files:

```js
// ── Section Name ─────────────────────────────────────────────────────────────
```

This em-dash + hyphens pattern is the standard separator between logical sections.

## Error Handling

**API functions (`js/api.js`):**
- Every `async` fetch function is wrapped in `try/catch`
- On error: log with `console.error('functionName:', e)` and return `[]` or `null`
- Pattern:
  ```js
  export async function fetchSurahList() {
      try {
          const res  = await fetchWithTimeout(`${BASE_URL}/surah`);
          const data = await res.json();
          return data.data;
      } catch (e) {
          console.error('fetchSurahList:', e);
          return [];
      }
  }
  ```

**Init function (`js/main.js`):**
- Top-level `init()` wraps all startup logic in `try/catch`
- Fatal errors render a user-visible text message into `#app-view`
- Pattern:
  ```js
  try {
      // ...
  } catch (err) {
      console.error('[init] Fatal error:', err);
      document.getElementById('app-view').textContent = 'Erreur de chargement — voir la console (F12).';
  }
  ```

**Storage (`js/storage.js`):**
- Both `get` and `set` silently catch `localStorage` exceptions and return the fallback
- Empty catch blocks used intentionally to swallow storage errors

**View functions:**
- Null-check API results before rendering: `if (!arabicData || !translationData) { render(app, error html); return; }`
- Optional chaining used for nullable data: `translitData?.ayahs?.[index]?.text || ''`

## Logging

**Framework:** `console` only

**Patterns:**
- `console.error('[context] message:', err)` for fatal/unexpected errors
- `console.warn('message:', err)` for non-critical failures (e.g., SW registration)
- `console.error('functionName:', e)` in API catch blocks — function name as tag
- No structured logging, no log levels library

## DOM Rendering

**Single primitive:** All HTML rendering goes through `render(container, htmlString)` in `js/dom.js`

```js
export function render(container, html) {
    const doc = new DOMParser().parseFromString(
        `<!DOCTYPE html><html><body>${html}</body></html>`, 'text/html'
    );
    container.replaceChildren(...Array.from(doc.body.childNodes));
}
```

- `DOMParser` is used instead of `innerHTML` assignment — does not execute inline scripts
- Template literals build HTML strings; never use string concatenation for HTML
- `render(app, ...)` for full view swaps; `render(element, ...)` for partial updates

## Comments

**When to Comment:**
- Section dividers for every logical group within a file
- Inline comments explaining non-obvious logic or intent (e.g., `// Only count each ayah once per surah`)
- French and English mixed — comments may be in either language (project is bilingual)

**JSDoc:** Not used — no `@param` / `@returns` annotations

## Function Design

**Size:** Functions stay focused; helper functions extracted for reuse (e.g., `surahCardHTML`, `filterSurahs`, `attachCardListeners`)

**Parameters:** Minimal — most functions read from `state` directly rather than receiving it as a parameter

**Return Values:**
- API functions: return data or `null`/`[]` on error
- Render functions: return nothing (void) — side-effect only
- Helper functions: return computed values (boolean, string, filtered array)

## Module Design

**Exports:** Named exports only (`export function`, `export const`, `export class`)

**Barrel Files:** Not used — each module exports directly; consumers import by path

**Singleton Pattern:**
- `state` object is a single exported mutable object (`js/state.js`) — mutated in place
- `storage` is a singleton object literal (`js/storage.js`)
- `tajweedParser` is a module-level singleton in `js/views/reader.js`

## IIFE Pattern

Self-initializing setup blocks use IIFEs at module scope:

```js
(function setupTheme() { ... })();
(function setupBurger() { ... })();
(function setupBottomNav() { ... })();
(function setupAutoHideNav() { ... })();
(function setupOLED() { ... })();
```

Named IIFEs (not anonymous) — use the feature name as the IIFE name for debuggability.

---

*Convention analysis: 2026-03-21*
