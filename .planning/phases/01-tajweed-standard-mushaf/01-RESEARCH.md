# Phase 1: Tajweed Standard Mushaf — Research

**Researched:** 2026-03-21
**Domain:** CSS color palette, Tajweed rules, tooltip UX (vanilla JS/CSS)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TAJ-01 | Les couleurs Tajweed correspondent exactement à la palette standard des Mushafs imprimés (rouge = madds, bleu = qalqalah, vert = ghunna/idgham, gris = silencieux) | Audit complet palette actuelle vs standard EasyQuran/Dar Al-Maarifah documenté ci-dessous |
| TAJ-02 | La légende Tajweed affiche les règles avec les couleurs correctes et leur description | Architecture légende existante dans `reader.js` identifiée — mise à jour CSS suffit pour les couleurs, textes déjà localisés |
| TAJ-03 | Le hover sur une lettre colorée affiche le nom de la règle Tajweed | Infrastructure CSS `::after` + `attr(data-description)` déjà en place mais affiche le nom technique anglais — besoin d'injecter le nom localisé dans `data-description` au moment du parse |
</phase_requirements>

---

## Summary

L'application utilise l'API AlQuran Cloud édition `quran-tajweed` qui annote le texte avec des marqueurs entre crochets (`[h`, `[q`, etc.). Le parser `js/tajweed.js` convertit ces marqueurs en éléments `<tajweed class="...">` avec des attributs `data-type` et `data-description`. Le CSS dans `style.css` applique des couleurs à ces classes.

**Le problème central :** Les couleurs actuelles suivent la convention AlQuran Cloud (rouge pour qalqalah, bleus pour madd, orange pour ghunna) qui est l'inverse de la convention des Mushafs imprimés standard (rouge pour madd, bleu pour qalqalah, vert pour ghunna/idgham). Ce n'est pas un bug — c'est un choix de palette différent du standard imprimé.

**TAJ-01 :** Mettre à jour les 14 valeurs CSS de couleur dans `style.css` pour aligner sur la palette Mushaf standard. Aucun changement de logique JS n'est nécessaire.

**TAJ-02 :** La légende est déjà construite depuis `TAJWEED_LEGEND` dans `reader.js`. Elle utilise des classes CSS (`.legend-dot.qlq`, etc.) qui héritent automatiquement les couleurs Tajweed. Donc mettre à jour le CSS suffit pour corriger aussi la légende. Les noms et descriptions sont déjà localisés FR/EN.

**TAJ-03 :** Le tooltip CSS `::after` + `attr(data-description)` est déjà en place et fonctionnel. Le problème : `data-description` contient la description technique AlQuran Cloud en anglais (ex. "Hamzat ul Wasl"), pas le nom localisé. La solution est d'injecter la description localisée dans `data-description` lors du rendu des ayahs dans `reader.js`, en utilisant les données de `TAJWEED_LEGEND`.

**Recommandation principale :** Trois tâches indépendantes et bien délimitées : (1) mapper la palette, (2) mettre à jour le CSS + vérifier la légende, (3) injecter les descriptions localisées dans les attributs `data-description`.

---

## Standard Stack

### Core
| Technologie | Version | Usage | Pourquoi standard |
|-------------|---------|-------|-------------------|
| CSS custom properties (`color:`) | CSS3 | Coloriser `<tajweed>` elements | Déjà utilisé, aucun ajout |
| CSS `::after` + `attr()` | CSS3 | Tooltip au hover | Déjà implémenté, zéro JS requis |
| Template literals JS | ES2020 | Injecter `data-description` localisé | Pattern existant dans `reader.js` |

### Dépendances existantes utilisées
| Composant | Fichier | Rôle dans cette phase |
|-----------|---------|----------------------|
| `js/tajweed.js` — classe `Tajweed` | `js/tajweed.js` | Definit les 17 règles, produit les attributs HTML |
| `TAJWEED_LEGEND` object | `js/views/reader.js` (lignes 15–31) | Noms localisés FR/EN par classe CSS |
| Couleurs Tajweed CSS | `style.css` (lignes 1447–1462) | 14 règles avec `color:` hex |
| Légende HTML | `js/views/reader.js` (lignes 76–84) | Utilise `.legend-dot.{cls}` → hérite couleur CSS |
| Tooltip CSS | `style.css` (lignes 679–708) | `::after` avec `attr(data-description)` |

