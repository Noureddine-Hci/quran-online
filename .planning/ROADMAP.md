# Roadmap: Al-Quran Online — Milestone 1

**Goal:** Passer de lecteur fonctionnel à meilleur lecteur Coran web
**Scope:** Tajweed standard Mushaf + Mode Mushaf page/page + Lecteur audio avancé

---

## Phase 1 — Tajweed Standard Mushaf

**Goal:** Les couleurs Tajweed correspondent exactement aux Mushafs imprimés
**Requirements:** TAJ-01, TAJ-02, TAJ-03
**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Palette CSS standard Mushaf + couleurs legend dots (TAJ-01, TAJ-02)
- [ ] 01-02-PLAN.md — Tooltip noms français localisés (TAJ-03)

**Success criteria:**
- [ ] Comparer côte à côte app vs image Mushaf : les couleurs sont identiques
- [ ] La légende affiche toutes les règles avec les bonnes couleurs
- [ ] Hover sur lettre colorée → nom de la règle s'affiche

---

## Phase 2 — Mode Mushaf

**Goal:** Un mode de lecture page par page fidèle au Mushaf Madinah
**Requirements:** MSH-01 à MSH-07
**Depends on:** Phase 1 (couleurs Tajweed correctes)

**Plans:**
- 2.1 — Dataset pages Mushaf : mapping verset → numéro de page (1-604)
- 2.2 — Vue Mushaf : layout page, texte justifié 15 lignes, numérotation versets
- 2.3 — Navigation pages (input, flèches, URL hash) + transition mode étude ↔ Mushaf
- 2.4 — Adaptation mobile du mode Mushaf

**Success criteria:**
- [ ] Ouvrir la page 2 → affiche exactement les versets de la page 2 du Mushaf Madinah
- [ ] Texte justifié, propre, lisible — ressemble à un vrai Mushaf
- [ ] Navigation 1-604 fonctionne (input + flèches)
- [ ] Clic verset → bascule vers mode étude avec traduction
- [ ] Mobile : lisible sans zoom

---

## Phase 3 — Lecteur Audio Avancé

**Goal:** Contrôle complet de la récitation : repeat, suivi mot par mot, vitesse
**Requirements:** AUD-01, AUD-02, AUD-03, AUD-04

**Plans:**
- 3.1 — Repeat verset (single + plage X→Y, N fois)
- 3.2 — Suivi mot par mot (word timestamps via API ou segmentation)
- 3.3 — Contrôle vitesse fin (0.5x→1.5x) + intégration avec UI player existant

**Success criteria:**
- [ ] Bouton repeat sur verset → relit en boucle jusqu'à désactivation
- [ ] Repeat plage : configurer verset 3 à 7, répéter 5 fois → fonctionne
- [ ] Récitation : le mot en cours est mis en évidence en temps réel
- [ ] Vitesse 0.75x → récitation ralentie correctement

---

## Phase 4 — PWA + Play Store

**Goal:** Publier l'app sur le Google Play Store via TWA (Trusted Web Activity)
**Requirements:** PWA-01 à PWA-05

**Plans:**
- 4.1 — PWA foundation : `manifest.json` (nom, icônes, thème), service worker basique (offline fallback)
- 4.2 — Assets Play Store : icônes toutes tailles, splash screen, screenshots
- 4.3 — TWA setup : `assetlinks.json`, Bubblewrap ou PWABuilder → génération APK/AAB
- 4.4 — Soumission Play Store : fiche app, politique de confidentialité, review

**Success criteria:**
- [ ] L'app s'installe sur Android via le navigateur (bouton "Ajouter à l'écran d'accueil")
- [ ] L'app fonctionne offline (page de fallback si pas de connexion)
- [ ] APK/AAB généré sans erreur par PWABuilder
- [ ] App soumise et visible sur le Play Store

---

## Backlog (v2)

- Recherche par mot-clé arabe / traduction
- Personnalisation couleurs Tajweed
- Mode Khatma (suivi lecture complète Coran)
- Partage verset (lien direct)
- Thèmes Mushaf (fond crème, etc.)

---

*Roadmap created: 2026-03-21*
*Milestone 1 target: meilleur lecteur Coran web*
