# AffiAds Audit 360°

**Fonctionne gratuitement, sans compte ni clé** : tapez le nom d'un commerce, choisissez-le dans la liste, l'audit démarre tout seul.

Application web (ordinateur, tablette, téléphone) qui réalise **automatiquement** l'audit de visibilité en ligne d'un commerce, à partir de données réelles et datées, puis produit un rapport client et un message de prospection.

## Ce que fait l'audit automatique

Tapez le **nom du commerce** : des **suggestions** (Google, ou OpenStreetMap sans clé) apparaissent et permettent de choisir l'établissement exact ; le type de commerce est détecté automatiquement. Cliquez ensuite sur « Lancer l'audit automatique ». L'application :

1. **Trouve la fiche Google** : adresse, téléphone, horaires, catégorie, statut (ouvert/fermé), photos, note, nombre d'avis, avis récents, doublons éventuels.
2. **Mesure la position locale** sur jusqu'à **3 recherches clients** (ex. « plombier Narbonne », « meilleure boulangerie Narbonne »), avec plus de 40 métiers reconnus automatiquement et relève les **concurrents** les plus visibles : note, avis, photos, et **vitesse de leur site** comparée à celle du commerce.
3. **Analyse le site sur mobile** avec Google PageSpeed Insights : performance, SEO, accessibilité, bonnes pratiques, Core Web Vitals réels, HTTPS, titre et description, capture d'écran, outils de suivi détectés (Pixel Meta, Google Analytics…).
4. **Interroge OpenStreetMap** (sans clé) : présence du commerce, réseaux sociaux déclarés, commerces similaires à proximité.
5. **Remplit la checklist** avec une preuve pour chaque point (badge AUTO), calcule un score par catégorie et un **plan d'action priorisé** (impact / effort / offre AffiAds liée).
6. **Prépare 6 questions** pour tester la visibilité dans ChatGPT, Claude, Gemini, Perplexity, Copilot et Le Chat : un clic ouvre l'assistant avec la question déjà remplie.
7. **Rédige un message de prospection** (Instagram, e-mail ou WhatsApp) à partir des constats réels.

Le **rapport client** comprend une page de couverture avec jauge de score, une synthèse « ce qui fonctionne / priorités », des graphiques comparatifs avec les concurrents, les horaires et avis Google, l'analyse du site, un plan d'action classé (tout de suite, dans le mois, ensuite) et une page de contact.

**Analyses avancées** : photos publiées par le propriétaire (et vraies photos de la fiche), **carte de visibilité** (position depuis 9 points autour du commerce), **visibilité sur Bing** (résultats Bing France, qui alimentent aussi DuckDuckGo et Copilot), **test IA automatique** avec Gemini et la Recherche Google (API « Generative Language » à activer sur la clé). Rapport PDF professionnel de 9 sections avec en-tête et pied de page sur chaque page.

**Synchronisation** : mêmes audits et réglages sur tous les appareils, reliés par QR code ; données chiffrées sur l’appareil (AES-GCM) avant l’envoi vers un coffre Supabase qui ne voit que des données chiffrées.

**Réseaux sociaux** : détection des comptes Facebook, Instagram, TikTok, YouTube et Snapchat (site, OpenStreetMap, recherche Bing).