**Aucune installation requise** — projet vanilla JS sans bundler.

---

## Architecture Patterns

### Structure actuelle du rendu Tajweed

```
API quran-tajweed → texte brut annoté
    "[h[ ٱ ]" → tajweedParser.parse() → "<tajweed class="ham_wasl" data-type="hamza-wasl" data-description="Hamzat ul Wasl">ٱ</tajweed>"
    → style.css → tajweed.ham_wasl { color: #AAAAAA; }
    → hover → ::after { content: attr(data-description); } → affiche "Hamzat ul Wasl"
```

### Pattern 1 : Mise à jour CSS de la palette (TAJ-01 + TAJ-02)
**Quoi :** Remplacer les 14 valeurs hex dans `style.css` lignes 1447–1462.
**Quand :** Toute la correction de palette passe par ce seul bloc CSS.
**Aucune modification JS nécessaire** pour TAJ-01 et TAJ-02 car la légende hérite les couleurs CSS automatiquement via `.legend-dot.{cls}`.

```css
/* AVANT (AlQuran Cloud convention) */
tajweed.qlq               { color: #DD0008; }   /* rouge */
tajweed.madda_normal      { color: #537FFF; }   /* bleu  */

/* APRÈS (standard Mushaf imprimé) */
tajweed.qlq               { color: #009be5; }   /* bleu ciel   */
tajweed.madda_normal      { color: #b8860b; }   /* cumin/doré  */
```

### Pattern 2 : Injection description localisée (TAJ-03)
**Quoi :** Dans `reader.js`, lors de la construction du HTML des ayahs, post-processer le HTML produit par `tajweedParser.parse()` pour remplacer `data-description="..."` par le nom localisé depuis `TAJWEED_LEGEND`.
**Quand :** TAJ-03 — le tooltip doit afficher le nom de la règle dans la langue de l'interface (FR/EN).

Approche actuelle : le tooltip affiche `data-description` = valeur brute d'AlQuran Cloud en anglais.
Approche cible : `data-description` = nom localisé depuis `TAJWEED_LEGEND[cls][lang][0]` (ex. "Qalqala" / "Qalqalah").

**Deux stratégies possibles :**

Option A — Post-traitement HTML (plus simple, zéro refactor) :
```javascript
// Dans reader.js, après tajweedParser.parse(ayah.text)
let parsed = tajweedParser.parse(ayah.text);
// Remplacer data-description par le nom localisé de TAJWEED_LEGEND
tajweedParser.getMeta().forEach(meta => {
    const legend = TAJWEED_LEGEND[meta.default_css_class];
    if (legend) {
        const localName = state.currentLang === 'fr' ? legend.fr[0] : legend.en[0];
        parsed = parsed.replace(
            new RegExp(`data-description="${meta.description.replace(/['"]/g, '\\$&')}"`, 'g'),
            `data-description="${localName}"`
        );
    }
});
```

Option B — Modifier `Tajweed.createMetaData()` pour injecter directement les descriptions localisées dans les métadonnées. Nécessite de passer la langue au constructeur — plus propre mais modifie l'API de la classe.

**Recommandation : Option A** — le moins invasif, aucun refactor de la classe `Tajweed`, cohérent avec le pattern no-framework du projet.

### Anti-Patterns à éviter
- **Ne pas mettre inline des couleurs dans `tajweed.js`** : Les `html_color` dans `createMetaData()` sont des métadonnées de documentation, non utilisées pour le rendu CSS. Ne pas les synchroniser avec le CSS — le CSS est la source de vérité unique pour les couleurs.
- **Ne pas utiliser JS pour les tooltips** : Le CSS `::after` + `attr()` est déjà parfait. Ajouter un listener `mouseover` serait une régression.
- **Ne pas modifier `data-type`** : Cet attribut sert d'identifiant technique stable — ne pas le localiser.

---

## Don't Hand-Roll

| Problème | Ne pas construire | Utiliser plutôt | Pourquoi |
|----------|-------------------|-----------------|----------|
| Tooltip sur lettre | Composant JS tooltip avec `mouseover`/`mouseout` | CSS `::after` + `attr(data-description)` déjà en place | Fonctionne sans JS, sans z-index wars, déjà implémenté |
| Légende des couleurs | Tableau HTML séparé codé en dur | `TAJWEED_LEGEND` + classes CSS héritées | Déjà synchronisé automatiquement avec les couleurs CSS |
| Parsing Tajweed | Nouveau parser | Classe `Tajweed` existante dans `js/tajweed.js` | Déjà testé, produit les bons attributs |

---

## Audit Palette : Couleurs actuelles vs Standard Mushaf

### Le standard imprimé (EasyQuran.com / Dar Al-Maarifah / GlobalQuran Lab)

Sources convergeantes confirmant la convention :
- EasyQuran.com (tajweed-guide) : Madd = dégradés rouges, Qalqalah = bleu ciel, Ghunna/Ikhfa/Idgham = vert, Silencieux = gris
- GlobalQuran Lab CSS officiel : Qalqalah = `#009be5` (bleu), Madd 6 = `#c84145` (rouge foncé), Madd obligatoire = `#fe4c57`, Madd permissible = `#ff6600`, Madd normal = `#cc9900` (cumin)
- AlQuranonline.com (Dar Al-Maarifah) : Madd = rouge, Qalqalah = bleu ciel, Ghunna = vert, Silencieux = gris

