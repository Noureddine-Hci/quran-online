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

## Phase 3 — Lecteur Audio Avancé ✅ DONE

**Goal:** Contrôle complet de la récitation : repeat, suivi mot par mot, vitesse
**Requirements:** AUD-01, AUD-02, AUD-03, AUD-04

**Delivered:**
- [x] AUD-01 — Repeat single verset (loop button existait déjà en Phase 0)
- [x] AUD-02 — Repeat plage X→Y, N fois (panel avec inputs + compteur de round)
- [x] AUD-04 — Vitesses étendues 0.5x → 2x (7 options)

**Also delivered:**
- [x] AUD-03 — Word-by-word highlighting via quran.com API (timestamps + chapter audio)

**Success criteria:**
- [x] Bouton repeat sur verset → relit en boucle jusqu'à désactivation
- [x] Repeat plage : configurer verset 3 à 7, répéter 5 fois → fonctionne
- [x] Récitation : le mot en cours est mis en évidence en temps réel
- [x] Vitesse 0.75x → récitation ralentie correctement

---

## Phase 3.5 — Bug Fixes + Stabilisation ✅ DONE

**Goal:** Corriger les bugs identifiés par l'audit de code
**Completed:** 2026-06-14 — statut établi par audit (lecture + tests dynamiques navigateur)

**Vague 1 — corrigés dans commit 47d6173 (vérifiés dans le code 2026-06-14):**
- [x] Mushaf keyboard `{ once: true }` retiré (mais avait introduit une cascade — voir STB-02)
- [x] Memory leak window.click — corrigé via AbortController (reader.js:57-59)
- [x] Service Worker cache désormais mushaf.js + tajweed.js
- [x] Bookmarks "Aller à" scroll au verset (race 500ms restante, voir backlog)
- [x] API timeouts uniformes (fetchWithTimeout sur tous les appels)
- [~] Lang guard — n'était que cosmétique (étiquette), le crash réel restait → corrigé en STB-05

**Vague 2 — corrigés cette phase (2026-06-14), vérifiés en live :**
- [x] **STB-01** API sans `res.ok` → page blanche sur sourate hors borne / 429 / 500
- [x] **STB-02** Cascade de re-rendus Mushaf (listeners `document` empilés, 3→6→10/frappe)
- [x] **STB-03** Thème clair non câblé (`.glass` codé en dur, `--glass-bg` undefined, texte arabe blanc)
- [x] **STB-04** Reset Stats stockait `null` → crash de la vue Stats
- [x] **STB-05** Crash app entière si code langue invalide en localStorage
- [x] **STB-06** Résidu mémoire reader (observers/timeupdate non nettoyés) + pause audio défensive

**Note audit :** le constat « audio continue après navigation » a été **réfuté en live** — les
navigateurs modernes mettent en pause tout média retiré du DOM. STB-06 ne traite que le résidu mémoire.

**Restant (déplacé en backlog / Phase 5) :** translittération qui échoue en silence, stats gonflées
par scroll rapide (back-fill + pas de dwell).

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
