# External Integrations

**Analysis Date:** 2026-03-21

## APIs & External Services

**Quran Data & Audio:**
- **AlQuran Cloud API** — primary data source for all Quran content
  - Base URL: `https://api.alquran.cloud/v1` (hardcoded in `js/api.js`)
  - Auth: None — public API, no key required
  - Endpoints consumed:
    - `GET /surah` — full list of 114 surahs (cached long-lived)
    - `GET /surah/{id}/{edition}` — surah text by edition (Arabic, translation, audio, tafsir, transliteration)
    - `GET /edition?format=audio&language=ar` — list of all reciters (cached long-lived)
  - Editions used:
    - `quran-tajweed` — Arabic text with Tajweed markup (reader view)
    - `quran-uthmani` — clean Uthmani Arabic script (fallback)
    - `fr.hamidullah` — French translation
    - `en.sahih` — English translation (Sahih International)
    - `en.transliteration` — Latin phonetic transliteration
    - `en.maarifulquran` — English Tafsir (Maariful Quran)
    - Any audio edition identifier (e.g. `ar.alafasy`) — per-verse or full-surah audio
  - Fetch strategy: 10-second timeout via `AbortController` (`js/api.js`)
  - Error handling: all fetch functions catch and return `null` / `[]` on failure

## Audio CDNs

**cdn.islamic.network:**
- Hosts per-verse audio MP3 files for verse-by-verse reciters
- Referenced in `sw.js`: `url.hostname.includes('islamic.network')`
- Cache strategy: Cache-First once fetched (stored in `quran-api-v3`)

**everyayah.com:**
- Secondary audio host for some reciter editions
- Referenced in `sw.js`: `url.hostname.includes('everyayah.com')`
- Cache strategy: Cache-First once fetched

**cdn.alquran.cloud / alquran.cloud:**
- Hosts the `MeQuran` Arabic font via `font-all.css`
- Referenced in `index.html`: `<link href="https://alquran.cloud/public/css/font-all.css" ...>`
- Cache strategy: Cache-First (stored in `quran-static-v3`)

## Data Storage

**Databases:**
- None — no backend database of any kind

**Browser Storage:**
- `localStorage` — all user data persisted client-side via `js/storage.js`
  - Wrapper: `storage.get(key, fallback)` / `storage.set(key, value)` with JSON serialization
  - No expiry or quota management

**File Storage:**
- Local filesystem only (static assets) — no cloud file storage

**Caching:**
- Service Worker Cache API (`sw.js`) — two named caches:
  - `quran-static-v3` — HTML, CSS, JS, fonts, icons
  - `quran-api-v3` — API JSON responses and audio files

## Authentication & Identity

**Auth Provider:**
- None — no user accounts, no login, no auth tokens
- All data is anonymous and local to the user's device

## Fonts

**Google Fonts:**
- `Inter` — UI sans-serif font
- `Amiri` — Arabic serif fallback font
- Loaded via: `https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400;1,700&family=Inter:wght@300;400;600;700&display=swap`

## Browser APIs

**Web Notifications API:**
- Used in `js/reminder.js` for daily reading reminders
- Permission requested on first use via `Notification.requestPermission()`
- Fires via `setTimeout` scheduled at page load — not a push notification (no server involved)
- Reschedules itself daily; survives across page loads by re-reading `localStorage`

**Service Worker API:**
- Registered in `js/main.js` on `window.load`
- Provides offline support and asset caching

**Web Share / Clipboard API:**
- Ayah sharing via `navigator.share()` with fallback to `navigator.clipboard.writeText()`
- Used in `js/views/reader.js`

**HTML Audio API:**
- Native `<audio>` element used for Quran recitation playback
- Controlled in `js/views/reader.js`

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, Datadog, or similar

**Logs:**
- `console.error()` used in all API catch blocks (`js/api.js`)
- `console.warn()` for Service Worker registration failure (`js/main.js`)
- No structured logging or log aggregation

## CI/CD & Deployment

**Hosting:**
- Not specified in codebase — static files suitable for any CDN or static host
- `manifest.json` present, indicating PWA deployment intent

**CI Pipeline:**
- Not detected — no `.github/`, `.gitlab-ci.yml`, or similar CI config

## Environment Configuration

**Required env vars:**
- None — no environment variables used anywhere

**Secrets:**
- None — API is public and requires no credentials

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None — the application only makes outbound read-only `GET` requests to `api.alquran.cloud`

---

*Integration audit: 2026-03-21*
