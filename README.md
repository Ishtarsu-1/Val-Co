# Atelier Val & Co — site vitrine

Site HTML/CSS/JS + petit serveur Node (aucune dépendance) qui sert le site et l'espace admin.

```bash
node server.js        # → http://localhost:8765  (admin : /admin/)
npm test              # tests de l'API admin
```

| Page | Rôle |
|---|---|
| `index.html` | Accueil : présente les 2 activités et renvoie vers chacune |
| `deco-florale.html` | Vitrine déco florale (prestations, galerie, déroulé, devis) |
| `objets-personnalises.html` | Vitrine produits avec prix → achat sur la boutique en ligne |
| `contact.html` | Formulaire de contact / devis |

Charte graphique : voir `DESIGN.md`.

## À personnaliser avant mise en ligne
1. **Boutique** : `js/main.js` → `SHOP_URL` (URL Shopify/Etsy). Chaque bouton produit a `data-shop="/products/..."` = chemin du produit.
2. **Formulaire** : créer un formulaire sur formspree.io et remplacer `VOTRE_ID` dans `contact.html`.
3. **E-mail / Instagram / Facebook** : liens dans les footers et `contact.html`.
4. **Photos & produits** : les images Unsplash sont provisoires → la cliente les remplace depuis `/admin` (voir ci-dessous).

## Espace admin (pour la cliente) — `/admin/`
- **Mes produits** : « + Ajouter un produit » ouvre un formulaire (photo, nom, prix, catégorie, description, étiquette, lien boutique). Modifier, supprimer, flèches ← → pour l'ordre.
- **Ma galerie** : « + Ajouter des photos » (plusieurs d'un coup), légende sous chaque photo, supprimer, réordonner.
- Tout est enregistré automatiquement dans `data/produits.json` / `data/galerie.json` ; les photos (réduites à 1600 px) dans `assets/uploads/`.

⚠️ **Pas encore de connexion** : en local, le serveur n'écoute que `127.0.0.1` et refuse de démarrer sur une autre adresse.
**Au déploiement** : brancher la connexion par code envoyé par e-mail dans `isAllowed()` (`server.js`), puis autoriser `HOST=0.0.0.0`.
L'hébergeur doit faire tourner Node et garder les fichiers (`data/`, `assets/uploads/`) entre deux redémarrages (VPS, Render avec disque, Fly.io avec volume…).