**Protection et confidentialité** : le code PIN actuel et le verrouillage biométrique local ne constituent pas une authentification serveur. L’application publiée sur GitHub Pages reste accessible publiquement à toute personne connaissant son URL ; ne stockez pas de secret sensible dans le code ou dans le navigateur. Une authentification propriétaire validée côté serveur est nécessaire avant de considérer l’application comme privée.

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
| axe-core — contrôle de l’interface AffiAds | Recherche de violations WCAG automatisables sur l’écran actuellement ouvert. Pour un site client externe, utiliser PageSpeed/Lighthouse ; les contrôles automatiques doivent être complétés par une vérification humaine. | [dequelabs/axe-core](https://github.com/dequelabs/axe-core) |
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

## Audit Instagram et YouTube

Écran « Plus → Instagram et YouTube » : collez le lien d’un compte. YouTube : abonnés, rythme, Shorts, titres et descriptions (SEO), tags, chapitres, engagement (données officielles avec la clé Google et l’API « YouTube Data API v3 », sinon page publique et flux RSS). Instagram : abonnés, publications, nom et bio quand ils sont publics, puis vérification guidée du profil. Avec la clé Google, l’IA propose niche, mots-clés, hashtags et idées de contenus. Le résultat s’ajoute au rapport client.


## Cohérence de l’interface

L’interface utilise un système visuel commun : mêmes couleurs, typographie, rayons, états de boutons, champs de formulaire et espacements sur Audit, Clients, Rapport, Message, Analyse détaillée et Réglages. La navigation mobile garde les actions principales visibles ; les sections secondaires sont regroupées dans « Plus ». Les indicateurs automatiques doivent être distingués des vérifications manuelles et des correspondances de comptes sociaux qui restent à confirmer.


## Build iOS IPA pour ESign / GBox

Le workflow `.github/workflows/ios-ipa.yml` se lance automatiquement après une mise à jour de l’application sur `main`, ou manuellement depuis **Actions → Build iOS IPA for ESign / GBox → Run workflow**. Il construit un IPA **non signé** destiné à être importé dans ESign/GBox. Aucun certificat Apple ni secret GitHub n’est nécessaire pour fabriquer l’artefact.

1. Ouvre l’onglet [Actions](https://github.com/mansstyle59/AffiAds-Audit-360/actions).
2. Sélectionne l’exécution **Build iOS IPA for ESign / GBox** la plus récente et attends qu’elle soit terminée avec succès.
3. Télécharge l’artefact **AffiAds-Audit-360-ESign-GBox-IPA** dans le bas de la page de l’exécution.
4. Sur l’iPhone, importe le fichier IPA dans ESign/GBox puis signe-le avec un certificat et un profil valides correspondant à l’identifiant de bundle et à l’appareil, si nécessaire.

L’identifiant de bundle par défaut est `fr.affiads.audit360`. Si ton profil ESign/GBox utilise un autre identifiant, renseigne celui-ci au lancement manuel du workflow.

**Important :** l’IPA généré est volontairement non signé. ESign/GBox doit le signer avec un certificat et un profil valides avant l’installation. Le workflow ne fournit pas de certificat et ne contourne pas les règles de signature iOS. Évite les certificats d’entreprise partagés provenant de sources inconnues.

### Code d’accès et confidentialité

Le code PIN est configuré dans l’application et son empreinte est stockée localement ; il n’est pas intégré comme texte en clair au dépôt public. Après l’installation, configure le code **1606** sur l’appareil si aucun code n’est déjà configuré, puis confirme ce même code. Une réinstallation peut effacer ce réglage local : le code devra alors être configuré de nouveau. Ne considère pas ce PIN local comme une authentification serveur : une véritable restriction à une seule personne nécessite une authentification côté serveur.


## SEO + GEO : ce qu'AffiAds peut faire pour le client

AffiAds Audit 360° vise à transformer un diagnostic en plan d'amélioration compréhensible, priorisé et vérifiable. **SEO** désigne la visibilité dans les moteurs de recherche ; **GEO** désigne ici le travail sur la clarté, la fiabilité et la découvrabilité des informations susceptibles d'être reprises dans les réponses des moteurs et assistants IA. Le terme GEO ne correspond pas à un classement officiel universel.

### 1. Ce que l'application peut analyser automatiquement selon les données disponibles

- **Fiche locale et présence publique** : identité, coordonnées, horaires, catégorie, photos, avis et concurrents lorsque la source et les autorisations/API le permettent.
- **Site et performance** : HTTPS, performance Lighthouse/PageSpeed, signaux SEO, accessibilité et Core Web Vitals lorsqu'ils sont fournis par l'outil ; titre, description, liens, coordonnées et certains éléments techniques lorsque la lecture de page fonctionne.
- **Recherche locale et concurrence** : résultats observés pour les requêtes choisies, concurrents visibles et comparaisons disponibles. Les positions sont indicatives et peuvent varier selon la localisation, l'appareil et la personnalisation.
- **Présence sur le Web** : liens publics, profils sociaux et annuaires détectés dans les sources accessibles.
- **Visibilité IA observée** : préparation de questions, ouverture des assistants, saisie de résultats datés et comparaison de présence/citations. Certains tests automatisés nécessitent une clé et restent soumis aux limites des API.

### 2. Ce que le client peut améliorer avec le plan d'action

- **SEO technique** : exploration et indexation, sitemap, robots.txt, canonicals, redirections, HTTPS, vitesse, stabilité et expérience mobile.
- **SEO on-page** : titres uniques, méta-descriptions, structure H1/H2/H3, maillage interne, images, pages de services et contenu répondant à une intention de recherche.
- **SEO local** : fiche Google et Bing complète, informations cohérentes, catégories adaptées, avis authentiques, pages de services/lieux réellement desservis et annuaires de référence.
- **Données structurées** : balisage adapté au contenu réel et validation des erreurs ; elles aident les moteurs à comprendre une page mais ne garantissent pas un résultat enrichi.
- **GEO / réponses IA** : réponses factuelles et faciles à citer, FAQ utile, informations d'entreprise cohérentes, expertise démontrable, références fiables, contenu lisible et vérification des robots d'exploration.
- **Suivi** : répétition de questions IA, enregistrement de la date, de la formulation, de la présence, des sources citées et des erreurs constatées.

### 3. Ce qu'AffiAds va fournir dans l'audit

La checklist comprend désormais des contrôles SEO technique/contenu et GEO, avec une recommandation associée à chaque nouveau point. Le client peut marquer les points vérifiés et ceux à améliorer ; les recommandations alimentent le plan d'action priorisé et le rapport PDF existants. Les actions proposées sont des conseils à appliquer ou à confier à un prestataire : l'application ne modifie pas automatiquement le site, les fiches ou les paramètres du client.

### 4. Méthode de mise en œuvre proposée

1. **Diagnostic initial** : recueillir les URL, le métier, la zone réelle, les objectifs et les sources accessibles.
2. **Corrections rapides (0–7 jours)** : coordonnées divergentes, titres évidents, liens cassés, informations manquantes et CTA.
3. **Fondations (2–4 semaines)** : indexation, pages de services, structure du contenu, performance, données structurées et FAQ.
4. **Autorité et GEO (mensuel)** : améliorer les preuves et les sources fiables, actualiser les informations et répéter les tests de visibilité IA.
5. **Mesure** : comparer les données disponibles avant/après, en distinguant les métriques observées des recommandations et des contrôles manuels.

### 5. Limites à annoncer clairement au client

- Une analyse publique ne donne pas accès aux données privées de Google Search Console, aux statistiques de la fiche, ni aux comptes du client. Une connexion ou un export autorisé est nécessaire.
- L'application ne peut pas garantir l'indexation, une position précise, l'apparition dans les aperçus IA, une citation par ChatGPT ou une hausse du chiffre d'affaires.
- Les tests IA sont des observations datées : les réponses varient selon la requête, le pays, la session et le produit.
- La présence d'un fichier `llms.txt`, d'un balisage ou d'une FAQ n'assure pas à elle seule une meilleure visibilité. Il faut privilégier le contenu utile, l'exactitude, l'exploration possible et les preuves.
- Les points qui ne peuvent pas être confirmés automatiquement doivent rester marqués comme à vérifier manuellement, avec une preuve ou une source quand elle est disponible.

## Logo.dev : logos de marque dans les rapports (optionnel)

AffiAds peut afficher le logo public du commerce dans le résumé de l'audit et sur la couverture du PDF grâce au dépôt officiel [logo-dev/logo-api](https://github.com/logo-dev/logo-api). L'intégration est facultative et n'interrompt jamais l'audit si elle n'est pas configurée.

1. Créez une clé sur [Logo.dev](https://www.logo.dev/signup).
2. Dans **Réglages → Logo.dev**, collez uniquement la clé publique qui commence par `pk_`, puis enregistrez-la.
3. La clé publique reste dans le stockage local de ce navigateur. Les clés secrètes `sk_` sont rejetées. N'ajoutez aucune clé au dépôt GitHub.
4. Les logos proviennent du CDN `img.logo.dev`. Si le logo ne peut pas être chargé, le bloc disparaît sans casser le rapport.

Sur l'offre gratuite, l'utilisation commerciale peut nécessiter une attribution visible vers Logo.dev : vérifiez les conditions actuelles sur [les règles d'attribution](https://www.logo.dev/docs/platform/attribution) et conservez le lien/mention fourni dans l'interface. Le logo est un élément visuel, pas une preuve d'identité du commerce. Vérifiez la bonne correspondance avant de remettre le PDF au client.

Tests : `node --test tests/logo-dev.test.cjs`. L'intégration n'ajoute aucun SDK, aucune dépendance npm et aucun appel de logo tant qu'une clé publique valide n'est pas enregistrée.
