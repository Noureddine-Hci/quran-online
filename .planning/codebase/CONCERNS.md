# Codebase Concerns

**Analysis Date:** 2026-03-21

## Tech Debt

**reader.js monolith:**
- Issue: A single file handles rendering, audio playback, tajweed toggling, bookmarking, tafsir accordion, memorisation mode, swipe navigation, and sticky player — 629 lines in one function
- Files: `js/views/reader.js`
- Impact: Hard to test individual features, hard to reason about interactions between features (e.g., audio state and sticky player visibility), high cognitive load for any change
- Fix approach: Extract audio logic into `js/audio.js`, extract toggle/preference controls into `js/views/reader-controls.js`, keep `renderSurahReader` as an orchestrator

**Global window event listeners never removed:**
- Issue: `window.addEventListener('click', ...)` is registered inside `renderSurahReader` on every surah load. `window.addEventListener('hashchange', handleRoute)`, `window.addEventListener('scroll', ...)` are also registered in `main.js` IIFEs on page load and cannot be cleaned up. The `window.addEventListener('click', ...)` in reader accumulates on each navigation.
- Files: `js/views/reader.js` line 513, `js/main.js` lines 23, 52, 179, 214, 224
- Impact: Each time a user opens a surah and goes back, a new click listener is added on `window`. After navigating across multiple surahs, stale handlers fire for every click. No `removeEventListener` calls exist anywhere in the codebase.
- Fix approach: Store handler references and remove them at the start of `renderSurahReader`, or use an abort controller pattern to clean up per-render listeners

**IntersectionObservers never disconnected:**
- Issue: `readObserver` (tracks read ayahs) and `stickyObserver` (sticky player) are created on each `renderSurahReader` call with no `disconnect()` call before or after
- Files: `js/views/reader.js` lines 356 and 386
- Impact: On every surah navigation, new observers are created and the old ones remain active, observing DOM nodes that no longer exist. This is a memory leak compounding with each navigation.
- Fix approach: Call `readObserver.disconnect()` and `stickyObserver.disconnect()` at the start of `renderSurahReader` by storing them in a module-level variable

**Inconsistent timeout handling in api.js:**
- Issue: `fetchSurahDetail`, `fetchTranslation`, and `fetchAudio` use plain `fetch()` without timeout, while `fetchSurahList`, `fetchTransliteration`, `fetchTafsir`, and `fetchReciters` use `fetchWithTimeout()`
- Files: `js/api.js` lines 22–53
- Impact: A slow/stalled response from `fetchSurahDetail` or `fetchTranslation` will block the reader view indefinitely with no user feedback or recovery path
- Fix approach: Apply `fetchWithTimeout` to all API calls uniformly

**style.css is a single 1588-line file:**
- Issue: All styles — variables, nav, reader, cards, toggles, audio controls, stats, bookmarks, mobile — live in one flat CSS file with no sectioning beyond inline comments
- Files: `style.css`
- Impact: High collision risk when modifying styles, no clear ownership of component sections, hard to audit what is safe to delete
- Fix approach: Split into component CSS files or at minimum add clearly demarcated sections with search-anchored comment headers; or migrate to a build step with CSS modules

**state.js is a mutable shared singleton with no reactivity:**
- Issue: `state` is imported and mutated directly by any module (`state.currentLang = newLang`, `state.currentSurahId = id`). There is no subscription model, so derived UI must be manually re-rendered after each mutation.
- Files: `js/state.js`, `js/main.js` line 92–99, `js/views/reader.js` line 44
- Impact: Easy to introduce bugs where state changes without triggering the necessary re-renders; already evident in `renderLangSelector` which manually calls `renderSurahReader` or `renderSurahList` after a language change
- Fix approach: Acceptable for a small SPA; document the pattern explicitly and enforce that state mutations only happen in `main.js` to avoid scattered updates

## Known Bugs

**Sticky player visibility logic is inverted on initial load:**
- Symptoms: The sticky player's visibility is toggled based on `entry.isIntersecting`, but when audio is not yet playing, `isPlaying` will be false so the player stays hidden — this is correct. However, once audio starts and the user scrolls away, the IntersectionObserver may fire with stale state if the observer was re-created after audio started.
- Files: `js/views/reader.js` lines 385–392
- Trigger: Start audio playback, then navigate to another surah and back; the sticky player state may be inconsistent
- Workaround: Stop playback before navigating (swipe navigation at line 609 does not stop audio)

**Swipe navigation does not stop active audio:**
- Symptoms: Swiping to the next/previous surah calls `navigate()` which triggers `renderSurahReader` for the new surah, but the `audioPlayer` element from the previous surah render keeps playing after the DOM is replaced
- Files: `js/views/reader.js` lines 601–611
- Trigger: Start audio playback, then swipe to the next surah — the old audio continues playing
- Workaround: Manually tap the stop button before swiping

