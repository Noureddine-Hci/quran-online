# Testing Patterns

**Analysis Date:** 2026-03-21

## Test Framework

**Runner:** None detected

**Assertion Library:** None detected

**Test Config:** No `jest.config.*`, `vitest.config.*`, `mocha.*`, or any other test runner config found at project root.

**Run Commands:**
```bash
# No test commands defined — no package.json scripts, no test runner installed
```

## Test File Organization

**Location:** No test files exist in the codebase.

**Naming:** Not applicable — no `*.test.js`, `*.spec.js`, or similar files found anywhere under the project root.

**Structure:**
```
js/            # Source files only — no co-located tests
  api.js
  dom.js
  i18n.js
  main.js
  reminder.js
  router.js
  state.js
  storage.js
  tajweed.js
  views/
    bookmarks.js
    list.js
    reader.js
    stats.js
sw.js
index.html
style.css
```

## Test Structure

**Suite Organization:** Not applicable — no tests exist.

**Patterns:** None established.

## Mocking

**Framework:** None

**Patterns:** None established.

## Fixtures and Factories

**Test Data:** None

**Location:** Not applicable

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
# Not configured
```

## Test Types

**Unit Tests:** Not used

**Integration Tests:** Not used

**E2E Tests:** Not used

## What Should Be Tested (Guidance for New Tests)

Given the codebase structure, these are the highest-value units to test if a test suite is introduced:

**Pure utility functions (easiest to test, no DOM required):**
- `stripDiacritics(str)` in `js/views/list.js` — pure string transformation
- `filterSurahs(term)` in `js/views/list.js` — pure filter over `state.surahs`
- `msUntil(hhmm)` in `js/reminder.js` — pure date calculation
- `getRoute()` in `js/router.js` — pure hash parsing
- `Tajweed.parse(text)` in `js/tajweed.js` — pure string transformation (class-based)

**Storage module (`js/storage.js`):**
- `storage.get(key, fallback)` — reads `localStorage`, returns parsed JSON or fallback
- `storage.set(key, value)` — writes JSON to `localStorage`
- Both methods silently swallow exceptions

**Bookmark helpers (`js/views/bookmarks.js`):**
- `isBookmarked(surahId, ayahNum)` — pure read from storage
- `toggleBookmark(surahId, ayahNum)` — mutates storage, returns boolean
- `getBookmarks()` — reads storage

**Stats helper (`js/views/stats.js`):**
- `recordAyahRead(surahId, ayahNum, totalAyahs)` — updates `stats` object in storage

**API module (`js/api.js`) — requires fetch mocking:**
- All exported functions follow the same `try/catch → return null/[]` pattern
- Would need `fetch` mock (e.g., `jest.fn()` or `vi.fn()`)
- Timeout behavior via `fetchWithTimeout` (AbortController pattern)

## Recommended Test Setup (If Introducing Tests)

**Suggested runner:** Vitest (compatible with ES Modules natively; no transpilation needed)

**Suggested config file:** `vitest.config.js` at project root

**Environment:** `jsdom` environment needed for any DOM or `localStorage` tests

**Example bootstrap for storage tests:**
```js
// js/storage.test.js
import { describe, it, expect, beforeEach } from 'vitest'
import { storage } from './storage.js'

describe('storage', () => {
    beforeEach(() => localStorage.clear())

    it('returns fallback when key absent', () => {
        expect(storage.get('missing', 42)).toBe(42)
    })

    it('round-trips a value', () => {
        storage.set('key', { a: 1 })
        expect(storage.get('key', null)).toEqual({ a: 1 })
    })
})
```

**Example bootstrap for pure utils:**
```js
// js/views/list.test.js
import { describe, it, expect } from 'vitest'
// stripDiacritics and filterSurahs are not currently exported —
// they would need to be exported before testing

describe('stripDiacritics', () => {
    it('removes tashkeel from Arabic text', () => {
        // test cases here
    })
})
```

**Note:** `stripDiacritics` and `filterSurahs` in `js/views/list.js` are module-private functions. They must be exported (`export function`) before they can be unit-tested.

---

*Testing analysis: 2026-03-21*
