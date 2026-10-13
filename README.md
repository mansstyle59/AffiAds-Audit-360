# AffiAds Audit 360°

**Fonctionne gratuitement, sans compte ni clé** : tapez le nom d'un commerce, choisissez-le dans la liste, l'audit démarre tout seul.

Application web (ordinateur, tablette, téléphone) qui réalise **automatiquement** l'audit de visibilité en ligne d'un commerce, à partir de données réelles et datées, puis produit un rapport client et un message de prospection.

## Ce que fait l'audit automatique

Tapez le **nom du commerce** : des **suggestions** (Google, ou OpenStreetMap sans clé) apparaissent et permettent de choisir l'établissement exact ; le type de commerce est détecté automatiquement. Cliquez ensuite sur « Lancer l'audit automatique ». L'application :

1. **Trouve la fiche Google** : adresse, téléphone, horaires, catégorie, statut (ouvert/fermé), photos, note, nombre d'avis, avis récents, doublons éventuels.
2. **Mesure la position locale** sur jusqu'à **3 recherches clients** (ex. « restaurant Narbonne », « meilleur restaurant Narbonne ») et relève les **concurrents** les plus visibles : note, avis, photos, et **vitesse de leur site** comparée à celle du commerce.
3. **Analyse le site sur mobile** avec Google PageSpeed Insights : performance, SEO, accessibilité, bonnes pratiques, Core Web Vitals réels, HTTPS, titre et description, capture d'écran, outils de suivi détectés (Pixel Meta, Google Analytics…).
4. **Interroge OpenStreetMap** (sans clé) : présence du commerce, réseaux sociaux déclarés, commerces similaires à proximité.
5. **Remplit la checklist** avec une preuve pour chaque point (badge AUTO), calcule un score par catégorie et un **plan d'action priorisé** (impact / effort / offre AffiAds liée).
6. **Prépare 6 questions** pour tester la visibilité dans ChatGPT, Claude, Gemini, Perplexity, Copilot et Le Chat : un clic ouvre l'assistant avec la question déjà remplie.
7. **Rédige un message de prospection** (Instagram, e-mail ou WhatsApp) à partir des constats réels.

Le **rapport client** comprend une page de couverture avec jauge de score, une synthèse « ce qui fonctionne / priorités », des graphiques comparatifs avec les concurrents, les horaires et avis Google, l'analyse du site, un plan d'action classé (tout de suite, dans le mois, ensuite) et une page de contact.

**Version 2026** : menu regroupé (Prospection, Analyse détaillée, Outils), barre d'onglets flottante effet verre sur téléphone, écran **Clients** avec l'historique des audits, **mode sombre** automatique, transitions entre écrans, **installation sur l'écran d'accueil** et interface disponible hors ligne, **partage natif** du résumé et du message, test du **Mode IA de Google**, checklist mise à jour (fin des questions-réponses Google, vidéos courtes verticales).

Autres fonctions : plusieurs clients enregistrés, export/import des audits (fichier JSON), rapport PDF, export CSV des tests IA, application installable sur l'écran d'accueil du téléphone.

## Sources gratuites et open source (sans clé)

| Source | Ce qu'elle apporte | Projet |
|---|---|---|
| Photon (OpenStreetMap) | Suggestions pendant la saisie, type de commerce | [komoot/photon](https://github.com/komoot/photon) |
| Nominatim + Overpass (OpenStreetMap) | Coordonnées, site, téléphone, horaires, réseaux déclarés, commerces similaires | [osm-search/Nominatim](https://github.com/osm-search/Nominatim), [drolbr/Overpass-API](https://github.com/drolbr/Overpass-API) |
| Jina Reader | Lecture complète du site : titre, description, boutons d'appel/WhatsApp/réservation, liens réseaux, Pixel Meta et Analytics, données structurées, cohérence téléphone/horaires/adresse | [jina-ai/reader](https://github.com/jina-ai/reader) |
| Microlink | Capture du site sur téléphone, technologies (Wix, WordPress…), Lighthouse de secours | [microlinkhq](https://github.com/microlinkhq) |
| Google Lighthouse / PageSpeed | Vitesse, SEO, accessibilité, Core Web Vitals | [GoogleChrome/lighthouse](https://github.com/GoogleChrome/lighthouse) |
| RDAP | Date d'enregistrement du nom de domaine | standard public de l'IETF |

Les services gratuits ont des limites d'usage (par exemple environ 25 analyses Microlink par jour et par appareil) : largement suffisant pour des audits de prospection.

## Clé Google (facultative)

Sans clé, l'application fonctionne avec les sources ci-dessus. Une **clé Google gratuite** ajoute la note, les avis, les photos de la fiche Google, les concurrents Google et les positions sur les recherches :

1. Créez un projet sur [Google Cloud](https://console.cloud.google.com/projectcreate).
2. Activez **Places API (New)** et **PageSpeed Insights API**.
3. Créez une clé API dans *Identifiants* et **restreignez-la** à l'adresse de l'application (`https://mansstyle59.github.io/*`) et à ces deux API.
4. Collez-la dans **Réglages** de l'application, puis « Tester la clé ».

La clé est conservée uniquement dans le navigateur : elle n'est jamais écrite dans le code ni publiée sur GitHub. Places API demande un compte de facturation Google ; un volume mensuel gratuit est inclus. Fixez une alerte de budget.

## Limites honnêtes

- La position locale vient d'une recherche Google Places : elle est **indicative** (Google Maps personnalise les résultats).
- Les réponses du propriétaire aux avis, les statistiques de la fiche et la Search Console ne sont pas accessibles publiquement.
- Les assistants IA n'offrent pas d'accès automatisé aux réponses de leurs applications grand public : les tests IA restent des observations datées, saisies en un clic.
- Aucun résultat commercial n'est promis dans le rapport ni dans les messages.

## Publication

Le site est publié automatiquement sur GitHub Pages à chaque mise à jour de la branche `main` (workflow `.github/workflows/pages.yml`).

## Fichiers

- `index.html` — structure des écrans
- `assets/app.js` — logique de l'application et appels aux sources de données
- `assets/app.css` — styles
- `assets/logo-*.png` — logo officiel AffiAds Audit
- `manifest.webmanifest` — installation sur téléphone