### Mapping complet : actuel → standard cible

| Classe CSS | Règle | Couleur actuelle | Couleur cible standard | Confiance |
|------------|-------|-----------------|----------------------|-----------|
| `tajweed.ham_wasl` | Hamza Wasl | `#AAAAAA` (gris) | `#AAAAAA` (gris) — inchangé | HIGH |
| `tajweed.slnt` | Lettre silencieuse | `#AAAAAA` (gris) | `#AAAAAA` (gris) — inchangé | HIGH |
| `tajweed.qlq` | Qalqala | `#DD0008` (rouge) | `#009be5` (bleu ciel) | HIGH |
| `tajweed.madda_normal` | Madd normal 2 voyelles | `#537FFF` (bleu) | `#bb8800` (cumin/doré) | HIGH |
| `tajweed.madda_permissible` | Madd permissible 2/4/6 | `#4050FF` (bleu moyen) | `#dd6600` (orange-rouge) | HIGH |
| `tajweed.madda_obligatory` | Madd obligatoire 4-5 | `#2144C1` (bleu) | `#cc2200` (rouge sang) | HIGH |
| `tajweed.madda_necessary` | Madd nécessaire 6 | `#000EBC` (bleu foncé) | `#8b0000` (rouge foncé/bordeaux) | HIGH |
| `tajweed.ghn` | Ghunna | `#FF7E1E` (orange) | `#008e50` (vert) | HIGH |
| `tajweed.idgh_ghn` | Idgham avec Ghunna | `#169200` (vert) | `#008e50` (vert) — ajuster teinte | MEDIUM |
| `tajweed.idgh_w_ghn` | Idgham sans Ghunna | `#169200` (vert) | `#169200` (vert) — inchangé | HIGH |
| `tajweed.idghm_shfw` | Idgham Shafawi | `#58B800` (vert clair) | `#58B800` (vert clair) — inchangé | MEDIUM |
| `tajweed.idgh_mus` | Idgham Mutajanisayn | `#169200` (vert) | `#169200` (vert) — inchangé | HIGH |
| `tajweed.ikhf` | Ikhfa | `#9400A8` (violet) | `#008e50` (vert) | HIGH |
| `tajweed.ikhf_shfw` | Ikhfa Shafawi | `#D500B7` (rose-violet) | `#58B800` (vert clair) | MEDIUM |
| `tajweed.iqlb` | Iqlab | `#26BFFD` (cyan) | `#008e50` (vert foncé) | MEDIUM |

**Note importante sur le standard Mushaf :** Les Mushafs imprimés standard (EasyQuran.com) regroupent toutes les règles de nasalisation (Ghunna, Idgham avec Ghunna, Ikhfa, Iqlab) en **vert** car elles partagent la même nature (son nasal). C'est la différence la plus significative par rapport à la palette actuelle qui différencie Ikhfa (violet) et Iqlab (cyan) avec des couleurs distinctes.

