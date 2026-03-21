# Requirements: Al-Quran Online

**Defined:** 2026-03-21
**Core Value:** Offrir la lecture du Coran la plus fidèle et la plus belle sur le web — Tajweed comme dans un Mushaf imprimé, récitation fluide, expérience irréprochable.

## v1 Requirements

### Tajweed

- [ ] **TAJ-01**: Les couleurs Tajweed correspondent exactement à la palette standard des Mushafs imprimés (rouge = madds longs 6 voyelles, orange/bleu = madds permissibles/obligatoires, vert = idgham, orange foncé = ghunna, gris = lettres silencieuses, etc.)
- [ ] **TAJ-02**: La légende Tajweed affiche les règles avec les couleurs correctes et leur description
- [ ] **TAJ-03**: Le hover sur une lettre colorée affiche le nom de la règle Tajweed

### Mode Mushaf

- [ ] **MSH-01**: Un mode "Mushaf" accessible depuis le lecteur bascule vers un affichage page par page
- [ ] **MSH-02**: Chaque page correspond fidèlement à une page du Mushaf Madinah (layout 15 lignes par page)
- [ ] **MSH-03**: Le texte est justifié et s'étire sur toute la largeur comme dans un vrai Mushaf
- [ ] **MSH-04**: Navigation par numéro de page (1-604) avec input et flèches précédent/suivant
- [ ] **MSH-05**: En cliquant sur un verset dans le mode Mushaf, l'utilisateur peut accéder au mode étude (traduction, audio)
- [ ] **MSH-06**: Le mode Mushaf affiche les Tajweed couleurs standard (TAJ-01)
- [ ] **MSH-07**: Le mode Mushaf est responsive (mobile : une demi-page ou adaptation intelligente)

### Lecteur Audio Avancé

- [ ] **AUD-01**: Répétition d'un verset (bouton repeat sur le verset en cours)
- [ ] **AUD-02**: Répétition d'une plage de versets (verset X à verset Y, N fois)
- [ ] **AUD-03**: Suivi mot par mot : chaque mot est mis en évidence au fur et à mesure de la récitation
- [ ] **AUD-04**: Contrôle de vitesse de récitation fin (0.5x, 0.75x, 1x, 1.25x, 1.5x)

### PWA & Play Store

- [ ] **PWA-01**: L'app a un `manifest.json` valide (nom, icônes, couleurs, orientation)
- [ ] **PWA-02**: Un service worker fournit un fallback offline (page "pas de connexion")
- [ ] **PWA-03**: L'app est installable sur Android depuis le navigateur
- [ ] **PWA-04**: Un fichier `assetlinks.json` lie le domaine au package Android
- [ ] **PWA-05**: Un AAB signé est généré et soumis au Play Store

## v2 Requirements

### Recherche

- **RCH-01**: Recherche de versets par mot-clé en arabe
- **RCH-02**: Recherche par traduction française
- **RCH-03**: Résultats avec contexte (verset complet, sourate, numéro)

### Personnalisation

- **PRS-01**: Personnalisation des couleurs Tajweed par règle
- **PRS-02**: Thèmes visuels Mushaf (fond crème, fond blanc, mode nuit)
- **PRS-03**: Taille police de lecture Mushaf indépendante du mode étude

### Social / Communauté

- **COM-01**: Partage d'un verset (lien direct vers sourate/verset)
- **COM-02**: Mode lecture continue (Khatma) avec suivi de progression

## Out of Scope

| Feature | Reason |
|---------|--------|
| Authentification / comptes | Pas de backend v1 — app locale/PWA |
| App mobile native | Web-first, PWA suffisant |
| Backend propriétaire | AlQuran Cloud couvre tous les besoins v1 |
| Multi-langue interface | Français suffisant pour v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TAJ-01 | Phase 1 | Pending |
| TAJ-02 | Phase 1 | Pending |
| TAJ-03 | Phase 1 | Pending |
| MSH-01 | Phase 2 | Pending |
| MSH-02 | Phase 2 | Pending |
| MSH-03 | Phase 2 | Pending |
| MSH-04 | Phase 2 | Pending |
| MSH-05 | Phase 2 | Pending |
| MSH-06 | Phase 2 | Pending |
| MSH-07 | Phase 2 | Pending |
| AUD-01 | Phase 3 | Pending |
| AUD-02 | Phase 3 | Pending |
| AUD-03 | Phase 3 | Pending |
| AUD-04 | Phase 3 | Pending |
| PWA-01 | Phase 4 | Pending |
| PWA-02 | Phase 4 | Pending |
| PWA-03 | Phase 4 | Pending |
| PWA-04 | Phase 4 | Pending |
| PWA-05 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 19 total
- Mapped to phases: 19
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-21*
*Last updated: 2026-03-21 — initial definition*
