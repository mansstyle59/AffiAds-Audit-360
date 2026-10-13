# AffiAds Audit 360°

Application web (ordinateur, tablette, téléphone) qui réalise **automatiquement** l'audit de visibilité en ligne d'un commerce, à partir de données réelles et datées, puis produit un rapport client et un message de prospection.

## Ce que fait l'audit automatique

Saisissez le **nom du commerce** et la **ville**, puis cliquez sur « Lancer l'audit automatique ». L'application :

1. **Trouve la fiche Google** : adresse, téléphone, horaires, catégorie, statut (ouvert/fermé), photos, note, nombre d'avis, avis récents, doublons éventuels.
2. **Mesure la position locale** sur une recherche client (ex. « restaurant Narbonne ») et relève les **concurrents** avec leur note et leur nombre d'avis.
3. **Analyse le site sur mobile** avec Google PageSpeed Insights : performance, SEO, accessibilité, bonnes pratiques, Core Web Vitals réels, HTTPS, titre et description, capture d'écran, outils de suivi détectés (Pixel Meta, Google Analytics…).
4. **Interroge OpenStreetMap** (sans clé) : présence du commerce, réseaux sociaux déclarés, commerces similaires à proximité.
5. **Remplit la checklist** avec une preuve pour chaque point (badge AUTO), calcule un score par catégorie et un **plan d'action priorisé** (impact / effort / offre AffiAds liée).
6. **Prépare 6 questions** pour tester la visibilité dans ChatGPT, Claude, Gemini, Perplexity, Copilot et Le Chat : un clic ouvre l'assistant avec la question déjà remplie.
7. **Rédige un message de prospection** (Instagram, e-mail ou WhatsApp) à partir des constats réels.

Autres fonctions : plusieurs clients enregistrés, export/import des audits (fichier JSON), rapport PDF, export CSV des tests IA, application installable sur l'écran d'accueil du téléphone.

## Clé Google (recommandée)

Sans clé, l'analyse se limite à OpenStreetMap et à PageSpeed (quota gratuit partagé, souvent épuisé). Avec une **clé Google gratuite**, tout fonctionne :

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