**Divergence entre implémentations numériques :** Il n'existe pas un seul standard hex universel. La référence la plus utilisée dans les apps web sérieuses (GlobalQuran, quran.com) converge sur :
- Qalqalah = bleu (#009be5 ou équivalent)
- Madd = rouge/orange/cumin selon l'intensité
- Ghunna/Ikhfa/Idgham = vert
- Silencieux = gris

---

## Analyse de l'état du Tooltip (TAJ-03)

### État actuel
Le CSS `tajweed:hover::after { content: attr(data-description); }` est déjà en place et **fonctionnel**. Il affiche le contenu de l'attribut `data-description` généré par `tajweed.js`.

### Valeurs `data-description` actuelles (depuis `createMetaData()`)
| Classe | `data-description` actuel | Nom FR souhaité | Nom EN souhaité |
|--------|--------------------------|-----------------|-----------------|
| `ham_wasl` | "Hamzat ul Wasl" | "Hamza Wasl" | "Hamza Wasl" |
| `slnt` | "Silent" / "Lam Shamsiyyah" | "Lettre silencieuse" | "Silent letter" |
| `qlq` | "Qalqalah" | "Qalqala" | "Qalqala" |
| `madda_normal` | "Normal Prolongation: 2 Vowels" | "Madd normal" | "Normal Madd" |
| `madda_permissible` | "Permissible Prolongation: 2, 4, 6 Vowels" | "Madd permissible" | "Permissible Madd" |
| `madda_necessary` | "Necessary Prolongation: 6 Vowels" | "Madd nécessaire" | "Necessary Madd" |
| `madda_obligatory` | "Obligatory Prolongation: 4-5 Vowels" | "Madd obligatoire" | "Obligatory Madd" |
| `ghn` | "Ghunnah: 2 Vowels" | "Ghunna" | "Ghunna" |
| `ikhf` | "Ikhfa'" | "Ikhfa" | "Ikhfa" |
| `ikhf_shfw` | "Ikhfa' Shafawi - Loss of Labial" | "Ikhfa Shafawi" | "Ikhfa Shafawi" |
| `idghm_shfw` | "Idgham Shafawi - Loss of Labial" | "Idgham Shafawi" | "Idgham Shafawi" |
| `iqlb` | "Iqlab" | "Iqlab" | "Iqlab" |
| `idgh_ghn` | "Idgham - Loss with Ghunnah" | "Idgham avec Ghunna" | "Idgham with Ghunna" |
| `idgh_w_ghn` | "Idgham - Loss without Ghunnah" | "Idgham sans Ghunna" | "Idgham w/o Ghunna" |
| `idgh_mus` | "Idgham - Mutajanisayn" / "Mutaqaribayn" | "Idgham Mutajanisayn" | "Idgham Mutajanisayn" |

Le tooltip fonctionne donc déjà techniquement. La tâche TAJ-03 consiste à remplacer les descriptions anglaises techniques par les noms courts localisés définis dans `TAJWEED_LEGEND`.

---

## Common Pitfalls

### Pitfall 1 : `idgh_mus` partagée par deux règles
**Ce qui se passe :** Dans `tajweed.js`, `[d` (Mutajanisayn) et `[b` (Mutaqaribayn) ont toutes les deux `default_css_class: 'idgh_mus'`. La même classe CSS s'applique donc aux deux.
**Pourquoi :** L'implémentation AlQuran Cloud les regroupe visuellement.
**Comment éviter :** Ne pas essayer de les différencier par CSS — la classe est partagée par design. La description dans le tooltip sera celle de la dernière règle dans `createMetaData()` qui correspond à la classe.
**Signe d'alerte :** Si on essaie d'assigner des couleurs différentes aux deux, ça ne marchera pas avec CSS de classe seule.

### Pitfall 2 : Tooltip hors-écran sur premiers mots de ligne
**Ce qui se passe :** Le tooltip `::after` est positionné `bottom: calc(100% + 4px)` et centré avec `left: 50%; transform: translateX(-50%)`. Pour les lettres en début de ligne (droite de l'écran en RTL), le tooltip peut déborder à droite.
**Pourquoi :** Le texte arabe est RTL, les premières lettres sont à droite.
**Comment éviter :** Ajouter `overflow: visible` sur le conteneur parent. Alternativement, utiliser `left: auto; right: 0; transform: none` pour les éléments proches du bord — mais CSS pur ne peut pas détecter la position relative au viewport. Solution pragmatique : accepter le comportement CSS `::after` existant et tester visuellement.

### Pitfall 3 : Couleurs insuffisamment contrastées en mode OLED/sombre
**Ce qui se passe :** Les rouges foncés (bordeaux `#8b0000` pour Madd nécessaire) seront peu visibles sur fond noir OLED.
**Pourquoi :** Le projet a un mode OLED actif (fond `#000000` pur).
**Comment éviter :** Vérifier chaque couleur cible sur fond noir. Préférer des nuances lumineuses suffisamment saturées. Minimum WCAG AA = ratio 4.5:1.

### Pitfall 4 : La `html_color` dans `tajweed.js` n'est pas utilisée pour le rendu
**Ce qui se passe :** La propriété `html_color` dans `createMetaData()` a l'air d'une source de vérité pour les couleurs, mais elle n'est **pas lue** par le CSS. Le CSS utilise les noms de classe CSS directement.
**Pourquoi :** C'est une valeur de documentation/métadonnée (vestige du jsfiddle original).
**Comment éviter :** Ne pas synchroniser `html_color` avec les nouvelles valeurs CSS — ce serait inutile. La source de vérité unique pour les couleurs reste `style.css`.

### Pitfall 5 : Tooltip et police MeQuran
**Ce qui se passe :** Le contenu du tooltip (`::after`) hérite de la `font-family` arabe par défaut sur `.ayah-text`. La police MeQuran ne contient pas les caractères latins.
**Pourquoi :** Le tooltip affiche du texte latin (noms de règles).
**Comment éviter :** Le CSS existant spécifie déjà `font-family: var(--font-sans)` dans le `::after` — ce point est déjà correctement géré.

---

## Code Examples

### CSS — Palette standard cible (complète)
```css
/* Source: synthèse GlobalQuran Lab CSS + EasyQuran.com standard */
tajweed.ham_wasl          { color: #AAAAAA; }   /* Hamza Wasl           — gris         */
tajweed.slnt              { color: #AAAAAA; }   /* Lettre silencieuse   — gris         */
tajweed.qlq               { color: #009be5; }   /* Qalqala              — bleu ciel    */
tajweed.ghn               { color: #008e50; }   /* Ghunna               — vert         */
tajweed.ikhf              { color: #008e50; }   /* Ikhfa                — vert         */
tajweed.ikhf_shfw         { color: #58B800; }   /* Ikhfa Shafawi        — vert clair   */
tajweed.iqlb              { color: #008e50; }   /* Iqlab                — vert foncé   */
tajweed.idgh_ghn          { color: #008e50; }   /* Idgham avec Ghunna   — vert         */
tajweed.idgh_w_ghn        { color: #169200; }   /* Idgham sans Ghunna   — vert         */
tajweed.idghm_shfw        { color: #58B800; }   /* Idgham Shafawi       — vert clair   */
tajweed.idgh_mus          { color: #169200; }   /* Idgham Mutajanisayn  — vert         */
tajweed.madda_normal      { color: #bb8800; }   /* Madd normal 2v       — cumin/doré   */
tajweed.madda_permissible { color: #dd6600; }   /* Madd permissible 2/4/6v — orange-rouge */
tajweed.madda_obligatory  { color: #cc2200; }   /* Madd obligatoire 4-5v — rouge sang  */
tajweed.madda_necessary   { color: #a00000; }   /* Madd nécessaire 6v   — rouge foncé  */
```

**Note :** Ces valeurs hex sont dérivées des sources les plus convergentes (GlobalQuran Lab `#c84145`, `#fe4c57`, `#ff6600`, `#cc9900` pour les madds ; `#009be5` pour qalqalah ; `#008e50` pour ghunna). Elles constituent un point de départ pour la tâche 1.1 (audit et validation visuelle). Un ajustement fin sera nécessaire après test visuel côte-à-côte avec un Mushaf.

### JavaScript — Injection de `data-description` localisé (TAJ-03)
```javascript
// Source: pattern existant reader.js — à ajouter après tajweedParser.parse()
// Localiser les data-description pour le tooltip

const lang = state.currentLang; // 'fr' ou 'en'

function localizeDescription(parsedHtml) {
    return tajweedParser.getMeta().reduce((html, meta) => {
        const legend = TAJWEED_LEGEND[meta.default_css_class];
        if (!legend) return html;
        const localName = lang === 'fr' ? legend.fr[0] : legend.en[0];
        // Remplacer l'attribut data-description dans les éléments de cette classe
        return html.replace(
            new RegExp(`(class="${meta.default_css_class}"[^>]*data-description=")([^"]*)(")`, 'g'),
            `$1${localName}$3`
        );
    }, parsedHtml);
}

