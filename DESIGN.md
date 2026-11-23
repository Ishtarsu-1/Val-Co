# DESIGN.md — Atelier Val & Co

> Fleurs, créations & émotions — Décoration florale (mariages, événements) & objets personnalisés, Gironde.

## 1. Visual Theme & Atmosphere

- **Une phrase** : un papier d'aquarelle crème, une encre brun-bronze, des fleurs dessinées au trait — l'élégance d'un faire-part de mariage champêtre.
- **Mots-clés** : bohème · champêtre · élégant · artisanal · lumineux · doux.
- **Philosophie** : beaucoup de blanc (crème), photos généreuses, typographie serif aux capitales espacées comme le logo, une touche de script pour l'émotion. Le logo dicte tout : brun `#5B4636`, trait fin, papier texturé.
- **Clair uniquement** (un papier n'a pas de mode sombre).

## 2. Color Palette & Roles

```css
:root {
  --paper:      #F4EFE8;  --paper-rgb: 244 239 232;   /* fond principal (papier du logo) */
  --cream:      #FBF8F3;  --cream-rgb: 251 248 243;   /* cartes, sections alternées */
  --ink:        #3E3128;  --ink-rgb: 62 49 40;        /* texte principal */
  --bronze:     #5B4636;  --bronze-rgb: 91 70 54;     /* logo, titres, boutons */
  --bronze-soft:#765A43;  --bronze-soft-rgb: 118 90 67;  /* hover, filets, icônes */
  --sage:       #8A9479;  --sage-rgb: 138 148 121;    /* accent champêtre (objets) */
  --blush:      #D9B8A7;  --blush-rgb: 217 184 167;   /* accent floral (déco) */
  --muted:      #6B5E54;  --muted-rgb: 107 94 84;     /* texte secondaire */
  --line:       rgb(var(--bronze-rgb) / .16);         /* séparateurs */
}
```

Rôles : Fleurs ↔ `--blush`, Objets ↔ `--sage`. Le bronze est la seule couleur « d'action ».

## 3. Typography Rules

```
https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Jost:wght@300;400;500&family=Allura&display=swap
```

| Rôle | Police | Taille | Détails |
|---|---|---|---|
| Display H1 | Cormorant Garamond 500 | clamp(2.8rem, 7vw, 5.6rem) | lh 1.02 |
| H2 | Cormorant Garamond 500 | clamp(2rem, 4.5vw, 3.4rem) | lh 1.1 |
| H3 | Cormorant Garamond 600 | 1.5rem | |
| Boutons, nav, tags | Jost 400 MAJ | .72–.8rem | letter-spacing .14–.2em, en écho à « ATELIER » du logo |
| Libellés (formulaire, footer, contact) | Jost 400 / Cormorant 500 | .92rem / 1.3rem | casse normale |
| Script | Allura | 1.6–2.4rem | accent émotionnel, 1 par section max |
| Body | Jost 300 | 1.05rem | lh 1.75 |
| Prix / label | Jost 500 | .95rem | |

Fallbacks : `"Cormorant Garamond", Georgia, serif` · `Jost, system-ui, sans-serif` · `Allura, cursive`.
Interdit : Inter/Roboto en titre, script en paragraphe, gras > 600. Pas de dégradé ni ombre sur le texte (style « papier » → aplat).

## 4. Component Stylings

- **Bouton primaire** `.btn` : fond `--bronze`, texte `--cream`, radius 999px, padding .95em 2em, Jost 400 MAJ .78rem ls .2em.
  hover : fond `--ink`, translateY(-2px) · active : translateY(0) · focus-visible : outline 2px `--bronze-soft` offset 3px · disabled : opacité .45, cursor not-allowed.
- **Bouton ghost** `.btn--ghost` : bordure 1px `--bronze`, fond transparent → hover fond `--bronze` texte `--cream`.
- **Lien** : souligné fin animé (background-size 0→100%).
- **Carte produit** : fond `--cream`, radius 6px, image ratio 4/5 zoom 1.06 au hover, ombre `--shadow-2` au hover, focus-within outline.
- **Hero d’accueil** : grand logo centré + titre + brins dessinés + aquarelle. C’est l’entrée validée par la cliente : ne pas y toucher.
- **Planche d’atelier** (section « à propos ») : photo en arche + tirage scotché avec légende manuscrite (`.pola`) + étiquette kraft (`.note`).
- **Étiquette kraft** `.note` : « En <mois> à l’atelier » remplie par JS selon le mois (`[data-saison]`), aussi en haut des pages Déco et Objets, et pour les infos de devis sur Contact.
- **Aperçu galerie** (accueil) : `#galerie[data-limit="4"]`, grille régulière 4 → 2 colonnes, photos 4/5 ; la galerie ignore les photos déjà affichées ailleurs sur la page.
- **Prestations** (déco) : liste éditoriale titre / description séparée par des filets, sans icônes.
- **Carte « univers »** (accueil) : grande image + voile, titre serif, flèche qui glisse au hover.
- **Nav** : transparente en haut, au scroll → fond `--paper` à 92% + `backdrop-filter: blur(10px)` + filet bas. Lien actif : point bronze sous le texte. Mobile : menu plein écran.
- **Champs de formulaire** : fond `--cream`, bordure 1px `--line`, focus → bordure `--bronze` ; invalide (après saisie) → bordure `--error`. Disabled → opacité .5.
- **Tag** `.tag` : Jost .72rem MAJ, bordure 1px, radius 999px.

## 5. Layout Principles

- Conteneur : `min(1180px, 100% - 2*var(--gutter))`, gutter 24px (16px mobile).
- Espacement : 4 · 8 · 12 · 16 · 24 · 32 · 48 · 72 · 112 · 160px. Sections : padding vertical clamp(72px, 12vw, 150px).
- Grilles : galerie en masonry (CSS columns), produits 3 → 2 → 1 colonnes.
- Alternance gauche/droite texte/image pour le rythme.

## 6. Depth & Elevation

```css
--shadow-1: 0 1px 2px rgb(var(--ink-rgb) / .06);
--shadow-2: 0 18px 40px -18px rgb(var(--ink-rgb) / .28);
--shadow-3: 0 30px 70px -30px rgb(var(--ink-rgb) / .38);
```
Pas d'ombre lourde : la profondeur vient de la texture papier (grain SVG fixe) et des photos.

## 7. Animation & Interaction — **L2 Fluide**

Vanilla CSS + IntersectionObserver, zéro dépendance.

| Catégorie | Implémentation |
|---|---|
| Texte H1 | Révélation mot par mot par masque (`.split`), seul moment orchestré |
| Texte / images | fade-up 24px, clip-path pour titres et arches, stagger via `--d` |
| Composant | Zoom d'image au hover des cartes, légende de galerie qui glisse |
| Parallaxe | `[data-parallax]` translateY léger, rAF |
| Nav | état scrollé |
| Clin d'œil | Le cœur du footer fait éclore de petits pétales au survol/clic |

| Fond | Aquarelle qui dérive, uniquement dans le hero d’accueil |

Retirés volontairement (effet « template ») : bandeau défilant, boutons magnétiques, halo souris, tampon qui tourne, aquarelle des pages internes.

Easing : `cubic-bezier(.22,.61,.36,1)` ; durées 600–900ms.
`prefers-reduced-motion: reduce` → animations et transitions ~0, contenu visible directement.

## 8. Do's and Don'ts

**Do**
1. Garder le crème comme fond dominant (≥ 70% de la surface).
2. Capitales espacées réservées aux boutons, nav et tags ; libellés et titres en casse normale.
3. Une seule phrase en script Allura par section.
4. Photos lumineuses, tons chauds, beaucoup d'air autour.
5. Toujours un chemin clair vers « Demander un devis » ou « Voir la boutique ».

**Don't**
1. Pas de noir pur ni de blanc pur.
2. Pas de couleurs saturées (rose vif, bleu) ni de dégradés fluo.
3. Pas de coins carrés durs sur les boutons ni de radius > 8px sur les cartes.
4. Pas d'emoji ; icônes SVG au trait fin uniquement.
5. Pas de `filter: blur()` sur éléments en mouvement.
6. Pas de texte script sous 1.4rem (illisible).
7. Pas plus de 2 polices sur un même bloc.
8. Pas de paiement sur le site : l'achat se fait sur la boutique (Shopify).

## 9. Responsive Behavior

| Breakpoint | Comportement |
|---|---|
| ≥ 1024px | Layout complet, magnet + spotlight actifs (`hover: hover`) |
| 640–1023px | Grilles 2 colonnes |
| < 640px | 1 colonne, nav en menu plein écran, gutter 16px, galerie 2 colonnes |

Cibles tactiles ≥ 44×44px, aucun débordement horizontal, images `loading="lazy"` sauf hero.
