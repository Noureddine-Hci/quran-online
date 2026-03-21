# Roadmap: Al-Quran Online — Milestone 1

**Goal:** Passer de lecteur fonctionnel à meilleur lecteur Coran web
**Scope:** Tajweed standard Mushaf + Mode Mushaf page/page + Lecteur audio avancé

---

## Phase 1 — Tajweed Standard Mushaf ✅ DONE

**Goal:** Les couleurs Tajweed correspondent exactement aux Mushafs imprimés
**Requirements:** TAJ-01, TAJ-02, TAJ-03
**Completed:** 2026-03-21

Plans:
- [x] 01-01-PLAN.md — Palette CSS standard Mushaf + couleurs legend dots (TAJ-01, TAJ-02)
- [x] 01-02-PLAN.md — Tooltip noms français localisés (TAJ-03)

**Success criteria:**
- [x] Comparer côte à côte app vs image Mushaf : les couleurs sont identiques
- [x] La légende affiche toutes les règles avec les bonnes couleurs
- [x] Hover sur lettre colorée → nom de la règle s'affiche

---

## Phase 2 — Mode Mushaf ✅ DONE

**Goal:** Un mode de lecture page par page fidèle au Mushaf Madinah
**Requirements:** MSH-01 à MSH-07
**Completed:** 2026-03-21

**Delivered:**
- [x] Vue Mushaf page par page (604 pages) via AlQuran Cloud `/v1/page/{N}/quran-tajweed`
- [x] Navigation (input page, flèches ← →, clavier, swipe mobile)
- [x] Toggle Tajweed/plain dans le Mushaf
- [x] Clic sur verset → bascule vers mode étude (reader)
- [x] En-têtes de sourate + Bismillah automatiques
- [x] Bottom nav avec bouton Mushaf
- [x] CSS responsive + OLED + light theme

**Success criteria:**
- [x] Ouvrir la page 2 → affiche exactement les versets de la page 2 du Mushaf Madinah
- [x] Texte justifié, propre, lisible — ressemble à un vrai Mushaf
- [x] Navigation 1-604 fonctionne (input + flèches)
- [x] Clic verset → bascule vers mode étude avec traduction
- [x] Mobile : lisible sans zoom

---

## Phase 3 — Lecteur Audio Avancé 🔧 PARTIAL

**Goal:** Contrôle complet de la récitation : repeat, suivi mot par mot, vitesse
**Requirements:** AUD-01, AUD-02, AUD-03, AUD-04

**Delivered:**
- [x] AUD-01 — Repeat single verset (loop button existait déjà en Phase 0)
- [x] AUD-02 — Repeat plage X→Y, N fois (panel avec inputs + compteur de round)
- [x] AUD-04 — Vitesses étendues 0.5x → 2x (7 options)

**Pending:**
- [ ] AUD-03 — Word-by-word highlighting (nécessite API quran.com pour timestamps mot-à-mot)

**Success criteria:**
- [x] Bouton repeat sur verset → relit en boucle jusqu'à désactivation
- [x] Repeat plage : configurer verset 3 à 7, répéter 5 fois → fonctionne
- [ ] Récitation : le mot en cours est mis en évidence en temps réel
- [x] Vitesse 0.75x → récitation ralentie correctement

---

## Phase 3.5 — Bug Fixes + Stabilisation 🔧 IN PROGRESS

**Goal:** Corriger les bugs identifiés par l'audit de code

**Bugs critiques:**
- [ ] Mushaf keyboard `{ once: true }` — seule la 1ère touche fonctionne
- [ ] Memory leak — event listeners window.click jamais nettoyés
- [ ] Service Worker ne cache pas mushaf.js ni tajweed.js

**Bugs importants:**
- [ ] Bookmarks "Aller à" ne scroll pas au verset spécifique
- [ ] API calls sans timeout (fetchSurahDetail, fetchTranslation, fetchAudio)
- [ ] Lang selector crash si code langue invalide dans localStorage

**Bugs mineurs:**
- [ ] Translitération échoue silencieusement
- [ ] Stats gonflées par scroll rapide

---

## Phase 4 — PWA + Play Store (DEFERRED)

**Goal:** Publier l'app sur le Google Play Store via TWA (Trusted Web Activity)
**Requirements:** PWA-01 à PWA-05
**Status:** Reporté — l'utilisateur veut se concentrer sur l'app d'abord

**Plans:**
- 4.1 — PWA foundation : `manifest.json`, service worker offline
- 4.2 — Assets Play Store : icônes, splash, screenshots
- 4.3 — TWA setup : `assetlinks.json`, Bubblewrap → AAB
- 4.4 — Soumission Play Store

---

## Backlog (v2)

- Recherche par mot-clé arabe / traduction
- Personnalisation couleurs Tajweed
- Mode Khatma (suivi lecture complète Coran)
- Partage verset (lien direct)
- Thèmes Mushaf (fond crème, etc.)
- Word-by-word highlighting (si reporté de Phase 3)

---

*Roadmap created: 2026-03-21*
*Last updated: 2026-03-21 — synced with actual implementation status*
*Milestone 1 target: meilleur lecteur Coran web*
