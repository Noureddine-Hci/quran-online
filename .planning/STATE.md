# Project State: Al-Quran Online

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-21)

**Core value:** Offrir la lecture du Coran la plus fidèle et la plus belle sur le web
**Current focus:** Milestone 1 complete — polish + PWA when ready

## Current Status

- Milestone 1 in progress
- Phase 1 — Tajweed Standard Mushaf: **DONE** (committed 2026-03-21)
- Phase 2 — Mode Mushaf: **DONE** (committed 2026-03-21)
- Phase 3 — Lecteur Audio Avancé: **DONE** (vitesses + range repeat + word-by-word)
- Phase 3.5 — Bug Fixes + Stabilisation: **DONE** (2026-06-14, STB-01..06 vérifiés en live)
- Phase 4 — PWA + Play Store: not started (deferred — user says "toute fin")
- Phase 5 — Durcissement & Qualité: **IN PROGRESS** (HRD-01..04 : XSS/CSP, a11y, perf, tests)
- Codebase mapped: .planning/codebase/

## Last Action

Phase 3.5 Stabilisation — STB-01..06 corrigés + vérifiés en navigateur (preview), 5 commits
atomiques sur branche `gsd/phase-3.5-stabilisation`. Docs GSD resync. 2026-06-14.

## Next Step

Phase 5 — Durcissement & Qualité (branche `gsd/phase-5-durcissement`) :
- HRD-01 échappement XSS + CSP · HRD-02 a11y (contraste Tajweed, focus) · HRD-03 perf (scroll mot-à-mot, debounce) · HRD-04 tests unitaires (vitest)
- Reste backlog : translittération silencieuse, stats gonflées par scroll (dwell threshold)