// Usage :
const rawParsed = tajweedParser.parse(ayah.text);
const localizedParsed = localizeDescription(rawParsed);
```

**Attention :** L'ordre des attributs dans le HTML généré par `tajweedParser.parseTajweed()` est fixe :
`class="{cls}" data-type="{type}" data-description="{desc}" data-tajweed="`
Le regex doit cibler `data-description` sans hypothèse sur ce qui vient avant/après.

---

## State of the Art

| Ancienne approche | Approche actuelle | Impact |
|-------------------|-------------------|--------|
| Tooltip JS (`mouseover`) | CSS `::after` + `attr()` | Zéro JS, meilleure performance |
| Couleurs AlQuran Cloud (rouge=qalqalah) | Couleurs Mushaf standard (rouge=madd, bleu=qalqalah) | TAJ-01 : objectif de cette phase |
| Description anglaise technique dans tooltip | Nom localisé court | TAJ-03 : meilleure UX utilisateur |

**Pas déprécié :**
- Le parser `tajweed.js` avec les identifiants `[h`, `[q`, etc. reste la bonne approche — c'est le format natif de l'API quran-tajweed.
- L'élément HTML `<tajweed>` (custom element non-registered) est parfaitement valide comme sélecteur CSS et fonctionne dans tous les navigateurs modernes.

