# Validation Strategy — Phase 01: Tajweed Standard Mushaf

**Phase:** 01
**Date:** 2026-03-21
**Approach:** Manual visual verification + grep-based content checks

## Context

This phase is pure CSS/JS editing on a vanilla JS project with zero test infrastructure.
RESEARCH.md explicitly documents: "Aucun framework de test détecté — vérification manuelle dans navigateur suffisante."

## Validation Approach

### Automated (grep-based)
- Verify correct hex values are present in style.css
- Verify data-description attributes are updated in reader.js
- Both plans include `<automated>` grep verify commands

### Manual (visual)
- Side-by-side comparison: app vs printed Mushaf image
- Hover tooltip display verification in browser
- Legend colors match ayah colors verification

## Acceptance
Phase passes when:
1. All grep checks pass (correct hex values in files)
2. Visual comparison confirms colors match standard Mushaf palette
3. Tooltips display French rule names on hover