**`stats.reset` stores `null` and may cause read failures:**
- Symptoms: `storage.set('stats', null)` stores the JSON string `"null"`. On next read, `storage.get('stats', { ayahsRead: 0, ... })` calls `JSON.parse("null")` which returns `null`, not the fallback object, so accessing `stats.ayahsRead` throws `TypeError: Cannot read properties of null`
- Files: `js/views/stats.js` line 116, `js/storage.js` lines 3–6
- Trigger: Click the Reset button in the stats view, then revisit the stats view
- Workaround: Reload the page after resetting

**`fetchSurahDetail` uses `quran-uthmani` in prefetch but `quran-tajweed` in render:**
- Symptoms: The `prefetchAdjacentSurahs` function fetches `quran-uthmani` edition and caches it. When the user navigates to that surah, `renderSurahReader` requests `quran-tajweed` edition — a different URL — so the cache is missed entirely and the full request fires again
- Files: `js/views/reader.js` lines 622–628 vs line 48
- Trigger: Navigate to any surah — the prefetch has no effect on the actual page load
- Workaround: None currently

**Language selector re-renders but does not close on outside click:**
- Symptoms: The language selector dropdown calls `renderLangSelector()` when a language is chosen, which replaces the DOM node and removes the existing `document` click-outside listener from the previous render. No click-outside listener is added in `renderLangSelector` (unlike the reciter selector in `reader.js`)
- Files: `js/main.js` lines 60–103
- Trigger: Open language selector, click outside — dropdown does not close

## Security Considerations

**Tajweed text rendered via DOMParser with HTML tags from API:**
- Risk: The `quran-tajweed` API returns text containing bracket notation (`[x...[ content ]`) that the tajweed parser converts to `<tajweed class="...">` HTML tags. This HTML string is then passed through `render()` which uses `DOMParser`. DOMParser does not execute scripts, but it does parse arbitrary HTML including `<img onerror>` and similar passive-vector tags if the API were ever compromised or the parsing logic mishandled.
- Files: `js/tajweed.js` lines 37–53, `js/dom.js` lines 8–14, `js/views/reader.js` line 108
- Current mitigation: DOMParser strips `<script>` execution; the tajweed parser output is structurally predictable
- Recommendations: Sanitize the parsed tajweed output with a DOM sanitizer (e.g., `DOMPurify`) before passing to `render()` to defend against API compromise or parser edge cases

**Tafsir text set via `body.textContent`:**
- Risk: Tafsir content uses `body.textContent = tafsirText` which is safe from XSS. However, if a future refactor changes this to `innerHTML` (as a tempting "fix" for missing formatting), it would introduce injection risk from the third-party API response.
- Files: `js/views/reader.js` line 347
- Current mitigation: `textContent` assignment is safe
- Recommendations: Add a comment explicitly noting why `textContent` is used here so it is not accidentally changed

**`prompt()` used for reminder time input:**
- Risk: Uses the browser-native `prompt()` for user input of reminder time. On some browsers this can be suppressed in cross-origin iframes. More importantly it blocks the main thread and is considered poor UX on mobile.
- Files: `js/reminder.js` line 69
- Current mitigation: Input is validated with a regex before use
- Recommendations: Replace with an inline time picker rendered in the page

## Performance Bottlenecks

**Three parallel API calls on every surah open:**
- Problem: `renderSurahReader` simultaneously fetches Arabic text, translation, and transliteration for every navigation. Each surah can have up to 286 ayahs (Al-Baqarah). With no response caching at the JS layer (only SW cache), the first visit always makes 3 network round trips.
- Files: `js/views/reader.js` lines 47–51
- Cause: No in-memory cache for surah data — only the service worker handles re-request caching
- Improvement path: Add a `Map`-based in-memory cache keyed by `${id}:${edition}` to avoid redundant SW cache roundtrips on back-navigation within a session

**Tajweed parser runs regex across full ayah text on every render:**
- Problem: `tajweedParser.parse()` is called for every ayah during initial render. For Al-Baqarah (286 ayahs), this executes 17 regex replacements × 286 times = 4862 regex operations synchronously before the DOM is painted.
- Files: `js/tajweed.js` lines 33–53, `js/views/reader.js` line 108
- Cause: No memoisation; parser runs fresh on every navigation even for the same surah
- Improvement path: Cache parsed results per ayah number in a `WeakMap` or plain object

**All 114 surah cards rendered at once in the list view:**
- Problem: `renderSurahList` generates HTML for all 114 surah cards in a single template literal join and injects them all into the DOM at once
- Files: `js/views/list.js` lines 82–84
- Cause: No virtual scrolling or pagination
- Improvement path: Acceptable at 114 items; becomes an issue only if the list grows or cards become heavier. No immediate action needed.

**`style.css` loaded as a single 1588-line blocking resource:**
- Problem: The entire stylesheet loads on every page visit, including styles for reader, stats, bookmarks, and mobile nav — even on the initial list view where most of these are unused
- Files: `style.css`
- Cause: No CSS splitting, no build step
- Improvement path: Low priority for current scale; would require adding a build pipeline

## Fragile Areas

