# Al-Quran Online

## What This Is

Al-Quran Online est un lecteur de Coran web premium, open-source, conçu pour offrir la meilleure expérience de lecture du Coran sur le web. L'app propose la lecture avec Tajweed coloré, la récitation audio par des récitants reconnus, la traduction/translittération, et un mode mémorisation — le tout avec un design soigné, mobile-first.

## Core Value

Offrir la lecture du Coran la plus fidèle et la plus belle sur le web — Tajweed comme dans un Mushaf imprimé, récitation fluide, expérience irréprochable.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Lecture sourate par sourate avec Tajweed coloré (AlQuran Cloud API) — Phase 0
- ✓ Récitants multiples arabes (verset par verset + sourate complète) — Phase 0
- ✓ Traduction française + translittération — Phase 0
- ✓ Mode mémorisation (masquage progressif) — Phase 0
- ✓ UI mobile-first (bottom nav, burger, header auto-hide) — Phase 0
- ✓ OLED mode + contrôle taille police + vitesse lecture — Phase 0
- ✓ Favoris + Stats — Phase 0
- ✓ Tajweed OFF → texte quran-uthmani propre (sans caractères parasites) — Phase 0

### Active

<!-- Current scope. Building toward these. -->

- [ ] Mode Mushaf page par page (pages 1-604 fidèles au Mushaf imprimé)
- [ ] Couleurs Tajweed standard Mushaf (palette exacte : rouge madds longs, orange madds permissibles, bleu obligatoire, vert idgham, etc.)
- [ ] Navigation par numéro de page (1-604) dans le mode Mushaf
- [ ] Lecteur audio avancé : repeat verset, suivi mot par mot, vitesse fine

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Recherche par mot-clé — complexité d'indexation, v2
- Authentification / comptes utilisateurs — app personnelle, pas de backend v1
- App mobile native — web-first, PWA suffisant
- Personnalisation couleurs Tajweed — standard Mushaf est le bon défaut, v2 si demandé

## Context

- **Stack** : Vanilla JS (ES modules), HTML5, CSS3 — zéro framework, zéro bundler
- **API** : AlQuran Cloud (alquran.cloud/api) — éditions `quran-tajweed`, `quran-uthmani`, traductions, audio par récitant
- **Police Tajweed** : MeQuran (cdn.alquran.cloud) — requise pour le rendu correct des caractères Tajweed
- **Architecture** : SPA hash-router, vues séparées (home, reader, settings...), state/storage/API en modules dédiés
- **Codebase** : brownfield, fonctionnel, avec une dette technique légère (pas de tests, i18n partielle)
- **Compétiteur principal** : Quran.com — l'app vise à le dépasser sur l'expérience web

## Constraints

- **Tech stack** : Vanilla JS uniquement — pas de frameworks (React, Vue) pour garder la légèreté
- **API** : AlQuran Cloud gratuit — pas de backend propriétaire, dépendance API externe
- **Pages Mushaf** : Les données de mapping verset→page doivent être sourced (API ou dataset JSON)
- **Performance** : Le mode Mushaf doit charger rapidement — pas de rendu côté serveur disponible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Dual-span tajweed/plain | Éviter innerHTML dans les handlers pour la sécurité (hook XSS) | ✓ Bon |
| AlQuran Cloud pour Tajweed | Seule API publique avec édition `quran-tajweed` parseable | — Pending |
| Mode Mushaf séparé (pas remplacement) | Préserve les features étude actuelles, les deux modes coexistent | — Pending |
| Navigation Mushaf par page 1-604 | Fidèle à l'expérience du vrai Mushaf imprimé | — Pending |
| Couleurs Tajweed standard Mushaf par défaut | Reconnaissance immédiate pour les utilisateurs habitués aux Corans imprimés | — Pending |

---
*Last updated: 2026-03-21 — initial project definition*