---

## Open Questions

1. **Valeurs hex exactes pour les madds**
   - Ce qu'on sait : la convention est rouge foncé→rouge sang→orange rouge→cumin pour necessary→obligatory→permissible→normal
   - Ce qui est flou : les hex exacts varient selon les sources (GlobalQuran Lab donne `#c84145`, `#cc9900` ; EasyQuran décrit des couleurs sans hex)
   - Recommandation : utiliser les valeurs GlobalQuran Lab comme point de départ, tester visuellement côte-à-côte avec une image de Mushaf Tajweed, ajuster si nécessaire. Tâche 1.1 = cet audit visuel.

2. **Ghunna vs Ikhfa vs Iqlab — même vert ou nuances différentes ?**
   - Ce qu'on sait : les Mushafs imprimés standard regroupent ces règles en "vert"
   - Ce qui est flou : certaines apps numériques (cpfair/quran-tajweed) utilisent teal/cyan pour Ikhfa — considéré non-standard
   - Recommandation : utiliser le même vert de famille pour toutes les règles de nasalisation (Ghunna, Ikhfa, Iqlab, Idgham avec Ghunna) avec des légères variations de luminosité pour les distinguer si nécessaire.

3. **Lisibilité en mode OLED (fond #000000)**
   - Ce qu'on sait : le projet a un mode OLED actif
   - Ce qui est flou : les rouges foncés (madda_necessary) peuvent devenir illisibles
   - Recommandation : vérifier chaque couleur avec un outil de contraste (ex. WebAIM) sur fond noir, ajuster la luminosité si nécessaire sans trahir la palette standard.

---

## Validation Architecture

> Aucun framework de test détecté dans le projet (pas de jest.config, vitest.config, pytest.ini, ni répertoire tests/). Le projet est vanilla JS sans bundler — les tests seraient manuels ou via un script de test ad hoc.

### Test Framework
| Propriété | Valeur |
|-----------|--------|
| Framework | Aucun — pas de test framework détecté |
| Config file | Néant |
| Quick run command | Ouvrir `index.html` dans le navigateur (serveur statique) |
| Full suite command | Vérification visuelle manuelle dans le navigateur |

### Phase Requirements → Test Map
| Req ID | Comportement | Type de test | Méthode | Fichier |
|--------|-------------|-------------|---------|---------|
| TAJ-01 | Couleurs dans le navigateur correspondent aux couleurs Mushaf imprimé | Manuel visuel | Comparer côte-à-côte app ouverte vs image Mushaf Tajweed | N/A |
| TAJ-02 | Légende affiche couleurs correctes et textes corrects | Manuel visuel | Ouvrir une sourate, activer la légende, vérifier chaque entrée | N/A |
| TAJ-03 | Hover sur lettre colorée affiche le nom de la règle | Manuel fonctionnel | Survoler plusieurs lettres de différentes couleurs, vérifier le tooltip | N/A |

### Wave 0 Gaps
Aucun framework de test à installer. Vérification manuelle dans navigateur suffisante pour cette phase CSS/JS légère. Les critères de succès visuels sont définis dans le ROADMAP.md (comparer côte à côte app vs image Mushaf).

---

## Sources

### Primaires (HIGH confidence)
- **AlQuran Cloud Tajweed Guide** — https://alquran.cloud/tajweed-guide — palette officielle AlQuran Cloud confirmée (correspond exactement au code existant)
- **JSFiddle AlQuran Cloud reference** — https://jsfiddle.net/s20qcwph/ — source originale du tajweed.js (confirmé : `qlq=#DD0008`, `madda_normal=#537FFF`)
- **Code source `js/tajweed.js`** (lignes 12–30) — 17 règles, identifiants, classes CSS, couleurs documentées
- **Code source `style.css`** (lignes 1447–1462) — palette CSS actuelle complète
- **Code source `js/views/reader.js`** (lignes 15–31, 76–84) — TAJWEED_LEGEND + génération de la légende HTML

### Secondaires (MEDIUM confidence)
- **GlobalQuran Lab** — https://github.com/GlobalQuran/lab/blob/master/tajweed/index.html — CSS couleurs standard Mushaf : `#009be5` (Qalqalah), `#c84145` (Madd nécessaire), `#ff6600` (Madd permissible), `#cc9900` (Madd normal), `#008e50` (Ghunna)
- **EasyQuran.com** — https://easyquran.com/en/tajweed-quran-colors-roles/ — Description textuelle de la convention standard (madd=rouge, qalqalah=bleu, ghunna=vert, silencieux=gris)
- **AlQuranonline.com Dar Al-Maarifah** — https://www.alquranonline.com/color-coded-tajweed.html — Confirme la même convention standard
- **cpfair/quran-tajweed GitHub Issue #6** — https://github.com/cpfair/quran-tajweed/issues/6 — CSS rgba() colors d'une implémentation alternative (diverge sur Ikhfa=teal, Qalqalah=bleu `rgba(8,80,170,1)`)

### Tertiaires (LOW confidence)
- **RecitID.ai** — https://recitid.ai/tajweed — Couleurs d'une app tierce (Qalqalah=bleu royal, Ghunna=rouge, Idgham=vert) — non standard, diverge
- **Various WebSearch results** — Sources multiples confirmant l'absence d'un standard hex universel et la convergence sur les grandes familles de couleurs (rouge=madd, bleu=qalqalah, vert=nasalisation, gris=silencieux)

---

## Metadata

**Confidence breakdown:**
- Standard Stack : HIGH — zéro dépendance nouvelle, tout est CSS/JS natif déjà présent
- Architecture patterns : HIGH — code source analysé directement, flux bien compris
- Palette de couleurs cibles : MEDIUM — convergence entre sources sur les familles de couleurs, hex exacts nécessitent validation visuelle (tâche 1.1)
- Pitfalls : HIGH — identifiés directement depuis le code source

**Research date:** 2026-03-21
**Valid until:** 2026-06-21 (stable — CSS colors ne changent pas, API quran-tajweed stable)