**Audio playback state management:**
- Files: `js/views/reader.js` lines 394–597
- Why fragile: Audio state (`currentAudioData`, `currentAyahIndex`, `loopAyahIndex`) is maintained in local variables inside `renderSurahReader`. These are reset on every navigation. The `audioPlayer` HTML element is also replaced on navigation. Multiple handlers (`onended`, `onerror`, `stickyPlayBtn`, `stickyStopBtn`, `playBtn`, loop buttons) all mutate the same local state — a race condition exists if the user rapidly clicks play/pause or switches reciters mid-load.
- Safe modification: Always call `stopPlayback()` before any navigation or reciter change. Do not read `audioPlayer.src` after calling `stopPlayback()`.
- Test coverage: No tests exist

**Hash-based router has no guard against invalid IDs:**
- Files: `js/router.js` lines 5–6, `js/views/reader.js` line 42
- Why fragile: The router extracts surah ID as a string from the URL (`match[1]`) and passes it directly to `renderSurahReader`. There is no validation that the ID is between 1 and 114. A URL like `#/surah/999` causes `fetchSurahDetail(999, ...)` which returns a valid-looking API error response, and the reader shows the error message — but there is no redirect back to the list.
- Safe modification: Add a guard in `renderSurahReader` validating `parseInt(id) >= 1 && parseInt(id) <= 114` before any API call

**Bookmark "goto" navigates to surah but does not scroll to ayah:**
- Files: `js/views/bookmarks.js` lines 90–95
- Why fragile: `bm-goto` buttons navigate to `#/surah/${surahId}` without passing the ayah number. The reader view opens at ayah 1 and the user has to manually jump using the jump input. The `data-ayah` attribute is present on the button but unused in the click handler.
- Safe modification: Pass ayah number as a URL fragment or query param and auto-scroll after render

## Scaling Limits

**localStorage as sole data store:**
- Current capacity: localStorage limit is 5–10 MB depending on browser. Bookmarks and stats are small. Audio and surah data are not stored — only served by the SW cache.
- Limit: If a user bookmarks many ayahs across many surahs, the storage is still negligible. The risk is localStorage being cleared by the browser under storage pressure.
- Scaling path: For a production app, migrate to IndexedDB via a library like `idb` for reliability; acceptable at current scale

**No rate limiting or retry logic for API calls:**
- Current capacity: alquran.cloud API is a free public API with undocumented rate limits
- Limit: Rapid navigation (e.g., swipe through multiple surahs) fires 3 parallel requests per surah, potentially triggering rate limiting. The `prefetchAdjacentSurahs` adds 2 more requests per surah.
- Scaling path: Add exponential backoff retry in `fetchWithTimeout` and debounce swipe navigation

## Dependencies at Risk

**Dependency on alquran.cloud free public API:**
- Risk: The entire application depends on a single third-party free API (`https://api.alquran.cloud/v1`) with no SLA, no authentication, and no documented uptime guarantees
- Impact: If the API goes down or changes its response structure, the app shows the error message and becomes non-functional (except for SW-cached surahs already visited)
- Migration plan: Cache all 114 surah list responses in SW on first load (currently only `surah` and `edition` endpoints are long-lived cached); consider bundling the surah list metadata statically to eliminate the first API call

**External font from `alquran.cloud`:**
- Risk: `https://alquran.cloud/public/css/font-all.css` loads the MeQuran Arabic font from an external CDN that is not under project control
- Impact: If the CDN is unavailable, Arabic text falls back to Amiri (loaded from Google Fonts) — functional but visually different from intended tajweed styling
- Files: `index.html` line 25
- Migration plan: Self-host the MeQuran font files to eliminate this dependency

**Google Fonts external dependency:**
- Risk: Inter and Amiri fonts loaded from `https://fonts.googleapis.com` — blocked in some regions, adds a render-blocking network request
- Files: `style.css` line 1
- Migration plan: Download and self-host font files; add `font-display: swap` if not already set

## Missing Critical Features

**No offline indicator:**
- Problem: When the user is offline and a surah has not been previously cached, the SW returns a `503` response with the text "Offline — resource not cached." The app's `fetchSurahDetail` call fails silently (returns `null`) and shows the generic error string — no distinction is made between network failure and API error
- Blocks: Users cannot tell if they need to reconnect or if there is a real error
- Files: `js/api.js` lines 22–30, `js/views/reader.js` lines 53–55

**No feedback when localStorage write fails:**
- Problem: `storage.set` swallows all errors silently (`catch {}`). If the browser rejects a write (quota exceeded, private browsing restrictions), bookmarks and stats appear to save but are lost on reload
- Blocks: Data integrity for bookmarks
- Files: `js/storage.js` line 11

## Test Coverage Gaps

**No tests exist:**
- What's not tested: All application logic — routing, API layer, state management, bookmark storage, stats calculation, tajweed parsing, audio playback orchestration
- Files: All of `js/`
- Risk: Any refactor or feature change can silently break existing functionality. The stats reset bug (stores `null`) would be caught immediately by a unit test.
- Priority: High for `js/storage.js`, `js/tajweed.js`, `js/views/stats.js` (pure logic); Medium for `js/api.js`; Low for view rendering

---

*Concerns audit: 2026-03-21*
