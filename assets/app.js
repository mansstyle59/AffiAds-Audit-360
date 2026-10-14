/* AffiAds Audit 360° — v2
   Audit automatique à partir de sources réelles :
   - Google Places API (New)  : fiche, note, avis, photos, horaires, concurrents, position locale (clé Google)
   - Google PageSpeed Insights : Lighthouse mobile + Core Web Vitals (clé recommandée)
   - OpenStreetMap (Nominatim + Overpass) : secours sans clé (coordonnées, site, réseaux, concurrents)
   Tout est stocké localement dans le navigateur. Aucune clé n'est écrite dans le code. */
"use strict";

/* ---------- Référentiels ---------- */
/* Familles d'activité : vocabulaire, photos, vidéos et annuaires adaptés à chaque métier */
const FAMS={
 food:{offer:"la carte ou les produits avec les prix",photos:"façade, salle, plats ou produits, équipe",video:"la préparation d’un plat ou d’un produit phare",dirs:"TripAdvisor, TheFork, PagesJaunes"},
 beauty:{offer:"les prestations avec les tarifs",photos:"salon, réalisations avant/après, équipe",video:"une transformation avant/après",dirs:"Planity, Treatwell, PagesJaunes"},
 health:{offer:"les spécialités, les actes et les modalités de rendez-vous",photos:"façade, accueil, cabinet, équipe",video:"la présentation de l’équipe et des conseils pratiques",dirs:"Doctolib, PagesJaunes",regulated:true},
 build:{offer:"les services, la zone d’intervention et des réalisations en photos",photos:"chantiers avant/après, équipe, véhicule",video:"un chantier avant/après en accéléré",dirs:"PagesJaunes, Houzz, Habitatpresto, StarOfService"},
 shop:{offer:"les produits phares avec les prix",photos:"vitrine, intérieur, produits, équipe",video:"les nouveautés ou un produit en situation",dirs:"PagesJaunes, Facebook"},
 service:{offer:"les services avec les tarifs ou une demande de devis",photos:"locaux, équipe, réalisations",video:"la présentation de l’équipe et d’un service",dirs:"PagesJaunes et les annuaires du métier"},
 legal:{offer:"les domaines d’intervention et les modalités de rendez-vous",photos:"locaux, équipe",video:"des conseils pratiques en 30 secondes",dirs:"PagesJaunes et les annuaires de la profession",regulated:true},
 auto:{offer:"les prestations avec les tarifs",photos:"atelier, véhicules, équipe",video:"une intervention en atelier",dirs:"PagesJaunes, iDGarages, Vroomly"},
 stay:{offer:"les chambres ou activités avec les tarifs et la réservation",photos:"façade, chambres ou espaces, environs",video:"une visite des lieux",dirs:"Booking, TripAdvisor, PagesJaunes"}};
const BIZ_TYPES=[
 {grp:"Restauration et alimentation",label:"Restaurant",kw:"restaurant",fam:"food",osm:'["amenity"~"^(restaurant)$"]'},
 {grp:"Restauration et alimentation",label:"Pizzeria / restauration rapide",kw:"pizzeria",f:1,fam:"food",osm:'["amenity"~"^(fast_food)$"]'},
 {grp:"Restauration et alimentation",label:"Café / bar",kw:"bar",fam:"food",osm:'["amenity"~"^(cafe|bar|pub)$"]'},
 {grp:"Restauration et alimentation",label:"Boulangerie",kw:"boulangerie",f:1,fam:"food",osm:'["shop"~"^(bakery|pastry)$"]'},
 {grp:"Restauration et alimentation",label:"Boucherie / charcuterie",kw:"boucherie",f:1,fam:"food",osm:'["shop"~"^(butcher|deli)$"]'},
 {grp:"Restauration et alimentation",label:"Traiteur",kw:"traiteur",fam:"food",osm:'["craft"="caterer"]'},
 {grp:"Restauration et alimentation",label:"Caviste",kw:"caviste",fam:"shop",osm:'["shop"~"^(wine|alcohol)$"]'},
 {grp:"Restauration et alimentation",label:"Commerce de proximité",kw:"épicerie",f:1,fam:"shop",osm:'["shop"~"^(convenience|supermarket|greengrocer)$"]'},
 {grp:"Beauté et bien-être",label:"Salon / beauté",kw:"coiffeur",fam:"beauty",osm:'["shop"~"^(hairdresser)$"]'},
 {grp:"Beauté et bien-être",label:"Barbier",kw:"barbier",fam:"beauty",osm:'["shop"~"^(hairdresser)$"]'},
 {grp:"Beauté et bien-être",label:"Institut de beauté / ongles",kw:"institut de beauté",fam:"beauty",osm:'["shop"~"^(beauty|cosmetics)$"]'},
 {grp:"Beauté et bien-être",label:"Santé / bien-être",kw:"spa",fam:"beauty",osm:'["leisure"~"^(spa|sauna)$"]'},
 {grp:"Beauté et bien-être",label:"Tatoueur",kw:"tatoueur",fam:"beauty",osm:'["shop"~"^(tattoo)$"]'},
 {grp:"Beauté et bien-être",label:"Salle de sport / coach",kw:"salle de sport",f:1,fam:"service",osm:'["leisure"~"^(fitness_centre|sports_centre)$"]'},
 {grp:"Santé (profession réglementée)",label:"Médecin",kw:"médecin",fam:"health",osm:'["amenity"~"^(doctors|clinic)$"]'},
 {grp:"Santé (profession réglementée)",label:"Kinésithérapeute / ostéopathe",kw:"kinésithérapeute",fam:"health",osm:'["healthcare"~"^(physiotherapist|osteopath)$"]'},
 {grp:"Santé (profession réglementée)",label:"Dentiste",kw:"dentiste",fam:"health",osm:'["amenity"~"^(dentist)$"]'},
 {grp:"Santé (profession réglementée)",label:"Pharmacie",kw:"pharmacie",f:1,fam:"health",osm:'["amenity"~"^(pharmacy)$"]'},
 {grp:"Santé (profession réglementée)",label:"Vétérinaire",kw:"vétérinaire",fam:"health",osm:'["amenity"~"^(veterinary)$"]'},
 {grp:"Commerces",label:"Opticien",kw:"opticien",fam:"shop",osm:'["shop"~"^(optician)$"]'},
 {grp:"Commerces",label:"Boutique / mode",kw:"boutique",f:1,fam:"shop",osm:'["shop"~"^(clothes|shoes|boutique|gift|jewelry)$"]'},
 {grp:"Commerces",label:"Fleuriste",kw:"fleuriste",fam:"shop",osm:'["shop"~"^(florist)$"]'},
 {grp:"Commerces",label:"Animalerie / toiletteur",kw:"toiletteur",fam:"shop",osm:'["shop"~"^(pet|pet_grooming)$"]'},
 {grp:"Commerces",label:"Magasin de meubles / déco",kw:"magasin de décoration",fam:"shop",osm:'["shop"~"^(furniture|interior_decoration)$"]'},
 {grp:"Artisans et bâtiment",label:"Artisan / dépannage",kw:"artisan",fam:"build",osm:'["craft"]'},
 {grp:"Artisans et bâtiment",label:"Plombier / chauffagiste",kw:"plombier",fam:"build",osm:'["craft"~"^(plumber|hvac)$"]'},
 {grp:"Artisans et bâtiment",label:"Électricien",kw:"électricien",fam:"build",osm:'["craft"~"^(electrician)$"]'},
 {grp:"Artisans et bâtiment",label:"Peintre / façadier",kw:"peintre en bâtiment",fam:"build",osm:'["craft"~"^(painter)$"]'},
 {grp:"Artisans et bâtiment",label:"Maçon / rénovation",kw:"entreprise de rénovation",f:1,fam:"build",osm:'["craft"~"^(builder|carpenter|roofer|tiler|stonemason)$"]'},
 {grp:"Artisans et bâtiment",label:"Serrurier",kw:"serrurier",fam:"build",osm:'["shop"~"^(locksmith)$"]'},
 {grp:"Artisans et bâtiment",label:"Paysagiste",kw:"paysagiste",fam:"build",osm:'["craft"~"^(gardener)$"]'},
 {grp:"Artisans et bâtiment",label:"Déménageur",kw:"déménageur",fam:"service",osm:""},
 {grp:"Services",label:"Agence immobilière",kw:"agence immobilière",f:1,fam:"service",osm:'["office"~"^(estate_agent)$"]'},
 {grp:"Services",label:"Auto-école",kw:"auto-école",f:1,fam:"service",osm:'["amenity"~"^(driving_school)$"]'},
 {grp:"Services",label:"Photographe",kw:"photographe",fam:"service",osm:'["craft"~"^(photographer)$"]'},
 {grp:"Services",label:"Pressing / cordonnerie",kw:"pressing",fam:"service",osm:'["shop"~"^(dry_cleaning|laundry|shoe_repair)$"]'},
 {grp:"Services",label:"Avocat / notaire / comptable",kw:"avocat",fam:"legal",osm:'["office"~"^(lawyer|notary|accountant)$"]'},
 {grp:"Auto et transport",label:"Garage / auto",kw:"garage automobile",fam:"auto",osm:'["shop"~"^(car_repair|car|tyres)$"]'},
 {grp:"Auto et transport",label:"Taxi / VTC",kw:"taxi",fam:"auto",osm:'["amenity"~"^(taxi)$"]'},
 {grp:"Hébergement et loisirs",label:"Hôtel / hébergement",kw:"hôtel",fam:"stay",osm:'["tourism"~"^(hotel|motel)$"]'},
 {grp:"Hébergement et loisirs",label:"Gîte / chambre d’hôtes",kw:"chambre d’hôtes",f:1,fam:"stay",osm:'["tourism"~"^(guest_house|chalet|apartment)$"]'},
 {grp:"Hébergement et loisirs",label:"Loisirs / activités",kw:"activité de loisirs",f:1,fam:"stay",osm:'["leisure"~"^(escape_game|bowling_alley|amusement_arcade|miniature_golf|water_park)$"]'},
 {grp:"Autre",label:"Autre commerce",kw:"",fam:"service",osm:""}
];
/* Les nouveaux points sont TOUJOURS ajoutés en fin de groupe pour garder la compatibilité des sauvegardes. */
const groups=[
{title:"A · Fiche Google et Maps",items:["Nom, adresse, téléphone et horaires exacts","Catégorie principale et catégories secondaires","Description, services et lien de réservation","Menu, produits ou prestations accessibles","Photos récentes et de bonne qualité","Note, nombre et récence des avis","Réponses du propriétaire aux avis","Attributs, services et FAQ complets (les Q&R Google ont disparu)","Doublons ou incohérences visibles","Fiche ouverte et active (pas marquée fermée)","Photos publiées par le propriétaire"]},
{title:"B · Site Internet et référencement",items:["Site web présent et adapté au mobile","Chargement et navigation corrects","Menu, tarifs, horaires et coordonnées cohérents","Boutons d'appel, réservation et itinéraire","Pages indexables et titres descriptifs","Données structurées pertinentes à contrôler","Connexion sécurisée HTTPS","Accessibilité du site","Outils de suivi publicitaire (Pixel Meta, Google Analytics / Tag Manager)"]},
{title:"C · Réseaux sociaux et publicité",items:["Présence sur Facebook et Instagram","Présence TikTok si pertinente","Publications récentes et régulières","Photos et vidéos de bonne qualité","Coordonnées et identité cohérentes","Publicités actives vérifiées dans la bibliothèque Meta","Vidéos courtes récentes (Reels, TikTok, Shorts)"]},
{title:"D · Réputation et concurrence",items:["Points positifs récurrents dans les avis","Critiques récurrentes à traiter","Réactivité aux avis négatifs","Comparaison avec trois concurrents locaux","Différences d'offre ou de présentation identifiées","Position sur la recherche locale principale","Visibilité sur Bing (DuckDuckGo, Copilot)"]},
{title:"E · Visibilité dans les assistants IA",items:["Test de recherche du commerce dans ChatGPT","Test de recherche du commerce dans Claude","Informations du site officiel exactes et faciles à trouver","Sources fiables et annuaires cohérents","Questions locales pertinentes testées manuellement","Tests dans Gemini, Perplexity et Copilot","Présence dans le Mode IA et les aperçus IA de Google"]}
];
/* Recommandation par point : texte, impact (1-3), effort (1-3), offre AffiAds liée */
const RECO={
"0-0":["Compléter et harmoniser adresse, téléphone et horaires (y compris exceptionnels) sur la fiche Google, le site et les réseaux.",3,1,"Optimisation de la fiche Google"],
"0-1":["Choisir la catégorie principale la plus précise et ajouter les catégories secondaires pertinentes.",3,1,"Optimisation de la fiche Google"],
"0-2":["Rédiger une description claire avec l'activité et la ville, lister les services et ajouter le lien de réservation ou de commande.",2,1,"Optimisation de la fiche Google"],
"0-3":["Mettre en ligne le menu ou le catalogue avec les prix, sur la fiche Google et sur le site.",2,1,"Optimisation de la fiche Google"],
"0-4":["Publier régulièrement des photos récentes et professionnelles (façade, intérieur, produits, équipe) et une vidéo courte.",3,2,"Photos et vidéos sur mesure"],
"0-5":["Mettre en place une collecte d'avis régulière (QR code en caisse, message après la visite) pour augmenter le volume et la fraîcheur des avis.",3,2,"Kit de collecte d'avis"],
"0-6":["Répondre à tous les avis, surtout les négatifs, de façon personnalisée et rapide.",2,1,"Gestion de la réputation"],
"0-7":["Google a supprimé les questions-réponses des fiches : compléter attributs, services et produits, et publier une FAQ sur le site, car l’IA de Google Maps s’en sert pour répondre aux clients.",2,1,"Optimisation de la fiche Google"],
"0-8":["Signaler et fusionner les fiches en double depuis Google Business Profile.",2,2,"Optimisation de la fiche Google"],
"0-9":["Corriger le statut de la fiche : elle apparaît fermée ou inactive, ce qui fait fuir les clients.",3,1,"Optimisation de la fiche Google"],
"1-0":["Créer ou refondre un site mobile rapide avec les informations essentielles et un bouton d'appel.",3,3,"Site web mobile"],
"1-1":["Alléger les images (WebP/AVIF), réduire les scripts et activer la mise en cache pour accélérer l'affichage sur mobile.",3,2,"Site web mobile"],
"1-2":["Harmoniser menu, tarifs, horaires et coordonnées entre le site et la fiche Google.",2,1,"Site web mobile"],
"1-3":["Ajouter des boutons visibles : appeler, réserver, itinéraire, WhatsApp.",3,1,"Site web mobile"],
"1-4":["Corriger titres et méta-descriptions (activité + ville) et vérifier que les pages sont indexables.",2,1,"Site web mobile"],
"1-5":["Ajouter des données structurées LocalBusiness (adresse, horaires, téléphone) cohérentes avec la fiche Google.",2,2,"Site web mobile"],
"1-6":["Activer le certificat HTTPS et rediriger toutes les pages vers la version sécurisée.",3,1,"Site web mobile"],
"1-7":["Corriger contrastes, textes alternatifs des images et libellés des boutons.",1,2,"Site web mobile"],
"1-8":["Installer le Pixel Meta et Google Analytics (avec bannière de consentement) avant toute campagne, pour mesurer les résultats.",2,2,"Campagnes publicitaires vidéo"],
"2-0":["Créer ou reprendre les comptes Facebook et Instagram avec une bio claire, un lien et les coordonnées.",3,1,"Gestion des réseaux sociaux"],
"2-1":["Tester TikTok avec des vidéos verticales courtes si la clientèle visée y est présente.",1,2,"Vidéos verticales 9:16"],
"2-2":["Planifier deux à trois publications par semaine (Reels, stories, coulisses).",3,2,"Pubs vidéo et Reels"],
"2-3":["Renouveler les visuels avec des photos et vidéos professionnelles adaptées aux réseaux.",2,2,"Photos et vidéos sur mesure"],
"2-4":["Harmoniser nom, logo, coordonnées et lien sur tous les comptes.",2,1,"Gestion des réseaux sociaux"],
"0-10":["Publier depuis la fiche Google des photos professionnelles récentes (façade, intérieur, plats ou produits, équipe) : Google met en avant les photos du propriétaire quand elles sont nombreuses et de qualité.",3,1,"Photos et vidéos sur mesure"],
"3-6":["Créer et compléter la fiche Bing Places (import possible depuis Google), et soigner les annuaires que Bing met en avant : Bing alimente aussi DuckDuckGo et Copilot.",2,1,"Optimisation des fiches locales"],
"2-6":["Publier chaque semaine une vidéo verticale courte (Reels, TikTok, YouTube Shorts) : c’est le format le plus vu et le plus recherché en 2026.",3,2,"Pubs vidéo et Reels"],
"2-5":["Lancer une campagne locale test (rayon de quelques kilomètres, vidéo de 15 secondes) pour toucher de nouveaux clients.",2,2,"Pub vidéo 15 s"],
"3-0":["Mettre en avant les points forts cités dans les avis dans la communication (visuels, site, publicités).",2,1,"Pubs vidéo et Reels"],
"3-1":["Traiter les critiques récurrentes et montrer publiquement les améliorations apportées.",3,2,"Gestion de la réputation"],
"3-2":["Répondre aux avis négatifs sous 48 heures avec une solution concrète.",2,1,"Gestion de la réputation"],
"3-3":["Analyser ce que font de plus les concurrents mieux notés (photos, avis, offres) et combler l'écart.",2,2,"Optimisation de la fiche Google"],
"3-4":["Formuler une promesse claire qui distingue le commerce de ses concurrents et la répéter partout.",2,2,"Pubs vidéo et Reels"],
"3-5":["Renforcer la pertinence locale : catégories, avis récents, photos, mots-clés dans la description et sur le site.",3,2,"Optimisation de la fiche Google"],
"4-0":["Renforcer les sources consultées par les assistants : site officiel clair, fiche Google complète, annuaires et articles locaux cohérents.",2,2,"Visibilité IA"],
"4-1":["Renforcer les sources consultées par les assistants : site officiel clair, fiche Google complète, annuaires et articles locaux cohérents.",2,2,"Visibilité IA"],
"4-2":["Publier une page « Infos pratiques » claire (adresse, horaires, services, prix) facile à citer.",2,1,"Site web mobile"],
"4-3":["Vérifier et harmoniser les fiches PagesJaunes, TripAdvisor, Facebook, Apple Plans et Bing Places.",2,2,"Visibilité IA"],
"4-4":["Constituer une liste de questions clients et tester régulièrement les réponses des assistants.",1,1,"Visibilité IA"],
"4-6":["Vérifier ce que répond le Mode IA de Google sur le commerce et renforcer les sources qu’il cite (fiche Google, avis, site, annuaires).",2,2,"Visibilité IA"],
"4-5":["Étendre les tests aux autres assistants et corriger les informations erronées repérées.",1,1,"Visibilité IA"]
};
const AI_TARGETS=[
 {name:"ChatGPT",url:"https://chatgpt.com/",q:"https://chatgpt.com/?q="},
 {name:"Claude",url:"https://claude.ai/new",q:"https://claude.ai/new?q="},
 {name:"Google Gemini",url:"https://gemini.google.com/app",q:"https://gemini.google.com/app?q="},
 {name:"Google Mode IA",url:"https://www.google.com/search?udm=50",q:"https://www.google.com/search?udm=50&q="},
 {name:"Perplexity",url:"https://www.perplexity.ai/",q:"https://www.perplexity.ai/?q="},
 {name:"Microsoft Copilot",url:"https://copilot.microsoft.com/",q:"https://copilot.microsoft.com/?q="},
 {name:"Mistral Le Chat",url:"https://chat.mistral.ai/chat",q:"https://chat.mistral.ai/chat?q="}
];
const TRACKERS=[["Facebook","Pixel Meta"],["Meta","Pixel Meta"],["Google Analytics","Google Analytics"],["Google Tag Manager","Google Tag Manager"],["Google/Doubleclick Ads","Google Ads"],["TikTok","Pixel TikTok"],["Hotjar","Hotjar"],["Microsoft Clarity","Microsoft Clarity"]];

/* ---------- Utilitaires ---------- */
const $=id=>document.getElementById(id);
const keys=groups.flatMap((g,gi)=>g.items.map((x,ii)=>gi+"-"+ii));
const fields=["name","type","city","date","site","maps","rating","reviews","phone","address","context"];
const today=()=>new Date().toISOString().slice(0,10);
const nowLabel=()=>new Date().toLocaleString("fr-FR",{dateStyle:"short",timeStyle:"short"});
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function safeUrl(u){try{const x=new URL(u);return ["http:","https:"].includes(x.protocol)?x.href:""}catch(e){return ""}}
/* Liens « site web » qui sont en fait une page de réseau social ou de plateforme */
const PLATFORMS=[[/(^|\.)(facebook\.com|fb\.com|fb\.me)$/,"Facebook","social"],[/(^|\.)instagram\.com$/,"Instagram","social"],[/(^|\.)tiktok\.com$/,"TikTok","social"],[/(^|\.)(youtube\.com|youtu\.be)$/,"YouTube","social"],[/(^|\.)snapchat\.com$/,"Snapchat","social"],[/(^|\.)linkedin\.com$/,"LinkedIn","social"],[/(^|\.)(linktr\.ee|linktree\.com|beacons\.ai)$/,"une page de liens (Linktree)","links"],[/(^|\.)business\.site$/,"un ancien site Google (business.site)","dead"],[/(^|\.)(pagesjaunes\.fr)$/,"sa fiche PagesJaunes","dir"],[/(^|\.)(planity\.com|treatwell\.fr|doctolib\.fr|thefork\.fr|lafourchette\.com|booksy\.com)$/,"sa page de réservation en ligne","booking"],[/(^|\.)(ubereats\.com|deliveroo\.fr|just-eat\.fr)$/,"sa page de livraison","booking"],[/(^|\.)(tripadvisor\.[a-z.]+)$/,"sa page TripAdvisor","dir"],[/(^|\.)(wa\.me|whatsapp\.com)$/,"WhatsApp","social"]];
function platformOf(host){host=String(host||"").toLowerCase().replace(/^www\./,"");const p=PLATFORMS.find(([rx])=>rx.test(host));return p?[p[1],p[2]]:null}
function normalizeUrl(raw){if(!raw)return null;raw=String(raw).trim();if(!/^https?:\/\//i.test(raw))raw="https://"+raw;try{let u=new URL(raw);if(!["http:","https:"].includes(u.protocol)||!u.hostname.includes("."))return null;return u}catch(e){return null}}
const fr1=n=>Number(n).toLocaleString("fr-FR",{maximumFractionDigits:1});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function typeInfo(label){return BIZ_TYPES.find(t=>t.label===label)||BIZ_TYPES[BIZ_TYPES.length-1]}
function famOf(label){return FAMS[typeInfo(label).fam]||FAMS.service}
function distKm(a,b){if(!a||!b)return null;const R=6371,toR=x=>x*Math.PI/180;const dLa=toR(b.lat-a.lat),dLo=toR(b.lng-a.lng);const h=Math.sin(dLa/2)**2+Math.cos(toR(a.lat))*Math.cos(toR(b.lat))*Math.sin(dLo/2)**2;return 2*R*Math.asin(Math.sqrt(h))}
function norm(s){return String(s||"").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g," ").trim()}
const STOP=new Set(["le","la","les","l","de","du","des","d","et","chez","au","aux","a","the","restaurant","sarl","sas"]);
function toks(s){return norm(s).split(" ").filter(w=>w&&!STOP.has(w))}
function similar(a,b){const A=norm(a),B=norm(b);if(!A||!B)return false;if(A===B||A.includes(B)||B.includes(A))return true;const x=toks(a),y=toks(b);if(!x.length||!y.length)return false;const common=x.filter(w=>y.includes(w)).length;return common/Math.min(x.length,y.length)>=0.75}
async function copyText(t,msg){try{await navigator.clipboard.writeText(t);if(msg)toast(msg)}catch(e){prompt("Copiez le texte :",t)}}
function toast(msg){let el=$("toast");if(!el){el=document.createElement("div");el.id="toast";el.setAttribute("role","status");el.style.cssText="position:fixed;left:50%;bottom:calc(98px + env(safe-area-inset-bottom));transform:translateX(-50%);background:#17171c;color:#fff;padding:11px 16px;border-radius:12px;font-size:14px;z-index:99;box-shadow:0 6px 24px #0004;max-width:90vw;text-align:center";document.body.appendChild(el)}el.textContent=msg;el.style.display="block";clearTimeout(toast.t);toast.t=setTimeout(()=>el.style.display="none",2600)}
async function fetchJson(url,opts={},timeout=90000){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),timeout);try{const r=await fetch(url,{...opts,signal:ctl.signal});let body=null;try{body=await r.json()}catch(e){}if(!r.ok){const m=body&&body.error&&(body.error.message||body.error.status)||("HTTP "+r.status);const err=new Error(m);err.status=r.status;throw err}return body}catch(e){if(e.name==="AbortError"){const err=new Error("Délai dépassé");err.status=408;throw err}throw e}finally{clearTimeout(t)}}

/* ---------- Stockage : plusieurs clients ---------- */
const STORE="affiads-audits-v2", OLD="affiads-audit-360", SETTINGS="affiads-settings";
function blankState(){return {id:uid(),createdAt:today(),checks:{},issues:{},auto:{},notes:"",biz:{date:today()},aiTests:[],campaign:{},campaignPrompts:[],data:{},pitch:""}}
let db={current:null,audits:{}};
let settings={googleKey:"",senderName:"",senderLine:"AffiAds — Votre visibilité, notre expertise.",senderContact:""};
let state=blankState();
function loadAll(){
 try{const s=JSON.parse(localStorage.getItem(SETTINGS)||"null");if(s)settings={...settings,...s}}catch(e){}
 try{const d=JSON.parse(localStorage.getItem(STORE)||"null");if(d&&d.audits)db=d}catch(e){}
 if(!Object.keys(db.audits).length){
  try{const old=JSON.parse(localStorage.getItem(OLD)||"null");if(old){const s={...blankState(),...old};s.id=uid();db.audits[s.id]=s;db.current=s.id}}catch(e){}
 }
 if(!Object.keys(db.audits).length){const s=blankState();db.audits[s.id]=s;db.current=s.id}
 if(!db.audits[db.current])db.current=Object.keys(db.audits)[0];
 state=fixState(db.audits[db.current]);
}
function fixState(s){s=s||blankState();["checks","issues","auto","biz","campaign","data","socialAudits","socialManual"].forEach(k=>{if(!s[k]||typeof s[k]!=="object")s[k]={}});["aiTests","campaignPrompts"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[]});if(!s.id)s.id=uid();return s}
function markSaved(ok){const el=$("savedState");if(!el)return;el.textContent=ok?"✓ Enregistré":"⚠ Non enregistré";el.classList.toggle("bad",!ok)}
function persistLocal(){const ok=persistRaw();markSaved(ok);if(typeof syncSoon==="function")syncSoon();return ok}
function persistRaw(){state.updatedAt=new Date().toISOString();db.audits[state.id]=state;db.current=state.id;try{localStorage.setItem(STORE,JSON.stringify(db));return true}catch(e){
 /* Quota dépassé : on retire la capture d'écran, la plus lourde */
 try{Object.values(db.audits).forEach(a=>{if(a.data&&a.data.psi)delete a.data.psi.shot});localStorage.setItem(STORE,JSON.stringify(db));return true}catch(e2){return false}}}
function saveSettings(keepStamp){if(!keepStamp)settings.updatedAt=Date.now();try{localStorage.setItem(SETTINGS,JSON.stringify(settings))}catch(e){}if(!keepStamp&&typeof syncSoon==="function")syncSoon()}
function auditLabel(s){const d=s.biz&&s.biz.date||s.createdAt||"";return (s.biz&&s.biz.name?s.biz.name:"Nouveau client")+(s.biz&&s.biz.city?", "+s.biz.city:"")+(d?" ("+new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})+")":"")}
function renderClientSelect(){
 const isBlank=a=>!(a.biz&&a.biz.name)&&!(a.data&&a.data.fetchedAt)&&!Object.keys(a.checks||{}).length;
 const all=Object.values(db.audits).filter(a=>a.id===state.id||!isBlank(a)).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)));
 const q=norm(($("clientSearch")&&$("clientSearch").value)||"");
 const list=all.filter(a=>!q||norm((a.biz&&a.biz.name||"")+" "+(a.biz&&a.biz.city||"")).includes(q));
 
 $("clientCount").textContent=all.length+" audit"+(all.length>1?"s":"")+" enregistré"+(all.length>1?"s":"")+" sur cet appareil";
 $("clientList").innerHTML=list.length?list.map(a=>{const sc=scoreOf(a),nm=a.biz&&a.biz.name||"Nouveau client",f=(a.data&&a.data.findings||[]).length,last=a.updatedAt||a.createdAt||"",done=Object.keys(a.checks||{}).filter(k=>a.checks[k]).length,total=keys.length,st=(a.data&&a.data.fetchedAt)?"Analyse réalisée":done?"Audit en cours":"À compléter";
  return '<div class="clientrow'+(a.id===state.id?" cur":"")+'"><button class="open" data-open="'+esc(a.id)+'"><span class="tile xs"><span class="sig"></span><span class="n">'+(sc??"—")+'</span></span><span class="who"><b>'+esc(nm)+'</b><span>'+esc([a.biz&&a.biz.city,a.biz&&a.biz.date?frDate(a.biz.date):""].filter(Boolean).join(", "))+(last?" · Modifié le "+new Date(last).toLocaleDateString("fr-FR",{day:"2-digit",month:"short",year:"numeric"}):"")+" · "+st+" · "+done+"/"+total+" contrôles"+(f?" · "+f+" opportunité"+(f>1?"s":""):"")+'</span></span></button><button class="btn iconbtn del" data-del="'+esc(a.id)+'" aria-label="Supprimer '+esc(nm)+'" title="Supprimer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button></div>'}).join(""):'<p class="muted" style="padding:14px 0">'+(q?"Aucun client ne correspond à cette recherche.":"Aucun audit pour l’instant.")+'</p>';
 $("clientList").querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{switchTo(b.dataset.open);nav("auto")});
 $("clientList").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const a=db.audits[b.dataset.del];if(!a||!confirm("Supprimer définitivement l’audit « "+auditLabel(a)+" » de cet appareil ?"))return;(db.deleted=db.deleted||{})[a.id]=new Date().toISOString();delete db.audits[a.id];if(a.id===state.id){const ids=Object.keys(db.audits);state=ids.length?fixState(db.audits[ids[0]]):blankState();persistLocal();hydrate()}else{try{localStorage.setItem(STORE,JSON.stringify(db));writeDeviceBackup()}catch(e){}renderClientSelect();syncSoon()}toast("Audit supprimé.")});
}
function wOf(k){return (RECO[k]&&RECO[k][1])||2}
function wScore(ks,checks,issues){let tot=0,okw=0;ks.forEach(k=>{if(checks&&checks[k]){tot+=wOf(k);if(!(issues&&issues[k]))okw+=wOf(k)}});return tot?Math.round(okw/tot*100):null}
function scoreOf(a){return wScore(keys,a.checks,a.issues)}
function switchTo(id){read();const old=state;if(old.id!==id&&!(old.biz&&old.biz.name)&&!(old.data&&old.data.fetchedAt)&&!Object.keys(old.checks||{}).length){delete db.audits[old.id]}else persistLocal();state=fixState(db.audits[id]);db.current=id;persistLocal();hydrate()}
function hydrate(){
 fields.forEach(id=>{$(id).value=state.biz[id]??(id==="date"?today():"")});
 if(!$("type").value)$("type").value=BIZ_TYPES[0].label;
 $("notes").value=state.notes||"";
 $("autoName").value=state.biz.name||"";$("autoCity").value=state.biz.city||"";$("autoType").value=state.biz.type||BIZ_TYPES[0].label;$("autoSite").value=state.biz.site||"";$("autoKeyword").value=state.biz.keyword||"";
 ["autoType","autoKeyword"].forEach(id=>delete $(id).dataset.touched);if(state.biz.keyword)$("autoKeyword").dataset.touched="1";setPickInfo();renderPlaceChoice();closeSuggest();
 renderClientSelect();renderChecklist();update();drawAiTests();renderCampaignPrompts();renderAutoSteps(state.data.steps||[]);renderAutoSummary();$("pitchText").value=state.pitch||"";renderTools();renderKeyNotice();
 $("socUrl").value="";$("socNiche").value="";renderSocial();setReportFormat(settings.reportFormat||"one");
}

/* ---------- Checklist & score ---------- */
function read(){fields.forEach(id=>state.biz[id]=$(id).value);state.notes=$("notes").value}
function renderChecklist(){
 $("checklist").innerHTML=groups.map((g,gi)=>'<div class="group"><div class="group-head"><h3>'+esc(g.title)+'</h3><span class="pill" id="g'+gi+'">0/'+g.items.length+'</span></div><div class="checks">'+g.items.map((item,ii)=>{const k=gi+"-"+ii,a=state.auto[k];
  return '<div class="check"><input type="checkbox" id="c'+k+'" data-check="'+k+'" '+(state.checks[k]?"checked":"")+' aria-label="Vérifié : '+esc(item)+'"><label for="c'+k+'">'+esc(item)+(a?' <span class="badge b-auto">AUTO</span>':'')+'<em><input type="checkbox" data-issue="'+k+'" '+(state.issues[k]?"checked":"")+' aria-label="À améliorer : '+esc(item)+'"> À améliorer</em>'+(a?'<span class="evid">'+esc(a.evidence)+(a.source?' · '+esc(a.source):'')+'</span>':'')+'</label></div>'}).join("")+'</div></div>').join("");
 $("checklist").querySelectorAll("[data-check]").forEach(el=>el.addEventListener("change",()=>{state.checks[el.dataset.check]=el.checked;update();persistLocal()}));
 $("checklist").querySelectorAll("[data-issue]").forEach(el=>el.addEventListener("change",()=>{state.issues[el.dataset.issue]=el.checked;if(el.checked)state.checks[el.dataset.issue]=true;renderChecklist();update();persistLocal()}));
}
function calc(subset){const ks=subset||keys;let n=ks.filter(k=>state.checks[k]).length,issues=ks.filter(k=>state.issues[k]).length,bad=ks.filter(k=>state.checks[k]&&state.issues[k]).length;return {n,issues,bad,score:wScore(ks,state.checks,state.issues),pct:Math.round(n/ks.length*100)}}
function groupScores(){return groups.map((g,gi)=>({title:g.title,...calc(g.items.map((_,ii)=>gi+"-"+ii))}))}
function issuesList(){
 const out=[];groups.forEach((g,gi)=>g.items.forEach((it,ii)=>{const k=gi+"-"+ii;if(state.issues[k]){const r=RECO[k]||["Corriger ce point.",2,2,""];const t=tailor(k);out.push({k,it,group:g.title,reco:t.reco||r[0],goal:t.goal||"",impact:r[1],effort:r[2],offer:r[3],evidence:state.auto[k]&&state.auto[k].evidence,prio:r[1]*2-r[2]})}}));
 return out.sort((a,b)=>b.prio-a.prio||b.impact-a.impact);
}
/* Conseil adapté aux chiffres réels de l'audit, avec un objectif mesurable */
function tailor(k){
 const d=state.data||{},p=d.place,m=d.median||{},R=d.rankings||[],H=d.html,P=d.psi,F=(d.social&&d.social.found)||{};
 const myC=p&&p.userRatingCount,myR=p&&p.rating,o={},fa=famOf(state.biz.type);
 switch(k){
  case "0-3":o.reco="Mettre en ligne "+fa.offer+", sur la fiche Google et sur le site.";break;
  case "0-2":o.reco="Rédiger une description claire avec l’activité ("+kwOf(state.biz.type)+") et la ville, lister "+fa.offer+" et ajouter le lien de "+(fa===FAMS.build||fa===FAMS.service?"demande de devis ou de contact":"réservation, de rendez-vous ou de commande")+".";break;
  case "4-3":o.reco="Vérifier et harmoniser les fiches sur les annuaires du secteur ("+fa.dirs+"), ainsi qu’Apple Plans, Bing Places et Facebook : mêmes nom, adresse, téléphone et horaires partout.";break;
  case "2-5":if(fa.regulated){o.reco="Profession réglementée : la publicité commerciale est encadrée par la déontologie. Privilégier une communication informative (fiche Google complète, site, photos, informations pratiques) plutôt qu’une campagne publicitaire.";}else o.reco="Lancer une campagne locale test (rayon de quelques kilomètres, vidéo verticale de 15 secondes montrant "+fa.video+") pour toucher de nouveaux clients.";break;
  case "0-0":{const a=state.auto[k];if(a&&/Manquant/.test(a.evidence))o.reco="Ajouter sur la fiche Google ce qui manque ("+a.evidence.replace(/^Manquant sur la fiche : /,"").replace(/\.$/,"")+"), puis vérifier que les horaires exceptionnels (jours fériés, vacances) sont publiés.";o.goal="Fiche complète à 100 % : adresse, téléphone, horaires, site.";break}
  case "0-4":o.reco="Publier régulièrement des photos récentes et professionnelles ("+fa.photos+") et une vidéo courte.";o.goal="Au moins 10 photos récentes, puis 2 à 4 nouvelles photos par mois.";break;
  case "0-10":o.reco="Publier depuis la fiche Google des photos professionnelles récentes ("+fa.photos+") : Google met en avant les photos du propriétaire quand elles sont nombreuses et de qualité.";o.goal="Au moins 10 photos publiées par le propriétaire"+(m.ownerPhotos!=null?" (médiane des concurrents : "+m.ownerPhotos+")":"")+", renouvelées chaque mois.";break;
  case "0-5":{const parts=[];if(myC!=null&&m.count!=null&&myC<m.count){const step=Math.min(m.count,myC+50);parts.push(step<m.count?"atteindre "+step+" avis dans les 6 mois, puis se rapprocher de la médiane des concurrents ("+m.count+" avis)":"atteindre "+m.count+" avis, la médiane des concurrents, dans les 6 mois")}else if(myC!=null&&myC<50)parts.push("atteindre au moins 50 avis");if(myR!=null&&myR<4.2)parts.push("remonter la note au-dessus de 4,2/5 en traitant les critiques récurrentes");o.reco="Mettre en place une collecte d’avis régulière ("+(fa===FAMS.build||fa===FAMS.service||fa===FAMS.auto?"lien d’avis envoyé par SMS ou WhatsApp après chaque intervention, carte avec QR code laissée au client":fa===FAMS.health||fa===FAMS.legal?"QR code discret à l’accueil, sans jamais offrir de contrepartie":"QR code en caisse ou sur la table, message après la visite")+") pour augmenter le volume et la fraîcheur des avis, et répondre à chacun.";
   const rhythm=" Rythme réaliste avec une demande systématique : 6 à 10 nouveaux avis par mois.";o.goal=parts.length?parts.join(", et ").replace(/^./,c=>c.toUpperCase())+"."+rhythm:rhythm.trim();break}
  case "0-9":o.reco="Vérifier immédiatement le statut dans Google Business Profile : la fiche apparaît fermée, ce qui fait perdre la quasi-totalité des clients venant de Google.";o.goal="Fiche affichée « Ouvert » dès cette semaine.";break;
  case "0-8":o.reco="Vérifier si la fiche au nom proche est un doublon. Si oui, demander sa fusion ou sa suppression à Google depuis Google Business Profile ; sinon, rien à faire.";break;
  case "1-0":o.reco=normalizeUrl(state.biz.site)?"Rendre le site lisible sur téléphone (balise viewport, mise en page adaptée), car la majorité des visites locales se font sur mobile.":"Créer un site mobile simple d’une à trois pages : infos pratiques, "+ fa.offer+", photos, bouton d’appel, itinéraire et liens vers les réseaux. Puis l’indiquer sur la fiche Google.";o.goal=normalizeUrl(state.biz.site)?"Site validé « adapté aux mobiles ».":"Site en ligne et relié à la fiche Google.";break;
  case "1-1":if(P)o.goal="Passer de "+(P.scores.perf??"—")+"/100 à 70/100 ou plus en performance mobile, avec un contenu principal affiché en moins de 2,5 s (actuellement "+(P.lab.lcp||"—")+").";break;
  case "1-3":if(H){const miss=[!H.tel.length&&"bouton d’appel cliquable",!H.whatsapp&&"WhatsApp",!H.booking.length&&(fa===FAMS.build||fa===FAMS.service||fa===FAMS.legal?"demande de devis ou de rendez-vous en ligne":fa===FAMS.health||fa===FAMS.beauty?"prise de rendez-vous en ligne":"réservation ou commande en ligne")].filter(Boolean);o.reco="Ajouter en haut de la page d’accueil, visible sur téléphone : "+miss.join(", ")+".";}o.goal="Un client peut appeler ou réserver en un seul geste depuis la page d’accueil.";break;
  case "1-4":{const a=state.auto[k];if(a&&/à corriger : /.test(a.evidence))o.reco="À corriger sur la page d’accueil : "+a.evidence.split("à corriger : ")[1].replace(/\.$/,"")+". Formule conseillée pour le titre : « "+(state.biz.name||"Nom")+" – "+kwOf(state.biz.type)+" à "+(state.biz.city||"Ville")+" ».";break}
  case "1-8":o.goal="Pixel Meta et Google Analytics actifs, avec bannière de consentement, avant la première campagne.";break;
  case "2-0":{const miss=["Instagram","Facebook"].filter(n=>!F[n]);if(miss.length&&d.social)o.reco=(miss.length===2?"Aucun compte Facebook ni Instagram n’a été trouvé : ":"Compte "+miss[0]+" non trouvé : ")+"créer ou relier "+(miss.length===2?"les comptes":"le compte")+" avec le même nom, le même logo, l’adresse, les horaires et le lien vers le site, puis les relier depuis le site et la fiche Google.";o.goal="Comptes actifs, reliés depuis le site et la fiche Google.";break}
  case "2-2":case "2-6":o.reco=k==="2-6"?"Publier chaque semaine une vidéo verticale courte (Reels, TikTok, YouTube Shorts), par exemple "+fa.video+" : c’est le format le plus vu en 2026.":"Planifier deux à trois publications par semaine : coulisses, "+fa.video+", avis clients, nouveautés.";o.goal="2 à 3 publications par semaine, dont au moins une vidéo verticale.";break;
  case "3-3":if(m.count!=null||m.rating!=null)o.goal="Rattraper la médiane des concurrents visibles : "+(m.rating!=null?fr1(m.rating)+"/5":"")+(m.count!=null?" et "+m.count+" avis":"")+".";break;
  case "3-5":{const miss=R.filter(r=>!r.rank||r.rank>3);if(miss.length)o.reco="Travailler la pertinence de la fiche sur "+miss.map(r=>"« "+r.query+" » ("+(r.rank?"n° "+r.rank:"absent")+")").join(", ")+" : catégories exactes, description avec l’activité et la ville, photos et avis récents qui citent l’activité.";o.goal="Entrer dans le top 3 sur ces recherches"+(d.grid?" et depuis au moins 6 des 9 points de la carte (actuellement "+d.grid.top3+")":"")+". Résultat à mesurer à 3 mois, sans garantie de position.";break}
  case "3-6":o.reco="Créer et compléter la fiche Bing Places (import possible depuis Google), et soigner les annuaires que Bing met en avant pour ce métier ("+fa.dirs+") : Bing alimente aussi DuckDuckGo et Copilot.";o.goal="Fiche Bing Places active et commerce visible en recherchant son nom sur Bing.";break;
 }
 return o;
}
function prioLabel(p){return p.impact>=3&&p.effort<=1?["Gain rapide","b-ok"]:p.prio>=4?["Priorité haute","b-bad"]:p.prio>=2?["Priorité moyenne","b-mid"]:["À planifier","b-auto"]}
function scoreColor(s){return s===null?"":s>=85?"good":s>=60?"mid":"bad"}
function update(){
 read();const c=calc();
 $("mDone").innerHTML=c.pct+"%<small>Audit complété</small>";$("mIssues").innerHTML=c.issues+"<small>Points à améliorer</small>";$("mScore").innerHTML=(c.score===null?"—":c.score)+"<small>Score indicatif</small>";$("mChecks").innerHTML=c.n+"<small>Contrôles effectués</small>";
 $("gaugeHome").innerHTML=gauge(c.score);$("count").textContent=c.n+" / "+keys.length+" vérifiés";
 $("scoreText").textContent=c.score===null?"Lancez l’audit automatique ou cochez les contrôles pour calculer un indicateur.":c.score>=85?"Bon résultat sur les éléments évalués ; traitez les points signalés.":c.score>=60?"Des améliorations sont à prioriser.":"Plusieurs points évalués restent à améliorer.";
 groups.forEach((g,gi)=>{let n=g.items.filter((_,ii)=>state.checks[gi+"-"+ii]).length;let el=$("g"+gi);if(el)el.textContent=n+"/"+g.items.length});
 $("catBars").innerHTML=groupScores().map(g=>'<div class="catbar">'+esc(g.title)+' — <b>'+(g.score===null?"non évalué":g.score+"/100")+'</b><div class="bar"><div class="s-'+(scoreColor(g.score)||"good")+'" style="width:'+(g.score||0)+'%"></div></div></div>').join("");
 const probs=issuesList();
 $("priorityList").innerHTML=probs.length?probs.slice(0,6).map(p=>{const l=prioLabel(p);return '<div class="priority"><b>'+esc(p.it)+' <span class="badge '+l[1]+'">'+l[0]+'</span></b><small>'+esc(p.reco)+'</small></div>'}).join("")+(probs.length>6?'<p class="muted">+ '+(probs.length-6)+' autre(s) dans le rapport.</p>':""):"Aucun problème signalé pour le moment.";
 renderReport();
}

/* ---------- Clé Google ---------- */
function keyLooksValid(k){return /^AIza[0-9A-Za-z_\-]{30,}$/.test(String(k||"").trim())}
function hasKey(){return keyLooksValid(settings.googleKey)}
const WRONG_KEY_MSG="Ce n’est pas une clé API Google Maps : une bonne clé commence par « AIza ». Celle-ci ressemble à un identifiant Vertex AI ou Gemini, refusé par Places API. Créez une « Clé API » dans Google Cloud → Identifiants (voir l’aide ci-dessous).";
function renderKeyNotice(){
 $("keyNotice").innerHTML=hasKey()?'<span class="badge b-ok">Mode complet</span> Fiche Google, avis, concurrents, positions et vitesse comparée inclus.':'<span class="badge b-ok">Gratuit</span> Site, réseaux, concurrents à proximité et IA analysés sans clé. <a href="#" data-goto="settings">Ajouter les avis Google</a>';
 const a=$("keyNotice").querySelector("[data-goto]");if(a)a.onclick=e=>{e.preventDefault();nav("settings")};
 $("googleKey").value=settings.googleKey||"";
 $("keyStatus").innerHTML=hasKey()?'<span class="keyok">Clé enregistrée dans ce navigateur.</span>':(settings.googleKey?'<span class="keybad">✕ '+esc(WRONG_KEY_MSG)+'</span>':'Aucune clé enregistrée : l’appli fonctionne en mode gratuit.');
}

/* ---------- Sources de données ---------- */
const PLACE_FIELDS=["places.id","places.displayName","places.formattedAddress","places.location","places.rating","places.userRatingCount","places.websiteUri","places.nationalPhoneNumber","places.internationalPhoneNumber","places.regularOpeningHours","places.businessStatus","places.primaryType","places.primaryTypeDisplayName","places.types","places.googleMapsUri","places.photos","places.reviews","places.editorialSummary","places.priceLevel","places.reservable","places.delivery","places.takeout","places.dineIn"].join(",");
const RANK_FIELDS="places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.googleMapsUri,places.websiteUri,places.primaryTypeDisplayName,places.photos";
async function placesSearch(textQuery,fieldMask,size,bias,radius){
 const body={textQuery,languageCode:"fr",regionCode:"FR",pageSize:size};
 if(bias)body.locationBias={circle:{center:{latitude:bias.lat,longitude:bias.lng},radius:radius||15000}};
 const opts=b=>({method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":settings.googleKey.trim(),"X-Goog-FieldMask":fieldMask},body:JSON.stringify(b)});
 try{return (await fetchJson("https://places.googleapis.com/v1/places:searchText",opts(body),30000)).places||[]}
 catch(e){if(e.status===400){const b2={textQuery,languageCode:"fr",regionCode:"FR",maxResultCount:size};return (await fetchJson("https://places.googleapis.com/v1/places:searchText",opts(b2),30000)).places||[]}throw e}
}
function pickPlace(list,name,city){if(!list.length)return null;const ok=list.find(p=>similar(p.displayName&&p.displayName.text,name)&&(!city||norm(p.formattedAddress).includes(norm(city))));return ok||list.find(p=>similar(p.displayName&&p.displayName.text,name))||list[0]}
async function nominatimCity(city){
 const r=await fetchJson("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=fr,be,ch,lu,mc&accept-language=fr&q="+encodeURIComponent(city),{},20000);
 return r&&r[0]?{lat:+r[0].lat,lng:+r[0].lon,label:r[0].display_name}:null;
}
const OVERPASS=["https://overpass-api.de/api/interpreter","https://overpass.kumi.systems/api/interpreter","https://overpass.private.coffee/api/interpreter"];
async function overpass(q){
 const jobs=OVERPASS.map(u=>fetchJson(u,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)},35000));
 try{return await Promise.any(jobs)}catch(e){const err=new Error("serveurs OpenStreetMap saturés");err.status=408;throw err}
}
/* Fiche OpenStreetMap du commerce : rapide via Nominatim (par identifiant, sinon par nom + ville) */
async function osmMe(name,city){
 const pick=state.biz.osmPick;let r=null;
 if(pick&&pick.osmType&&pick.osmId){r=await fetchJson("https://nominatim.openstreetmap.org/lookup?format=jsonv2&extratags=1&addressdetails=1&accept-language=fr&osm_ids="+encodeURIComponent(String(pick.osmType).charAt(0).toUpperCase()+pick.osmId),{},15000);r=r&&r[0]}
 if(!r){const l=await fetchJson("https://nominatim.openstreetmap.org/search?format=jsonv2&extratags=1&addressdetails=1&limit=5&accept-language=fr&countrycodes=fr,be,ch,lu,mc&q="+encodeURIComponent(name+", "+city),{},15000);r=(l||[]).find(x=>similar(x.name||x.display_name,name))||null}
 if(!r)return null;
 const a=r.address||{},t={...(r.extratags||{})};
 t["addr:housenumber"]=t["addr:housenumber"]||a.house_number;t["addr:street"]=t["addr:street"]||a.road;t["addr:postcode"]=t["addr:postcode"]||a.postcode;t["addr:city"]=t["addr:city"]||a.city||a.town||a.village;
 return {name:r.name||name,tags:t,loc:{lat:+r.lat,lng:+r.lon},url:"https://www.openstreetmap.org/"+(r.osm_type||"node")+"/"+r.osm_id};
}
function rxEscape(s){return s.replace(/[.*+?^${}()|[\]\\"]/g,"\\$&")}
const ACC={a:"[aàâä]",e:"[eéèêë]",i:"[iîï]",o:"[oôö]",u:"[uùûü]",c:"[cç]",y:"[yÿ]"};
function rxWord(w){return w.split("").map(ch=>ACC[ch]||rxEscape(ch)).join("")}
async function osmLookup(name,center,type,light){
 let meN=null;try{meN=await osmMe(name,state.biz.city||"")}catch(e){if(light)throw e}
 if(light)return {me:meN,competitors:[]};
 if(meN&&meN.loc&&meN.loc.lat)center=meN.loc;
 const words=norm(name).split(" ").filter(w=>w.length>2).slice(0,4);
 const pat=words.length?words.map(rxWord).join(".*"):rxEscape(name);
 const filt=typeInfo(type).osm;
 const q='[out:json][timeout:25];(nwr["name"~"'+pat+'",i](around:10000,'+center.lat+','+center.lng+'););out center tags 10;'+(filt?'(nwr'+filt+'["name"](around:2500,'+center.lat+','+center.lng+'););out center tags 40;':'');
 let r;try{r=await overpass(q)}catch(e){if(meN)return {me:meN,competitors:[],compError:e.message};throw e}
 const els=(r&&r.elements)||[];
 const pos=e=>({lat:e.lat??(e.center&&e.center.lat),lng:e.lon??(e.center&&e.center.lon)});
 const matches=els.filter(e=>e.tags&&e.tags.name&&similar(e.tags.name,name));
 const meO=matches[0]||null;const me=meO;
 const comp=filt?els.filter(e=>e!==me&&e.tags&&e.tags.name&&!similar(e.tags.name,name)):[];
 const seen=new Set();const competitors=comp.filter(e=>{const k=norm(e.tags.name);if(seen.has(k))return false;seen.add(k);return true}).map(e=>({name:e.tags.name,website:e.tags.website||e.tags["contact:website"]||"",loc:pos(e),src:"OSM"}));
 const meOut=meO?{name:meO.tags.name,tags:{...(meN&&meN.tags||{}),...meO.tags},loc:pos(meO),url:"https://www.openstreetmap.org/"+meO.type+"/"+meO.id}:meN;
 return {me:meOut,competitors};
}
function parseLhr(lh,loadingExperience,url,via){
 lh=lh||{};const cat=lh.categories||{},au=lh.audits||{};
 const sc=k=>cat[k]&&cat[k].score!=null?Math.round(cat[k].score*100):null;
 const pass=k=>{const x=au[k];if(!x||["error","manual"].includes(x.scoreDisplayMode))return null;if(x.scoreDisplayMode==="notApplicable")return true;return x.score===null?null:x.score>=0.9};
 const disp=k=>au[k]&&au[k].displayValue||"";
 const field=(loadingExperience&&loadingExperience.metrics)||{};
 const fm=k=>field[k]?{p75:field[k].percentile,cat:field[k].category}:null;
 let entities=((au["third-party-summary"]&&au["third-party-summary"].details&&au["third-party-summary"].details.items)||[]).map(i=>i.entity&&(i.entity.text||i.entity)).filter(Boolean).map(String);
 if(!entities.length&&Array.isArray(lh.entities))entities=lh.entities.filter(e=>!e.isFirstParty).map(e=>e.name).filter(Boolean);
 const tracking=[...new Set(TRACKERS.filter(t=>entities.some(e=>e.toLowerCase().includes(t[0].toLowerCase()))).map(t=>t[1]))];
 const shotData=au["final-screenshot"]&&au["final-screenshot"].details&&au["final-screenshot"].details.data||"";
 return {url:lh.finalDisplayedUrl||lh.finalUrl||url,requested:url,fetchedAt:nowLabel(),via,scores:{perf:sc("performance"),a11y:sc("accessibility"),bp:sc("best-practices"),seo:sc("seo")},
  lab:{lcp:disp("largest-contentful-paint"),fcp:disp("first-contentful-paint"),tbt:disp("total-blocking-time"),cls:disp("cumulative-layout-shift"),si:disp("speed-index"),lcpMs:au["largest-contentful-paint"]&&au["largest-contentful-paint"].numericValue},
  field:{lcp:fm("LARGEST_CONTENTFUL_PAINT_MS"),inp:fm("INTERACTION_TO_NEXT_PAINT"),cls:fm("CUMULATIVE_LAYOUT_SHIFT_SCORE"),overall:loadingExperience&&loadingExperience.overall_category||null},
  audits:{https:pass("is-on-https"),viewport:pass("viewport"),title:pass("document-title"),meta:pass("meta-description"),crawlable:pass("is-crawlable"),status:pass("http-status-code"),alt:pass("image-alt"),links:pass("link-text"),canonical:pass("canonical"),robots:pass("robots-txt")},
  entities,tracking,shot:shotData.length<400000?shotData:""};
}
/* Google PageSpeed (clé facultative), puis Microlink Lighthouse en secours gratuit */
async function pageSpeed(url,cats){
 let api="https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&locale=fr&url="+encodeURIComponent(url);
 (cats||["performance","accessibility","best-practices","seo"]).forEach(c=>api+="&category="+c);
 if(hasKey())api+="&key="+encodeURIComponent(settings.googleKey.trim());
 try{const r=await fetchJson(api,{},120000);return parseLhr(r.lighthouseResult,r.loadingExperience,url,"Google PageSpeed Insights")}
 catch(e){
  if(cats&&cats.length===1&&!hasKey())throw e;
  const ml=await fetchJson("https://api.microlink.io/?url="+encodeURIComponent(url)+"&meta=false&insights.technologies=false&insights.lighthouse=true",{},120000);
  const lh=ml&&ml.data&&ml.data.insights&&ml.data.insights.lighthouse;if(!lh)throw new Error((ml&&ml.message)||e.message);
  return parseLhr(lh,null,url,"Lighthouse via Microlink");
 }
}
/* Microlink : capture d'écran mobile et technologies (Wappalyzer), sans clé */
async function microlinkShot(url){
 const r=await fetchJson("https://api.microlink.io/?url="+encodeURIComponent(url)+"&meta=false&screenshot=true&insights.technologies=true&insights.lighthouse=false&viewport.isMobile=true&viewport.width=390&viewport.height=844&viewport.deviceScaleFactor=1",{},60000);
 const d=r&&r.data||{};
 return {shot:d.screenshot&&d.screenshot.url||"",tech:((d.insights&&d.insights.technologies)||[]).map(t=>({name:t.name,cat:(t.categories||[])[0]||""}))};
}
/* RDAP : date d'enregistrement du nom de domaine */
async function domainInfo(host){
 const dom=host.replace(/^www\./,"");
 const r=await fetchJson("https://rdap.org/domain/"+encodeURIComponent(dom),{},20000);
 const ev=k=>((r.events||[]).find(e=>e.eventAction===k)||{}).eventDate||"";
 return {domain:dom,created:ev("registration"),expires:ev("expiration")};
}
/* Lecture du HTML du site : Jina Reader (rendu complet), puis AllOrigins en secours */
async function fetchText(url,opts,timeout){const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),timeout||40000);try{const r=await fetch(url,{...(opts||{}),signal:ctl.signal});if(!r.ok){const e=new Error("HTTP "+r.status);e.status=r.status;throw e}return await r.text()}finally{clearTimeout(t)}}
async function fetchHtml(url){
 const tries=[()=>fetchText("https://r.jina.ai/"+url,{headers:{"X-Return-Format":"html","X-Timeout":"25"}},45000),()=>fetchText("https://api.allorigins.win/raw?url="+encodeURIComponent(url),{},30000)];
 let last;for(const f of tries){try{const t=await f();if(t&&t.length>200&&/<(html|head|body)[\s>]/i.test(t))return t;last=new Error("page vide ou illisible")}catch(e){last=e}}
 throw last||new Error("page illisible");
}
const SOCIAL_RX=[["Facebook",/(^|\.)facebook\.com$|(^|\.)fb\.com$/],["Instagram",/(^|\.)instagram\.com$/],["TikTok",/(^|\.)tiktok\.com$/],["YouTube",/(^|\.)youtube\.com$|(^|\.)youtu\.be$/],["LinkedIn",/(^|\.)linkedin\.com$/],["X / Twitter",/(^|\.)(twitter|x)\.com$/],["Pinterest",/(^|\.)pinterest\.[a-z]+$/],["Snapchat",/(^|\.)snapchat\.com$/]];
const BOOKING_RX=/booksy|kiute|maiia|keldoc|rdvmedicaux|resalib|setmore|acuityscheduling|squareup\.com\/appointments|wecasa|habitatpresto|vroomly|idgarages|ornikar|thefork|lafourchette|zenchef|resy\.com|sevenrooms|guestonline|planity|treatwell|calendly|doctolib|booking\.com|airbnb|ubereats|deliveroo|just-?eat|bookingpage|tablebooker|mybusinessplanner|kalendes|simplybook|resengo|covermanager|opentable/i;
const TRACK_RX=[["Pixel Meta",/connect\.facebook\.net|fbq\(/],["Google Tag Manager",/googletagmanager\.com\/gtm|GTM-[A-Z0-9]{4,}/],["Google Analytics",/googletagmanager\.com\/gtag|google-analytics\.com|gtag\(/],["Pixel TikTok",/analytics\.tiktok\.com|ttq\.load/],["Microsoft Clarity",/clarity\.ms/],["Hotjar",/hotjar\.com/],["Google Ads",/googleadservices|AW-[0-9]{6,}/]];
const CMS_RX=[["Wix",/wix\.com|_wixCssImports|wixstatic/i],["WordPress",/wp-content|wp-includes/i],["Shopify",/cdn\.shopify|Shopify\.theme/i],["Squarespace",/squarespace/i],["Webflow",/webflow/i],["Jimdo",/jimdo/i],["PrestaShop",/prestashop/i],["Google Sites",/sites\.google/i],["Site.pro / SitW",/site123|sitew/i]];
function analyzeHtml(html,pageUrl,ctx){
 const doc=new DOMParser().parseFromString(html,"text/html");
 const q=s=>doc.querySelector(s),attr=(s,a)=>{const e=q(s);return e?(e.getAttribute(a)||"").trim():""};
 const title=(q("title")&&q("title").textContent||"").trim();
 const metaDesc=attr('meta[name="description" i]',"content");
 const h1s=[...doc.querySelectorAll("h1")].map(h=>h.textContent.replace(/\s+/g," ").trim()).filter(Boolean);
 const viewport=!!q('meta[name="viewport" i]');
 const ogImage=attr('meta[property="og:image"]',"content");
 const generator=attr('meta[name="generator" i]',"content");
 const ldTypes=new Set();
 doc.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{try{const walk=o=>{if(!o||typeof o!=="object")return;if(Array.isArray(o))return o.forEach(walk);const t=o["@type"];(Array.isArray(t)?t:[t]).filter(Boolean).forEach(x=>ldTypes.add(String(x)));if(o["@graph"])walk(o["@graph"])};walk(JSON.parse(s.textContent))}catch(e){}});
 const base=(()=>{try{return new URL(pageUrl)}catch(e){return null}})();
 const links=[...doc.querySelectorAll("a[href]")].map(a=>({href:(a.getAttribute("href")||"").trim(),text:a.textContent.replace(/\s+/g," ").trim()}));
 const socials=[];const seen=new Set();
 links.forEach(l=>{let u;try{u=new URL(l.href,base||undefined)}catch(e){return}if(/sharer|share\?|intent\/tweet|\/share$/i.test(u.href))return;const s=SOCIAL_RX.find(([,rx])=>rx.test(u.hostname));if(s&&!seen.has(s[0])&&u.pathname.length>1){seen.add(s[0]);socials.push({net:s[0],url:u.href})}});
 const tel=links.filter(l=>/^tel:/i.test(l.href)).map(l=>l.href.slice(4));
 const whatsapp=links.some(l=>/wa\.me|whatsapp/i.test(l.href));
 const booking=[...new Set(links.filter(l=>BOOKING_RX.test(l.href)||/r[ée]serv|commander|prendre rendez|rendez-vous en ligne|devis|book now|order/i.test(l.text)).map(l=>{try{return new URL(l.href,base||undefined).hostname.replace(/^www\./,"")}catch(e){return l.text}}))].slice(0,4);
 const tracking=TRACK_RX.filter(([,rx])=>rx.test(html)).map(([n])=>n);
 const cms=generator||((CMS_RX.find(([,rx])=>rx.test(html))||[])[0]||"");
 const imgs=[...doc.querySelectorAll("img")];const noAlt=imgs.filter(i=>!i.hasAttribute("alt")||!i.getAttribute("alt").trim()).length;
 const text=(doc.body&&doc.body.textContent||"").replace(/\s+/g," ");
 const digits=text.replace(/\D/g,"");
 const phoneOnSite=ctx&&ctx.phone?digits.includes(String(ctx.phone).replace(/\D/g,"").slice(-9)):null;
 const cityOnSite=ctx&&ctx.city?norm(text).includes(norm(ctx.city)):null;
 const hoursOnSite=/horaires|lundi|mardi|mercredi|ouvert du|ouverture/i.test(text);
 const addressOnSite=/\b\d{5}\b/.test(text);
 const menuOnSite=/\b(menu|carte|nos plats|tarifs?|prestations|nos services)\b/i.test(links.map(l=>l.text).join(" ")+" "+text.slice(0,4000))||/\d+[,.]?\d*\s?€/.test(text);
 const years=[...text.matchAll(/(?:©|copyright)\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)].map(m=>+m[1]).filter(y=>y>1995&&y<=new Date().getFullYear());
 const copyrightYear=years.length?Math.max(...years):null;
 const words=text.split(" ").filter(w=>w.length>2).length;
 const mixed=(html.match(/\ssrc=["']http:\/\//gi)||[]).length;
 return {title,metaDesc,h1s,viewport,ogImage:!!ogImage,ldTypes:[...ldTypes],socials,tel:[...new Set(tel)],whatsapp,booking,tracking,cms,imgs:imgs.length,noAlt,phoneOnSite,cityOnSite,hoursOnSite,addressOnSite,menuOnSite,copyrightYear,words,mixed,fetchedAt:nowLabel()};
}
const LOCAL_TYPES=/LocalBusiness|Restaurant|FoodEstablishment|Bakery|CafeOrCoffeeShop|BarOrPub|Store|HairSalon|BeautySalon|DaySpa|HealthAndBeautyBusiness|Hotel|LodgingBusiness|AutoRepair|AutomotiveBusiness|HomeAndConstructionBusiness|Plumber|Electrician|HousePainter|ProfessionalService|MedicalBusiness|Organization/;

/* ---------- Recherche assistée : suggestions et choix exact du commerce ---------- */
const DETAIL_FIELDS=PLACE_FIELDS.split(",").map(f=>f.replace(/^places\./,"")).join(",");
const G_TYPE_MAP=[
 [/^(pizza_restaurant|fast_food_restaurant|sandwich_shop|hamburger_restaurant|kebab_shop|meal_takeaway)$/,"Pizzeria / restauration rapide"],
 [/^(catering_service|caterer)$/,"Traiteur"],
 [/(^|_)restaurant$|meal_delivery|brunch|diner|steak_house|food_court/,"Restaurant"],
 [/^(cafe|bar|pub|wine_bar|coffee_shop|cocktail_bar|tea_house|night_club|cafeteria|juice_shop)$/,"Café / bar"],
 [/^(bakery|pastry_shop|confectionery|dessert_shop|chocolate_shop)$/,"Boulangerie"],
 [/^(butcher_shop|deli)$/,"Boucherie / charcuterie"],
 [/^(liquor_store|wine_store)$/,"Caviste"],
 [/^(convenience_store|grocery_store|supermarket|food_store|market|health_food_store|asian_grocery_store)$/,"Commerce de proximité"],
 [/^barber_shop$/,"Barbier"],
 [/^(hair_salon|hair_care)$/,"Salon / beauté"],
 [/^(beauty_salon|nail_salon|beautician|makeup_artist|tanning_studio|skin_care_clinic)$/,"Institut de beauté / ongles"],
 [/^(spa|massage|wellness_center|sauna)$/,"Santé / bien-être"],
 [/^(gym|fitness_center|yoga_studio|pilates_studio|sports_coaching)$/,"Salle de sport / coach"],
 [/^(dentist|dental_clinic)$/,"Dentiste"],
 [/^(pharmacy|drugstore)$/,"Pharmacie"],
 [/^(physiotherapist|chiropractor)$/,"Kinésithérapeute / ostéopathe"],
 [/^(doctor|medical_clinic|medical_center|general_practitioner|medical_lab)$/,"Médecin"],
 [/^veterinary_care$/,"Vétérinaire"],
 [/^(optician|eye_care_center)$/,"Opticien"],
 [/^(plumber|hvac_contractor)$/,"Plombier / chauffagiste"],
 [/^electrician$/,"Électricien"],
 [/^painter$/,"Peintre / façadier"],
 [/^(roofing_contractor|general_contractor|carpenter)$/,"Maçon / rénovation"],
 [/^locksmith$/,"Serrurier"],
 [/^(landscaper|gardener)$/,"Paysagiste"],
 [/^moving_company$/,"Déménageur"],
 [/^florist$/,"Fleuriste"],
 [/^(pet_store|pet_care|pet_groomer)$/,"Animalerie / toiletteur"],
 [/^(furniture_store|home_goods_store)$/,"Magasin de meubles / déco"],
 [/^real_estate_agency$/,"Agence immobilière"],
 [/^driving_school$/,"Auto-école"],
 [/^(photographer|photography_studio)$/,"Photographe"],
 [/^(laundry|dry_cleaner|shoe_repair)$/,"Pressing / cordonnerie"],
 [/^(lawyer|accounting|notary_public)$/,"Avocat / notaire / comptable"],
 [/^tattoo/,"Tatoueur"],
 [/^(car_repair|car_dealer|car_wash|auto_parts_store|car_rental|tire_shop)$/,"Garage / auto"],
 [/^taxi_service$/,"Taxi / VTC"],
 [/^(bed_and_breakfast|guest_house|cottage|farmstay|campground|private_guest_room)$/,"Gîte / chambre d’hôtes"],
 [/^(lodging|hotel|motel|hostel|inn|resort_hotel)$/,"Hôtel / hébergement"],
 [/^(amusement_center|bowling_alley|tourist_attraction|adventure_sports_center|water_park|amusement_park)$/,"Loisirs / activités"],
 [/^(clothing_store|shoe_store|jewelry_store|gift_shop|book_store|sporting_goods_store|electronics_store|store|shopping_mall)$/,"Boutique / mode"]];
function typeFromGoogle(types){for(const t of types||[])for(const [rx,label] of G_TYPE_MAP)if(rx.test(t))return label;return null}
const OSM_MAP=[["amenity",/^(restaurant|food_court)$/,"Restaurant"],["amenity",/^(fast_food)$/,"Pizzeria / restauration rapide"],["amenity",/^(cafe|bar|pub|biergarten)$/,"Café / bar"],["shop",/^(bakery|pastry|confectionery)$/,"Boulangerie"],["shop",/^(butcher|deli)$/,"Boucherie / charcuterie"],["craft",/^caterer$/,"Traiteur"],["shop",/^(wine|alcohol)$/,"Caviste"],["shop",/^(convenience|supermarket|greengrocer|cheese|farm)$/,"Commerce de proximité"],["shop",/^hairdresser$/,"Salon / beauté"],["shop",/^(beauty|cosmetics)$/,"Institut de beauté / ongles"],["shop",/^tattoo$/,"Tatoueur"],["leisure",/^(spa|sauna)$/,"Santé / bien-être"],["leisure",/^(fitness_centre|sports_centre)$/,"Salle de sport / coach"],["amenity",/^(doctors|clinic)$/,"Médecin"],["healthcare",/^(physiotherapist|osteopath)$/,"Kinésithérapeute / ostéopathe"],["amenity",/^dentist$/,"Dentiste"],["amenity",/^pharmacy$/,"Pharmacie"],["amenity",/^veterinary$/,"Vétérinaire"],["shop",/^optician$/,"Opticien"],["shop",/^florist$/,"Fleuriste"],["shop",/^(pet|pet_grooming)$/,"Animalerie / toiletteur"],["shop",/^(furniture|interior_decoration)$/,"Magasin de meubles / déco"],["craft",/^(plumber|hvac)$/,"Plombier / chauffagiste"],["craft",/^electrician$/,"Électricien"],["craft",/^painter$/,"Peintre / façadier"],["craft",/^(builder|carpenter|roofer|tiler|stonemason)$/,"Maçon / rénovation"],["shop",/^locksmith$/,"Serrurier"],["craft",/^gardener$/,"Paysagiste"],["office",/^estate_agent$/,"Agence immobilière"],["amenity",/^driving_school$/,"Auto-école"],["craft",/^photographer$/,"Photographe"],["shop",/^(dry_cleaning|laundry|shoe_repair)$/,"Pressing / cordonnerie"],["office",/^(lawyer|notary|accountant)$/,"Avocat / notaire / comptable"],["shop",/^(car_repair|car|tyres|car_parts)$/,"Garage / auto"],["amenity",/^taxi$/,"Taxi / VTC"],["tourism",/^(hotel|motel|hostel)$/,"Hôtel / hébergement"],["tourism",/^(guest_house|chalet|apartment|camp_site)$/,"Gîte / chambre d’hôtes"],["craft",/./,"Artisan / dépannage"],["shop",/./,"Boutique / mode"]];
function typeFromOsm(key,val){const v=String(val||"");const m=OSM_MAP.find(([k,rx])=>k===key&&rx.test(v));return m?m[2]:null}
function kwOf(label){const t=typeInfo(label);if(t.kw)return t.kw;const c=state&&state.biz&&state.biz.activity;return c?String(c).toLowerCase():"commerce"}
function artOf(label){return typeInfo(label).f?"une ":"un "}
function bestOf(label){return typeInfo(label).f?"meilleure ":"meilleur "}
function defaultKeywords(label){const k=typeInfo(label).kw;return k?k+", "+bestOf(label)+k:""}
function applyDetectedType(label){if(!label||$("autoType").dataset.touched)return;$("autoType").value=label;if(!$("autoKeyword").dataset.touched)$("autoKeyword").value=defaultKeywords(label)}
let sessionToken=uid(),suggestTimer=null,suggestItems=[],suggestIdx=-1,suggestSeq=0;
/* ---------- Registre des entreprises (SIRENE, API publique de l'État, sans clé) : activité et date d'ouverture ---------- */
const NAF={"56.10A":["Restauration traditionnelle","Restaurant"],"56.10B":["Cafétéria","Restaurant"],"56.10C":["Restauration rapide","Pizzeria / restauration rapide"],"56.21Z":["Traiteur","Traiteur"],"56.30Z":["Débit de boissons (bar, café)","Café / bar"],"10.71C":["Boulangerie-pâtisserie","Boulangerie"],"10.71D":["Pâtisserie","Boulangerie"],"47.24Z":["Boulangerie, pâtisserie (vente)","Boulangerie"],"10.13B":["Charcuterie","Boucherie / charcuterie"],"47.22Z":["Boucherie, charcuterie","Boucherie / charcuterie"],"47.25Z":["Caviste (boissons)","Caviste"],"47.11B":["Supérette, alimentation générale","Commerce de proximité"],"47.11C":["Supérette","Commerce de proximité"],"47.11D":["Supermarché","Commerce de proximité"],"47.29Z":["Alimentation spécialisée","Commerce de proximité"],"47.21Z":["Primeur (fruits et légumes)","Commerce de proximité"],"96.02A":["Coiffure","Salon / beauté"],"96.02B":["Soins de beauté","Institut de beauté / ongles"],"96.04Z":["Entretien corporel (spa, bien-être)","Santé / bien-être"],"96.09Z":["Autres services personnels","Autre commerce"],"93.13Z":["Salle de sport, fitness","Salle de sport / coach"],"93.11Z":["Installation sportive","Salle de sport / coach"],"85.51Z":["Enseignement sportif, coaching","Salle de sport / coach"],"86.21Z":["Médecin généraliste","Médecin"],"86.22C":["Médecin spécialiste","Médecin"],"86.23Z":["Dentiste","Dentiste"],"86.90E":["Kinésithérapie, rééducation","Kinésithérapeute / ostéopathe"],"86.90F":["Santé humaine (paramédical)","Kinésithérapeute / ostéopathe"],"47.73Z":["Pharmacie","Pharmacie"],"75.00Z":["Vétérinaire","Vétérinaire"],"47.78A":["Opticien","Opticien"],"47.71Z":["Habillement","Boutique / mode"],"47.72A":["Chaussures","Boutique / mode"],"47.77Z":["Bijouterie, horlogerie","Boutique / mode"],"47.76Z":["Fleuriste, animalerie","Fleuriste"],"47.59A":["Meubles","Magasin de meubles / déco"],"47.59B":["Équipement du foyer","Magasin de meubles / déco"],"43.22A":["Plomberie (eau, gaz)","Plombier / chauffagiste"],"43.22B":["Chauffage, climatisation","Plombier / chauffagiste"],"43.21A":["Électricité (bâtiment)","Électricien"],"43.34Z":["Peinture et vitrerie","Peintre / façadier"],"43.99C":["Maçonnerie","Maçon / rénovation"],"41.20A":["Construction de maisons","Maçon / rénovation"],"41.20B":["Construction de bâtiments","Maçon / rénovation"],"43.32A":["Menuiserie","Maçon / rénovation"],"43.32B":["Menuiserie métallique, serrurerie","Serrurier"],"43.91B":["Couverture","Maçon / rénovation"],"43.33Z":["Revêtement des sols et murs","Maçon / rénovation"],"43.39Z":["Finitions du bâtiment","Maçon / rénovation"],"81.30Z":["Paysagiste","Paysagiste"],"49.42Z":["Déménagement","Déménageur"],"49.32Z":["Taxi","Taxi / VTC"],"49.39A":["Transport de voyageurs","Taxi / VTC"],"45.20A":["Garage, entretien automobile","Garage / auto"],"45.20B":["Garage, entretien automobile","Garage / auto"],"45.11Z":["Vente de voitures","Garage / auto"],"85.53Z":["Auto-école","Auto-école"],"68.31Z":["Agence immobilière","Agence immobilière"],"74.20Z":["Photographe","Photographe"],"96.01B":["Pressing, blanchisserie","Pressing / cordonnerie"],"95.23Z":["Cordonnerie","Pressing / cordonnerie"],"69.10Z":["Avocat, notaire (juridique)","Avocat / notaire / comptable"],"69.20Z":["Expert-comptable","Avocat / notaire / comptable"],"55.10Z":["Hôtel","Hôtel / hébergement"],"55.20Z":["Hébergement touristique (gîte, chambre d’hôtes)","Gîte / chambre d’hôtes"],"93.29Z":["Activités de loisirs","Loisirs / activités"],"93.21Z":["Parc de loisirs","Loisirs / activités"]};
const sireneCache={};
function nafInfo(code){return NAF[code]||null}
async function sireneSearch(name,city){
 const key=norm(name)+"|"+norm(city||"");if(sireneCache[key])return sireneCache[key];
 const job=(async()=>{
  const r=await fetchJson("https://recherche-entreprises.api.gouv.fr/search?per_page=10&q="+encodeURIComponent(name),{},10000);
  const out=[];(r.results||[]).forEach(e=>{
   const etabs=[...(e.matching_etablissements||[]),...(e.siege?[e.siege]:[])];
   etabs.forEach(t=>{if(!t||!t.siret||out.some(o=>o.siret===t.siret))return;
    out.push({siret:t.siret,names:[...(t.liste_enseignes||[]),t.nom_commercial,e.nom_raison_sociale,e.nom_complet,e.sigle].filter(Boolean),commune:t.libelle_commune||"",cp:t.code_postal||"",adresse:t.adresse||"",date:t.date_creation||t.date_debut_activite||"",dateEnt:e.date_creation||"",naf:t.activite_principale||e.activite_principale||"",open:(t.etat_administratif||e.etat_administratif)!=="F"&&!t.date_fermeture})});
  });return out;
 })();
 sireneCache[key]=job;job.catch(()=>{delete sireneCache[key]});return job;
}
function sameCity(a,b){const A=norm(a).replace(/\b(saint|sainte)\b/g,"st").replace(/\s+/g,""),B=norm(b).replace(/\b(saint|sainte)\b/g,"st").replace(/\s+/g,"");return !!A&&!!B&&(A===B||A.includes(B)||B.includes(A))}
function regScore(x,name,addr){const exact=x.names.some(n=>norm(n)===norm(name)||norm(n).replace(/^(le|la|les|l) /,"")===norm(name).replace(/^(le|la|les|l) /,""))?3:1;const A=toks(addr||"").filter(w=>w.length>3&&!/^(france|rue|avenue|route|place|chemin|boulevard)$/.test(w));const hit=A.filter(w=>norm(x.adresse).includes(w)).length;return exact+hit*2}
function sireneMatch(list,name,city,cp,addr){
 if(addr!==undefined){const ok=list.filter(x=>x.open&&x.names.some(n=>similar(n,name))&&((cp&&x.cp===cp)||(city&&sameCity(x.commune,city))));return ok.map(x=>({x,s:regScore(x,name,addr)})).sort((a,b)=>b.s-a.s||String(b.x.date).localeCompare(String(a.x.date)))[0]?.x||null}
 const ok=list.filter(x=>x.open&&x.names.some(n=>similar(n,name))&&((cp&&x.cp===cp)||(city&&sameCity(x.commune,city))));
 return ok.sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
}
function fmtOpen(d){if(!d)return "";const x=new Date(d+"T12:00:00");return isNaN(x)?"":x.toLocaleDateString("fr-FR",{month:"long",year:"numeric"})}
function ageText(d){if(!d)return "";const m=Math.round((Date.now()-Date.parse(d))/(864e5*30.44));return m<1?"ouvert ce mois-ci":m<24?"ouvert il y a "+m+" mois":"ouvert il y a "+Math.floor(m/12)+" ans"}

async function googleSuggest(input){
 const body={input,languageCode:"fr",includedRegionCodes:["fr","be","ch","lu","mc"],sessionToken};
 const r=await fetchJson("https://places.googleapis.com/v1/places:autocomplete",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":settings.googleKey.trim()},body:JSON.stringify(body)},12000);
 return (r.suggestions||[]).map(s=>s.placePrediction).filter(Boolean).map(p=>({src:"google",id:p.placeId,main:p.structuredFormat&&p.structuredFormat.mainText&&p.structuredFormat.mainText.text||p.text&&p.text.text||"",secondary:p.structuredFormat&&p.structuredFormat.secondaryText&&p.structuredFormat.secondaryText.text||"",types:p.types||[]}));
}
/* Secours : la recherche textuelle Google trouve les commerces même lorsque
   l’autocomplétion ne renvoie rien pour les premiers mots saisis. */
async function googleTextSuggest(input){
 const list=await placesSearch(input,"places.id,places.displayName,places.formattedAddress,places.primaryType,places.primaryTypeDisplayName,places.types",8);
 return list.map(p=>({src:"google",id:p.id,main:p.displayName&&p.displayName.text||"",secondary:p.formattedAddress||"",city:cityFromSecondary(p.formattedAddress||""),types:p.types||[],typeLabel:p.primaryTypeDisplayName&&p.primaryTypeDisplayName.text||""})).filter(p=>p.main);
}
async function photonSuggest(input){
 const r=await fetchJson("https://photon.komoot.io/api/?lang=fr&limit=8&q="+encodeURIComponent(input),{},12000);
 return (r.features||[]).filter(f=>f.properties&&f.properties.name&&["FR","BE","CH","LU","MC"].includes(String(f.properties.countrycode).toUpperCase())&&f.properties.osm_key!=="place"&&f.properties.osm_key!=="highway"&&f.properties.osm_key!=="boundary").slice(0,6).map(f=>{const p=f.properties;return {src:"osm",main:p.name,secondary:[[p.housenumber,p.street].filter(Boolean).join(" "),[p.postcode,p.city||p.town||p.village].filter(Boolean).join(" ")].filter(Boolean).join(", "),city:p.city||p.town||p.village||"",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],key:p.osm_key,value:p.osm_value,osmType:p.osm_type,osmId:p.osm_id}});
}
function cityFromSecondary(sec){const parts=String(sec||"").split(",").map(x=>x.trim()).filter(Boolean);if(parts.length>=2&&/france|belgique|suisse|luxembourg|monaco/i.test(parts[parts.length-1]))parts.pop();const last=parts[parts.length-1]||"";return last.replace(/^\d{4,5}\s*/,"").trim()}
function closeSuggest(){$("suggest").classList.add("hidden");$("autoName").setAttribute("aria-expanded","false");suggestIdx=-1}
function sgType(s){return (s.src==="google"?typeFromGoogle(s.types):typeFromOsm(s.key,s.value))||(s.reg&&nafInfo(s.reg.naf)&&nafInfo(s.reg.naf)[1])||null}
function sgMeta(s){const t=s.reg&&nafInfo(s.reg.naf)?nafInfo(s.reg.naf)[0]:sgType(s);const y=s.reg&&s.reg.date?s.reg.date.slice(0,4):"";if(!t&&!y)return s.regPending?'<em class="sgmeta"><i class="sgdot"></i>Recherche du type et de l’année d’ouverture…</em>':"";return '<em class="sgmeta">'+(t?'<i class="sgtag">'+esc(t)+'</i>':'')+(y?'<i class="sgtag yr">Ouvert en '+esc(y)+'</i>':'')+'</em>'}
async function enrichSuggest(seq,typed){
 const city=$("autoCity").value.trim();let list=[];
 try{list=await sireneSearch(typed,city)}catch(e){suggestItems.forEach(s=>s.regPending=false);if(seq===suggestSeq)renderSuggest();return}
 if(seq!==suggestSeq)return;
 const pairs=[];suggestItems.forEach((s,i)=>{s.reg=null;s.regPending=false;const c=s.city||cityFromSecondary(s.secondary)||city;const cp=(String(s.secondary||"").match(/\b(\d{5})\b/)||[])[1]||"";list.filter(x=>x.open&&x.names.some(n=>similar(n,s.main))&&((cp&&x.cp===cp)||(c&&sameCity(x.commune,c)))).forEach(x=>pairs.push({i,x,sc:regScore(x,s.main,s.secondary)}))});
 pairs.sort((a,b)=>b.sc-a.sc);const usedS=new Set(),usedI=new Set();pairs.forEach(p=>{if(usedS.has(p.x.siret)||usedI.has(p.i))return;usedS.add(p.x.siret);usedI.add(p.i);suggestItems[p.i].reg=p.x});renderSuggest();
}
function renderSuggest(){
 const box=$("suggest");
 if(!suggestItems.length){closeSuggest();return}
 box.innerHTML=suggestItems.map((s,i)=>'<button type="button" role="option" id="sg'+i+'" aria-selected="'+(i===suggestIdx)+'" data-sg="'+i+'"><b>'+esc(s.main)+'</b><span>'+esc(s.secondary||"")+'</span>'+sgMeta(s)+'</button>').join("")+'<div class="src">'+(suggestItems[0].src==="google"?"Suggestions Google":"Suggestions OpenStreetMap — ajoutez une clé Google pour des résultats plus complets")+'</div>';
 box.classList.remove("hidden");$("autoName").setAttribute("aria-expanded","true");
 box.querySelectorAll("[data-sg]").forEach(b=>b.addEventListener("mousedown",e=>{e.preventDefault();pickSuggestion(suggestItems[Number(b.dataset.sg)])}));
}
function queueSuggest(){
 clearTimeout(suggestTimer);
 const name=$("autoName").value.trim();if(name.length<2){suggestItems=[];closeSuggest();return}
 const q=name+($("autoCity").value.trim()?" "+$("autoCity").value.trim():"");
 suggestTimer=setTimeout(async()=>{
  const seq=++suggestSeq;
  try{
   let items=[];
   if(hasKey()){
    try{items=await googleSuggest(q)}catch(e){items=[]}
    if(!items.length){try{items=await googleTextSuggest(q)}catch(e){items=[]}}
   }
   if(!items.length){try{items=await photonSuggest(q)}catch(e){items=[]}}
   if(seq!==suggestSeq)return;
   suggestItems=items;suggestIdx=-1;items.forEach(s=>s.regPending=true);
   if(items.length){renderSuggest();enrichSuggest(seq,name)}
   else renderSuggestEmpty(name,hasKey());
  }catch(e){if(seq===suggestSeq)renderSuggestEmpty(name,hasKey())}
 },hasKey()?220:420);
}
function renderSuggestEmpty(name,withGoogle){
 const box=$("suggest");
 box.innerHTML='<div class="src" style="padding:12px">Aucun commerce trouvé pour « '+esc(name)+' ». Essayez avec le nom et la ville, ou vérifiez la clé Google dans Réglages'+(withGoogle?' (API Places et restrictions de la clé).':'.')+'</div>';
 box.classList.remove("hidden");$("autoName").setAttribute("aria-expanded","true");
}
function setPickInfo(){const b=state.biz;$("pickInfo").textContent=b.placeId?"✓ Établissement Google sélectionné : "+(b.pickLabel||b.name):b.osmPick?"✓ Établissement OpenStreetMap sélectionné : "+(b.pickLabel||b.name):""}
function clearPick(){delete state.biz.reg;delete state.biz.placeId;delete state.biz.osmPick;delete state.biz.pickLabel;setPickInfo()}
function pickSuggestion(s){
 if(!s)return;closeSuggest();clearPick();
 $("autoName").value=s.main;
 const city=s.city||cityFromSecondary(s.secondary);if(city)$("autoCity").value=city;
 state.biz.pickLabel=s.main+(s.secondary?" — "+s.secondary:"");
 state.biz.reg=s.reg||null;
 if(s.src==="google"){state.biz.placeId=s.id;applyDetectedType(typeFromGoogle(s.types)||(s.reg&&nafInfo(s.reg.naf)&&nafInfo(s.reg.naf)[1]))}
 else{state.biz.osmPick={lat:s.lat,lng:s.lng,key:s.key,value:s.value,osmType:s.osmType,osmId:s.osmId};applyDetectedType(typeFromOsm(s.key,s.value)||(s.reg&&nafInfo(s.reg.naf)&&nafInfo(s.reg.naf)[1]))}
 setPickInfo();persistLocal();
 if($("autoCity").value.trim()){try{$("runAuto").focus({preventScroll:true})}catch(e){}toast("Établissement choisi : touchez « Lancer l’audit » quand vous êtes prêt.")}else $("autoCity").focus();
}
async function placeDetails(id){
 const r=await fetchJson("https://places.googleapis.com/v1/places/"+encodeURIComponent(id)+"?languageCode=fr&regionCode=FR&sessionToken="+encodeURIComponent(sessionToken),{headers:{"X-Goog-Api-Key":settings.googleKey.trim(),"X-Goog-FieldMask":DETAIL_FIELDS}},20000);
 sessionToken=uid();return r;
}
function renderPlaceChoice(){
 const box=$("placeChoice"),d=state.data||{},c=(d.placeCandidates||[]);
 if(c.length<2||!d.place||(d.exactPick&&d.place.id===state.biz.placeId)){box.classList.add("hidden");box.innerHTML="";return}
 box.classList.remove("hidden");
 box.innerHTML='<h2>Est-ce le bon établissement ?</h2><p class="muted">Google a trouvé plusieurs fiches proches. Si l\'analyse ne porte pas sur le bon commerce, choisissez-le et relancez.</p>'+c.map(x=>'<div class="choice'+(x.id===d.place.id?" cur":"")+'"><span><b>'+esc(x.name)+'</b><br><span class="muted">'+esc(x.address||"")+(x.rating!=null?" · "+fr1(x.rating)+"/5 ("+(x.count||0)+" avis)":"")+'</span></span>'+(x.id===d.place.id?'<span class="badge b-ok">Analysé</span>':'<button class="btn" data-repick="'+esc(x.id)+'">Analyser celui-ci</button>')+'</div>').join("");
 box.querySelectorAll("[data-repick]").forEach(b=>b.onclick=()=>{const x=c.find(y=>y.id===b.dataset.repick);state.biz.placeId=x.id;state.biz.pickLabel=x.name+" — "+(x.address||"");setPickInfo();runAuto()});
}
function keywordList(type,city){
 let raw=$("autoKeyword").value.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
 const base=kwOf(type);
 if(!raw.length)raw=typeInfo(type).kw?[base,bestOf(type)+base]:[base];
 const cityN=norm(city);
 return [...new Set(raw.map(k=>norm(k).includes(cityN)&&cityN?k:k+" "+city))].slice(0,3);
}

/* ---------- v5 : photos du propriétaire, carte de visibilité, Bing, IA Gemini ---------- */
function ownerPhotoCount(p){const nm=p&&p.displayName&&p.displayName.text||"";return (p&&p.photos||[]).filter(ph=>(ph.authorAttributions||[]).some(a=>similar(a.displayName,nm))).length}
async function photoUris(p,max){
 const out=[];for(const ph of (p.photos||[]).slice(0,max)){
  try{const r=await fetchJson("https://places.googleapis.com/v1/"+ph.name+"/media?maxWidthPx=480&skipHttpRedirect=true",{headers:{"X-Goog-Api-Key":settings.googleKey.trim()}},15000);
   if(r&&r.photoUri)out.push({uri:r.photoUri,owner:(ph.authorAttributions||[]).some(a=>similar(a.displayName,p.displayName&&p.displayName.text)),author:(ph.authorAttributions||[])[0]&&ph.authorAttributions[0].displayName||""})}catch(e){if(e.status===403)break}
 }return out;
}
/* Carte de visibilité : 9 points autour du commerce, recherche « identifiants seulement » (tarif Google le plus bas) */
async function visibilityGrid(query,loc,myId,spacingKm){
 const dLat=spacingKm/111,dLng=spacingKm/(111*Math.cos(loc.lat*Math.PI/180));const pts=[];
 for(const dy of [1,0,-1])for(const dx of [-1,0,1])pts.push({lat:loc.lat+dy*dLat,lng:loc.lng+dx*dLng,dx,dy});
 const res=await Promise.all(pts.map(async pt=>{try{const l=await placesSearch(query,"places.id",20,pt,1500);const i=l.findIndex(x=>x.id===myId);return {...pt,rank:i>=0?i+1:null,ok:true}}catch(e){return {...pt,rank:null,ok:false,err:e}}}));
 const ok=res.filter(r=>r.ok);if(!ok.length)throw res[0].err;
 return {query,spacingKm,points:res,top3:ok.filter(r=>r.rank&&r.rank<=3).length,found:ok.filter(r=>r.rank).length,total:ok.length};
}
/* Bing France : vrais résultats lus via AllOrigins, secours DuckDuckGo (résultats Bing) via Jina Reader */
function b64urlDecode(s){try{s=s.replace(/-/g,"+").replace(/_/g,"/");s+="=".repeat((4-s.length%4)%4);return decodeURIComponent(escape(atob(s)))}catch(e){return ""}}
function hostOf(u){try{return new URL(u).hostname.replace(/^www\./,"")}catch(e){return ""}}
async function bingSearch(q){
 const bing="https://www.bing.com/search?q="+encodeURIComponent(q)+"&mkt=fr-FR&setlang=fr&cc=FR&count=20";
 try{
  const h=await fetchText("https://api.allorigins.win/raw?url="+encodeURIComponent(bing),{},30000);
  const doc=new DOMParser().parseFromString(h,"text/html");
  const rows=[...doc.querySelectorAll("li.b_algo")].map(li=>{const a=li.querySelector("h2 a");if(!a)return null;let u=a.getAttribute("href")||"";const m=u.match(/[?&]u=a1([^&]+)/);if(m)u=b64urlDecode(m[1])||u;return {title:a.textContent.trim(),url:u,host:hostOf(u),snippet:(li.querySelector("p")||{}).textContent||""}}).filter(Boolean);
  if(rows.length)return {engine:"Bing",rows};
 }catch(e){}
 const h=await fetchText("https://r.jina.ai/https://html.duckduckgo.com/html/?q="+encodeURIComponent(q)+"&kl=fr-fr",{headers:{"X-Return-Format":"html"}},45000);
 const doc=new DOMParser().parseFromString(h,"text/html");
 const rows=[...doc.querySelectorAll("a.result__a")].map(a=>{let u=a.getAttribute("href")||"";const m=u.match(/uddg=([^&]+)/);if(m)u=decodeURIComponent(m[1]);return {title:a.textContent.trim(),url:u,host:hostOf(u),snippet:""}});
 if(!rows.length)throw new Error("aucun résultat lisible");
 return {engine:"DuckDuckGo (résultats Bing)",rows};
}
function matchBiz(row,name,siteHost){if(siteHost&&row.host&&(row.host===siteHost||row.host.endsWith("."+siteHost)))return "site";let path="";try{path=decodeURIComponent(new URL(row.url).pathname)}catch(e){}return nameIn(row.title,name)||nameIn(path.replace(/[-_/.]/g," "),name)?"mention":null}
/* IA avec recherche web : Gemini + Recherche Google (clé Google, API « Generative Language » activée) */
const GEMINI_MODELS=["gemini-flash-latest","gemini-2.5-flash"];
async function geminiAsk(question){
 let last;for(const m of GEMINI_MODELS){
  try{const r=await fetchJson("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":settings.googleKey.trim()},body:JSON.stringify({contents:[{role:"user",parts:[{text:question}]}],tools:[{google_search:{}}],generationConfig:{temperature:0.2,maxOutputTokens:900}})},60000);
   const c=(r.candidates||[])[0]||{};const text=((c.content&&c.content.parts)||[]).map(p=>p.text||"").join("").trim();
   const chunks=((c.groundingMetadata&&c.groundingMetadata.groundingChunks)||[]).map(g=>g.web).filter(Boolean).map(w=>({title:w.title||"",uri:w.uri||""}));
   return {model:m,text,sources:chunks};
  }catch(e){last=e;if(e.status!==404)throw e}
 }throw last;
}
async function geminiChat(prompt){
 let last;for(const m of GEMINI_MODELS){try{const r=await fetchJson("https://generativelanguage.googleapis.com/v1beta/models/"+m+":generateContent",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":settings.googleKey.trim()},body:JSON.stringify({contents:[{role:"user",parts:[{text:prompt}]}],generationConfig:{temperature:0.3,maxOutputTokens:700}})},45000);return (((r.candidates||[])[0]||{}).content||{parts:[]}).parts.map(p=>p.text||"").join("").trim()}catch(e){last=e;if(e.status!==404)throw e}}throw last;
}
function nameIn(text,name){const tk=toks(name);if(!tk.length)return false;const T=toks(text);for(let i=0;i+tk.length<=T.length;i++){let ok=true;for(let j=0;j<tk.length;j++)if(T[i+j]!==tk[j]){ok=false;break}if(ok)return true}return T.join("").includes(tk.join(""))&&tk.join("").length>=6}
function aiMentions(text,name){return nameIn(text,name)}
function aiRank(text,name){const lines=String(text).split(/\n+/).filter(l=>/^\s*(\d+[.)]|[-*•])\s+/.test(l));const i=lines.findIndex(l=>aiMentions(l,name));return i>=0?i+1:null}

/* Réseaux sociaux : site du commerce + OpenStreetMap + recherche Bing ciblée */
const NETS=[["Facebook","facebook.com"],["Instagram","instagram.com"],["TikTok","tiktok.com"],["YouTube","youtube.com"],["Snapchat","snapchat.com"]];
function netOf(host){host=String(host||"").replace(/^(www|m|fr-fr|fr)\./,"");const n=NETS.find(([,d])=>host===d||host.endsWith("."+d)||(d==="youtube.com"&&host==="youtu.be")||(d==="facebook.com"&&host==="fb.com"));return n?n[0]:null}
function profileOk(u){try{const x=new URL(u);return !/\/(sharer|share|intent|dialog|plugins|login|hashtag|explore|search|watch\?)/i.test(x.pathname+x.search)&&x.pathname.length>1}catch(e){return false}}
async function socialScan(name,city,known){
 const found={}, candidates={};
 const previous=(state.data&&state.data.social)||{};
 const rejected=(previous.rejected||[]).filter(x=>x&&x.net&&x.url);
 const canonicalSocialUrl=url=>{try{const u=new URL(url);u.hash="";u.hostname=u.hostname.toLowerCase();if(u.hostname.startsWith("www."))u.hostname=u.hostname.slice(4);while(u.pathname.length>1&&u.pathname.endsWith("/"))u.pathname=u.pathname.slice(0,-1);return u.href}catch(e){return String(url||"")}};
 const isRejected=(net,url)=>rejected.some(x=>x.net===net&&canonicalSocialUrl(x.url)===canonicalSocialUrl(url));
 /* Conserver les profils déjà choisis ou confirmés lors d’un audit précédent ; un profil signalé incorrect reste exclu. */
 Object.entries(previous.found||{}).forEach(([net,f])=>{
  if(f&&f.url&&NETS.some(x=>x[0]===net)&&profileOk(f.url)&&!isRejected(net,f.url)){
   found[net]={...f};
  }
 });
 /* Les liens présents sur le site complètent les profils conservés, sans les écraser. */
 (known||[]).forEach(s=>{
  const n=netOf(hostOf(s.url))||s.net;
  if(n&&NETS.some(x=>x[0]===n)&&!found[n]&&profileOk(s.url)&&!isRejected(n,s.url)){
   found[n]={url:s.url,src:s.src||"site officiel",confidence:"lien trouvé sur le site — identité à confirmer",verified:false};
  }
 });
 /* Recherche séparée par réseau, avec classement strict : le nom seul ou un seul mot commun ne suffit plus. */
 const searches=await Promise.all(NETS.map(async ([net,domain])=>{
  const queries=[
   '"'+name+'" "'+city+'" site:'+domain,
   '"'+name+'" site:'+domain,
   '"'+name+'" '+city+' '+domain
  ];
  const all=[];let engine="";
  for(const query of queries){
   try{const r=await bingSearch(query);all.push(...(r.rows||[]));engine=engine||r.engine||""}catch(e){}
  }
  return {net,rows:all,engine};
 }));
 const engines=searches.map(x=>x.engine).filter(Boolean);
 const compact=v=>norm(String(v||"")).replace(/[^a-z0-9]/g,"");
 const brand=compact(name),tokens=[...new Set(toks(name).filter(w=>w.length>=3))];
 const cityTokens=[...new Set(toks(city).filter(w=>w.length>=3))];
 const scoreCandidate=(r)=>{
  let decoded="";try{decoded=decodeURIComponent(r.url)}catch(e){decoded=r.url}
  const title=String(r.title||"");
  const text=norm(title+" "+decoded.replace(/[-_./@]/g," ")+" "+String(r.snippet||""));
  const packed=compact(title+" "+decoded);
  const matched=tokens.filter(w=>text.split(" ").includes(w)).length;
  const packedMatch=brand.length>=6&&packed.includes(brand);
  const cityHits=cityTokens.filter(w=>text.split(" ").includes(w)).length;
  const hasName=tokens.length>0&&(packedMatch||matched>=Math.max(2,Math.ceil(tokens.length*.75)));
  const score=(packedMatch?8:matched*2)+(cityHits?Math.min(2,cityHits):0)+(title?1:0);
  return {score,hasName,packedMatch,matched,cityHits,title};
 };
 searches.forEach(({net,rows})=>{
  const unique=new Map();
  rows.forEach(r=>{
   if(netOf(r.host)!==net||!profileOk(r.url))return;
   let u;try{u=new URL(r.url);u.hash="";}catch(e){return}
   const url=u.href;
   if(isRejected(net,url))return;
   const rank=scoreCandidate({...r,url});
   /* Garder des pistes plus larges pour affichage, mais la sélection automatique reste très stricte plus bas. */
   const plausible=rank.hasName||rank.matched>=1;
   if(!plausible)return;
   const old=unique.get(url);
   if(!old||rank.score>old.rank.score)unique.set(url,{url,title:rank.title,rank});
  });
  const ranked=[...unique.values()].sort((a,b)=>b.rank.score-a.rank.score);
  candidates[net]=ranked.slice(0,5).map(x=>({url:x.url,title:x.title,score:x.rank.score,cityMatch:x.rank.cityHits>0}));
  /* En cas de plusieurs candidats proches, ne pas choisir arbitrairement un profil. */
  if(!found[net]&&ranked.length){
   const best=ranked[0],second=ranked[1];
   const decisive=best.rank.packedMatch||(best.rank.matched>=2&&best.rank.cityHits>0);
   const separated=!second||best.rank.score-second.rank.score>=3;
   if(decisive&&separated){
    found[net]={url:best.url,src:"recherche web ciblée",title:best.title,confidence:"correspondance probable — validation manuelle conseillée",verified:false};
   }
  }
 });
 return {found,candidates,rejected,engine:engines.join(", "),checked:NETS.map(n=>n[0]),queries:searches.length*3,verificationRequired:true};
}
/* ---------- Audit automatique ---------- */
let steps=[];
function setStep(id,status,title,detail,link){let s=steps.find(x=>x.id===id);if(!s){s={id};steps.push(s)}Object.assign(s,{status,title,detail:detail||"",link:link||null});renderAutoSteps(steps)}
/* Erreurs Google et réseau traduites en consignes claires */
function frErr(e){
 const m=String(e&&e.message||e||"");const url=(m.match(/https:\/\/console\.(?:developers|cloud)\.google\.com\/[^\s"']+/)||[])[0]||"";
 if(/has not been used|is disabled|SERVICE_DISABLED|API_NOT_ACTIVATED|not been enabled/i.test(m)){const api=/youtube/i.test(m+url)?"YouTube Data API v3":/generativelanguage|generative language/i.test(m+url)?"Generative Language API (Gemini)":/pagespeed/i.test(m+url)?"PageSpeed Insights API":"Places API (New)";return {code:"disabled",text:"« "+api+" » n’est pas encore activée dans votre projet Google. Touchez « Activer l’API », puis « Activer », attendez 2 minutes et relancez l’audit.",link:{href:url||(api.startsWith("Places")?"https://console.cloud.google.com/apis/library/places.googleapis.com":api.startsWith("YouTube")?"https://console.cloud.google.com/apis/library/youtube.googleapis.com":api.startsWith("Generative")?"https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com":"https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com"),label:"Activer l’API"}}}
 if(/API keys are not supported|Expected OAuth2|CREDENTIALS_MISSING|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(m))return {code:"badkey",text:WRONG_KEY_MSG,link:{href:"#settings",label:"Ouvrir les réglages"}};
 if(/are blocked|API_KEY_SERVICE_BLOCKED/i.test(m)){const api=/youtube/i.test(m)?"YouTube Data API v3":/generativelanguage|generative language/i.test(m)?"Generative Language API (Gemini)":/pagespeed/i.test(m)?"PageSpeed Insights API":"Places API (New)";return {code:"blocked",text:"Votre clé n’a pas le droit d’utiliser « "+api+" ». Dans Google Cloud → Identifiants, ouvrez la clé, cochez « "+api+" » dans « Restrictions relatives aux API », puis Enregistrer (prise en compte en 2 à 5 minutes).",link:{href:"https://console.cloud.google.com/apis/credentials",label:"Modifier la clé"}}}
 if(/API key not valid|API_KEY_INVALID/i.test(m))return {code:"badkey",text:"La clé Google n’est pas valide : copiez-la à nouveau dans Réglages.",link:{href:"#settings",label:"Ouvrir les réglages"}};
 if(/referer|referrer|API_KEY_HTTP_REFERRER_BLOCKED/i.test(m))return {code:"referer",text:"La clé n’autorise pas ce site : dans Google Cloud, ajoutez https://mansstyle59.github.io/* aux sites web autorisés.",link:{href:"https://console.cloud.google.com/apis/credentials",label:"Modifier la clé"}};
 if(/billing|BILLING/i.test(m))return {code:"billing",text:"Google demande d’associer un compte de facturation au projet (le volume gratuit reste gratuit).",link:{href:"https://console.cloud.google.com/billing",label:"Ouvrir la facturation"}};
 if((e&&e.status===429)||/quota|RESOURCE_EXHAUSTED/i.test(m))return {code:"quota",text:"Quota du service atteint pour le moment : réessayez plus tard."};
 if((e&&e.status===408)||/Délai dépassé|saturés|timeout/i.test(m))return {code:"timeout",text:"Le service a mis trop de temps à répondre (réseau mobile lent ou serveur saturé). Réessayez dans un instant."};
 if(/Failed to fetch|NetworkError|Load failed/i.test(m))return {code:"network",text:"Connexion impossible au service : vérifiez la connexion internet."};
 return {code:"other",text:m.length>160?m.slice(0,160)+"…":m};
}
function renderAutoSteps(list){
 $("progCard").classList.toggle("hidden",!(list&&list.length)&&!running);
 if(!running){$("progTitle").textContent=list&&list.length?"Analyse terminée : voir les "+list.length+" étapes":"Progression";$("progDetails").open=!(list&&list.length)}
 if(!list||!list.length){$("autoSteps").innerHTML='<p class="muted">Aucune analyse lancée pour ce client.</p>';return}
 const ico={run:'<span class="spin">◌</span>',ok:"✓",warn:"!",err:"✕",skip:"–"};
 $("autoSteps").innerHTML=list.map(s=>'<div class="step '+s.status+'"><span class="ico">'+(ico[s.status]||"•")+'</span><div><b>'+esc(s.title)+'</b>'+(s.detail?'<small>'+esc(s.detail)+'</small>':'')+(s.link?'<a class="steplink" href="'+esc(s.link.href)+'"'+(String(s.link.href).startsWith("#")?'':' target="_blank" rel="noopener"')+'>'+esc(s.link.label)+'</a>':'')+'</div></div>').join("");
 glossify($("autoSteps"));
}
function setAuto(k,status,evidence,source){state.auto[k]={status,evidence,source:source||"",at:today()};if(status==="ok"||status==="issue"){state.checks[k]=true;state.issues[k]=status==="issue"}}
let running=false;
async function runAuto(){
 if(running)return;
 if(navigator.onLine===false){toast("Pas de connexion internet : connectez-vous puis relancez l’audit.");return}
 const name=$("autoName").value.trim(),city=$("autoCity").value.trim();let type=$("autoType").value;
 if(!name||!city){toast("Renseignez le nom du commerce et la ville.");($("autoName").value?$("autoCity"):$("autoName")).focus();return}
 running=true;document.body.classList.add("scanning");closeSuggest();$("runAuto").disabled=true;$("runAuto").textContent="Analyse en cours…";$("progDetails").open=true;$("progTitle").textContent="Analyse en cours…";$("progDetails").scrollIntoView({behavior:"smooth",block:"start"});
 steps=[];const data={fetchedAt:nowLabel(),steps};const findings=[];let googleBlocked=null;
 const backup=JSON.parse(JSON.stringify({auto:state.auto,checks:state.checks,issues:state.issues,data:state.data,biz:state.biz}));
 Object.keys(state.auto).forEach(k=>{const a=state.auto[k];if(a&&(a.status==="ok"||a.status==="issue")){delete state.checks[k];delete state.issues[k]}});state.auto={};
 state.biz.name=name;state.biz.city=city;state.biz.date=today();
 let site=$("autoSite").value.trim();
 try{
  /* 1. Ville */
  setStep("geo","run","Localisation");
  let center=null;
  if(state.biz.osmPick){center={lat:state.biz.osmPick.lat,lng:state.biz.osmPick.lng,label:"Position de l'établissement choisi"};setStep("geo","ok","Établissement localisé",state.biz.pickLabel||"")}
  else{try{center=await nominatimCity(city);setStep("geo",center?"ok":"warn",center?"Ville localisée":"Ville introuvable sur OpenStreetMap",center?center.label:"Les recherches se feront sans centre géographique.")}catch(e){const f=frErr(e);if(f.code==="network"){const er=new Error("offline");er.stop="offline";throw er}setStep("geo","warn","Localisation indisponible",f.text)}}
  data.center=center;
  /* 2. Fiche Google */
  let place=null;
  if(hasKey()){
   setStep("place","run","Recherche de la fiche Google");
   try{
    let list=[];try{list=await placesSearch(name+" "+city,PLACE_FIELDS,5,center)}catch(e){if(!state.biz.placeId)throw e}
    if(state.biz.placeId){place=list.find(p=>p.id===state.biz.placeId)||await placeDetails(state.biz.placeId)}
    else place=pickPlace(list,name,city);
    data.place=place;data.exactPick=!!(state.biz.placeId&&place&&place.id===state.biz.placeId);
    const cands=list.filter(p=>p.id);if(place&&!cands.some(p=>p.id===place.id))cands.unshift(place);
    data.placeCandidates=cands.slice(0,5).map(p=>({id:p.id,name:p.displayName&&p.displayName.text,address:p.formattedAddress,rating:p.rating,count:p.userRatingCount}));
    if(place){
     setStep("place","ok","Fiche Google trouvée : "+(place.displayName&&place.displayName.text),(place.formattedAddress||"")+(state.biz.placeId?" · sélection exacte":" · meilleure correspondance"));
     const pl=place.location&&{lat:place.location.latitude,lng:place.location.longitude};
     const dup=list.filter(p=>p.id!==place.id&&similar(p.displayName&&p.displayName.text,place.displayName&&place.displayName.text||name)&&distKm(pl,p.location&&{lat:p.location.latitude,lng:p.location.longitude})<1);data.duplicates=dup.map(p=>({name:p.displayName&&p.displayName.text,address:p.formattedAddress,url:p.googleMapsUri}));
     state.biz.activity=(place.primaryTypeDisplayName&&place.primaryTypeDisplayName.text)||"";
     const det=typeFromGoogle([place.primaryType,...(place.types||[])]);if(det&&!$("autoType").dataset.touched&&det!==type){type=det;$("autoType").value=det;if(!$("autoKeyword").dataset.touched)$("autoKeyword").value=defaultKeywords(det)}
    }else setStep("place","warn","Aucune fiche Google trouvée","Vérifiez l'orthographe ou choisissez le commerce dans les suggestions en tapant son nom.");
   }catch(e){const f=frErr(e);googleBlocked=f.code;setStep("place","err",f.code==="disabled"?"Fiche Google : API à activer":f.code==="badkey"||f.code==="referer"?"Fiche Google : clé à corriger":"Fiche Google non disponible",f.text,f.link)}
  }else setStep("place","skip","Fiche Google non analysée","Ajoutez une clé Google dans Réglages pour obtenir note, avis, photos et concurrents.");
  state.biz.type=type;
  /* 2 bis. Registre des entreprises (SIRENE) : activité officielle et date d'ouverture de l'établissement */
  setStep("reg","run","Registre des entreprises (SIRENE)");
  try{const gName=place&&place.displayName&&place.displayName.text;const cp=((place&&place.formattedAddress)||"").match(/\b(\d{5})\b/);
   let reg=null;for(const n of [...new Set([gName,name].filter(Boolean))]){const L=await sireneSearch(n,city);reg=sireneMatch(L,n,city,cp&&cp[1],(place&&place.formattedAddress)||state.biz.address||"");if(reg)break}
   if(!reg&&state.biz.reg&&similar(state.biz.reg.names[0]||"",name))reg=state.biz.reg;
   state.biz.reg=reg||null;
   if(reg){const ni=nafInfo(reg.naf);setStep("reg","ok",(ni?ni[0]:"Activité "+reg.naf)+(reg.date?" · ouvert en "+fmtOpen(reg.date):""),"Établissement inscrit au registre SIRENE"+(reg.dateEnt&&reg.dateEnt!==reg.date?" · entreprise créée en "+reg.dateEnt.slice(0,4):"")+". Date d’inscription de cet établissement, qui peut différer de l’ouverture au public (reprise, déménagement).");
    if(ni&&!place&&!$("autoType").dataset.touched&&ni[1]!==type){type=ni[1];state.biz.type=type;$("autoType").value=type;if(!$("autoKeyword").dataset.touched)$("autoKeyword").value=defaultKeywords(type)}}
   else setStep("reg","skip","Registre des entreprises : établissement non identifié","Nom commercial différent du nom déclaré, entreprise individuelle ou commerce hors de France.");
  }catch(e){setStep("reg","skip","Registre des entreprises non consulté",frErr(e).text)}
  if(place){
   const p=place,loc=p.location?{lat:p.location.latitude,lng:p.location.longitude}:null;data.loc=loc;
   state.biz.maps=p.googleMapsUri||state.biz.maps;if(p.rating!=null)state.biz.rating=p.rating;if(p.userRatingCount!=null)state.biz.reviews=p.userRatingCount;
   state.biz.phone=p.nationalPhoneNumber||state.biz.phone||"";state.biz.address=p.formattedAddress||state.biz.address||"";
   if(!site&&p.websiteUri)site=p.websiteUri;
   const src="Google Places, "+data.fetchedAt;
   data.hours=p.regularOpeningHours&&p.regularOpeningHours.weekdayDescriptions||[];
   const missing=[!p.formattedAddress&&"adresse",!p.nationalPhoneNumber&&"téléphone",!data.hours.length&&"horaires",!p.websiteUri&&"site web"].filter(Boolean);
   setAuto("0-0",missing.length?"issue":"ok",missing.length?"Manquant sur la fiche : "+missing.join(", ")+".":"Adresse, téléphone, horaires et site renseignés.",src);
   if(missing.length)findings.push({sev:2,text:"La fiche Google ne mentionne pas : "+missing.join(", ")+"."});
   setAuto("0-1","info","Catégorie principale affichée : "+((p.primaryTypeDisplayName&&p.primaryTypeDisplayName.text)||p.primaryType||"non communiquée")+". Catégories secondaires à vérifier dans Google Business Profile.",src);
   const ph=(p.photos||[]).length;data.photos=ph;const own=ownerPhotoCount(p);data.ownerPhotos=own;
   setAuto("0-10",ph&&own>=Math.min(3,ph)?"ok":"issue",ph?own+" photo"+(own>1?"s":"")+" du propriétaire parmi les "+ph+" photos que Google met en avant"+(own<3?" : la fiche est surtout illustrée par les clients.":"."):"Aucune photo sur la fiche.","Google Places, "+data.fetchedAt);
   if(ph&&own<Math.min(3,ph))findings.push({sev:2,text:"Sur les "+ph+" photos que Google met en avant, "+(own?"seulement "+own+" vien"+(own>1?"nent":"t"):"aucune ne vient")+" du propriétaire : l’image du commerce dépend des photos de clients."});
   setStep("photos","run","Récupération des photos de la fiche");
   try{data.photoList=await photoUris(p,6);setStep("photos",data.photoList.length?"ok":"warn",data.photoList.length?data.photoList.length+" photos récupérées · "+own+" / "+ph+" publiées par le propriétaire":"Photos non disponibles","Les photos s’affichent dans les résultats et le rapport.")}catch(e){setStep("photos","warn","Photos non disponibles",frErr(e).text)}
   setAuto("0-4",ph<5?"issue":"info",ph<5?"Seulement "+ph+" photo"+(ph>1?"s":"")+" sur la fiche Google.":ph+" photos mises en avant par Google (l’outil en lit 10 au maximum). Récence et qualité à contrôler visuellement.",src);
   if(ph<5)findings.push({sev:2,text:ph?"Très peu de photos sur la fiche Google ("+ph+").":"Aucune photo sur la fiche Google : c’est souvent la première chose regardée avant de choisir."});
   const rv=(p.reviews||[]).map(r=>({rating:r.rating,when:r.relativePublishTimeDescription||"",time:r.publishTime||"",text:(r.text&&r.text.text||r.originalText&&r.originalText.text||"").slice(0,280)}));
   data.reviews=rv;
   const last=rv.map(r=>Date.parse(r.time)).filter(Boolean).sort((a,b)=>b-a)[0];const daysSince=last?Math.round((Date.now()-last)/864e5):null;data.daysSinceReview=daysSince;
   const rProb=[];if(p.rating!=null&&p.rating<4.2)rProb.push("note de "+fr1(p.rating)+"/5");if(p.userRatingCount!=null&&p.userRatingCount<50)rProb.push("seulement "+p.userRatingCount+" avis");if(p.rating==null)rProb.push("aucune note");
   const ageM=state.biz.reg&&state.biz.reg.date?Math.round((Date.now()-Date.parse(state.biz.reg.date))/(864e5*30.44)):null;if(ageM!=null&&ageM<18&&rProb.length)rProb.push("à relativiser : établissement "+ageText(state.biz.reg.date));
   setAuto("0-5",rProb.length?"issue":"ok",(p.rating!=null?fr1(p.rating)+"/5 sur "+p.userRatingCount+" avis":"Aucun avis")+(daysSince!=null?" · parmi les 5 avis mis en avant par Google, le plus récent date de "+daysSince+" j":"")+(rProb.length?" — à améliorer : "+rProb.join(", ")+".":"."),src);
   if(rProb.length)findings.push({sev:3,text:"Avis Google : "+rProb.join(", ")+"."});
   const neg=rv.filter(r=>r.rating&&r.rating<=3);
   if(rv.length){setAuto("3-0","info",rv.filter(r=>r.rating>=4).length+" avis positifs parmi les "+rv.length+" plus pertinents (extraits dans le rapport).",src);setAuto("3-1",neg.length?"issue":"info",neg.length?neg.length+" avis à 3 étoiles ou moins parmi les "+rv.length+" plus pertinents : critiques à lire dans le rapport.":"Aucun avis négatif parmi les "+rv.length+" plus pertinents.",src)}
   const st=p.businessStatus||"";setAuto("0-9",st&&st!=="OPERATIONAL"?"issue":"ok",st==="OPERATIONAL"?"Fiche active (ouverte).":st==="CLOSED_TEMPORARILY"?"Fiche marquée « fermée temporairement ».":st==="CLOSED_PERMANENTLY"?"Fiche marquée « définitivement fermée ».":"Statut non communiqué.",src);
   if(st&&st!=="OPERATIONAL")findings.push({sev:3,text:"Google affiche le commerce comme "+(st==="CLOSED_PERMANENTLY"?"définitivement fermé":st==="CLOSED_TEMPORARILY"?"fermé temporairement":"inactif")+" : les clients qui le cherchent pensent qu’il n’ouvre plus."});
   setAuto("0-8",(data.duplicates||[]).length?"issue":"ok",(data.duplicates||[]).length?"Fiche(s) au nom très proche à moins de 1 km : "+data.duplicates.map(d=>d.name).join(", ")+". À vérifier : doublon ou autre établissement.":"Aucun doublon évident dans les résultats.",src);
   if((data.duplicates||[]).length)findings.push({sev:2,text:"Une autre fiche Google au nom très proche existe à moins de 1 km ("+data.duplicates.map(d=>d.name).join(", ")+") : s’il s’agit d’un doublon, il disperse les avis et peut tromper les clients."});
   if(p.editorialSummary&&p.editorialSummary.text)setAuto("0-2","info","Résumé Google : « "+p.editorialSummary.text+" ». Description du propriétaire et lien de réservation à vérifier.",src);
   const serv=[p.reservable&&"réservation",p.delivery&&"livraison",p.takeout&&"à emporter",p.dineIn&&"sur place"].filter(Boolean);if(serv.length)data.services=serv;
  }
  /* 3. OpenStreetMap */
  if(center){setStep("osm","run","Recherche OpenStreetMap");
   try{const o=await osmLookup(name,data.loc||center,type,!!place&&hasKey());data.osm=o;const t=o.me&&o.me.tags||{};
    if(!site&&(t.website||t["contact:website"]))site=t.website||t["contact:website"];
    const socials=[["Facebook",t["contact:facebook"]||t.facebook],["Instagram",t["contact:instagram"]||t.instagram],["TikTok",t["contact:tiktok"]]].filter(x=>x[1]);data.socials=data.socials||[];socials.forEach(s=>{if(!data.socials.some(x=>(x.net||netOf(hostOf(x.url)))===s[0]))data.socials.push({net:s[0],url:s[1],src:"OpenStreetMap"});});
    if(!place&&o.me){state.biz.phone=state.biz.phone||t.phone||t["contact:phone"]||"";state.biz.address=state.biz.address||[t["addr:housenumber"],t["addr:street"],t["addr:postcode"],t["addr:city"]].filter(Boolean).join(" ");if(t.opening_hours){data.hours=[t.opening_hours];setAuto("0-0","info","Horaires OpenStreetMap : "+t.opening_hours+". À comparer avec la fiche Google.","OpenStreetMap")}}
    if(socials.length)setAuto("2-0","info","Réseaux déclarés sur OpenStreetMap : "+socials.map(s=>s[0]).join(", ")+". Activité à vérifier.","OpenStreetMap");
    setStep("osm",o.me?"ok":"warn",o.me?"Commerce présent sur OpenStreetMap":"Commerce absent d'OpenStreetMap",(o.me?(o.me.tags&&(o.me.tags.website||o.me.tags["contact:website"])?"Site web trouvé. ":""):"Une fiche OpenStreetMap alimente Apple Plans et de nombreuses applis. ")+(o.compError?"Commerces voisins non chargés : serveur saturé, réessayez plus tard.":o.competitors.length+" commerce(s) similaire(s) à proximité."));
   }catch(e){if(place)setStep("osm","skip","OpenStreetMap non consulté","Serveur OpenStreetMap lent pour le moment : sans incidence sur l’audit, la fiche Google a bien été analysée.");else setStep("osm","warn","OpenStreetMap indisponible","Serveur lent pour le moment : les commerces voisins n’ont pas pu être chargés. Ajoutez une clé Google pour ne plus en dépendre, ou relancez plus tard.")}}
  const foundAny=!!(place||(data.osm&&data.osm.me)||state.biz.osmPick);
  if(!foundAny&&hasKey()&&!googleBlocked){const er=new Error("notfound");er.stop="notfound";throw er}
  data.unverified=!foundAny;data.partial=!place;
  const srcChecked=[place&&"la fiche Google",data.osm&&data.osm.me&&"OpenStreetMap"].filter(Boolean);
  /* 4. Visibilité locale sur plusieurs recherches + concurrents */
  const queries=keywordList(type,city);const bingEarly=Promise.allSettled([bingSearch(queries[0]),bingSearch(name+" "+city)]);state.biz.keyword=$("autoKeyword").value.trim()||queries.map(q=>q.replace(new RegExp("\\s*"+rxEscape(city)+"$","i"),"")).join(", ");
  if(hasKey()){
   data.rankings=[];const myId=place&&place.id;const agg={};
   if(googleBlocked&&["disabled","badkey","referer","billing"].includes(googleBlocked))setStep("rank","skip","Positions et concurrents Google non mesurés","Ils seront analysés dès que la clé Google fonctionnera.");
   else for(const [qi,q] of queries.entries()){
    setStep("rank"+qi,"run","Position sur « "+q+" »");
    try{const list=await placesSearch(q,RANK_FIELDS,20,data.loc||center);
     if(!list.length){setStep("rank"+qi,"warn","Aucun résultat Google pour « "+q+" »","Recherche trop précise : modifiez les mots-clés dans les options.");continue}
     const rows=list.map((p,i)=>({rank:i+1,id:p.id,name:p.displayName&&p.displayName.text,rating:p.rating,count:p.userRatingCount,photos:(p.photos||[]).length,ownerPhotos:ownerPhotoCount(p),url:p.googleMapsUri,website:p.websiteUri||"",address:p.formattedAddress,dist:distKm(data.loc||center,p.location&&{lat:p.location.latitude,lng:p.location.longitude}),me:myId?p.id===myId:similar(p.displayName&&p.displayName.text,name)}));
     const mine=rows.find(r=>r.me);data.rankings.push({query:q,rank:mine?mine.rank:null,total:rows.length,rows,fetchedAt:data.fetchedAt});
     rows.filter(r=>!r.me).forEach(r=>{const a=agg[r.id]||(agg[r.id]={...r,bestRank:r.rank,hits:0,ranks:{}});a.hits++;a.ranks[qi]=r.rank;if(r.rank<a.bestRank)a.bestRank=r.rank});
     setStep("rank"+qi,mine?(mine.rank<=3?"ok":"warn"):"warn",mine?"Position "+mine.rank+" / "+rows.length+" sur « "+q+" »":"Absent des "+rows.length+" premiers sur « "+q+" »","Recherche Google Places, indicative.");
    }catch(e){const f=frErr(e);setStep("rank"+qi,"err","Recherche « "+q+" » non mesurée",f.text,f.link);if(["disabled","badkey","referer","billing"].includes(f.code))break}
   }
   const R=data.rankings;data.ranking=R[0]||null;
   if(R.length){
    const found=R.filter(r=>r.rank),top3=R.filter(r=>r.rank&&r.rank<=3);
    data.visibility={n:R.length,found:found.length,top3:top3.length,avg:found.length?found.reduce((s,r)=>s+r.rank,0)/found.length:null};
    setAuto("3-5",top3.length===R.length?"ok":"issue","Top 3 sur "+top3.length+" recherche"+(top3.length>1?"s":"")+" sur "+R.length+" · "+R.map(r=>"« "+r.query+" » : "+(r.rank?"n° "+r.rank:"absent")).join(" · ")+" (Google Places, indicatif).","Google Places, "+data.fetchedAt);
    const comps=Object.values(agg).sort((a,b)=>b.hits-a.hits||a.bestRank-b.bestRank).slice(0,8);data.competitors=comps;
    if(found.length<R.length){const miss=R.filter(r=>!r.rank);findings.push({sev:3,text:"Le commerce n'apparaît pas dans les "+miss[0].total+" premiers résultats Google sur "+miss.map(r=>"« "+r.query+" »").join(", ")+(comps.length?" — on y trouve notamment "+comps.slice(0,3).map(c=>c.name).join(", "):"")+"."})}
    const behind=found.filter(r=>r.rank>3);if(behind.length)findings.push({sev:2,text:"Sur "+behind.map(r=>"« "+r.query+" » (n° "+r.rank+")").join(", ")+", le commerce est devancé par "+behind[0].rows.filter(x=>x.rank<behind[0].rank).slice(0,3).map(x=>x.name).join(", ")+"."});
    if(comps.length>=3){const med=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:null};const mR=med(comps.map(c=>c.rating)),mC=med(comps.map(c=>c.count||0)),mP=med(comps.map(c=>c.photos)),mO=med(comps.map(c=>c.ownerPhotos));data.median={rating:mR,count:mC,photos:mP,ownerPhotos:mO};
     const myR=place&&place.rating,myC=place&&place.userRatingCount;const below=(myR!=null&&mR!=null&&myR<mR)||(myC!=null&&mC!=null&&myC<mC);
     setAuto("3-3",below?"issue":"ok","Médiane des "+comps.length+" concurrents : "+(mR!=null?fr1(mR)+"/5":"—")+" et "+(mC??"—")+" avis"+(myR!=null?" · ce commerce : "+fr1(myR)+"/5 et "+(myC??0)+" avis":"")+".","Google Places, "+data.fetchedAt);
     if(below)findings.push({sev:2,text:"Les concurrents visibles ont en médiane "+(mR!=null?fr1(mR)+"/5":"")+" et "+mC+" avis, contre "+(myR!=null?fr1(myR)+"/5":"pas de note")+" et "+(myC??0)+" avis ici."});}
   }
  }else{
   const c=(data.osm&&data.osm.competitors)||[];data.competitors=c.slice(0,8).map(x=>({name:x.name,website:x.website,dist:distKm(data.loc||center,x.loc),hits:0}));
   if(c.length>=3)setAuto("3-3","info",c.length+" commerces similaires à moins de 2,5 km (OpenStreetMap) : "+c.slice(0,5).map(x=>x.name).join(", ")+". Notes à comparer sur Google Maps.","OpenStreetMap");
  }
  /* 4 bis. Carte de visibilité autour du commerce */
  if(hasKey()&&place&&data.loc&&!(googleBlocked&&["disabled","badkey","referer","billing"].includes(googleBlocked))){
   const gq=queries[0];setStep("grid","run","Carte de visibilité : 9 points autour du commerce","« "+gq+" »");
   try{const g=await visibilityGrid(gq,data.loc,place.id,1.5);data.grid=g;
    setStep("grid",g.top3>=6?"ok":"warn","Carte : dans les 3 premiers depuis "+g.top3+" endroit"+(g.top3>1?"s":"")+" sur "+g.total,gridVerdict(g)[1]);
    setAuto("3-5",(state.auto["3-5"]&&state.auto["3-5"].status==="issue")||g.top3<6?"issue":"ok",(state.auto["3-5"]?state.auto["3-5"].evidence+" ":"")+"Carte : dans les 3 premiers depuis "+g.top3+" endroits sur "+g.total+" autour du commerce.","Google Places, "+data.fetchedAt);
    if(g.top3<g.total)findings.push({sev:g.top3<=3?3:2,text:"Google Maps, recherche « "+gq+" » faite depuis 9 endroits autour du commerce : "+gridVerdict(g)[1].replace(/^./,c=>c.toLowerCase())});
   }catch(e){const f=frErr(e);setStep("grid","warn","Carte de visibilité non mesurée",f.text,f.link)}
  }
  /* 4 ter. Bing (et moteurs alimentés par Bing : DuckDuckGo, Copilot, Ecosia) */
  {const siteHost=hostOf((normalizeUrl(site)||{}).href||"");const kq=queries[0],bq=name+" "+city;
   setStep("bing","run","Recherche sur Bing","« "+kq+" » et « "+bq+" »");
   const [rk,rb]=await bingEarly;
   const mk=(r,q)=>{if(r.status!=="fulfilled")return null;const rows=r.value.rows.slice(0,10).map((x,i)=>({...x,pos:i+1,match:matchBiz(x,name,siteHost)}));const hit=rows.find(x=>x.match);return {query:q,engine:r.value.engine,rows,pos:hit?hit.pos:null,hitType:hit?hit.match:null}};
   const K=mk(rk,kq),B=mk(rb,bq);data.bing={keyword:K,brand:B,fetchedAt:nowLabel()};
   if(K||B){
    const dirs=[...new Set(((K&&K.rows)||[]).map(x=>x.host).filter(h=>/tripadvisor|pagesjaunes|restaurantguru|yelp|thefork|lafourchette|planity|treatwell|doctolib|houzz|habitatpresto|starofservice|travaux\.com|quotatis|allovoisins|seloger|logic-immo|bienici|leboncoin|vroomly|idgarages|annuaire|kelest|societe\.com|infobel|cylex|hoodspot|facebook|instagram|petitfute|google|booking|mappy|justacote|118712|ville-data|lacarte/i.test(h)))].slice(0,6);data.bing.directories=dirs;
    const brandOk=B&&B.pos&&B.pos<=3;const kwOk=K&&K.pos&&K.pos<=5;
    setAuto("3-6",brandOk&&kwOk?"ok":"issue",(K?"« "+kq+" » : "+(K.pos?"n° "+K.pos+(K.hitType==="site"?" (site officiel)":" (mention)"):"absent des 10 premiers")+". ":"")+(B?"Recherche du nom : "+(B.pos?"n° "+B.pos:"absent des 10 premiers")+".":""),(K||B).engine+", "+data.bing.fetchedAt);
    if(K&&!K.pos)findings.push({sev:2,text:"Sur Bing (qui alimente aussi DuckDuckGo et Copilot), le commerce n’apparaît pas dans les 10 premiers résultats pour « "+kq+" »"+(dirs.length?" ; Bing y met en avant "+dirs.slice(0,3).join(", "):"")+"."});
    if(B&&!B.pos)findings.push({sev:3,text:"Même en cherchant son nom sur Bing (« "+bq+" »), le commerce n’apparaît pas dans les 10 premiers résultats."});
    setStep("bing",K&&K.pos||B&&B.pos?"ok":"warn",(K?"« "+kq+" » : "+(K.pos?"n° "+K.pos:"absent du top 10"):"")+(B?" · nom : "+(B.pos?"n° "+B.pos:"absent du top 10"):""),(K||B).engine);
   }else setStep("bing","warn","Bing non mesuré","Le service de lecture est saturé : réessayez dans un instant.");
  }
  /* 5. Site web : Lighthouse + lecture du contenu + capture + domaine (en parallèle, sans clé) */
  let u=normalizeUrl(site);const plat=u&&platformOf(u.hostname);
  if(plat){data.sitePlatform={name:plat[0],kind:plat[1],url:u.href};state.biz.site="";if(plat[1]==="social"&&!(data.socials||[]).some(x=>x.net===plat[0]))(data.socials=data.socials||[]).push({net:plat[0],url:u.href});u=null}
  const compSites=hasKey()&&$("autoCompSpeed").checked?(data.competitors||[]).filter(c=>{const cu=normalizeUrl(c.website);return cu&&!platformOf(cu.hostname)}).slice(0,3):[];
  if(compSites.length)setStep("psic","run","Vitesse des sites concurrents",compSites.map(c=>c.name).join(", "));
  const compJobs=compSites.map(c=>pageSpeed(normalizeUrl(c.website).href,["performance"]).then(r=>{c.perf=r.scores.perf;c.lcp=r.lab.lcp}).catch(()=>{c.perf=null}));
  if(!u&&data.sitePlatform){const P0=data.sitePlatform,dead=P0.kind==="dead";
   const ev=dead?"Le lien « site web » de la fiche pointe vers un ancien site Google (business.site), supprimé par Google en 2024 : les clients tombent sur une page qui n’existe plus.":"Pas de site à lui : le lien « site web » "+(place?"de la fiche Google":"trouvé")+" renvoie vers "+(P0.kind==="social"?"sa page "+P0.name:P0.name)+".";
   setAuto("1-0","issue",ev,"Audit automatique, "+data.fetchedAt);
   findings.push({sev:3,text:ev+(dead?"":" Une page "+P0.name+" ne remplace pas un site : moins bien référencée sur Google, sans contrôle sur la présentation, et invisible pour les clients qui n’ont pas de compte.")});
   setStep("psi","warn",dead?"Lien de site mort (ancien site Google)":"Pas de site propre : la fiche renvoie vers "+P0.name,"Le site n’est donc pas analysé (vitesse, SEO, boutons). "+(dead?"Remplacer ce lien est urgent.":"Un site mobile simple est une vraie opportunité."));
  }
  else if(!u){const where=srcChecked.length?srcChecked.join(" ni sur "):"";if(!where){setAuto("1-0","info","Aucun site trouvé automatiquement : le commerce n’a été trouvé ni sur Google ni sur OpenStreetMap. Si un site existe, ajoutez-le dans les options et relancez.","Audit automatique, "+data.fetchedAt)}else{setAuto("1-0","issue","Aucun site web indiqué sur "+where+". Si un site existe, ajoutez-le dans les options et relancez.","Audit automatique, "+data.fetchedAt);const cw=(data.competitors||[]).slice(0,5),cws=cw.filter(c=>c.website).length;findings.push({sev:3,text:"Aucun site web n'est indiqué sur "+where+"."+(cw.length>=3?" "+cws+" des "+cw.length+" concurrents les plus visibles en ont un.":"")})}setStep("psi","warn","Pas de site web à analyser","Aucun site trouvé : c'est en soi une opportunité.")}
  else{
   state.biz.site=u.href;
   setStep("psi","run","Vitesse et qualité du site (Lighthouse mobile)","Compter 20 à 60 secondes.");
   setStep("html","run","Lecture du site : contenu, boutons, réseaux, suivi");
   setStep("shot","run","Capture mobile et technologies du site");
   const [rPsi,rHtml,rShot,rDom]=await Promise.allSettled([pageSpeed(u.href),fetchHtml(u.href).then(h=>analyzeHtml(h,u.href,{phone:state.biz.phone,city})),microlinkShot(u.href),domainInfo(u.hostname)]);
   const H=rHtml.status==="fulfilled"?rHtml.value:null,P=rPsi.status==="fulfilled"?rPsi.value:null,M=rShot.status==="fulfilled"?rShot.value:null,D=rDom.status==="fulfilled"?rDom.value:null;
   data.html=H;data.psi=P;data.tech=M&&M.tech||[];data.shotUrl=M&&M.shot||"";data.domain=D;
   const srcP=P?P.via+", "+P.fetchedAt:"",srcH="Lecture du site (Jina Reader), "+data.fetchedAt;
   /* Vitesse */
   if(P){const s=P.scores;
    const slow=(s.perf!=null&&s.perf<50)||(P.lab.lcpMs&&P.lab.lcpMs>4000);
    setAuto("1-1",slow?"issue":(s.perf!=null&&s.perf>=90?"ok":"info"),"Performance mobile "+(s.perf??"—")+"/100 · contenu principal affiché en "+(P.lab.lcp||"—")+(P.field.overall?" · Core Web Vitals réels : "+({FAST:"bons",AVERAGE:"moyens",SLOW:"mauvais"}[P.field.overall]||P.field.overall):""),srcP);
    if(slow)findings.push({sev:3,text:"Sur mobile, le site obtient "+(s.perf??"—")+"/100 en performance et affiche son contenu principal en "+(P.lab.lcp||"plusieurs secondes")+"."});
    setAuto("1-7",s.a11y!=null&&s.a11y<80?"issue":"ok","Accessibilité "+(s.a11y??"—")+"/100"+(P.audits.alt===false?" · images sans texte alternatif":""),srcP);
    setStep("psi","ok","Site mesuré : performance "+(s.perf??"—")+" · SEO "+(s.seo??"—")+" · accessibilité "+(s.a11y??"—")+" · bonnes pratiques "+(s.bp??"—"),P.via);
   }else setStep("psi","warn","Vitesse non mesurée",frErr(rPsi.reason).text+" Les autres contrôles du site sont faits.");
   /* Mobile */
   const mobileOk=H?H.viewport:(P?P.audits.viewport!==false:null);
   if(mobileOk!=null)setAuto("1-0",mobileOk?"ok":"issue",mobileOk?"Site présent et configuré pour mobile.":"Le site n'est pas configuré pour mobile (balise viewport absente).",H?srcH:srcP);
   if(mobileOk===false)findings.push({sev:3,text:"Le site n'est pas adapté aux téléphones."});
   /* HTTPS */
   const httpsBad=u.protocol==="http:"||(P&&P.audits.https===false)||(H&&H.mixed>0);
   setAuto("1-6",httpsBad?"issue":"ok",httpsBad?"Le site n'utilise pas entièrement HTTPS"+(H&&H.mixed?" ("+H.mixed+" élément(s) chargé(s) en http)":"")+".":"Connexion HTTPS active.",H?srcH:srcP);
   if(httpsBad)findings.push({sev:3,text:"Le site n'est pas entièrement sécurisé (HTTPS)."});
   /* SEO */
   const seoProbs=[];
   if(H){if(!H.title)seoProbs.push("titre de page absent");else if(city&&!norm(H.title).includes(norm(city)))seoProbs.push("la ville n'apparaît pas dans le titre");if(!H.metaDesc)seoProbs.push("méta-description absente");if(!H.h1s.length)seoProbs.push("aucun titre principal (H1)")}
   else if(P){if(P.audits.title===false)seoProbs.push("titre de page absent");if(P.audits.meta===false)seoProbs.push("méta-description absente")}
   if(P&&P.audits.crawlable===false)seoProbs.push("page bloquée pour Google");
   if(H||P)setAuto("1-4",seoProbs.length?"issue":"ok",[P&&P.scores.seo!=null&&"SEO technique "+P.scores.seo+"/100",H&&H.title&&"titre « "+H.title.slice(0,70)+" »",seoProbs.length?"à corriger : "+seoProbs.join(", "):"titre, description et H1 présents"].filter(Boolean).join(" · "),H?srcH:srcP);
   if(seoProbs.length)findings.push({sev:2,text:"Référencement du site : "+seoProbs.join(", ")+"."});
   /* Suivi publicitaire */
   const track=[...new Set([...(H?H.tracking:[]),...(P?P.tracking:[])])];data.tracking=track;
   if(H||P){const meta=track.includes("Pixel Meta"),gtm=track.includes("Google Tag Manager");setAuto("1-8",meta?"ok":gtm?"info":"issue",track.length?"Outils détectés : "+track.join(", ")+(meta?"":gtm?" · Pixel Meta non visible : il peut être installé via Google Tag Manager, à confirmer avec l’extension Meta Pixel Helper.":" · Pixel Meta non détecté."):"Aucun outil de mesure (Pixel Meta, Google Analytics) détecté sur la page d’accueil.",H?srcH:srcP);
    if(!meta&&!gtm)findings.push({sev:1,text:"Aucun Pixel Meta détecté sur le site : les futures publicités Facebook / Instagram ne pourraient pas être mesurées."})}
   if(H){
    setStep("html","ok","Site lu : "+(H.title?"« "+H.title.slice(0,60)+" »":"sans titre"),[H.socials.length?"Réseaux : "+H.socials.map(s=>s.net).join(", "):"aucun lien vers les réseaux",H.tel.length?"bouton d'appel":"pas de bouton d'appel",H.booking.length?"réservation : "+H.booking.join(", "):"pas de lien de réservation",H.cms?"site "+H.cms:""].filter(Boolean).join(" · "));
    /* Cohérence avec la fiche */
    if(H.phoneOnSite!=null||H.hoursOnSite||H.addressOnSite){const miss=[H.phoneOnSite===false&&"le téléphone de la fiche",!H.hoursOnSite&&"les horaires",!H.addressOnSite&&"l'adresse"].filter(Boolean);
     setAuto("1-2",miss.length?"issue":"ok",miss.length?"Absent(s) de la page d'accueil : "+miss.join(", ")+".":(H.phoneOnSite?"Téléphone identique à la fiche Google, ":"Téléphone, ")+"horaires et adresse présents sur la page d’accueil.",srcH);
     setAuto("4-2",miss.length?"issue":"ok",miss.length?"Infos pratiques incomplètes sur le site : "+miss.join(", ")+".":"Infos pratiques claires sur la page d'accueil.",srcH);
     if(H.phoneOnSite===false)findings.push({sev:2,text:"Le numéro de téléphone public du commerce ("+(place?"fiche Google":"OpenStreetMap")+") n'apparaît pas sur la page d'accueil du site."})}
    /* Boutons d'action */
    const ctas=[H.tel.length&&"appel",H.whatsapp&&"WhatsApp",H.booking.length&&"réservation, rendez-vous ou devis ("+H.booking.join(", ")+")"].filter(Boolean);
    setAuto("1-3",ctas.length?"ok":"issue",ctas.length?"Boutons d'action présents : "+ctas.join(", ")+".":"Aucun bouton d'appel cliquable, WhatsApp, ni lien de réservation, de rendez-vous ou de devis sur la page d'accueil.",srcH);
    if(!ctas.length)findings.push({sev:2,text:"Le site n'a ni bouton d'appel cliquable, ni WhatsApp, ni lien de réservation, de rendez-vous ou de devis : les visiteurs mobiles doivent chercher comment vous contacter."});
    /* Données structurées */
    const local=H.ldTypes.filter(t=>LOCAL_TYPES.test(t));
    setAuto("1-5",local.length?"ok":"issue",local.length?"Données structurées présentes : "+local.join(", ")+".":"Aucune donnée structurée LocalBusiness (adresse, horaires) pour Google et les IA"+(H.ldTypes.length?" (types présents : "+H.ldTypes.slice(0,4).join(", ")+")":"")+".",srcH);
    if(!local.length)findings.push({sev:1,text:"Le site ne fournit pas de données structurées « commerce local » : Google et les assistants IA lisent moins bien ses informations."});
    /* Réseaux sociaux */
    const allSoc=[...(data.socials||[])];H.socials.forEach(s=>{const idx=allSoc.findIndex(x=>(x.net||netOf(hostOf(x.url)))===s.net);if(idx<0)allSoc.push({...s,src:"site officiel"});else if(allSoc[idx].src==="OpenStreetMap"||!allSoc[idx].src)allSoc[idx]={...s,src:"site officiel"};});data.socials=allSoc;
    const hasFbIg=allSoc.some(s=>/Facebook|Instagram/.test(s.net));
    setAuto("2-0",hasFbIg?"ok":"issue",hasFbIg?"Comptes liés : "+allSoc.map(s=>s.net).join(", ")+". Activité récente à vérifier.":"Aucun lien vers Facebook ou Instagram depuis le site.",srcH);
    if(!hasFbIg)findings.push({sev:2,text:"Le site ne renvoie vers aucun compte Facebook ou Instagram."});
    if(allSoc.some(s=>s.net==="TikTok"))setAuto("2-1","ok","Compte TikTok lié depuis le site.",srcH);
    setAuto("2-4",allSoc.length?"info":"issue",allSoc.length?"Liens réseaux trouvés : "+allSoc.map(s=>s.net).join(", ")+". Vérifier nom, logo et coordonnées identiques.":"Aucun réseau lié : identité en ligne dispersée.",srcH);
    if(H.menuOnSite)setAuto("0-3","info","Le site présente une carte, des tarifs ou des prestations.",srcH);
    if(H.copyrightYear&&H.copyrightYear<new Date().getFullYear()-1)findings.push({sev:1,text:"La mention © du site indique "+H.copyrightYear+" : le site semble ne pas avoir été mis à jour depuis."});
   }else setStep("html","warn","Contenu du site non lu","Le site bloque peut-être la lecture automatique. "+frErr(rHtml.reason).text);
   const cmsName=(H&&H.cms)||(data.tech.find(t=>/CMS|Ecommerce|Website builder/i.test(t.cat))||{}).name||"";data.cms=cmsName;
   if(!M&&!(P&&P.shot))data.shotFallback="https://image.thum.io/get/width/600/crop/1200/noanimate/"+u.href;
   setStep("shot",M||(P&&P.shot)?"ok":"skip",M?"Capture mobile réalisée"+(data.tech.length?" · technologies : "+data.tech.slice(0,5).map(t=>t.name).join(", "):""):(P&&P.shot?"Capture mobile réalisée (Lighthouse)":"Capture : service principal saturé, service de secours utilisé"),M?(D&&D.created?"Nom de domaine enregistré en "+new Date(D.created).getFullYear():""):(D&&D.created?"Nom de domaine enregistré en "+new Date(D.created).getFullYear():""));
  }
  if(compJobs.length){await Promise.all(compJobs);const done=compSites.filter(c=>c.perf!=null);setStep("psic",done.length?"ok":"warn",done.length?"Vitesse comparée avec "+done.length+" site"+(done.length>1?"s":"")+" concurrent"+(done.length>1?"s":""):"Vitesse des concurrents non mesurée",done.map(c=>c.name+" : "+c.perf+"/100").join(" · "));
   const mine=data.psi&&data.psi.scores.perf;const faster=done.filter(c=>mine!=null&&c.perf>mine);if(mine!=null&&faster.length)findings.push({sev:2,text:faster.length+" concurrent"+(faster.length>1?"s":"")+" sur "+done.length+(faster.length>1?" ont":" a")+" un site plus rapide sur mobile ("+faster.map(c=>c.name+" : "+c.perf+"/100").join(", ")+", contre "+mine+"/100)."});}
  /* 5 bis. Réseaux sociaux */
  setStep("social","run","Présence sur les réseaux sociaux","Facebook, Instagram, TikTok, YouTube, Snapchat");
  try{const known=[...(data.socials||[]).map(s=>({...s,src:s.src||"source locale"}))];const sc=await socialScan(name,city,known);data.social=sc;
   const F=sc.found,list=NETS.map(n=>n[0]).filter(n=>F[n]);
   const searched=!!sc.engine;const searchUnavailable=!searched;
   setAuto("2-0",F.Facebook&&F.Instagram?"ok":(F.Facebook||F.Instagram)?(searched?"issue":"info"):searched?"issue":"info",(F.Facebook&&F.Instagram)?"Comptes Facebook et Instagram trouvés. Fréquence des publications à vérifier.":(F.Facebook||F.Instagram)?(F.Facebook?"Facebook":"Instagram")+" trouvé, mais "+(F.Facebook?"Instagram":"Facebook")+" non trouvé (ni relié depuis le site, ni par recherche).":(searchUnavailable?"Recherche web indisponible : impossible de conclure sur la présence des comptes. Les liens connus sont conservés ; relancez la recherche ou vérifiez manuellement.":"Aucun compte Facebook ni Instagram détecté par les sources consultées ; vérifier manuellement avant de conclure."),"Recherche des réseaux, "+data.fetchedAt);
   setAuto("2-1",F.TikTok?"ok":"info",F.TikTok?"Compte TikTok détecté : "+F.TikTok.url+" (ouvrir le lien et confirmer qu’il s’agit du bon commerce).":"TikTok non détecté par les sources consultées. Cela ne prouve pas que le compte est absent : vérification manuelle recommandée.",F.TikTok?(F.TikTok.src||"Recherche web"):"Recherche web ciblée · "+data.fetchedAt);
   setAuto("2-4",list.length?"info":searchUnavailable?"info":"issue",list.length?"Réseaux trouvés : "+list.join(", ")+". Vérifier nom, logo et coordonnées identiques.":searchUnavailable?"Recherche web indisponible : la présence des réseaux reste indéterminée.":"Aucun réseau détecté par les sources consultées ; vérifier manuellement avant de conclure.","Recherche des réseaux, "+data.fetchedAt);
   if(!F.Facebook&&!F.Instagram){if(searched)findings.push({sev:3,text:"Aucun compte Facebook ni Instagram n’a été trouvé pour le commerce (ni sur son site, ni par recherche) : ce sont pourtant les premiers réseaux consultés avant de choisir un commerce local."})}
   else{const miss=["Instagram","Facebook","TikTok"].filter(n=>!F[n]);if(miss.length)findings.push({sev:1,text:"Réseaux détectés : "+list.join(", ")+". Comptes non détectés par les sources consultées : "+miss.join(", ")+". Cela ne prouve pas leur absence ; vérifier chaque plateforme manuellement avant de conclure."})}
   setStep("social",list.length?"ok":"warn",list.length?"Réseaux détectés : "+list.join(", "):searchUnavailable?"Recherche indisponible — résultat inconclusif":"Aucun compte détecté automatiquement",list.length?"Résultats à vérifier : "+list.join(", ")+".":searchUnavailable?"Les sources de recherche n’ont pas répondu ; ne pas conclure à l’absence de comptes.":"Non détectés (à confirmer manuellement) : "+NETS.map(n=>n[0]).filter(n=>!F[n]).join(", ")+".");
  }catch(e){setStep("social","warn","Réseaux sociaux non vérifiés",frErr(e).text)}
  /* 6. Visibilité IA : Gemini avec Recherche Google, puis questions prêtes pour les autres assistants */
  $("campaignBusiness").value=name;$("campaignCity").value=city;$("campaignType").value=typeInfo(type).kw||type;$("campaignService").value="";
  if(!state.campaignPrompts.length||state.campaign.name!==name)getCampaignPrompts(true);
  if(hasKey()){
   const kw=kwOf(type),fem=!!typeInfo(type).f;
   const known=!!typeInfo(type).kw;const QS=[["Découverte locale",(known?"Je cherche "+artOf(type)+kw+" à "+city:"Je cherche à "+city+" un établissement de ce type : « "+kw+" »")+". Quels établissements me recommandes-tu ? Réponds avec une liste numérotée."],["Meilleur choix",(known?(fem?"Quelle est la ":"Quel est le ")+bestOf(type)+kw+" à "+city:"Quels sont les meilleurs établissements de ce type à "+city+" : « "+kw+" »")+" et dans les environs ? Donne une liste numérotée de 5 établissements maximum avec la raison."],["Marque exacte","Que sais-tu de « "+name+" » à "+city+" ? Adresse, horaires, avis, site officiel et réseaux sociaux."]];
   setStep("ai","run","Test IA : Gemini avec Recherche Google","3 questions de clients");
   state.aiTests=state.aiTests.filter(t=>!t.auto);const out=[];let aiErr=null;
   for(const [kind,q] of QS){try{const r=await geminiAsk(q);const neg=/(pas (pu )?trouv|aucune information|pas d.information|ne (dispose|trouve) pas|introuvable)/i.test(r.text);const present=aiMentions(r.text,name)&&!(kind==="Marque exacte"&&neg);const rank=kind!=="Marque exacte"?aiRank(r.text,name):null;const comps=(data.competitors||[]).filter(c=>c.name&&aiMentions(r.text,c.name)).map(c=>c.name);
     out.push({kind,q,present,rank,partial:kind==="Marque exacte"&&neg,competitors:comps,sources:r.sources.slice(0,5),excerpt:r.text.slice(0,700),model:r.model});
     state.aiTests.push({auto:true,platform:"Google Gemini",date:today(),prompt:q,presence:present?"yes":(kind==="Marque exacte"&&neg?"partial":"no"),rank:rank?String(rank):"",competitors:comps.join(", "),source:(r.sources[0]||{}).uri||"",notes:"Test automatique ("+r.model+" + Recherche Google) · "+kind,campaignId:"",campaignPromptId:""});
    }catch(e){aiErr=e;break}}
   data.aiAuto=out;
   if(out.length){const yes=out.filter(o=>o.present).length;setStep("ai",yes?"ok":"warn","Gemini cite le commerce dans "+yes+" réponse"+(yes>1?"s":"")+" sur "+out.length,"Les 6 questions pour ChatGPT, Claude, Perplexity… sont prêtes dans « Visibilité IA ».");
    const disc=out.filter(o=>o.kind!=="Marque exacte");if(disc.length&&!disc.some(o=>o.present))findings.push({sev:3,text:"Quand on demande à l’IA de Google (Gemini, avec recherche web) "+"de recommander "+(typeInfo(type).kw?artOf(type)+kwOf(type):"un établissement « "+kwOf(type)+" »")+" à "+city+", elle "+(disc.flatMap(o=>o.competitors).length?"cite "+[...new Set(disc.flatMap(o=>o.competitors))].slice(0,3).join(", ")+", mais pas le commerce.":"ne cite pas le commerce.")});
   }else{const f=frErr(aiErr);setStep("ai","warn",f.code==="disabled"||f.code==="blocked"?"Test IA : Gemini à activer sur votre clé":"Test IA automatique non réalisé",f.text+" Les 6 questions pour les assistants sont prêtes dans « Visibilité IA ».",f.link)}
   drawAiTests();
  }else setStep("ai","ok","6 questions IA prêtes","Ajoutez une clé Google pour tester Gemini automatiquement ; les autres assistants s’ouvrent avec la question déjà remplie.");
  aiAutoChecks();
  data.findings=findings.sort((a,b)=>b.sev-a.sev);
  state.data=data;
  hydrateBizFields();
  state.pitch=buildPitch();
  persistLocal();
  renderClientSelect();renderChecklist();update();renderAutoSummary();renderPlaceChoice();$("pitchText").value=state.pitch;renderTools();
  $("progDetails").open=false;$("progTitle").textContent="Analyse terminée : voir les "+steps.length+" étapes";
  $("autoSummaryCard").scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
  toast("Audit terminé : résultats ci-dessous.");
 }catch(e){
  if(e&&e.stop){Object.assign(state,{auto:backup.auto,checks:backup.checks,issues:backup.issues,data:backup.data||{},biz:{...backup.biz,name,city}});
   if(e.stop==="offline")setStep("net","err","Pas de connexion internet","Connectez-vous (Wi-Fi ou données mobiles) puis relancez l’audit. Les résultats précédents de ce client n’ont pas été modifiés.");
   else setStep("notfound","err","Commerce introuvable : « "+name+" » à "+city,"Aucune fiche Google ni OpenStreetMap ne correspond. Vérifiez l’orthographe et la ville, puis tapez le début du nom et choisissez le commerce dans la liste qui s’affiche.");
   toast(e.stop==="offline"?"Pas de connexion internet.":"Commerce introuvable : vérifiez le nom.");renderChecklist();update();renderAutoSummary();
  }else setStep("fatal","err","Erreur inattendue",frErr(e).text)}
 finally{running=false;document.body.classList.remove("scanning");$("runAuto").disabled=false;$("runAuto").textContent="Relancer l'audit";state.data.steps=steps;persistLocal()}
}
function hydrateBizFields(){fields.forEach(id=>{if(state.biz[id]!==undefined&&state.biz[id]!==null)$(id).value=state.biz[id]});$("autoSite").value=state.biz.site||"";$("autoKeyword").value=state.biz.keyword||""}

function kpiBox(v,label,cls){return '<div class="kpi '+(cls||"")+'"><b>'+v+'</b><span>'+label+'</span></div>'}
function cwvLabel(m,unit){if(!m)return "—";const v=unit==="s"?fr1(m.p75/1000)+" s":unit==="cls"?fr1(m.p75/100):m.p75+" ms";return v+" ("+({FAST:"bon",AVERAGE:"moyen",SLOW:"mauvais"}[m.cat]||"—")+")"}
function verdict(score){return score===null?["Audit à compléter","Lancez l'audit ou cochez les contrôles de la checklist."]:score>=85?["Bonne visibilité","Les fondamentaux sont en place ; quelques optimisations restent possibles."]:score>=60?["Visibilité à renforcer","Plusieurs points freinent la découverte du commerce par de nouveaux clients."]:["Visibilité insuffisante","Des points importants empêchent le commerce d'être trouvé et choisi en ligne."]}
function scoreTile(score,small){
 const [t,sx]=verdict(score);
 return '<div class="scoretile"><div class="tile'+(small?" sm":"")+'" role="img" aria-label="Score '+(score??"non calculé")+' sur 100"><span class="sig"></span><span class="n">'+(score??"—")+'</span><span class="d">sur 100</span></div><div class="verdict"><b>'+esc(t)+'</b><span>'+esc(sx)+'</span></div></div>';
}
function gauge(score){return scoreTile(score,true)}
function frDate(iso){if(!iso)return "";const d=new Date(iso.length===10?iso+"T12:00:00":iso);return isNaN(d)?iso:d.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}
function hbars(title,sub,items,fmt){
 const vals=items.map(i=>i.value).filter(v=>v!=null&&!isNaN(v));if(!vals.length)return "";
 const max=Math.max(...vals,1);
 return '<div class="chartbox"><h4>'+esc(title)+'</h4>'+(sub?'<p>'+esc(sub)+'</p>':'')+'<div class="hbars">'+items.map(i=>'<div class="hbar'+(i.me?" me":"")+'" title="'+esc(i.label+" : "+(i.value==null?"non mesuré":fmt(i.value)))+'"><span class="lab">'+esc(i.label)+'</span><span class="trk"><span class="fill" style="display:block;width:'+(i.value==null?0:Math.max(1,i.value/max*100)).toFixed(1)+'%"></span></span><span class="val">'+(i.value==null?"—":fmt(i.value))+'</span></div>').join("")+'</div></div>';
}
function kpiRow(){
 const d=state.data||{},p=d.place,ps=d.psi,vis=d.visibility,rk=d.ranking;
 if(d.fetchedAt&&!p){const H=d.html,ctas=H?[H.tel.length,H.whatsapp,H.booking.length].filter(Boolean).length:null,soc=(d.socials||[]).length,comp=(d.competitors||[]).length,hasSite=!!normalizeUrl(state.biz.site);
  return '<div class="kpis">'+kpiBox(ps&&ps.scores.perf!=null?ps.scores.perf+"/100":(hasSite?"—":"Aucun site"),"Vitesse du site (mobile)",ps?scoreColor(ps.scores.perf):(hasSite?"":"bad"))+kpiBox(H?ctas+"<small style=font-size:12px> / 3</small>":"—","Boutons d’action (appel, WhatsApp, réservation)",H?(ctas>=2?"good":ctas?"mid":"bad"):"")+kpiBox(soc,"Réseaux sociaux liés",soc>=2?"good":soc?"mid":"bad")+kpiBox(comp,"Commerces similaires à proximité","")+'</div>'}
 return '<div class="kpis">'+kpiBox(p?(p.rating!=null?fr1(p.rating)+"/5":"Aucune"):"—","Note Google",p?(p.rating!=null?(p.rating>=4.5?"good":p.rating>=4.2?"mid":"bad"):"bad"):"")+kpiBox(p?(p.userRatingCount||0):"—","Avis Google",p?((p.userRatingCount||0)>=100?"good":(p.userRatingCount||0)>=50?"mid":"bad"):"")
 +(vis&&vis.n>1?kpiBox(vis.top3+'<small style="font-size:12px"> / '+vis.n+'</small>',"Recherches où il est dans le top 3",vis.top3===vis.n?"good":vis.top3?"mid":"bad"):kpiBox(rk?(rk.rank?rk.rank+'<small style="font-size:12px"> / '+rk.total+'</small>':"Absent"):"—","Position « "+esc(rk?rk.query:"recherche locale")+" »",rk?(rk.rank&&rk.rank<=3?"good":rk.rank&&rk.rank<=10?"mid":"bad"):""))
 +kpiBox(ps&&ps.scores.perf!=null?ps.scores.perf+"/100":(d.fetchedAt&&!normalizeUrl(state.biz.site)?"Aucun site":"—"),"Vitesse du site (mobile)",ps?scoreColor(ps.scores.perf):(d.fetchedAt&&!normalizeUrl(state.biz.site)?"bad":""))+'</div>';
}
function findingsHtml(){const f=(state.data&&state.data.findings)||[];return f.length?'<ul class="findings">'+f.map(x=>'<li>'+esc(x.text)+'</li>').join("")+'</ul>':''}
function strengths(){return keys.filter(k=>state.auto[k]&&state.auto[k].status==="ok"||(!state.auto[k]&&state.checks[k]&&!state.issues[k])).map(k=>{const [gi,ii]=k.split("-").map(Number);return {it:groups[gi].items[ii],ev:state.auto[k]&&state.auto[k].evidence}})}
function siteBlock(){
 const d=state.data||{},ps=d.psi,H=d.html;if(!ps&&!H&&!d.shotUrl&&!d.shotFallback)return "";
 const shot=d.shotUrl||(ps&&ps.shot)||d.shotFallback||"";
 const yes=(ok,t,extra)=>'<li class="'+(ok?"ok":"ko")+'"><span aria-hidden="true">'+(ok?"✓":"✕")+'</span> '+esc(t)+(extra?' <span class="muted">— '+esc(extra)+'</span>':'')+'</li>';
 const track=d.tracking||(ps&&ps.tracking)||[];
 const checks=H?'<ul class="ticks">'+yes(H.viewport,"Adapté aux téléphones")+yes(!(state.biz.site||"").startsWith("http:")&&!H.mixed,"Connexion sécurisée HTTPS")+yes(H.tel.length>0,"Bouton d’appel cliquable")+yes(H.whatsapp,"Contact WhatsApp")+yes(H.booking.length>0,"Réservation ou commande en ligne",H.booking.join(", "))+yes(H.socials.length>0,"Liens vers les réseaux sociaux",H.socials.map(s=>s.net).join(", "))+yes(!!H.title&&!!H.metaDesc,"Titre et description pour Google")+yes(H.hoursOnSite&&H.addressOnSite,"Horaires et adresse visibles")+yes(H.ldTypes.some(t=>LOCAL_TYPES.test(t)),"Données structurées « commerce local »")+yes(track.includes("Pixel Meta"),"Pixel Meta (mesure des publicités)")+'</ul>':'';
 const info=[d.cms&&"Réalisé avec "+d.cms,d.domain&&d.domain.created&&"domaine enregistré en "+new Date(d.domain.created).getFullYear(),H&&H.copyrightYear&&"mention © "+H.copyrightYear,track.length&&"suivi : "+track.join(", ")].filter(Boolean).join(" · ");
 return '<div class="siteblock">'+(shot?'<img class="shot" src="'+esc(shot)+'" alt="Capture du site sur téléphone" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">':'')+'<div style="flex:1 1 280px;min-width:0">'
  +(ps?'<div class="kpis">'+kpiBox(ps.scores.perf??"—","Performance",scoreColor(ps.scores.perf))+kpiBox(ps.scores.seo??"—","SEO",scoreColor(ps.scores.seo))+kpiBox(ps.scores.a11y??"—","Accessibilité",scoreColor(ps.scores.a11y))+kpiBox(ps.scores.bp??"—","Bonnes pratiques",scoreColor(ps.scores.bp))+'</div><p class="muted" style="margin:8px 0 0">Contenu principal affiché en <b>'+esc(ps.lab.lcp||"—")+'</b> · stabilité visuelle <b>'+esc(ps.lab.cls||"—")+'</b> · blocage <b>'+esc(ps.lab.tbt||"—")+'</b>'+(ps.field.lcp?'<br>Mesures réelles des visiteurs : LCP '+cwvLabel(ps.field.lcp,"s")+" · INP "+cwvLabel(ps.field.inp,"ms")+" · CLS "+cwvLabel(ps.field.cls,"cls"):'')+'</p>':'<p class="muted">Vitesse non mesurée lors de cet audit.</p>')
  +checks+(info?'<p class="muted" style="margin:6px 0 0">'+esc(info)+'</p>':'')+'<p class="muted" style="margin:4px 0 0"><small>'+esc(state.biz.site||"")+(ps?" · "+esc(ps.via||"")+" · "+esc(ps.fetchedAt):"")+'</small></p></div></div>';
}
function compBlock(forReport){
 const d=state.data||{},p=d.place,comps=d.competitors||[],R=d.rankings||(d.ranking?[d.ranking]:[]);
 if(!comps.length&&!R.length)return "";
 const myName=(p&&p.displayName&&p.displayName.text)||state.biz.name||"Commerce audité";
 let h="";
 if(R.length)h+='<div class="box" style="margin-top:6px"><h3>Position sur les recherches clients</h3>'+R.map(r=>'<div class="qrow"><span>« '+esc(r.query)+' »</span><b>'+(r.rank?"n° "+r.rank+" / "+r.total:"absent des "+r.total+" premiers")+'</b></div>').join("")+'<p class="muted" style="margin:6px 0 0">Recherche Google Places du '+esc(d.fetchedAt||"")+'. Les résultats Maps réels varient selon la position et l’historique de chaque personne.</p></div>';
 const top=comps.slice(0,6);
 if(p&&top.length){
  const me={label:myName,me:true},rows=[me,...top.map(c=>({label:c.name,c}))];
  const mk=(f,mev)=>rows.map(r=>({label:r.label,me:r.me,value:r.me?mev:f(r.c)}));
  h+='<div class="charts">'+hbars("Nombre d’avis Google","Plus d’avis = plus de confiance et de visibilité",mk(c=>c.count??null,p.userRatingCount??null),v=>String(Math.round(v)))
   +hbars("Note Google","Sur 5",mk(c=>c.rating??null,p.rating??null),v=>fr1(v))
   +hbars("Photos du propriétaire","Parmi les photos que Google met en avant (10 au maximum)",mk(c=>c.ownerPhotos??null,d.ownerPhotos??null),v=>String(v))
   +(top.some(c=>c.perf!=null)||d.psi?hbars("Vitesse du site sur mobile","Score PageSpeed / 100",mk(c=>c.perf??null,d.psi&&d.psi.scores.perf),v=>String(v)):"")+'</div>';
 }
 if(comps.length&&!p){h+='<h3 style="margin-top:14px">Commerces similaires à proximité</h3><p class="muted">Source : OpenStreetMap. Ajoutez une clé Google pour comparer notes, avis et positions.</p><div class="tablewrap"><table class="t"><thead><tr><th>Établissement</th><th>Site web</th><th>Distance</th></tr></thead><tbody>'+comps.map(c=>'<tr><td>'+esc(c.name)+'</td><td>'+(c.website?"Oui":"Non")+'</td><td>'+(c.dist!=null?fr1(c.dist)+" km":"—")+'</td></tr>').join("")+'</tbody></table></div>';return h}
 if(comps.length){h+='<h3 style="margin-top:14px">Concurrents les plus visibles</h3><div class="tablewrap"><table class="t comp"><thead><tr><th>Établissement</th><th>Meilleure position</th><th>Note</th><th>Avis</th><th>Photos pro</th><th>Site</th><th>Distance</th></tr></thead><tbody>'
  +(p?'<tr class="me"><td>'+esc(myName)+' (audité)</td><td>'+(R.some(r=>r.rank)?"n° "+Math.min(...R.filter(r=>r.rank).map(r=>r.rank)):"absent")+'</td><td>'+(p.rating!=null?fr1(p.rating):"—")+'</td><td>'+(p.userRatingCount??"—")+'</td><td>'+(d.ownerPhotos??"—")+' / '+((p.photos||[]).length)+'</td><td>'+(d.psi?d.psi.scores.perf+"/100":p.websiteUri?"Oui":"Non")+'</td><td>—</td></tr>':'')
  +comps.map(c=>'<tr><td>'+(c.url&&!forReport?'<a href="'+esc(safeUrl(c.url))+'" target="_blank" rel="noopener">'+esc(c.name)+'</a>':esc(c.name))+'</td><td>'+(c.bestRank?"n° "+c.bestRank+(c.hits>1?" ("+c.hits+" recherches)":""):"—")+'</td><td>'+(c.rating!=null?fr1(c.rating):"—")+'</td><td>'+(c.count??"—")+'</td><td>'+(c.ownerPhotos!=null?c.ownerPhotos+" / "+c.photos:"—")+'</td><td>'+(c.perf!=null?c.perf+"/100":c.website?"Oui":"Non")+'</td><td>'+(c.dist!=null?fr1(c.dist)+" km":"—")+'</td></tr>').join("")+'</tbody></table></div>'}
 return h;
}
function googleBlock(){
 const d=state.data||{},p=d.place;if(!p)return "";
 return '<div class="kpis">'+kpiBox(p.rating!=null?fr1(p.rating)+"/5":"Aucune","Note",p.rating!=null?(p.rating>=4.5?"good":p.rating>=4.2?"mid":"bad"):"bad")+kpiBox(p.userRatingCount||0,"Avis",(p.userRatingCount||0)>=100?"good":(p.userRatingCount||0)>=50?"mid":"bad")+kpiBox((d.ownerPhotos??"—")+(d.photos!=null?'<small style="font-size:13px"> / '+d.photos+'</small>':""),"Photos du propriétaire",d.ownerPhotos==null?"":d.ownerPhotos>=6?"good":d.ownerPhotos>=3?"mid":"bad")+kpiBox(d.daysSinceReview!=null?d.daysSinceReview+" j":"—","Âge de l’avis le plus récent parmi les 5 mis en avant","")+'</div>'
 +'<div class="twocol" style="margin-top:12px"><div class="box"><h3>Informations affichées</h3><ul><li>Catégorie : '+esc((p.primaryTypeDisplayName&&p.primaryTypeDisplayName.text)||p.primaryType||"non communiquée")+'</li><li>Adresse : '+esc(p.formattedAddress||"absente")+'</li><li>Téléphone : '+esc(p.nationalPhoneNumber||"absent")+'</li><li>Site : '+esc(p.websiteUri||"absent")+'</li>'+(state.biz.reg?'<li>Registre SIRENE : '+esc((nafInfo(state.biz.reg.naf)||[state.biz.reg.naf])[0])+(state.biz.reg.date?', ouvert en '+esc(fmtOpen(state.biz.reg.date)):'')+'</li>':'')+''+(d.services?'<li>Services : '+esc(d.services.join(", "))+'</li>':'')+'</ul></div><div class="box"><h3>Horaires</h3>'+((d.hours||[]).length?'<ul class="hours">'+d.hours.map(h=>'<li>'+esc(h)+'</li>').join("")+'</ul>':'<p class="muted">Aucun horaire publié.</p>')+'</div></div>'
 +((d.reviews||[]).length?'<h3 style="margin-top:14px">Avis les plus pertinents selon Google</h3>'+d.reviews.map(r=>'<div class="review"><b aria-label="'+(r.rating||0)+' sur 5">'+"★".repeat(r.rating||0)+"☆".repeat(5-(r.rating||0))+'</b> <span class="muted">'+esc(r.when)+'</span><br>'+esc(r.text||"(sans texte)")+'</div>').join(""):"");
}
function partialNote(){const d=state.data||{};if(!d.fetchedAt||!d.partial)return "";return '<div class="partial"><b>Audit partiel</b><span>'+(d.unverified?"Le commerce n’a été trouvé ni sur Google ni sur OpenStreetMap : les résultats reposent sur Bing, les réseaux sociaux et le site s’il est connu. Vérifiez le nom ou ajoutez une clé Google.":"La fiche Google n’a pas été analysée"+(hasKey()?" (clé Google à corriger)":" (pas de clé Google)")+" : note, avis, photos et positions Google ne sont pas inclus dans le score.")+'</span></div>'}
function bizLine(){const b=state.biz||{},r=b.reg,ni=r&&nafInfo(r.naf);const parts=[ni?ni[0]:b.type,b.city,r&&r.date?"ouvert en "+fmtOpen(r.date)+" ("+ageText(r.date).replace(/^ouvert /,"")+")":""].filter(Boolean);return parts.length?'<p class="bizline">'+esc(parts.join(" · "))+'</p>':''}
function renderAutoSummary(){
 const d=state.data||{};
 $("autoToReport").classList.toggle("hidden",!d.fetchedAt);
 if(!d.fetchedAt){$("autoSummaryCard").classList.add("hidden");$("autoSummary").innerHTML="";return}
 $("autoSummaryCard").classList.remove("hidden");const sc=calc().score;
 $("autoSummary").innerHTML='<h2 style="margin-bottom:4px">'+esc(state.biz.name||"Résultats")+'</h2>'+bizLine()+scoreTile(sc)+partialNote()+kpiRow()+(d.findings&&d.findings.length?'<h3 style="margin-top:22px">Opportunités repérées</h3>'+findingsHtml():'')+(socialBlock(false)?'<h3 style="margin-top:22px">Réseaux sociaux</h3>'+socialBlock(false):'')+(d.place?'<h3 style="margin-top:22px">Photos de la fiche</h3>'+photosBlock():'')+(gridBlock()?'<h3 style="margin-top:22px">Où le commerce est vu sur Google Maps</h3>'+gridBlock():'')+compBlock(false)+(bingBlock(false)?'<h3 style="margin-top:22px">Visibilité sur Bing</h3>'+bingBlock(false):'')+(aiAutoBlock(false)?'<h3 style="margin-top:22px">Ce que répond l’IA de Google</h3>'+aiAutoBlock(false):'')+((d.psi||d.html)?'<h3 style="margin-top:22px">Le site sur téléphone</h3>'+siteBlock():'')+'<div class="actions" style="margin-top:14px"><button class="btn primary" data-go2="report">Ouvrir le rapport client</button><button class="btn" data-go2="pitch">Rédiger le message</button></div>';
 glossify($("autoSummary"));
 $("autoSummary").querySelectorAll("[data-go2]").forEach(b=>b.onclick=()=>nav(b.dataset.go2));
}

/* ---------- Blocs d'affichage v5 ---------- */
/* Logos officiels des réseaux */
const NET_ICON={Facebook:"facebook",Instagram:"instagram",TikTok:"tiktok",YouTube:"youtube",Snapchat:"snapchat"};
function netIcon(n,size,off){const f=NET_ICON[n];return f?'<img class="nico'+(off?" off":"")+'" src="assets/social/'+f+'.png" alt="" width="'+(size||28)+'" height="'+(size||28)+'">':""}
function socialBlock(forReport){
 const S=(state.data||{}).social;if(!S)return "";
 const deep=S.deepCandidates||{};
 const cards=NETS.map(([n])=>{
  const f=S.found&&S.found[n];let handlePath="";
  if(f){try{handlePath=decodeURIComponent(new URL(f.url).pathname.split("/").filter(Boolean)[0]||"")}catch(e){}}
  const handle=handlePath.startsWith("@")?handlePath.slice(1):handlePath;
  const confirmed=!!(f&&f.verified===true);
  const label=f?(forReport?esc(handle?"@"+handle:(confirmed?"Confirmé":"Profil trouvé")):'<a href="'+esc(safeUrl(f.url))+'" target="_blank" rel="noopener">'+esc(handle?"@"+handle:(confirmed?"Voir le compte":"Ouvrir le profil"))+'</a>'):"À vérifier";
  const status=f?(confirmed?"Confirmé manuellement":"Non confirmé — correspondance incertaine"):"Aucun compte confirmé";
  const src=f&&f.src?'<small class="soc-source">'+esc(f.src==="vérification manuelle"?"Vérifié manuellement":f.src)+'</small>':"";
  const rejectedForNet=(S.rejected||[]).filter(x=>x&&x.net===n&&x.url);
   const searchUrl="https://www.google.com/search?q="+encodeURIComponent('"'+String(state.biz.name||"").trim()+'" '+String(state.biz.city||"").trim()+" site:"+match[1]);
   const controls=forReport?"":'<div class="soc-actions">'+(f?'<button type="button" class="soc-mini" data-social-incorrect="'+esc(n)+'" title="Signaler ce profil comme incorrect">Incorrect ?</button>':rejectedForNet.length?'<button type="button" class="soc-mini" data-social-restore="'+esc(n)+'" title="Annuler le signalement si ce profil était correct">Annuler le signalement</button>':'<a class="soc-mini soc-link" href="'+esc(searchUrl)+'" target="_blank" rel="noopener" title="Chercher le profil public sur Google">Google</a><button type="button" class="soc-mini" data-social-manual="'+esc(n)+'" title="Ajouter le lien public trouvé manuellement">Ajouter</button>')+'<button type="button" class="soc-mini" data-social-deep="'+esc(n)+'" title="Rechercher d’autres profils avec Bing">Autres pistes</button></div>';
  const suggestions=deep[n]&&deep[n].length?deep[n]:(S.candidates&&S.candidates[n]||[]);
  const options=(suggestions.length&&!forReport)?'<div class="soc-candidates"><small>Profils possibles — ouvrez le lien et vérifiez le commerce avant de choisir</small>'+suggestions.slice(0,5).map(c=>'<div class="soc-candidate-row"><a href="'+esc(safeUrl(c.url))+'" target="_blank" rel="noopener">'+esc(c.title||c.url)+'</a><button type="button" class="soc-mini" data-social-pick="'+esc(n)+'" data-social-url="'+esc(c.url)+'">Utiliser</button></div>').join("")+'</div>':"";
  return '<div class="socwrap"><div class="soc '+(confirmed?"on":f?"candidate":"off")+'">'+netIcon(n,32,!f)+'<span class="sname">'+esc(n)+'</span><span class="sstate">'+label+'<small class="soc-verification">'+status+'</small>'+src+controls+'</span></div>'+options+'</div>';
 }).join("");
 return '<div class="socials">'+cards+'</div><p class="muted"><small>Règle stricte : un résultat de recherche n’est jamais considéré comme officiel sans vérification. Vérifiez le nom exact, la ville, les photos et les coordonnées. « Incorrect ? » retire le résultat de cet audit ; « Recherche approfondie » propose d’autres profils possibles.</small></p>';
}
async function deepSocialSearch(net){
 const d=state.data||{},S=d.social||(d.social={found:{},checked:NETS.map(x=>x[0])});
 const match=NETS.find(x=>x[0]===net);if(!match)throw new Error("Réseau inconnu");
 const domain=match[1],name=String(state.biz.name||"").trim(),city=String(state.biz.city||"").trim(),address=String(state.biz.address||"").trim();S.found=S.found||{};
 if(!name){toast("Renseignez d’abord le nom exact du commerce.");return}
 const queries=[
  '"'+name+'" "'+city+'" site:'+domain,
  '"'+name+'" "'+address+'" site:'+domain,
  '"'+name+'" site:'+domain,
  '"'+name+'" '+city+' '+domain,
  '"'+name.replace(/["']/g,"")+'" profil officiel '+net+' '+city,
  '"'+name+'" '+(state.biz.phone||"")+' site:'+domain
 ].filter((q,i,a)=>a.indexOf(q)===i);
 const canonical=url=>{try{const u=new URL(url);u.hash="";u.hostname=u.hostname.toLowerCase();if(u.hostname.startsWith("www."))u.hostname=u.hostname.slice(4);while(u.pathname.length>1&&u.pathname.endsWith("/"))u.pathname=u.pathname.slice(0,-1);return u.href}catch(e){return String(url||"")}};const rejected=(S.rejected||[]).filter(x=>x.net===net).map(x=>canonical(x.url));
 const all=[];for(const q of queries){try{const r=await bingSearch(q);all.push(...(r.rows||[]))}catch(e){}}
 const normText=v=>norm(String(v||""));
 const compact=v=>normText(v).replace(/[^a-z0-9]/g,"");
 const tokens=[...new Set(toks(name).filter(w=>w.length>=3))],cityTokens=[...new Set(toks(city).filter(w=>w.length>=3))],brand=compact(name);
 const ranked=new Map();
 for(const r of all){
  if(netOf(hostOf(r.url))!==net||!profileOk(r.url))continue;
  let u;try{u=new URL(r.url);u.hash="";}catch(e){continue}
  const url=u.href;if(rejected.includes(canonical(url))||S.found[net]?.url===url)continue;
  const title=String(r.title||"");let path="";try{path=decodeURIComponent(u.pathname)}catch(e){}
  const text=normText(title+" "+path.replace(/[-_./@]/g," ")+" "+String(r.snippet||"")),packed=compact(title+" "+path);
  const matched=tokens.filter(t=>text.split(" ").includes(t)).length;
  const exact=brand.length>=6&&packed.includes(brand);
  const cityHits=cityTokens.filter(t=>text.split(" ").includes(t)).length;
  /* Recherche approfondie : conserver les pistes ayant au moins un mot distinctif dans le titre, l’URL ou l’extrait. La sélection automatique reste stricte ailleurs. */
  if(!(exact||matched>=1))continue;
  const score=(exact?10:matched*2)+(cityHits?Math.min(3,cityHits):0)+(title?1:0);
  const old=ranked.get(url);if(!old||score>old.score)ranked.set(url,{url,title,score,cityMatch:cityHits>0});
 }
 S.deepCandidates=S.deepCandidates||{};
 S.deepCandidates[net]=[...ranked.values()].sort((a,b)=>b.score-a.score).slice(0,5);
 S.deepCheckedAt=new Date().toISOString();S.deepQueries=(S.deepQueries||0)+queries.length;
 persistLocal();update();
 toast(S.deepCandidates[net].length?S.deepCandidates[net].length+" piste(s) trouvée(s) : vérifiez avant de choisir.":"Aucun profil assez fiable trouvé. Essayez le nom officiel exact.");
}
document.addEventListener("click",async e=>{
 const bad=e.target.closest("[data-social-incorrect]");
 if(bad){
  const net=bad.dataset.socialIncorrect,S=state.data&&state.data.social;if(!S||!S.found||!S.found[net])return;
  const old=S.found[net];S.rejected=S.rejected||[];if(!S.rejected.some(x=>x.net===net&&x.url===old.url))S.rejected.push({net,url:old.url,at:new Date().toISOString()});
  delete S.found[net];if(S.deepCandidates)delete S.deepCandidates[net];
  state.data.socials=(state.data.socials||[]).filter(x=>(x.net||netOf(hostOf(x.url)))!==net||x.url!==old.url);
  persistLocal();update();toast(net+" signalé incorrect pour cet audit.");return;
 }
 const restore=e.target.closest("[data-social-restore]");
 if(restore){
  const net=restore.dataset.socialRestore,S=state.data&&state.data.social;if(!S)return;
  const index=(S.rejected||[]).findIndex(x=>x&&x.net===net&&x.url);
  if(index<0)return;
  const item=S.rejected.splice(index,1)[0];S.found=S.found||{};
  S.found[net]={url:item.url,src:"signalement annulé par l’utilisateur",verified:false,confidence:"réintégré — à vérifier"};
  state.data.socials=state.data.socials||[];
  if(!state.data.socials.some(x=>(x.net||netOf(hostOf(x.url)))===net&&x.url===item.url))state.data.socials.push({net,url:item.url,src:"signalement annulé par l’utilisateur",verified:false});
  persistLocal();update();toast("Profil "+net+" réintégré comme piste à vérifier.");return;
 }
 const manual=e.target.closest("[data-social-manual]");
 if(manual){const net=manual.dataset.socialManual;nav("tools");$("socialVerifiedNet").value=net;$("socialVerifiedUrl").focus({preventScroll:true});toast("Collez le lien public de "+net+" puis touchez « Ajouter au rapport ».");return}
 const deep=e.target.closest("[data-social-deep]");
 if(deep){const net=deep.dataset.socialDeep;deep.disabled=true;deep.textContent="Recherche…";try{await deepSocialSearch(net)}catch(err){toast("Recherche impossible pour le moment. Réessayez.");}finally{deep.disabled=false;deep.textContent="Autres pistes"}return}
 const pick=e.target.closest("[data-social-pick]");
 if(pick){
  const net=pick.dataset.socialPick,url=pick.dataset.socialUrl,S=state.data&&state.data.social;
  if(!S||!url||netOf(hostOf(url))!==net)return;
  S.found=S.found||{};S.found[net]={url,src:"piste choisie après recherche approfondie",verified:false,confidence:"non confirmé — contrôle manuel nécessaire"};
  S.deepCandidates=S.deepCandidates||{};delete S.deepCandidates[net];
  state.data.socials=(state.data.socials||[]).filter(x=>(x.net||netOf(hostOf(x.url)))!==net);state.data.socials.push({net,url,src:"piste choisie après recherche approfondie",verified:false});
  persistLocal();update();toast("Profil ajouté comme piste à vérifier, pas comme compte officiel.");
 }
});
function photosBlock(){
 const d=state.data||{},L=d.photoList||[];if(!d.place)return "";
 const comps=(d.competitors||[]).filter(c=>c.ownerPhotos!=null);const med=comps.length?comps.map(c=>c.ownerPhotos).sort((a,b)=>a-b)[Math.floor(comps.length/2)]:null;
 return '<div class="photohead"><b>'+(d.ownerPhotos??0)+' / '+(d.photos??0)+'</b><span>photos publiées par le propriétaire, parmi celles que Google met en avant'+(med!=null?'. Médiane des concurrents : '+med:'')+'.</span></div>'
  +(L.length?'<div class="photostrip">'+L.map(ph=>'<figure><img src="'+esc(ph.uri)+'" alt="Photo de la fiche Google" loading="lazy" referrerpolicy="no-referrer"><figcaption>'+(ph.owner?'Propriétaire':'Client'+(ph.author?' · '+esc(ph.author):''))+'</figcaption></figure>').join("")+'</div>':'');
}
/* Carte de visibilité : vraie carte OpenStreetMap, pastilles = position du commerce vue depuis chaque endroit */
function gridDir(dx,dy){return ({"0,1":"au nord","0,-1":"au sud","1,0":"à l’est","-1,0":"à l’ouest","1,1":"au nord-est","-1,1":"au nord-ouest","1,-1":"au sud-est","-1,-1":"au sud-ouest","0,0":"au commerce même"})[dx+","+dy]}
function ordFr(n){return n===1?"1er":n+"e"}
function gridVerdict(g){
 const ok=g.points.filter(p=>p.ok),weak=ok.filter(p=>!p.rank||p.rank>3);
 const where=weak.map(p=>gridDir(p.dx,p.dy)+" ("+(p.rank?ordFr(p.rank):"absent")+")");
 if(!weak.length)return ["Excellent","Quand un client cherche « "+g.query+" » autour du commerce, il le voit dans les 3 premiers résultats partout, jusqu’à environ 2 km.","g"];
 if(g.top3>=6)return ["Bon","Le commerce est dans les 3 premiers presque partout autour de lui. Plus faible "+where.join(", ")+".","g"];
 if(g.top3>=1)return ["À renforcer","Il n’est dans les 3 premiers que depuis "+g.top3+" endroit"+(g.top3>1?"s":"")+" sur "+g.total+". Ailleurs, les clients voient d’abord ses concurrents : "+where.slice(0,4).join(", ")+(where.length>4?"…":"")+".","m"];
 return ["Faible","Depuis aucun des "+g.total+" endroits testés le commerce n’apparaît dans les 3 premiers : les clients voisins voient d’abord ses concurrents.","b"];
}
function gridBlock(){
 const g=(state.data||{}).grid;if(!g)return "";
 const c=g.points.find(p=>p.dx===0&&p.dy===0)||g.points[4];const Z=13,T=256,W=330,H=330;
 const wx=(lng)=>(lng+180)/360*T*2**Z,wy=(lat)=>{const r=lat*Math.PI/180;return (1-Math.log(Math.tan(r)+1/Math.cos(r))/Math.PI)/2*T*2**Z};
 const x0=wx(c.lng)-W/2,y0=wy(c.lat)-H/2;let tiles="";
 for(let tx=Math.floor(x0/T);tx<=Math.floor((x0+W)/T);tx++)for(let ty=Math.floor(y0/T);ty<=Math.floor((y0+H)/T);ty++)tiles+='<img src="https://tile.openstreetmap.org/'+Z+'/'+tx+'/'+ty+'.png" alt="" style="left:'+((tx*T-x0)/W*100).toFixed(2)+'%;top:'+((ty*T-y0)/H*100).toFixed(2)+'%;width:'+(T/W*100).toFixed(2)+'%;height:'+(T/H*100).toFixed(2)+'%" loading="lazy" onerror="this.remove()">';
 const pins=g.points.map(p=>{const r=p.rank,cls=!p.ok?"na":r&&r<=3?"g":r&&r<=10?"m":"b";const me=p.dx===0&&p.dy===0;return '<span class="gpin '+cls+(me?" me":"")+'" style="left:'+((wx(p.lng)-x0)/W*100).toFixed(2)+'%;top:'+((wy(p.lat)-y0)/H*100).toFixed(2)+'%" title="'+esc(gridDir(p.dx,p.dy))+' : '+(p.ok?(r?ordFr(r)+" sur Google":"pas dans les 20 premiers"):"non mesuré")+'">'+(p.ok?(r?(r>20?"20+":ordFr(r)):"absent"):"?")+'</span>'}).join("");
 const [vt,vx,vc]=gridVerdict(g);
 return '<div class="gridwrap"><div class="gmap" role="img" aria-label="Carte : position du commerce sur Google depuis 9 endroits autour de lui">'+tiles+'<span class="gveil"></span>'+pins+'<span class="gosm">© OpenStreetMap</span></div><div class="gtext"><span class="gverdict '+vc+'">'+esc(vt)+'</span><b>'+esc(vx)+'</b><span>Comment lire la carte : on a fait la recherche « '+esc(g.query)+' » comme un client placé à 9 endroits autour du commerce (le point entouré, au centre), espacés d’environ '+String(g.spacingKm).replace(".",",")+' km. Chaque pastille indique la place du commerce dans les résultats Google à cet endroit.</span><span class="glegend"><i class="g"></i>1er à 3e : vu tout de suite <i class="m"></i>4e à 10e : il faut faire défiler <i class="b"></i>au-delà : quasi invisible</span></div></div>';
}
function bingBlock(forReport){
 const B=(state.data||{}).bing;if(!B||(!B.keyword&&!B.brand))return "";
 const one=(x,label)=>x?'<div class="box"><h3>'+esc(label)+'</h3><p class="bigpos '+(x.pos?(x.pos<=3?"g":"m"):"b")+'">'+(x.pos?"n° "+x.pos+(x.hitType==="site"?" (site officiel)":" (mention)"):"Absent du top 10")+'</p><ol class="serp">'+x.rows.slice(0,5).map(r=>'<li class="'+(r.match?"hit":"")+'">'+(forReport?esc(r.title):'<a href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener">'+esc(r.title)+'</a>')+'<small>'+esc(r.host)+'</small></li>').join("")+'</ol></div>':"";
 return '<div class="twocol">'+one(B.keyword,"« "+(B.keyword&&B.keyword.query||"")+" »")+one(B.brand,"Recherche du nom")+'</div>'+((B.directories||[]).length?'<p class="muted" style="margin-top:8px">Sites que Bing met en avant sur cette recherche : '+esc(B.directories.join(", "))+'. Être bien présent sur ces annuaires améliore la visibilité sur Bing, DuckDuckGo et Copilot.</p>':'')+'<p class="muted"><small>'+esc((B.keyword||B.brand).engine)+', le '+esc(B.fetchedAt)+'.</small></p>';
}
function aiAutoBlock(forReport){
 const A=(state.data||{}).aiAuto;if(!A||!A.length)return "";
 return '<div class="aiq">'+A.map(o=>'<div class="box"><div class="aihead"><span class="badge '+(o.present?"b-ok":o.partial?"b-mid":"b-bad")+'">'+(o.present?"Cité"+(o.rank?" · n° "+o.rank:""):o.partial?"Infos incomplètes":"Non cité")+'</span><b>'+esc(o.kind)+'</b></div><p class="muted q">« '+esc(o.q)+' »</p>'+(o.competitors.length?'<p><small>Concurrents cités : '+esc(o.competitors.join(", "))+'</small></p>':'')+'<p class="excerpt">'+esc(o.excerpt.replace(/[*#]/g,"").slice(0,forReport?420:600))+(o.excerpt.length>(forReport?420:600)?"…":"")+'</p>'+(o.sources.length?'<p><small>Sources citées : '+o.sources.map(s=>forReport?esc(s.title||hostOf(s.uri)):'<a href="'+esc(safeUrl(s.uri))+'" target="_blank" rel="noopener">'+esc(s.title||hostOf(s.uri))+'</a>').join(", ")+'</small></p>':'')+'</div>').join("")+'</div><p class="muted"><small>Réponses de Gemini avec Recherche Google ('+esc(A[0].model)+'), le '+esc((state.data||{}).fetchedAt||"")+'. Les réponses des assistants varient selon le moment et la formulation.</small></p>';
}
function offersBlock(issues){
 const by={};issues.forEach(p=>{if(!p.offer)return;(by[p.offer]=by[p.offer]||[]).push(p)});
 const list=Object.entries(by).sort((a,b)=>b[1].reduce((s,p)=>s+p.prio,0)-a[1].reduce((s,p)=>s+p.prio,0));
 if(!list.length)return '<p class="muted">Aucune action prioritaire à proposer.</p>';
 return '<div class="offers">'+list.map(([o,ps],i)=>'<div class="offer'+(i===0?" first":"")+'"><b>'+esc(o)+'</b><small>'+ps.length+' point'+(ps.length>1?"s":"")+' traité'+(ps.length>1?"s":"")+'</small><ul>'+ps.slice(0,4).map(p=>'<li>'+esc(p.it)+'</li>').join("")+'</ul></div>').join("")+'</div>';
}

/* Ce qu'AffiAds peut apporter, et ce qu'il ne fait pas : adapté aux constats de l'audit */
function scopeBlock(issues){
 const d=state.data||{},has=k=>issues.some(p=>p.k===k);
 const can=[
  ["Fiche Google optimisée",(has("0-0")||has("0-1")||has("0-2")||has("0-7")||has("0-8")||has("0-9")?"Corriger et compléter les points relevés : ":"Compléter et tenir à jour : ")+"catégories, description, services, horaires, liens et doublons."],
  ["Photos et vidéos sur mesure","Photos professionnelles ("+famOf(state.biz.type).photos+") et vidéos verticales"+(famOf(state.biz.type).regulated?" informatives":" (15 s et plus, format Reels)")+" pour la fiche Google, le site et les réseaux"+(d.ownerPhotos!=null&&d.ownerPhotos<3?", là où l’audit montre peu de photos du propriétaire.":".")],
  ["Réseaux sociaux","Contenus réguliers pour Instagram, Facebook, TikTok et YouTube, avec une identité cohérente partout."],
  ["Site web mobile",normalizeUrl(state.biz.site)?"Améliorer le site existant : vitesse, boutons d’appel et de "+(famOf(state.biz.type)===FAMS.build||famOf(state.biz.type)===FAMS.service?"demande de devis":"réservation ou de rendez-vous")+", infos pratiques et données pour Google et les IA.":"Créer un site mobile simple : infos pratiques, "+famOf(state.biz.type).offer+", bouton d’appel, liens vers les réseaux."],
  ["Collecte d’avis","Outils simples pour obtenir plus d’avis récents (QR code, message après la visite ou l’intervention) et réponses aux avis."],
  ["Présence sur Bing et les assistants IA","Fiches et annuaires cohérents (Bing Places, "+famOf(state.biz.type).dirs+"…) pour être mieux cité par Bing, Gemini, ChatGPT et Copilot."],
  ["Suivi des progrès","Nouvel audit après les actions pour mesurer l’évolution, avec les mêmes indicateurs datés."]];
 const cannot=[...(famOf(state.biz.type).regulated?["Faire de la publicité commerciale pour une profession réglementée : la communication reste informative et conforme à la déontologie de la profession."]:[]),
  "Garantir une position précise sur Google, Bing ou dans les réponses des IA : leurs classements dépendent de leurs propres algorithmes.",
  "Promettre une hausse de chiffre d’affaires : AffiAds améliore la visibilité et l’image, les résultats commerciaux dépendent aussi de l’offre, des prix et de l’accueil.",
  "Supprimer des avis négatifs authentiques, ni publier de faux avis : seuls les avis contraires aux règles de Google peuvent être signalés.",
  "Agir sans les accès du propriétaire : la fiche Google, les réseaux et le site restent la propriété du commerce, qui donne les accès nécessaires.",
  "Remplacer l’expérience client : la qualité du service, des produits et de l’accueil reste la première source de bons avis."];
 return '<div class="twocol scope"><div class="box good"><h3>Ce qu’AffiAds peut apporter</h3><ul>'+can.map(([t,x])=>'<li><b>'+esc(t)+'</b><br><span class="muted">'+esc(x)+'</span></li>').join("")+'</ul></div><div class="box neutral"><h3>Ce qu’AffiAds ne fait pas</h3><ul>'+cannot.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ul></div></div>';
}
/* ---------- Rapport client v5 ---------- */
function sec(n,title,body,cls){return '<section class="sec'+(cls?" "+cls:"")+'"><h2><span class="num">'+n+'</span>'+esc(title)+'</h2>'+body+'</section>'}
function renderReport(){
 read();
 const totals=calc(),b=state.biz,ai=state.aiTests,d=state.data||{};
 const issues=issuesList(),good=strengths(),gs=groupScores();
 const [vt,vsub]=verdict(totals.score);
 const sender=settings.senderName||"",line=settings.senderLine||"AffiAds",contact=settings.senderContact||"";
 const top3=(d.findings||[]).slice(0,3);
 const cover='<div class="cover"><div class="brandline"><img src="assets/logo-192.png" alt="">AffiAds Audit 360°</div>'
  +'<span class="eyebrow">Audit de visibilité en ligne</span><h1>'+esc(b.name||"Votre prochain audit")+'</h1>'
  +'<div class="meta">'+esc([b.type,b.city&&("à "+b.city)].filter(Boolean).join(" "))+(b.address?" · "+esc(b.address):"")+(b.reg&&b.reg.date?'<br>Établissement ouvert en '+esc(fmtOpen(b.reg.date))+' (registre SIRENE)':'')+'<br>Audit du '+esc(frDate(b.date||today()))+(d.fetchedAt?" · données publiques collectées le "+esc(d.fetchedAt):"")+'</div>'
  +scoreTile(totals.score)+partialNote()+kpiRow()
  +(top3.length?'<div class="covertop"><h3>Les 3 constats à retenir</h3><ol>'+top3.map(f=>'<li>'+esc(f.text)+'</li>').join("")+'</ol></div>':'')
  +'<div class="coverfoot"><b>'+esc(sender?sender+", ":"")+esc(line)+'</b>'+(contact?'<span>'+esc(contact)+'</span>':'')+'</div></div>';
 const syn='<p class="lead">'+esc(b.name||"Le commerce")+' obtient un score indicatif de <b>'+(totals.score??"—")+'/100</b> : '+esc(vt.toLowerCase())+'. '+esc(vsub)+' L’analyse porte sur '+totals.n+' contrôles ; '+issues.length+' point'+(issues.length>1?"s":"")+' à améliorer '+(issues.length>1?"ont":"a")+' été identifié'+(issues.length>1?"s":"")+'.</p>'
  +'<div class="twocol"><div class="box good"><h3>Points forts</h3>'+(good.length?'<ul>'+good.slice(0,6).map(g=>'<li><b>'+esc(g.it)+'</b>'+(g.ev?'<br><span class="muted">'+esc(g.ev)+'</span>':'')+'</li>').join("")+'</ul>':'<p class="muted">À confirmer après vérification.</p>')+'</div><div class="box bad"><h3>Opportunités prioritaires</h3>'+(issues.length?'<ul>'+issues.slice(0,6).map(p=>'<li><b>'+esc(p.it)+'</b><br><span class="muted">'+esc(p.reco)+'</span></li>').join("")+'</ul>':'<p class="muted">Aucune priorité relevée.</p>')+'</div></div>'
  +'<h3 style="margin-top:20px">Score par catégorie</h3><div class="catbars">'+gs.map(g=>'<div class="catbar">'+esc(g.title)+' — <b>'+(g.score===null?"non évalué":g.score+"/100")+'</b><div class="bar"><div class="s-'+(scoreColor(g.score)||"good")+'" style="width:'+(g.score||0)+'%"></div></div></div>').join("")+'</div>'
  +((d.findings||[]).length>3?'<h3 style="margin-top:20px">Tous les constats</h3>'+findingsHtml():'')
  +(b.context?'<p><b>Première impression :</b> '+esc(b.context)+'</p>':"");
 const gHtml=(d.place?googleBlock():'<ul><li>Adresse : '+esc(b.address||"non relevée")+'</li><li>Téléphone : '+esc(b.phone||"non relevé")+'</li><li>Note : '+(b.rating!==""&&b.rating!=null&&!isNaN(b.rating)?fr1(b.rating):"non relevée")+' / 5 · Avis : '+esc(b.reviews||"non relevé")+'</li></ul><p class="muted">Ajoutez une clé Google pour analyser la fiche, les avis et les photos.</p>')
  +(d.place?'<h3 style="margin-top:18px">Photos de la fiche</h3>'+photosBlock():'')+(socialBlock(true)?'<h3 style="margin-top:18px">Réseaux sociaux</h3>'+socialBlock(true):((d.socials||[]).length?'<p>Réseaux sociaux liés : '+d.socials.map(s=>esc(s.net)).join(", ")+'.</p>':''));
 const vis=(gridBlock()?'<h3>Où le commerce est vu sur Google Maps</h3>'+gridBlock():'')+(compBlock(true)||'<p class="muted">Concurrence non analysée : ajoutez une clé Google pour comparer notes, avis et positions.</p>');
 const bing=bingBlock(true)||'<p class="muted">Bing n’a pas pu être interrogé lors de cet audit.</p>';
 const completed=ai.filter(t=>!t.auto&&(t.presence==="yes"||t.presence==="no"));
 const aiHtml=(aiAutoBlock(true)||'<p class="muted">Test automatique non réalisé : ajoutez une clé Google avec Gemini activé.</p>')
  +(completed.length?'<h3 style="margin-top:16px">Tests manuels dans les autres assistants</h3><div class="tablewrap"><table class="t"><thead><tr><th>IA / date</th><th>Question</th><th>Résultat</th></tr></thead><tbody>'+ai.filter(t=>!t.auto).map(t=>'<tr><td>'+esc(t.platform)+'<br>'+esc(t.date)+'</td><td>'+esc(t.prompt)+'</td><td>'+(t.presence==="yes"?"Cité":t.presence==="no"?"Non cité":"Incertain")+(t.rank?" · n° "+esc(t.rank):"")+(t.competitors?"<br><small>Concurrents : "+esc(t.competitors)+"</small>":"")+'</td></tr>').join("")+'</tbody></table></div>':'');
 const siteHtml=(d.psi||d.html||d.shotUrl)?siteBlock():d.sitePlatform?'<p>'+esc(state.auto['1-0']?state.auto['1-0'].evidence:'')+' Un site mobile simple (infos pratiques, '+esc(famOf(b.type).offer)+', bouton d’appel) aide Google, Bing et les assistants IA à le recommander.</p>':'<p>'+(safeUrl(b.site)?'Site : '+esc(b.site)+' : analyse non réalisée.':'Aucun site web n’a été trouvé pour ce commerce. Un site mobile simple (infos pratiques, plan d’accès, bouton d’appel) aide Google, Bing et les assistants IA à le recommander.')+'</p>';
 const toCheck=keys.filter(k=>!state.checks[k]||(state.auto[k]&&state.auto[k].status==="info")).map(k=>{const [gi,ii]=k.split("-").map(Number);return {it:groups[gi].items[ii],ev:state.auto[k]&&state.auto[k].status==="info"?state.auto[k].evidence:""}});
 const checkHtml=toCheck.length?'<h3 style="margin-top:20px">À vérifier avec le commerçant</h3><p class="muted">Ces points ne peuvent pas être mesurés de façon fiable depuis l’extérieur, ou demandent l’accès aux comptes : ils sont à confirmer lors de l’échange avant d’être chiffrés.</p><ul class="detail">'+toCheck.slice(0,12).map(x=>'<li>'+esc(x.it)+(x.ev?' <span class="muted">('+esc(x.ev)+')</span>':'')+'</li>').join("")+'</ul>'+(toCheck.length>12?'<p class="muted">+ '+(toCheck.length-12)+' autre(s) point(s) dans la checklist.</p>':''):'';
 const buckets=[["Gain rapide","À faire tout de suite"],["Priorité haute","Dans le mois"],["Priorité moyenne","Ensuite"],["À planifier","À planifier"]];
 const plan=issues.length?buckets.map(([lab,title])=>{const its=issues.filter(p=>prioLabel(p)[0]===lab);return its.length?'<h3 style="margin-top:12px">'+esc(title)+'</h3>'+its.map(p=>{const l=prioLabel(p);return '<div class="reco"><b>'+esc(p.it)+'</b>'+esc(p.reco)+(p.evidence?'<br><small><b>Constat :</b> '+esc(p.evidence)+'</small>':'')+(p.goal?'<br><small><b>Objectif :</b> '+esc(p.goal)+'</small>':'')+'<div class="tags"><span class="badge '+l[1]+'">'+l[0]+'</span><span class="badge b-auto">Impact '+"●".repeat(p.impact)+"○".repeat(3-p.impact)+'</span><span class="badge b-auto">Effort '+"●".repeat(p.effort)+"○".repeat(3-p.effort)+'</span></div></div>'}).join(""):""}).join(""):"<p>Aucun point signalé.</p>";
 const detail=groups.map((g,gi)=>{const rows=g.items.map((it,ii)=>({it,k:gi+"-"+ii})).filter(x=>state.checks[x.k]||state.issues[x.k]);return rows.length?'<h3>'+esc(g.title)+'</h3><ul class="detail">'+rows.map(x=>'<li class="'+(state.issues[x.k]?"ko":"ok")+'">'+esc(x.it)+' : '+(state.issues[x.k]?'<b>à améliorer</b>':'vérifié')+(state.auto[x.k]?' <span class="muted">('+esc(state.auto[x.k].evidence)+')</span>':'')+'</li>').join("")+'</ul>':""}).join("")||'<p class="muted">Aucun contrôle renseigné.</p>';
 const sources=[d.place&&"Google Places API (fiche, avis, photos, concurrents, carte de visibilité)",d.psi&&(d.psi.via||"Lighthouse")+" (site mobile)",d.html&&"lecture du site (Jina Reader)",d.bing&&"Bing France",d.aiAuto&&d.aiAuto.length&&"Gemini avec Recherche Google",d.osm&&"OpenStreetMap"].filter(Boolean);
 const method='<p>L’audit combine des données publiques collectées automatiquement et des vérifications manuelles. Le score indicatif correspond à la part des contrôles réussis parmi ceux effectués, pondérée par l’importance de chaque point (un point à fort impact, comme les avis ou la position locale, compte trois fois plus qu’un point secondaire). Les points non vérifiés n’entrent pas dans le score. Il ne s’agit pas d’un classement officiel.</p>'+(sources.length?'<p><b>Sources :</b> '+esc(sources.join(" ; "))+'.</p>':'')+'<p class="muted">Les positions Google et Bing sont mesurées depuis des recherches neutres : les résultats réels varient selon la position, l’appareil et l’historique de chaque personne. Les statistiques privées (vues de la fiche, Search Console) nécessitent l’accès du propriétaire. Aucun résultat n’est garanti.</p>'+detail+(state.notes?'<h3>Observations complémentaires</h3><p>'+esc(state.notes)+'</p>':'');
 const closing='<div class="closing"><b style="font-size:17px">Prochaine étape</b><p class="muted" style="margin:6px 0 12px">Un échange de 10 minutes pour parcourir ce rapport et choisir ensemble les actions prioritaires. Démo et devis gratuits, sans engagement.</p><div class="brandline"><img src="assets/logo-64.png" alt="" width="36" height="36"><div><b>'+esc(sender?sender+", ":"")+esc(line)+'</b>'+(contact?'<br><span class="muted">'+esc(contact)+'</span>':'')+'</div></div></div>';
 const S=[];
 S.push(["Synthèse",syn]);
 S.push(["Fiche Google, photos et réseaux sociaux",gHtml]);
 S.push(["Visibilité locale et concurrence",vis,"newpage"]);
 S.push(["Visibilité sur Bing",bing+'<p class="muted"><small>Bing alimente aussi DuckDuckGo, Ecosia et Microsoft Copilot.</small></p>']);
 S.push(["Visibilité dans les assistants IA",aiHtml]);
 S.push(["Site web sur mobile",siteHtml]);
 const SA=state.socialAudits||{};if(SA.instagram||SA.youtube)S.push(["Audit Instagram et YouTube",(SA.instagram?socBlock(SA.instagram,true):"")+(SA.youtube?socBlock(SA.youtube,true):""),"newpage"]);
 S.push(["Plan d’action recommandé",'<p class="muted">Classé par priorité : impact attendu sur la visibilité, puis effort de mise en œuvre. Chaque action s’appuie sur un constat daté de l’audit.</p>'+plan+checkHtml,"newpage"]);
 S.push(["Ce qu’AffiAds peut apporter",scopeBlock(issues)+'<h3 style="margin-top:20px">Proposition adaptée à cet audit</h3><p>Les actions du plan regroupées par prestation, de la plus utile à la moins urgente :</p>'+offersBlock(issues)+closing,"newpage"]);
 S.push(["Méthode et détail des contrôles",method]);
 const toc='<div class="toc"><h3>Sommaire</h3><ol>'+S.map(x=>'<li>'+esc(x[0])+'</li>').join("")+'</ol></div>';
 const body=cover+toc+S.map((x,i)=>sec(i+1,x[0],x[1],x[2])).join("");
 const head='<div class="phead"><span><img src="assets/logo-64.png" alt="" width="18" height="18"> AffiAds Audit 360°</span><span>'+esc(b.name||"")+(b.city?" · "+esc(b.city):"")+'</span></div>';
 const foot='<div class="pfoot"><span>'+esc(line)+(contact?" · "+esc(contact):"")+'</span><span>Audit du '+esc(frDate(b.date||today()))+'</span></div>';
 glossClose();$("report").innerHTML='<table class="printwrap"><thead><tr><td>'+head+'</td></tr></thead><tbody><tr><td>'+body+'</td></tr></tbody><tfoot><tr><td>'+foot+'</td></tr></tfoot></table>';
 glossify($("report"));renderOnePage();
}

/* ---------- Audit d'un compte Instagram ou d'une chaîne YouTube ----------
   YouTube : YouTube Data API v3 (clé Google), sinon page publique + flux RSS.
   Instagram : informations publiques du profil (abonnés, publications, bio) quand Instagram les affiche. */
const SOC_STOP=new Set("le la les un une des de du d l et ou en au aux a à pour par sur avec sans dans ce cette ces mon ma mes ton ta tes son sa ses notre nos votre vos leur leurs qui que quoi est sont pas plus tout tous très comment pourquoi quand the and of to in on for with my your is are this that how what new vs ep episode vidéo video officiel officielle partie part shorts short".split(" "));
function socParse(raw,force){
 let t=String(raw||"").trim();if(!t)return null;
 let u=null;try{u=new URL(/^https?:\/\//i.test(t)?t:(/\.(com|be)\//i.test(t)?"https://"+t:"x:"))}catch(e){}
 if(u&&/youtube\.com|youtu\.be/i.test(u.hostname)){const p=u.pathname.split("/").filter(Boolean);
  if(p[0]&&p[0].startsWith("@"))return {net:"youtube",handle:p[0]};
  if(p[0]==="channel"&&p[1])return {net:"youtube",channelId:p[1]};
  if((p[0]==="c"||p[0]==="user")&&p[1])return {net:"youtube",user:p[1]};
  return null}
 if(u&&/instagram\.com/i.test(u.hostname)){const h=u.pathname.split("/").filter(Boolean)[0];return h&&!/^(p|reel|reels|explore|stories)$/.test(h)?{net:"instagram",handle:h.replace(/^@/,"")}:null}
 const h=t.replace(/^@/,"").replace(/\s+/g,"");if(!/^[\w.\-]{2,60}$/.test(h))return null;
 return force==="youtube"?{net:"youtube",handle:"@"+h}:{net:"instagram",handle:h};
}
function parseCount(s){
 s=String(s||"").trim().toLowerCase().replace(/ | /g," ");const m=s.match(/([\d][\d\s.,]*)\s*(k|m|md|b|mille|million|millions)?/);if(!m)return null;
 let n=m[1].trim(),mult=1;const suf=m[2]||"";if(/^(k|mille)$/.test(suf))mult=1e3;else if(/^(m|million|millions)$/.test(suf))mult=1e6;else if(/^(md|b)$/.test(suf))mult=1e9;
 if(mult>1)n=n.replace(/\s/g,"").replace(",",".");else n=n.replace(/[\s.,](?=\d{3}\b)/g,"").replace(",",".");
 const v=parseFloat(n);return isNaN(v)?null:Math.round(v*mult);
}
function isoDur(d){const m=String(d||"").match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);if(!m)return null;return (+m[1]||0)*86400+(+m[2]||0)*3600+(+m[3]||0)*60+(+m[4]||0)}
function fmtN(n){return n==null?"—":n>=1e6?fr1(n/1e6)+" M":n>=1e4?Math.round(n/1e3)+" k":n>=1e3?fr1(n/1e3)+" k":String(n)}
function topWords(texts,n){const c={};texts.forEach(t=>toks(String(t||"").replace(/https?:\/\/\S+/g," ").replace(/#/g," ")).forEach(w=>{if(w.length>2&&!SOC_STOP.has(w)&&!/^\d+$/.test(w))c[w]=(c[w]||0)+1}));return Object.entries(c).sort((a,b)=>b[1]-a[1]).slice(0,n||8).map(x=>x[0])}
function nicheWords(niche){return toks(niche||"").filter(w=>w.length>2&&!SOC_STOP.has(w))}
async function proxyHtml(url){
 const tries=[()=>fetchText("https://api.allorigins.win/raw?url="+encodeURIComponent(url),{},30000),()=>fetchText("https://r.jina.ai/"+url,{headers:{"X-Return-Format":"html"}},45000)];
 let last;for(const f of tries){try{const t=await f();if(t&&t.length>300)return t;last=new Error("page vide")}catch(e){last=e}}throw last||new Error("page illisible");
}
/* ----- YouTube ----- */
async function ytApi(path,params){const q=new URLSearchParams({...params,key:settings.googleKey.trim()});return fetchJson("https://www.googleapis.com/youtube/v3/"+path+"?"+q,{},25000)}
async function ytViaApi(ref){
 const part="snippet,statistics,brandingSettings,contentDetails";
 const r=await ytApi("channels",ref.channelId?{part,id:ref.channelId}:ref.user?{part,forUsername:ref.user}:{part,forHandle:ref.handle});
 const ch=(r.items||[])[0];if(!ch){const e=new Error("Chaîne YouTube introuvable");e.notfound=true;throw e}
 const up=ch.contentDetails&&ch.contentDetails.relatedPlaylists&&ch.contentDetails.relatedPlaylists.uploads;
 let vids=[];
 if(up){const pl=await ytApi("playlistItems",{part:"contentDetails",playlistId:up,maxResults:30});const ids=(pl.items||[]).map(i=>i.contentDetails.videoId).filter(Boolean);
  if(ids.length){const v=await ytApi("videos",{part:"snippet,statistics,contentDetails",id:ids.join(",")});vids=(v.items||[]).map(x=>({id:x.id,title:x.snippet.title,desc:x.snippet.description||"",tags:x.snippet.tags||[],date:x.snippet.publishedAt,views:+x.statistics.viewCount||0,likes:x.statistics.likeCount!=null?+x.statistics.likeCount:null,comments:x.statistics.commentCount!=null?+x.statistics.commentCount:null,dur:isoDur(x.contentDetails.duration)}))}}
 let playlists=null;try{const p=await ytApi("playlists",{part:"id",channelId:ch.id,maxResults:1});playlists=p.pageInfo?p.pageInfo.totalResults:null}catch(e){}
 const b=(ch.brandingSettings&&ch.brandingSettings.channel)||{};
 return {via:"YouTube Data API",id:ch.id,title:ch.snippet.title,handle:ch.snippet.customUrl||ref.handle||"",desc:ch.snippet.description||"",created:ch.snippet.publishedAt,country:ch.snippet.country||b.country||"",
  subs:ch.statistics.hiddenSubscriberCount?null:+ch.statistics.subscriberCount,views:+ch.statistics.viewCount,videoCount:+ch.statistics.videoCount,keywords:b.keywords||"",trailer:!!b.unsubscribedTrailer,playlists,thumb:ch.snippet.thumbnails&&(ch.snippet.thumbnails.medium||ch.snippet.thumbnails.default||{}).url||"",videos:vids.sort((a,b)=>String(b.date).localeCompare(String(a.date)))};
}
async function ytViaPublic(ref){
 const page=ref.channelId?"https://www.youtube.com/channel/"+ref.channelId:ref.user?"https://www.youtube.com/user/"+ref.user:"https://www.youtube.com/"+ref.handle;
 const h=await proxyHtml(page);
 const id=ref.channelId||(h.match(/"(?:channelId|externalId)":"(UC[\w-]{22})"/)||h.match(/channel\/(UC[\w-]{22})/)||[])[1];
 if(!id){const e=new Error("Chaîne YouTube introuvable");e.notfound=true;throw e}
 const meta=(n)=>{const m=h.match(new RegExp('<meta[^>]+(?:property|name)="'+n+'"[^>]+content="([^"]*)"'))||h.match(new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="'+n+'"'));return m?m[1].replace(/&amp;/g,"&").replace(/&#39;/g,"’").replace(/&quot;/g,'"'):""};
 const subTxt=(h.match(/"subscriberCountText":\{(?:"accessibility":\{"accessibilityData":\{"label":"[^"]*"\}\},)?"simpleText":"([^"]+)"/)||h.match(/([\d][\d\s.,]*\s*(?:k|M|Md)?)\s*(?:abonnés|subscribers)/i)||[])[1];
 const x=await proxyHtml("https://www.youtube.com/feeds/videos.xml?channel_id="+id);
 const doc=new DOMParser().parseFromString(x,"text/xml");
 const vids=[...doc.getElementsByTagName("entry")].map(e=>{const g=(t)=>{const el=e.getElementsByTagName(t)[0];return el?el.textContent:""};const st=e.getElementsByTagName("media:statistics")[0],sr=e.getElementsByTagName("media:starRating")[0];
  return {id:g("yt:videoId"),title:g("title"),desc:g("media:description"),tags:[],date:g("published"),views:st?+st.getAttribute("views"):0,likes:sr?+sr.getAttribute("count"):null,comments:null,dur:null,isShortUrl:/\/shorts\//.test((e.getElementsByTagName("link")[0]||{getAttribute:()=>""}).getAttribute("href")||"")}});
 return {via:"Page publique YouTube et flux RSS",id,title:meta("og:title")||(doc.getElementsByTagName("title")[0]||{}).textContent||ref.handle,handle:ref.handle||"",desc:meta("og:description")||meta("description"),created:"",country:"",subs:subTxt?parseCount(subTxt):null,views:null,videoCount:null,keywords:meta("keywords"),trailer:null,playlists:null,thumb:meta("og:image"),videos:vids};
}
function ytAnalyze(c,niche){
 const V=c.videos||[],now=Date.now(),days=t=>Math.round((now-Date.parse(t))/864e5);
 const last10=V.slice(0,10),dates=last10.map(v=>Date.parse(v.date)).filter(Boolean);
 const gaps=[];for(let i=0;i+1<dates.length;i++)gaps.push((dates[i]-dates[i+1])/864e5);
 const cadence=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:null,since=V[0]?days(V[0].date):null;
 const med=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:null};
 const medViews=med(last10.map(v=>v.views));
 const eng=last10.filter(v=>v.views>0&&v.likes!=null);const engRate=eng.length?eng.reduce((s,v)=>s+(v.likes+(v.comments||0)),0)/eng.reduce((s,v)=>s+v.views,0)*100:null;
 const shorts=last10.filter(v=>v.isShortUrl||(v.dur!=null&&v.dur<=60)).length,longs=last10.filter(v=>v.dur!=null&&v.dur>300);
 const kw=nicheWords(niche);const top=topWords(V.map(v=>v.title+" "+(v.tags||[]).join(" ")),10);const target=kw.length?kw:top.slice(0,2);
 const hasKw=t=>target.length&&target.some(w=>norm(t).includes(w));
 const titleLen=last10.length?Math.round(last10.reduce((s,v)=>s+v.title.length,0)/last10.length):null;
 const titleKw=last10.length?Math.round(last10.filter(v=>hasKw(v.title)).length/last10.length*100):null;
 const descLen=last10.length?Math.round(last10.reduce((s,v)=>s+v.desc.length,0)/last10.length):null;
 const descLink=last10.length?Math.round(last10.filter(v=>/https?:\/\//.test(v.desc)).length/last10.length*100):null;
 const tagged=c.via.startsWith("YouTube Data")&&last10.length?Math.round(last10.filter(v=>v.tags.length).length/last10.length*100):null;
 const chap=longs.length?Math.round(longs.filter(v=>/(^|\n)\s*0?0:00/.test(v.desc)).length/longs.length*100):null;
 const best=[...V].sort((a,b)=>b.views-a.views)[0]||null;
 const M={cadence,since,medViews,engRate,shorts,n10:last10.length,titleLen,titleKw,descLen,descLink,tagged,chap,top,target,best};
 const C=[];const add=(id,label,ok,ev,reco,goal,w)=>C.push({id,label,ok,ev,reco,goal,w:w||2});
 if(since!=null)add("y1","Régularité de publication",since<=14&&(cadence==null||cadence<=10),"Dernière vidéo il y a "+since+" j"+(cadence!=null?" · une vidéo tous les "+Math.round(cadence)+" j en moyenne sur les "+last10.length+" dernières":"")+".","Publier à un rythme fixe (même jour, même heure) : l’algorithme et les abonnés récompensent la régularité.","Au moins une vidéo par semaine, dont des Shorts.",3);
 if(last10.length)add("y2","Format court (Shorts)",shorts>0,shorts+" Short"+(shorts>1?"s":"")+" probable"+(shorts>1?"s":"")+" parmi les "+last10.length+" dernières vidéos.","Découper les meilleures vidéos en Shorts verticaux de 15 à 60 s avec une accroche dans les 2 premières secondes : c’est le format qui attire le plus de nouveaux abonnés.","2 à 3 Shorts par semaine.",3);
 if(titleLen!=null)add("y3","Titres optimisés (SEO)",titleLen>=30&&titleLen<=75&&titleKw>=50,"Titres de "+titleLen+" caractères en moyenne · "+titleKw+" % contiennent "+(kw.length?"la niche":"les mots principaux")+" (« "+target.join(", ")+" »).","Placer le mot-clé recherché en début de titre, 40 à 70 caractères, promesse claire (bénéfice ou question).","Mot-clé de la niche dans au moins 8 titres sur 10.",3);
 if(descLen!=null)add("y4","Descriptions complètes",descLen>=200&&descLink>=50,"Descriptions de "+descLen+" caractères en moyenne · "+descLink+" % contiennent un lien.","Rédiger 2 à 3 phrases avec les mots-clés en début de description, puis les liens (site, réservation, réseaux) et 3 hashtags.","Description de plus de 200 caractères avec lien sur chaque vidéo.",2);
 if(tagged!=null)add("y5","Tags et mots-clés",tagged>=50||!!c.keywords,tagged+" % des vidéos ont des tags"+(c.keywords?" · mots-clés de chaîne renseignés":" · aucun mot-clé de chaîne")+".","Renseigner les mots-clés de la chaîne et quelques tags précis par vidéo (niche, ville, variantes).",null,1);
 if(chap!=null)add("y6","Chapitres sur les vidéos longues",chap>=30,chap+" % des vidéos de plus de 5 min ont des chapitres.","Ajouter des chapitres (00:00 Introduction…) : Google les affiche directement dans ses résultats.",null,1);
 add("y7","Présentation de la chaîne",(c.desc||"").length>=150&&(!target.length||target.some(w=>norm(c.desc).includes(w))),(c.desc?"Description de "+c.desc.length+" caractères"+(target.length?(target.some(w=>norm(c.desc).includes(w))?", contient la niche":", sans les mots de la niche"):""):"Aucune description de chaîne")+".","Écrire une présentation de chaîne claire : qui, pour qui, quoi, à quel rythme, avec les mots-clés de la niche et un lien.",null,2);
 if(c.trailer!=null)add("y8","Bande-annonce de chaîne",c.trailer,c.trailer?"Bande-annonce définie pour les visiteurs non abonnés.":"Aucune bande-annonce pour les visiteurs non abonnés.","Ajouter une vidéo de présentation de 30 à 60 s pour les visiteurs non abonnés.",null,1);
 if(engRate!=null)add("y9","Engagement",engRate>=2,"Mentions « j’aime » et commentaires = "+fr1(engRate)+" % des vues sur les "+last10.length+" dernières vidéos (repère courant : 2 % ou plus).","Poser une question en fin de vidéo, épingler un commentaire, répondre aux premiers commentaires dans l’heure.",null,2);
 if(medViews!=null&&c.subs)add("y10","Portée des nouvelles vidéos",medViews>=c.subs*0.1,"Vues médianes des "+last10.length+" dernières vidéos : "+fmtN(medViews)+" pour "+fmtN(c.subs)+" abonnés ("+Math.round(medViews/c.subs*100)+" %).","Travailler les miniatures (visage, 3 mots maximum, contraste) et les 30 premières secondes pour relancer la portée.",null,2);
 return {M,C};
}
/* ----- Instagram ----- */
async function igFetch(ref){
 const h=await proxyHtml("https://www.instagram.com/"+ref.handle+"/");
 const meta=(n)=>{const m=h.match(new RegExp('<meta[^>]+(?:property|name)="'+n+'"[^>]+content="([^"]*)"'))||h.match(new RegExp('<meta[^>]+content="([^"]*)"[^>]+(?:property|name)="'+n+'"'));return m?m[1].replace(/&amp;/g,"&").replace(/&#039;|&#39;/g,"’").replace(/&quot;/g,'"').replace(/&#x([0-9a-f]+);/gi,(_,x)=>String.fromCodePoint(parseInt(x,16))):""};
 const d=meta("description")||meta("og:description");
 const num=rx=>{const m=d.match(rx);return m?parseCount(m[1]):null};
 const followers=num(/([\d][\d\s.,]*\s*[KkMm]?)\s*(?:Followers|abonnés|followers)/),following=num(/([\d][\d\s.,]*\s*[KkMm]?)\s*(?:Following|abonnements)/),posts=num(/([\d][\d\s.,]*\s*[KkMm]?)\s*(?:Posts|publications)/);
 const t=meta("og:title");const name=(t.match(/^(.*?)\s*\(@/)||[])[1]||"";
 const bio=((d.match(/on Instagram:\s*"([\s\S]*)"\s*$/)||d.match(/sur Instagram\s*:\s*«?\s*"?([\s\S]*?)"?\s*»?\s*$/)||[])[1]||"").trim();
 if(followers==null&&posts==null){const e=new Error("Profil Instagram non lisible (compte privé, inexistant, ou lecture bloquée par Instagram)");e.blocked=true;throw e}
 return {via:"Profil public Instagram",handle:ref.handle,name,bio,followers,following,posts,pic:meta("og:image")};
}
const IG_MANUAL=[["m1","Reels publiés au moins 2 fois par semaine","Publier 2 à 3 Reels par semaine : c’est le format qui touche le plus de non-abonnés.",3],["m2","Lien dans la bio (site, réservation, devis)","Ajouter un lien unique dans la bio vers l’action principale (réservation, devis, site).",3],["m3","Compte professionnel avec boutons de contact","Passer en compte professionnel et activer les boutons Appeler, E-mail, Itinéraire ou Réserver.",2],["m4","Stories à la une organisées","Créer 4 à 6 stories à la une : offre, avis, coulisses, infos pratiques.",1],["m5","Légendes avec mots-clés (et ville)","Écrire des légendes qui reprennent les mots que les clients tapent (activité, ville, spécialité) : Instagram et Google les lisent.",2],["m6","Lieu ajouté aux publications","Ajouter le lieu sur chaque publication pour apparaître dans les recherches locales.",1],["m7","3 à 5 hashtags ciblés","Utiliser 3 à 5 hashtags précis (niche, ville) plutôt que 30 hashtags génériques.",1],["m8","Publications épinglées","Épingler 3 publications : présentation, meilleure offre, avis clients.",1]];
function igAnalyze(c,niche){
 const kw=nicheWords(niche),C=[];const add=(id,label,ok,ev,reco,goal,w)=>C.push({id,label,ok,ev,reco,goal,w:w||2});
 const ratio=c.followers!=null&&c.following?c.followers/c.following:null;
 if(c.name||c.handle)add("i1","Nom du profil avec l’activité (SEO)",kw.length?kw.some(w=>norm(c.name+" "+c.handle).includes(w)):null,"Nom affiché : « "+(c.name||"—")+" » · identifiant @"+c.handle+".","Le champ « Nom » est pris en compte par la recherche Instagram : y ajouter l’activité, par exemple « "+(c.name||"Nom")+" | "+(niche||"activité")+" ».",null,3);
 if(c.bio)add("i2","Bio claire avec mots-clés et appel à l’action",c.bio.length>=60&&(!kw.length||kw.some(w=>norm(c.bio).includes(w)))&&/r[ée]serv|devis|appel|contact|command|lien|dm|message|rdv|rendez|👇|⬇/i.test(c.bio),"Bio : « "+c.bio.slice(0,160)+(c.bio.length>160?"…":"")+" ».","Bio en 3 lignes : ce que vous faites et pour qui, où (ville), puis l’action à faire (réserver, demander un devis) avec le lien.",null,3);
 else add("i2","Bio claire avec mots-clés et appel à l’action",null,"Bio non lisible automatiquement : à vérifier sur le profil.","Bio en 3 lignes : ce que vous faites et pour qui, où (ville), puis l’action à faire (réserver, demander un devis) avec le lien.",null,3);
 if(c.posts!=null)add("i3","Volume de publications",c.posts>=30,c.posts+" publications.","Constituer un fond d’au moins 30 publications utiles (offre, coulisses, avis, avant/après).",null,1);
 if(ratio!=null)add("i4","Équilibre abonnés / abonnements",ratio>=1,fmtN(c.followers)+" abonnés pour "+fmtN(c.following)+" abonnements.","Réduire les abonnements sans lien avec l’activité et miser sur le contenu pour attirer des abonnés.",null,1);
 const man=(state.socialManual||{});IG_MANUAL.forEach(([id,label,reco,w])=>{if(man[id]!=null)C.push({id,label,ok:man[id],ev:man[id]?"Vérifié sur le profil.":"Absent après vérification.",reco,w,manual:true})});
 return {M:{ratio},C:C.filter(x=>x.ok!==null)};
}
/* ----- IA : niche, mots-clés et idées (Gemini) ----- */
async function socAi(net,c,niche,M){
 const base=net==="youtube"?"Chaîne YouTube « "+c.title+" » ("+(c.handle||"")+"). Abonnés : "+fmtN(c.subs)+". Titres récents : "+(c.videos||[]).slice(0,12).map(v=>v.title).join(" | ")+".":"Compte Instagram @"+c.handle+" « "+(c.name||"")+" ». Bio : "+(c.bio||"inconnue")+". Abonnés : "+fmtN(c.followers)+".";
 const q="Tu es consultant en marketing des réseaux sociaux pour une agence française. "+base+(niche?" Niche indiquée : "+niche+".":"")+" En t’appuyant uniquement sur ces informations et sur une recherche web si utile, réponds en JSON strict sans texte autour : {\"niche\":\"la niche en une phrase\",\"public\":\"le public visé en une phrase\",\"motscles\":[8 mots-clés ou expressions que le public tape dans la recherche "+(net==="youtube"?"YouTube":"Instagram")+"],\"hashtags\":[5 hashtags précis],\"idees\":[5 idées de "+(net==="youtube"?"vidéos ou Shorts":"Reels")+" concrètes avec un titre accrocheur]}. Si une information manque, écris \"à confirmer\".";
 const r=await geminiAsk(q);const m=r.text.match(/\{[\s\S]*\}/);if(!m)throw new Error("réponse IA illisible");
 const j=JSON.parse(m[0]);return {niche:String(j.niche||""),public:String(j.public||""),motscles:(j.motscles||[]).map(String).slice(0,10),hashtags:(j.hashtags||[]).map(String).slice(0,6),idees:(j.idees||[]).map(String).slice(0,6),sources:r.sources.slice(0,4)};
}
function socScore(C){let t=0,o=0;C.forEach(x=>{t+=x.w;if(x.ok)o+=x.w});return t?Math.round(o/t*100):null}
let socRunning=false;
async function runSocial(){
 if(socRunning)return;const force=$("socNet").value;const ref=socParse($("socUrl").value,force==="auto"?null:force);
 if(!ref){toast("Collez un lien Instagram ou YouTube pour l’analyse automatique. Facebook, TikTok et Snapchat se confirment dans « Boîte à outils ».");$("socUrl").focus();return}
 const niche=$("socNiche").value.trim();socRunning=true;$("runSocial").disabled=true;$("runSocial").textContent="Analyse en cours…";
 const box=$("socResult");box.innerHTML='<p class="muted"><span class="spin">◌</span> Lecture du compte '+(ref.net==="youtube"?"YouTube":"Instagram")+'…</p>';
 const res={net:ref.net,input:$("socUrl").value.trim(),niche,at:nowLabel(),date:today()};
 try{
  if(ref.net==="youtube"){
   let c=null,apiErr=null;if(hasKey()){try{c=await ytViaApi(ref)}catch(e){if(e.notfound)throw e;apiErr=e}}
   if(!c){try{c=await ytViaPublic(ref)}catch(e){if(apiErr){const f=frErr(apiErr);const er=new Error(f.text);er.link=f.link;throw er}throw e}}
   if(apiErr)res.warn=frErr(apiErr);
   c.videos=(c.videos||[]).slice(0,30);res.data=c;Object.assign(res,ytAnalyze(c,niche));
  }else{res.data=await igFetch(ref);Object.assign(res,igAnalyze(res.data,niche))}
  if(hasKey()){box.innerHTML+='<p class="muted"><span class="spin">◌</span> Analyse de la niche avec l’IA de Google…</p>';try{res.ai=await socAi(ref.net,res.data,niche,res.M)}catch(e){res.aiErr=frErr(e).text}}
  res.score=socScore(res.C);
  state.socialAudits=state.socialAudits||{};state.socialAudits[ref.net]=res;
  if(!state.biz.name){state.biz.name=ref.net==="youtube"?res.data.title:(res.data.name||"@"+res.data.handle)}
  persistLocal();renderClientSelect();renderSocial();update();toast("Audit du compte terminé.");
 }catch(e){
  const blocked=e.blocked||/allorigins|jina|HTTP 4|HTTP 5|Failed to fetch|page vide|illisible/i.test(String(e.message));
  const errHtml='<div class="partial"><b>'+(e.notfound?"Compte introuvable":ref.net==="instagram"&&blocked?"Instagram n’a pas laissé lire ce profil":"Analyse impossible pour le moment")+'</b><span>'+esc(e.notfound?"Vérifiez le lien ou le @nom du compte.":ref.net==="instagram"&&blocked?"Instagram bloque souvent la lecture automatique. Vérifiez que le compte est public et réessayez dans quelques minutes, ou indiquez ci-dessous ce que vous voyez sur le profil : l’appli calcule quand même le score et le plan d’action.":frErr(e).text)+'</span>'+(e.link?'<a class="steplink" href="'+esc(e.link.href)+'" target="_blank" rel="noopener">'+esc(e.link.label)+'</a>':'')+'</div>';
  if(ref.net==="instagram"&&!e.notfound){const prev=(state.socialAudits||{}).instagram;if(!prev||prev.data.handle!==ref.handle){const r2={net:"instagram",input:res.input,niche,at:res.at,date:res.date,data:{handle:ref.handle,name:"",bio:"",followers:null,following:null,posts:null,via:"vérification manuelle"},manualOnly:true};Object.assign(r2,igAnalyze(r2.data,niche));r2.score=socScore(r2.C);state.socialAudits=state.socialAudits||{};state.socialAudits.instagram=r2;persistLocal()}}
  renderSocial();box.insertAdjacentHTML("afterbegin",errHtml);
 }finally{socRunning=false;$("runSocial").disabled=false;$("runSocial").textContent="Lancer l’audit du compte"}
}
function socManualHtml(){const man=state.socialManual||{};return '<div class="box" style="margin-top:14px"><h3>Vérifications sur le profil Instagram</h3><p class="muted">Ouvrez le profil sur votre téléphone et indiquez ce que vous voyez : le score et le plan d’action se mettent à jour.</p>'+IG_MANUAL.map(([id,label])=>'<div class="qrow"><span>'+esc(label)+'</span><span class="seg sm"><button type="button" data-man="'+id+'" data-v="1" class="'+(man[id]===true?"on":"")+'">Oui</button><button type="button" data-man="'+id+'" data-v="0" class="'+(man[id]===false?"on":"")+'">Non</button></span></div>').join("")+'</div>'}
function socBlock(r,forReport){
 if(!r)return "";const d=r.data||{},yt=r.net==="youtube",M=r.M||{};
 const head='<div class="sochead"><span class="socnet">'+netIcon(yt?"YouTube":"Instagram",26)+'</span>'+(d.thumb||d.pic?'<img src="'+esc(d.thumb||d.pic)+'" alt="" width="56" height="56" referrerpolicy="no-referrer">':'')+'<div><b>'+esc(yt?d.title:(d.name||"@"+d.handle))+'</b><span>'+(yt?"YouTube"+(d.handle?" · "+esc(d.handle):""):"Instagram · @"+esc(d.handle))+' · analysé le '+esc(r.at||"")+'</span></div>'+(r.score!=null?'<span class="socscore '+scoreColor(r.score)+'">'+r.score+'<small>/100 · '+r.C.length+' point'+(r.C.length>1?"s":"")+'</small></span>':'')+'</div>';
 const k=yt?[[fmtN(d.subs),"Abonnés"],[M.medViews!=null?fmtN(M.medViews):"—","Vues médianes (vidéos récentes)"],[M.cadence!=null?Math.round(M.cadence)+" j":"—","Entre deux vidéos"],[M.engRate!=null?fr1(M.engRate)+" %":"—","Engagement"]]:[[fmtN(d.followers),"Abonnés"],[d.posts!=null?fmtN(d.posts):"—","Publications"],[fmtN(d.following),"Abonnements"],[M.ratio!=null?fr1(M.ratio):"—","Ratio abonnés / abonnements"]];
 const kpis=r.manualOnly?'':'<div class="kpis">'+k.map(x=>kpiBox(x[0],x[1],"")).join("")+'</div>';
 const ai=r.ai?'<div class="twocol" style="margin-top:12px"><div class="box"><h3>Niche et public</h3><p><b>'+esc(r.ai.niche)+'</b></p><p class="muted">'+esc(r.ai.public)+'</p>'+(r.ai.motscles.length?'<p><small><b>Mots-clés à viser :</b> '+esc(r.ai.motscles.join(", "))+'</small></p>':'')+(r.ai.hashtags.length?'<p><small><b>Hashtags :</b> '+esc(r.ai.hashtags.join(" "))+'</small></p>':'')+'</div><div class="box"><h3>Idées de '+(yt?"vidéos et Shorts":"Reels")+'</h3><ol class="blist">'+r.ai.idees.map(x=>'<li>'+esc(x)+'</li>').join("")+'</ol><p class="muted"><small>Suggestions de l’IA de Google à valider.</small></p></div></div>':(M.top&&M.top.length?'<p style="margin-top:10px"><b>Thèmes les plus présents :</b> '+esc(M.top.slice(0,8).join(", "))+'</p>':'');
 const checks=(r.C||[]).length?'<ul class="ticks socticks" style="margin-top:12px">'+r.C.map(x=>'<li class="'+(x.ok?"ok":"ko")+'"><span aria-hidden="true">'+(x.ok?"✓":"✕")+'</span><div><b>'+esc(x.label)+'</b><small>'+esc(x.ev)+'</small></div></li>').join("")+'</ul>':'';
 const todo=(r.C||[]).filter(x=>!x.ok).sort((a,b)=>b.w-a.w);
 const pend=r.net==='instagram'?IG_MANUAL.filter(([id])=>(state.socialManual||{})[id]==null):[];
 const plan=todo.length||pend.length?'<h3 style="margin-top:14px">Plan d’action '+(yt?"YouTube":"Instagram")+'</h3>'+todo.map(x=>'<div class="reco"><b>'+esc(x.label)+'</b>'+esc(x.reco)+(x.goal?'<br><small><b>Objectif :</b> '+esc(x.goal)+'</small>':'')+'</div>').join("")+(pend.length?'<p class="muted" style="margin-top:8px"><b>À vérifier sur le profil :</b> '+esc(pend.map(x=>x[1].toLowerCase()).join(" ; "))+'.</p>':''):'';
 const vids=yt&&(d.videos||[]).length?'<h3 style="margin-top:14px">Dernières vidéos</h3><div class="tablewrap"><table class="t"><thead><tr><th>Vidéo</th><th>Date</th><th>Vues</th><th>J’aime</th></tr></thead><tbody>'+d.videos.slice(0,forReport?6:10).map(v=>'<tr><td>'+(forReport?esc(v.title):'<a href="https://www.youtube.com/watch?v='+esc(v.id)+'" target="_blank" rel="noopener">'+esc(v.title)+'</a>')+'</td><td>'+esc(frDate(String(v.date).slice(0,10)))+'</td><td>'+fmtN(v.views)+'</td><td>'+(v.likes!=null?fmtN(v.likes):"—")+'</td></tr>').join("")+'</tbody></table></div>':'';
 const src='<p class="muted"><small>Source : '+esc(d.via||"lecture manuelle")+(r.warn?" (API YouTube : "+esc(r.warn.text)+")":"")+'. Les repères (2 % d’engagement, une vidéo par semaine…) sont des ordres de grandeur courants, pas des règles officielles des plateformes.</small></p>';
 return '<div class="socaudit">'+head+kpis+ai+checks+plan+vids+src+'</div>';
}
function renderSocial(){
 const A=state.socialAudits||{},box=$("socResult");if(!box)return;
 const found=((state.data&&state.data.social&&state.data.social.found)||{});const chips=["Facebook","Instagram","YouTube","TikTok","Snapchat"].filter(n=>found[n]).map(n=>'<button type="button" class="chipq chipico" data-soc="'+esc(found[n].url)+'" data-net="'+esc(n)+'">'+netIcon(n,20)+n+(n==="Facebook"?' trouvé : vérifier':' trouvé : analyser')+'</button>').join("");
 $("socFound").innerHTML=chips;$("socFound").querySelectorAll("[data-soc]").forEach(b=>b.onclick=()=>{if(b.dataset.net==="Facebook"||b.dataset.net==="TikTok"||b.dataset.net==="Snapchat"){nav("tools");$("socialVerifiedNet").value=b.dataset.net;$("socialVerifiedUrl").value=b.dataset.soc;$("socialVerifiedUrl").focus();toast("Profil "+b.dataset.net+" trouvé : confirmez le lien public pour l’ajouter au rapport.");return}$("socUrl").value=b.dataset.soc;$("socNet").value="auto";runSocial()});
 if(!$("socNiche").value&&state.biz&&state.biz.name)$("socNiche").value=[kwOf(state.biz.type),state.biz.city].filter(Boolean).join(" à ");
 const parts=["instagram","youtube"].filter(n=>A[n]).map(n=>socBlock(A[n],false)+(n==="instagram"?socManualHtml():""));
 box.innerHTML=(parts.join("")||'<p class="muted" style="margin-top:12px">Aucun compte analysé pour ce client.</p>');glossify(box);
 box.querySelectorAll("[data-man]").forEach(b=>b.onclick=()=>{state.socialManual=state.socialManual||{};state.socialManual[b.dataset.man]=b.dataset.v==="1";const r=(state.socialAudits||{}).instagram;if(r){const a=igAnalyze(r.data,r.niche);r.C=a.C;r.M=a.M;r.score=socScore(r.C)}persistLocal();renderSocial();update()});
}

/* ---------- Bulles d'explication : chaque mot technique devient touchable ----------
   [terme(s), titre, explication simple, phrase à dire au client] */
const GLOSS=[
 [["SEO","SEO technique","référencement"],"SEO (référencement)","Tout ce qui aide Google à comprendre une page et à la montrer quand quelqu’un fait une recherche : titre, description, textes, vitesse, liens.","« C’est ce qui permet à votre site de sortir quand un client tape votre métier et votre ville sur Google. »"],
 [["Core Web Vitals"],"Core Web Vitals","Trois mesures de Google sur le confort réel des visiteurs : vitesse d’affichage (LCP), réactivité aux clics (INP) et stabilité de la page (CLS). Google les prend en compte dans son classement.","« Google mesure si votre site est agréable sur téléphone, et en tient compte pour vous classer. »"],
 [["LCP","contenu principal affiché"],"Affichage du contenu principal (LCP)","Temps qu’il faut pour que le plus gros élément de la page (photo, titre) s’affiche sur téléphone. Bon : moins de 2,5 secondes.","« Au-delà de 3 secondes d’attente, une bonne partie des visiteurs repart. »"],
 [["INP"],"Réactivité (INP)","Temps de réaction quand on touche un bouton ou un menu. Bon : moins de 200 millisecondes.","« Le site doit réagir tout de suite quand on appuie sur un bouton. »"],
 [["CLS","stabilité visuelle"],"Stabilité de la page (CLS)","Mesure si les éléments bougent pendant le chargement (le bouton qui se décale au moment où on appuie). Bon : moins de 0,1.","« Rien ne doit bouger sous le doigt du client pendant le chargement. »"],
 [["Lighthouse","PageSpeed"],"Lighthouse / PageSpeed","L’outil officiel de Google qui teste un site sur téléphone et donne des notes sur 100 : performance, SEO, accessibilité, bonnes pratiques.","« C’est le test de Google lui-même, pas une opinion. »"],
 [["Performance","performance mobile"],"Performance mobile","Note de vitesse du site sur un téléphone moyen (sur 100). Au-dessus de 90 : très bien ; en dessous de 50 : lent.","« Votre site est noté sur sa vitesse par Google, comme un contrôle technique. »"],
 [["accessibilité","Accessibilité"],"Accessibilité","Facilité d’utilisation pour tous, y compris les malvoyants : contrastes, tailles, descriptions des images.","« Un site lisible par tous est aussi mieux compris par Google. »"],
 [["bonnes pratiques","Bonnes pratiques"],"Bonnes pratiques","Note de sécurité et de qualité technique du site (connexion sécurisée, erreurs, images bien dimensionnées).",""],
 [["HTTPS"],"HTTPS (connexion sécurisée)","Le petit cadenas dans la barre d’adresse. Sans lui, le navigateur affiche « Non sécurisé » et Google pénalise le site.","« Sans cadenas, le téléphone du client affiche "+"« site non sécurisé » : ça fait fuir. »"],
 [["Pixel Meta"],"Pixel Meta","Petit code installé sur le site qui mesure les visites venant de Facebook et Instagram. Indispensable pour savoir si une publicité rapporte des clients.","« Sans lui, on fait de la pub à l’aveugle. »"],
 [["Google Tag Manager"],"Google Tag Manager","Outil qui sert de « boîte » pour installer les codes de mesure (Google Analytics, Pixel Meta…) sans toucher au site.",""],
 [["Google Analytics"],"Google Analytics","Outil gratuit de Google qui compte les visiteurs du site, d’où ils viennent et ce qu’ils regardent.",""],
 [["données structurées"],"Données structurées","Informations cachées dans le site, écrites pour Google et les IA : adresse, horaires, téléphone, type de commerce. Elles aident à apparaître correctement dans les résultats.","« C’est une fiche d’identité de votre commerce, lisible par les robots. »"],
 [["méta-description"],"Méta-description","Le petit texte de 2 lignes affiché sous le titre dans les résultats Google. Bien écrit, il donne envie de cliquer.",""],
 [["H1","titre principal (H1)"],"Titre principal (H1)","Le grand titre de la page. Google s’en sert pour comprendre le sujet : il doit contenir l’activité et la ville.",""],
 [["Bing"],"Bing","Le moteur de recherche de Microsoft. Il alimente aussi DuckDuckGo, Ecosia et l’assistant Copilot, et il est utilisé par défaut sur beaucoup d’ordinateurs Windows.","« Environ un ordinateur sur dix cherche avec Bing sans le savoir. »"],
 [["Copilot"],"Copilot","L’assistant IA de Microsoft (Windows, Edge, Bing). Il s’appuie sur les résultats de Bing.",""],
 [["Gemini"],"Gemini","L’assistant IA de Google. L’appli lui pose les mêmes questions qu’un client et regarde s’il cite le commerce.","« De plus en plus de gens demandent à une IA où aller : il faut qu’elle vous connaisse. »"],
 [["Mode IA"],"Mode IA de Google","Nouvelle façon de chercher sur Google : une réponse rédigée par l’IA, avec quelques adresses recommandées, au lieu d’une liste de liens.",""],
 [["médiane"],"Médiane","La valeur du milieu : la moitié des concurrents fait mieux, l’autre moitié fait moins bien. Plus juste qu’une moyenne quand un concurrent a des chiffres énormes.",""],
 [["Engagement","engagement"],"Engagement","Part des personnes qui réagissent (j’aime, commentaires) par rapport à celles qui voient le contenu. Repère courant : 2 % ou plus.","« Ça montre si votre public est vraiment intéressé, pas seulement le nombre d’abonnés. »"],
 [["Shorts"],"Shorts","Vidéos verticales de moins d’une minute sur YouTube, l’équivalent des Reels. C’est le format qui fait venir le plus de nouveaux abonnés.",""],
 [["Reels"],"Reels","Vidéos verticales courtes d’Instagram et Facebook, montrées à des personnes qui ne suivent pas encore le compte.","« C’est la vitrine qui passe devant des gens qui ne vous connaissent pas encore. »"],
 [["SIRENE","registre SIRENE"],"Registre SIRENE","Le registre officiel de l’État où sont inscrites toutes les entreprises françaises, avec leur activité et leur date de création.",""],
 [["OpenStreetMap"],"OpenStreetMap","Carte libre et gratuite, utilisée par Apple Plans, de nombreuses applis et des GPS. Y figurer aide à être trouvé ailleurs que sur Google.",""],
 [["Google Business Profile","fiche Google"],"Fiche Google (Google Business Profile)","La fiche du commerce qui s’affiche sur Google Maps et à droite des résultats : adresse, horaires, photos, avis. C’est souvent le premier contact avec un client.","« C’est votre vitrine sur Google : la plupart des clients la voient avant de venir. »"],
 [["score indicatif"],"Score indicatif","Note sur 100 calculée par l’appli : la part des points vérifiés qui sont réussis, en comptant plus les points les plus importants (avis, position locale). Ce n’est pas une note officielle de Google.","« C’est un repère pour mesurer les progrès d’un audit à l’autre. »"],
 [["balise viewport","viewport"],"Balise viewport","Une ligne de code qui indique au téléphone d’afficher le site à la bonne taille. Sans elle, le site apparaît minuscule sur mobile.",""],
 [["Linktree"],"Linktree","Une page qui regroupe plusieurs liens. Pratique sur Instagram, mais ce n’est pas un vrai site : Google la référence très peu.",""],
 [["chapitres"],"Chapitres YouTube","Repères horaires dans la description (00:00 Introduction…). Google les affiche directement dans ses résultats.",""],
 [["hashtags"],"Hashtags","Mots précédés de # qui classent une publication par thème. 3 à 5 hashtags précis valent mieux que 30 génériques.",""],
 [["indexable","indexables"],"Page indexable","Une page que Google a le droit d’enregistrer et de montrer dans ses résultats.",""],
 [["Carte :","3 premiers"],"Les 3 premiers sur Google Maps","Sur Google Maps, les 3 premiers commerces s’affichent tout de suite (le « pack local ») ; les autres ne se voient qu’en faisant défiler. Ce sont eux qui reçoivent la majorité des appels et des visites.","« Être dans les 3 premiers, c’est être vu sans que le client cherche. »"]
];
let glossRx=null;const glossMap={};
function glossInit(){
 const terms=[];GLOSS.forEach((g,i)=>g[0].forEach(t=>{terms.push(t);glossMap[t.toLowerCase()]=i}));
 terms.sort((a,b)=>b.length-a.length);
 glossRx=new RegExp("(?<![\\p{L}\\d])("+terms.map(t=>t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")).join("|")+")(?![\\p{L}\\d])","u");
}
function glossify(root){
 if(!root)return;if(!glossRx)glossInit();
 const seen=new Set(),walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement&&n.parentElement.closest("a,button,script,style,input,textarea,select,option,svg,.gl,.gpop,.cover h1,h2")?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
 const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 nodes.forEach(n=>{let text=n.nodeValue,m=text.match(glossRx);if(!m)return;
  const frag=document.createDocumentFragment();let changed=false;
  while(m){const i=glossMap[m[1].toLowerCase()];const before=text.slice(0,m.index);if(before)frag.appendChild(document.createTextNode(before));
   if(i!=null&&!seen.has(i)){seen.add(i);const b=document.createElement("button");b.type="button";b.className="gl";b.dataset.gl=i;b.textContent=m[1];b.setAttribute("aria-label",m[1]+" : explication");frag.appendChild(b);changed=true}
   else frag.appendChild(document.createTextNode(m[1]));
   text=text.slice(m.index+m[1].length);m=text.match(glossRx)}
  if(!changed)return;if(text)frag.appendChild(document.createTextNode(text));n.parentNode.replaceChild(frag,n)});
}
function glossClose(){const p=$("gpop");if(p)p.remove()}
function glossOpen(btn){
 glossClose();const g=GLOSS[+btn.dataset.gl];if(!g)return;
 const p=document.createElement("div");p.id="gpop";p.className="gpop";p.setAttribute("role","dialog");p.setAttribute("aria-label",g[1]);
 p.innerHTML='<button type="button" class="gpx" aria-label="Fermer">✕</button><b>'+esc(g[1])+'</b><p>'+esc(g[2])+'</p>'+(g[3]?'<p class="gsay"><span>À dire au client</span>'+esc(g[3])+'</p>':'');
 document.body.appendChild(p);
 const r=btn.getBoundingClientRect(),w=Math.min(330,innerWidth-24);p.style.width=w+"px";
 let left=Math.min(Math.max(12,r.left+r.width/2-w/2),innerWidth-w-12);let top=r.bottom+8;
 const h=p.offsetHeight;if(top+h>innerHeight-12&&r.top-h-8>12)top=r.top-h-8;
 p.style.left=left+"px";p.style.top=Math.max(12,top)+"px";
 p.querySelector(".gpx").onclick=glossClose;
}
document.addEventListener("click",e=>{const b=e.target.closest(".gl");if(b){e.preventDefault();e.stopPropagation();glossOpen(b);return}if(!e.target.closest("#gpop"))glossClose()},true);
document.addEventListener("keydown",e=>{if(e.key==="Escape")glossClose()});
window.addEventListener("scroll",glossClose,{passive:true});

/* ---------- Rapport en 1 page (format par défaut du PDF) ---------- */
function firstSentence(t,max){t=String(t||"").trim();const m=t.match(/^.+?[.!?](\s|$)/);t=m?m[0].trim():t;return t.length>(max||170)?t.slice(0,(max||170)-1).replace(/\s\S*$/,"")+"…":t}
function renderOnePage(){
 const box=$("report1");if(!box)return;
 const b=state.biz,d=state.data||{},c=calc(),[vt,vsub]=verdict(c.score),issues=issuesList(),good=strengths(),p=d.place,ps=d.psi,vis=d.visibility;
 const sender=settings.senderName||"",line=settings.senderLine||"AffiAds",contact=settings.senderContact||"",r=b.reg,ni=r&&nafInfo(r.naf);
 const sub=[ni?ni[0]:b.type,b.address||b.city,r&&r.date?"ouvert en "+fmtOpen(r.date):""].filter(Boolean).join(" · ");
 const col=v=>v==="good"?"#13915b":v==="mid"?"#c27c0e":v==="bad"?"#d1344b":"#6b6890";
 const k=(v,l,cls)=>'<div class="k1"><b style="color:'+col(cls)+'">'+v+'</b><span>'+esc(l)+'</span></div>';
 const hasG=!!p;
 const kp=[hasG?k(p.rating!=null?fr1(p.rating)+"/5":"Aucune","Note Google",p.rating==null?"bad":p.rating>=4.5?"good":p.rating>=4.2?"mid":"bad"):"",hasG?k(p.userRatingCount||0,"Avis Google",(p.userRatingCount||0)>=100?"good":(p.userRatingCount||0)>=50?"mid":"bad"):"",vis?k(vis.top3+"/"+vis.n,"Recherches où il est dans les 3 premiers",vis.top3===vis.n?"good":vis.top3?"mid":"bad"):"",d.grid?k(d.grid.top3+"/"+d.grid.total,"Endroits où il est vu en tête sur Maps",d.grid.top3>=6?"good":d.grid.top3?"mid":"bad"):"",ps&&ps.scores.perf!=null?k(ps.scores.perf+"/100","Vitesse du site sur mobile",scoreColor(ps.scores.perf)):(d.fetchedAt&&!normalizeUrl(b.site)?k("Aucun","Site web à lui","bad"):""),d.social?k(Object.keys(d.social.found).length+"/5","Réseaux sociaux trouvés",Object.keys(d.social.found).length>=2?"good":Object.keys(d.social.found).length?"mid":"bad"):""].filter(Boolean).slice(0,4).join("");
 const sc=c.score,R=34,C=2*Math.PI*R,dash=sc==null?0:C*sc/100,scol=sc==null?"#b9b6d3":sc>=85?"#13915b":sc>=60?"#c27c0e":"#d1344b";
 const ring='<svg viewBox="0 0 84 84" width="104" height="104" aria-hidden="true"><circle cx="42" cy="42" r="'+R+'" fill="none" stroke="#ece9fb" stroke-width="9"/><circle cx="42" cy="42" r="'+R+'" fill="none" stroke="'+scol+'" stroke-width="9" stroke-linecap="round" stroke-dasharray="'+dash.toFixed(1)+' '+C.toFixed(1)+'" transform="rotate(-90 42 42)"/><text x="42" y="44" text-anchor="middle" font-size="24" font-weight="800" fill="#17134a" font-family="inherit">'+(sc??"—")+'</text><text x="42" y="58" text-anchor="middle" font-size="9" fill="#6b6890" font-family="inherit">sur 100</text></svg>';
 const gs=groupScores().filter(g=>g.score!=null);
 const categoryNames={"A":"Fiche Google","B":"Site web","C":"Réseaux sociaux","D":"Réputation","E":"Visibilité IA","F":"Concurrence"};
 const bars=gs.length?'<div class="opchart" role="img" aria-label="Scores par catégorie, sur 100"><div class="opcharthead"><b>Scores par catégorie</b><span>sur 100</span></div>'+gs.map(g=>{const label=categoryNames[g.title[0]]||g.title;const score=Math.max(0,Math.min(100,Number(g.score)||0));const color=col(scoreColor(score));return '<div class="opchartrow"><span class="opchartlabel" title="'+esc(label)+'">'+esc(label)+'</span><div class="opcharttrack"><i style="width:'+score+'%;background:'+color+'"></i></div><b class="opchartvalue" style="color:'+color+'">'+score+'</b></div>'}).join("")+'</div>':'<div class="opchart opchartempty"><b>Scores par catégorie</b><p>Aucun score de catégorie disponible pour le moment. Complétez les vérifications pour afficher les statistiques.</p></div>';
 const F=(d.findings||[]).slice(0,4).map(f=>firstSentence(f.text,200));
 const G=good.slice(0,4).map(g=>g.it);
 const A=issues.slice(0,5);
 const by={};issues.forEach(x=>{if(x.offer)(by[x.offer]=by[x.offer]||0),by[x.offer]+=x.prio});const offers=Object.entries(by).sort((a,b2)=>b2[1]-a[1]).slice(0,3).map(x=>x[0]);
 const ok='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#13915b"/><path d="M4.5 8.2l2.2 2.2 4.8-4.8" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
 const ko='<svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"><circle cx="8" cy="8" r="8" fill="#d1344b"/><path d="M8 4.2v5M8 11.4v.4" stroke="#fff" stroke-width="1.9" stroke-linecap="round"/></svg>';
 box.innerHTML='<div class="op">'
  +'<div class="ophead"><span class="opbrand"><span class="oplogo"><img src="assets/logo-64.png" alt="" width="26" height="26"></span>AffiAds Audit 360°</span><span class="opdate">Audit de visibilité en ligne<br>'+esc(frDate(b.date||today()))+'</span></div>'
  +'<div class="optitle'+(!String(b.name||"").trim()?' op-emptytitle':'')+'"><h1>'+esc(b.name||"Votre prochain audit")+'</h1>'+(sub?'<p class="opsub">'+esc(sub)+'</p>':'')+(!String(b.name||"").trim()?'<p class="op-emptyhint">Renseignez le nom et la ville du commerce pour personnaliser ce rapport.</p>':'')+'</div>'
  +'<div class="oprow"><div class="opscore">'+ring+'<div><b>'+esc(vt)+'</b><span>'+esc(vsub)+'</span></div></div><div class="opk">'+kp+'</div></div>'
  +(d.partial&&d.fetchedAt?'<p class="opnote">Audit partiel : la fiche Google n’a pas été analysée, les chiffres Google ne sont pas inclus.</p>':'')
  +bars
  +(d.social?'<div class="opsoc"><span>Réseaux sociaux</span>'+NETS.map(([n])=>'<span class="opnet'+(d.social.found[n]?"":" off")+'">'+netIcon(n,22,!d.social.found[n])+'<em>'+(d.social.found[n]?"Présent":"À vérifier")+'</em></span>').join("")+'</div>':'')
  +'<div class="op2"><div class="opbox good"><h3>Ce qui va bien</h3>'+(G.length?'<ul>'+G.map(x=>'<li>'+ok+'<span>'+esc(x)+'</span></li>').join("")+'</ul>':'<p>À confirmer lors de l’échange.</p>')+'</div><div class="opbox bad"><h3>Ce qui freine les clients</h3>'+(F.length?'<ul>'+F.map(x=>'<li>'+ko+'<span>'+esc(x)+'</span></li>').join("")+'</ul>':'<p>Aucun frein majeur relevé.</p>')+'</div></div>'
  +'<h3 class="opt">Plan d’action : les '+A.length+' priorités</h3>'+(A.length?'<div class="opacts">'+A.map((x,i)=>{const l=prioLabel(x);return '<div class="opact"><span class="opnum">'+(i+1)+'</span><div><b>'+esc(x.it)+'</b><span>'+esc(x.goal?firstSentence(x.goal,170):firstSentence(x.reco,170))+'</span></div><em class="'+l[1]+'">'+esc(l[0])+'</em></div>'}).join("")+'</div>':'<p>Aucune action urgente.</p>')
  +'<div class="opoffer"><div class="opofl"><h3>Ce qu’AffiAds vous propose</h3><p>'+(offers.length?offers.map(o=>'<span class="opchip">'+esc(o)+'</span>').join(""):'<span class="opchip">Suivi de votre visibilité</span>')+'</p><p class="opcta">Un échange de 10 minutes pour choisir ensemble les actions. Démo et devis gratuits, sans engagement.</p></div><div class="opsign"><b>'+esc(sender||"AffiAds")+'</b><span>'+esc(line)+'</span>'+(contact?'<span class="opcontact">'+esc(contact)+'</span>':'')+'</div></div>'
  +'<p class="opfoot">Données publiques relevées le '+esc(d.fetchedAt||frDate(today()))+' : Google, Bing, site web, réseaux sociaux'+(r?", registre SIRENE":"")+'. Score indicatif ; les positions varient selon la personne et le lieu ; aucun résultat n’est garanti. Rapport détaillé disponible sur demande.</p>'
  +'</div>';
}
function setReportFormat(f){settings.reportFormat=f;saveSettings(true);document.body.classList.toggle("rep-one",f!=="full");document.querySelectorAll("[data-repfmt]").forEach(b=>b.classList.toggle("on",b.dataset.repfmt===f))}

/* ---------- Vrai fichier PDF (fonctionne aussi dans l’appli installée sur iPhone, où « Imprimer » ne marche pas) ---------- */
const libCache={};
function loadLib(url,test){if(test())return Promise.resolve();if(libCache[url])return libCache[url];libCache[url]=new Promise((ok,ko)=>{const sc=document.createElement("script");sc.src=url;sc.onload=()=>test()?ok():ko(new Error("bibliothèque PDF"));sc.onerror=()=>{delete libCache[url];ko(new Error("Chargement impossible (connexion ?)"))};document.head.appendChild(sc)});return libCache[url]}
function pdfName(){return ((settings.reportFormat==="full"?"Rapport complet AffiAds - ":"Audit AffiAds - ")+(state.biz.name||"commerce")+(state.biz.city?" - "+state.biz.city:"")).replace(/[\\/:*?"<>|]+/g," ").trim()+".pdf"}
let pdfBusy=false;
async function pdfCanvas(el,sc){return html2canvas(el,{scale:sc||2,backgroundColor:"#ffffff",useCORS:true,logging:false,width:794,windowWidth:794})}

/* PDF polish 2026-97: more deliberate A4 pagination and document metadata */
function pdfPageHead(doc,M,y,title){
 doc.setFont("helvetica","bold");doc.setFontSize(8.5);doc.setTextColor(57,72,216);
 doc.text("AffiAds Audit 360°",M,9);
 doc.setFont("helvetica","normal");doc.setFontSize(8);doc.setTextColor(88,96,128);
 const biz=[state.biz.name,state.biz.city].filter(Boolean).join(" · ");
 doc.text(biz.slice(0,64),210-M,9,{align:"right"});
 doc.setDrawColor(218,224,246);doc.setLineWidth(.3);doc.line(M,11.5,210-M,11.5);
 if(title){doc.setFont("helvetica","bold");doc.setFontSize(12);doc.setTextColor(27,38,76);doc.text(title.slice(0,90),M,18);return 24}
 return y;
}

async function makePdf(){
 if(pdfBusy)return;pdfBusy=true;const full=settings.reportFormat==="full";
 const btns=[$("pdf"),$("printReport")];btns.forEach(b=>{if(b){b.disabled=true;b.dataset.t=b.textContent;b.textContent="Création du PDF…"}});
 let holder=null;const prevTheme=document.documentElement.getAttribute("data-theme");
 try{
  await Promise.all([loadLib("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",()=>!!window.html2canvas),loadLib("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",()=>!!(window.jspdf&&window.jspdf.jsPDF))]);
  document.documentElement.setAttribute("data-theme","light");renderOnePage();renderReport();
  holder=document.createElement("div");holder.className="pdfhold"+(full?" pdffull":"");document.body.appendChild(holder);
  const {jsPDF}=window.jspdf;const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4",compress:true});
  try{await document.fonts.ready}catch(e){}
  if(!full){
   const page=$("report1").cloneNode(true);page.removeAttribute("id");page.classList.add("pdfpage");holder.appendChild(page);await sleep(120);
   const canvas=await pdfCanvas(page,2.5);
   const maxW=194,maxH=268,scale=Math.min(maxW/canvas.width,maxH/canvas.height);
   const w=canvas.width*scale,h=canvas.height*scale,x=(210-w)/2,y=(297-h)/2;
   doc.setFillColor(255,255,255);doc.rect(0,0,210,297,"F");
   doc.addImage(canvas.toDataURL("image/jpeg",0.94),"JPEG",x,y,w,h,undefined,"FAST");
   doc.setDrawColor(226,228,245);doc.setLineWidth(0.25);doc.line(10,285,200,285);
   doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(115,116,145);
   doc.text("AFFIADS AUDIT 360°  ·  DOCUMENT DE TRAVAIL CONFIDENTIEL",10,290);
   doc.text("Édité le "+frDate(today()),200,290,{align:"right"});
  }else{
   const src=$("report").querySelector("table.printwrap>tbody>tr>td")||$("report");
   const wrap=document.createElement("div");wrap.className="card report pdfpage";wrap.innerHTML=src.innerHTML;holder.appendChild(wrap);await sleep(150);
   const M=12,TOP=25,BOT=17,CW=210-2*M,CH=297-TOP-BOT;
   const blocks=[];[...wrap.children].forEach(el=>{
    if(el.classList.contains("sec")&&el.offsetHeight*0.2645>150){
     [...el.children].forEach(ch=>blocks.push({el:ch,section:el.querySelector(":scope > h2")?.textContent||""}));
    }else blocks.push({el,section:el.classList.contains("cover")?"":""});
   });
   let y=TOP,first=true;
   const head=(section)=>{pdfPageHead(doc,M,TOP,section||"");};
   for(const item of blocks){
    const el=item.el;if(!el.offsetHeight)continue;
    const section=item.section||"";
    const cv=await pdfCanvas(el,1.8);const hmm=cv.height*CW/cv.width;
    const isCover=el.classList.contains("cover");
    const isHeading=/^H[23]$/.test(el.tagName)||el.classList.contains("opt");
    const reserved=isHeading?Math.max(18,hmm+7):0;
    if(isCover&&first===false){doc.addPage();y=TOP;head(section)}
    if((y+hmm+reserved>TOP+CH)&&y>TOP+1){doc.addPage();y=TOP;head(section)}
    if(hmm<=CH){
     doc.addImage(cv.toDataURL("image/jpeg",0.9),"JPEG",M,y,CW,hmm,undefined,"FAST");
     y+=hmm+3;
    }else{
     const pxPerMm=cv.width/CW;let off=0;
     while(off<cv.height){
      const room=Math.max(10,((TOP+CH)-y)*pxPerMm);const hpx=Math.min(room,cv.height-off);
      const part=document.createElement("canvas");part.width=cv.width;part.height=Math.ceil(hpx);
      part.getContext("2d").drawImage(cv,0,-off);
      doc.addImage(part.toDataURL("image/jpeg",0.9),"JPEG",M,y,CW,hpx/pxPerMm,undefined,"FAST");
      off+=hpx;y+=hpx/pxPerMm+3;
      if(off<cv.height){doc.addPage();y=TOP;head(section)}
     }
    }
    if(isCover){doc.addPage();y=TOP;head("Sommaire de l’audit")}
    first=false;
   }
   const n=doc.getNumberOfPages();
   for(let i=1;i<=n;i++){
    doc.setPage(i);doc.setFont("helvetica","normal");doc.setFontSize(7.5);doc.setTextColor(112,120,148);
    doc.setDrawColor(225,229,243);doc.setLineWidth(.25);doc.line(M,284.5,210-M,284.5);
    doc.text((settings.senderLine||"AffiAds")+(settings.senderContact?" · "+settings.senderContact:""),M,290);
    doc.text("Page "+i+" / "+n,210-M,290,{align:"right"});
   }
  }
  doc.setProperties({title:pdfName().replace(/\.pdf$/,""),author:settings.senderName||"AffiAds",creator:"AffiAds Audit 360°"});
  showPdfSheet(doc.output("blob"));
 }catch(e){toast("PDF impossible pour le moment : "+(e&&e.message||"erreur")+". Réessayez dans un instant.")}
 finally{if(prevTheme)document.documentElement.setAttribute("data-theme",prevTheme);else document.documentElement.removeAttribute("data-theme");if(holder)holder.remove();pdfBusy=false;btns.forEach(b=>{if(b){b.disabled=false;b.textContent=b.dataset.t||b.textContent}})}
}
function showPdfSheet(blob){
 const old=$("pdfSheet");if(old)old.remove();
 const name=pdfName(),file=new File([blob],name,{type:"application/pdf"}),url=URL.createObjectURL(blob);
 const canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}));
 const el=document.createElement("div");el.id="pdfSheet";el.className="pdfsheet";el.setAttribute("role","dialog");el.setAttribute("aria-label","PDF prêt");
 el.innerHTML='<div class="pdfcard"><div class="pdfico" aria-hidden="true">PDF</div><b>Votre PDF est prêt</b><span>'+esc(name)+' · '+Math.max(1,Math.round(blob.size/1024))+' Ko</span><div class="pdfacts">'+(canShare?'<button type="button" class="btn primary" id="pdfShare">Envoyer ou enregistrer</button>':'')+'<a class="btn'+(canShare?'':' primary')+'" id="pdfOpen" href="'+url+'" download="'+esc(name)+'" target="_blank" rel="noopener">'+(canShare?"Ouvrir le PDF":"Télécharger le PDF")+'</a><button type="button" class="btn" id="pdfClose">Fermer</button></div><small>« Envoyer ou enregistrer » ouvre le menu de partage : WhatsApp, Mail, Messages, ou « Enregistrer dans Fichiers ».</small></div>';
 document.body.appendChild(el);
 const close=()=>{el.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)};
 $("pdfClose").onclick=close;el.addEventListener("click",e=>{if(e.target===el)close()});
 if(canShare)$("pdfShare").onclick=async()=>{try{await navigator.share({files:[file],title:name.replace(/\.pdf$/,"")});close()}catch(e){if(e&&e.name!=="AbortError")toast("Partage impossible : utilisez « Ouvrir le PDF ».")}};
}

/* ---------- Message prospect ---------- */
function buildPitch(){
 const b=state.biz,d=state.data||{},tone=$("pitchTone").value,who=$("pitchContact").value.trim();
 const sender=settings.senderName||"Denis",line=settings.senderLine||"AffiAds — Votre visibilité, notre expertise.",contact=settings.senderContact||"";
 const raw=(d.findings||[]).map(f=>String(f.text||"").trim()).filter(Boolean);
 const fallback=issuesList().map(p=>p.it.charAt(0).toUpperCase()+p.it.slice(1)+" : "+p.reco.charAt(0).toLowerCase()+p.reco.slice(1));
 const facts=[...new Set((raw.length?raw:fallback).map(s=>s.replace(/^[-•\s]+/,"").replace(/\s+/g," ").trim()).filter(Boolean))].slice(0,tone==="sms"?1:2);
 const hello="Bonjour"+(who?" "+who:"")+",";
 const biz=(b.name||"votre établissement").trim(),city=b.city?" à "+b.city.trim():"";
 const brand=line.split("—")[0].trim()||"AffiAds";
 const signature="\n\n"+sender+"\n"+line+(contact?"\n"+contact:"");
 const teaser=facts[0]||"quelques pistes concrètes pour améliorer votre visibilité en ligne";
 if(tone==="sms")return hello+"\n\nJe suis "+sender+" d’"+brand+". En regardant la présence en ligne de "+biz+city+", j’ai repéré une piste à explorer : "+teaser.charAt(0).toLowerCase()+teaser.slice(1)+".\n\nJe peux vous envoyer un court résumé, gratuitement et sans engagement. Cela vous intéresserait ?"+signature;
 if(tone==="email"){
  const bullets=facts.length?facts.map(f=>"• "+f).join("\n"):"• Quelques pistes à vérifier sur votre fiche Google, votre site et vos réseaux sociaux.";
  return "Objet : Quelques pistes pour la visibilité de "+biz+"\n\n"+hello+"\n\nJe me permets de vous contacter au nom d’"+brand+". Nous accompagnons les commerces et professionnels dans leur visibilité en ligne : fiche Google, site internet, contenus vidéo et réseaux sociaux.\n\nJ’ai examiné les informations publiques disponibles concernant "+biz+city+" et relevé quelques points qui mériteraient d’être étudiés :\n\n"+bullets+"\n\nJe peux vous transmettre le résumé de l’audit et vous présenter les actions à envisager, en fonction de vos priorités. Vous restez bien entendu libre d’y donner suite ou non.\n\nSeriez-vous disponible pour un bref échange, ou préférez-vous recevoir le résumé par e-mail ?\n\nBien cordialement,"+signature;
 }
 const bullets=facts.length?facts.map(f=>"• "+f).join("\n"):"• Quelques pistes à vérifier sur votre fiche Google, votre site et vos réseaux sociaux.";
 return hello+"\n\nJe suis "+sender+" d’"+brand+". J’ai examiné les informations publiques concernant "+biz+city+" et repéré quelques pistes d’amélioration :\n\n"+bullets+"\n\nSi vous le souhaitez, je peux vous envoyer un résumé clair avec les priorités à envisager. Vous pourrez le consulter librement, sans engagement.\n\nEst-ce que je vous l’envoie ?"+signature;
}

/* ---------- Navigation ---------- */
const VIEWS=["auto","clients","home","audit","report","pitch","social","campaign","research","webcheck","tools","settings"];
const TITLES={social:["Instagram et YouTube","Audit d’un compte : niche, SEO, régularité, engagement et plan d’action."],auto:["Audit","Un nom, une ville : l'application collecte les données publiques pour vous."],clients:["Clients","Tous vos audits, enregistrés sur cet appareil."],campaign:["Visibilité IA","Lancez des tests comparables dans les assistants IA, question déjà remplie."],research:["Recherche web","Recherches publiques ciblées pour documenter l’audit."],webcheck:["Tests du site","Vitesse, SEO et qualité du site sur téléphone."],home:["Fiche commerce","Coordonnées du commerce et diagnostic par catégorie."],audit:["Checklist","Points automatiques avec preuve, et points à vérifier à la main."],report:["Rapport client","Prêt à imprimer ou enregistrer en PDF."],pitch:["Message prospect","Un message basé sur les constats réels de l'audit."],tools:["Boîte à outils","Liens directs vers les outils de vérification."],settings:["Réglages","Thème, installation, clé Google, signature et sauvegardes."]};
function closeMore(){const n=document.querySelector(".nav");n.classList.remove("open");$("navMore").setAttribute("aria-expanded","false")}
let curView="auto";
function nav(v){
 closeMore();if(!TITLES[v])v="auto";
 const swap=()=>{VIEWS.forEach(x=>$("view-"+x).classList.toggle("hidden",x!==v));document.querySelectorAll(".nav button[data-view]").forEach(b=>{const on=b.dataset.view===v;b.classList.toggle("active",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});$("navMore").classList.toggle("active",!["auto","clients","report"].includes(v));$("pageTitle").textContent=TITLES[v][0];$("pageSub").textContent=TITLES[v][1];document.body.dataset.view=v;if(v==="report")renderReport();if(v==="tools")renderTools();if(v==="clients")renderClientSelect();if(v==="pitch"&&!$("pitchText").value.trim()){$("pitchText").value=state.pitch=buildPitch()}};
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(document.startViewTransition&&!reduce&&v!==curView)document.startViewTransition(swap);else swap();
 if(v==="social")renderSocial();
 curView=v;if(location.hash!=="#"+v)history.replaceState(null,"","#"+v);
 window.scrollTo({top:0,behavior:reduce?"auto":"smooth"});
}

/* ---------- Boîte à outils (liens préremplis) ---------- */
function renderTools(){
 const b=state.biz,n=(b.name||"").trim(),c=(b.city||"").trim(),u=normalizeUrl(b.site),q=s=>encodeURIComponent(s.trim());
 const list=[["Google Business Profile","https://business.google.com/","Gérer la fiche (accès propriétaire)"],["Fiche Google Maps",safeUrl(b.maps)||"https://www.google.com/maps/search/"+q(n+" "+c),"Avis, photos, horaires"],
  ["PageSpeed Insights",u?"https://pagespeed.web.dev/analysis?url="+encodeURIComponent(u.href)+"&form_factor=mobile":"https://pagespeed.web.dev/","Vitesse du site"],
  ["Test des résultats enrichis",u?"https://search.google.com/test/rich-results?url="+encodeURIComponent(u.href):"https://search.google.com/test/rich-results?hl=fr","Données structurées"],
  ["Pages indexées",u?"https://www.google.com/search?q="+q("site:"+u.hostname):"https://www.google.com/","Combien de pages Google connaît"],
  ["Bibliothèque publicitaire Meta","https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&search_type=keyword_unordered&q="+q(n),"Publicités actives"],
  ["Recherche réseaux sociaux (Google)","https://www.google.com/search?q="+q('"'+n+'" '+c+" (site:instagram.com OR site:facebook.com OR site:tiktok.com OR site:youtube.com OR site:snapchat.com)"),"Recherche large des comptes publics"],
  ["TikTok — Google","https://www.google.com/search?q="+q(n+" "+c+" site:tiktok.com"),"Recherche ciblée des profils et vidéos"],
  ["TikTok — Bing","https://www.bing.com/search?q="+q(n+" "+c+" site:tiktok.com"),"Deuxième moteur pour réduire les faux négatifs"],
  ["TikTok — recherche directe","https://www.tiktok.com/search?q="+q(n+" "+c),"Recherche sur TikTok"],
  ["Instagram — Google","https://www.google.com/search?q="+q(n+" "+c+" site:instagram.com"),"Recherche ciblée des profils"],
  ["Facebook — Google","https://www.google.com/search?q="+q(n+" "+c+" site:facebook.com"),"Recherche ciblée des pages"],
  ["YouTube — Google","https://www.google.com/search?q="+q(n+" "+c+" site:youtube.com"),"Recherche ciblée des chaînes"],
  ["Snapchat — Google","https://www.google.com/search?q="+q(n+" "+c+" site:snapchat.com"),"Recherche ciblée des profils"],
  ["PagesJaunes","https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui="+q(n)+"&ou="+q(c),"Annuaire"],
  ["Tripadvisor","https://www.tripadvisor.fr/Search?q="+q(n+" "+c),"Avis touristiques"],
  ["OpenStreetMap",state.data&&state.data.osm&&state.data.osm.me?state.data.osm.me.url:"https://www.openstreetmap.org/search?query="+q(n+" "+c),"Alimente Apple Plans et de nombreuses applis"],
  ["Search Console","https://search.google.com/search-console/about?hl=fr","SEO du site (accès propriétaire)"]];
 $("links").innerHTML=list.map(t=>'<a href="'+esc(t[1])+'" target="_blank" rel="noopener"><span><b>'+esc(t[0])+'</b><br><span class="muted">'+esc(t[2])+' ↗</span></span></a>').join("");
 const verify=$("saveSocialVerified");
 if(verify)verify.onclick=()=>{
  const raw=$("socialVerifiedUrl").value.trim(),net=$("socialVerifiedNet").value;
  if(!raw){toast("Collez le lien public du profil à vérifier.");$("socialVerifiedUrl").focus();return}
  const domains={"Facebook":"facebook.com","Instagram":"instagram.com","TikTok":"tiktok.com","YouTube":"youtube.com","Snapchat":"snapchat.com"};
  let url=raw;
  if(/^@/.test(url))url="https://www."+domains[net]+"/"+url;
  else if(!(url.startsWith("https://")||url.startsWith("http://")))url="https://"+url;
  let parsed;try{parsed=new URL(url)}catch(e){toast("Lien invalide : vérifiez l’adresse du profil.");return}
  const detected=netOf(parsed.hostname);
  if(!detected||detected!==net||!profileOk(parsed.href)){toast("Le lien ne correspond pas à un profil "+net+".");return}
  if(!state.data)state.data={};
  if(!state.data.social)state.data.social={found:{},engine:"",checked:NETS.map(x=>x[0])};
  if(!state.data.social.found)state.data.social.found={};
  state.data.social.found[net]={url:parsed.href,src:"vérification manuelle",verified:true,confidence:"confirmé par l’utilisateur"};
  state.data.socials=state.data.socials||[];
  state.data.socials=state.data.socials.filter(x=>(x.net||netOf(hostOf(x.url)))!==net);
  state.data.socials.push({net,url:parsed.href,src:"vérification manuelle",verified:true});
  if(net==="TikTok")setAuto("2-1","ok","Compte TikTok confirmé manuellement : "+parsed.href,"Profil ouvert et vérifié manuellement");
  if(net==="Facebook"||net==="Instagram")setAuto("2-0","ok","Compte "+net+" confirmé manuellement : "+parsed.href,"Profil ouvert et vérifié manuellement");
  persistLocal();update();renderTools();toast(net+" ajouté au rapport comme profil vérifié.");
 };

}

/* ---------- Visibilité IA ---------- */
function campaignInputFromBiz(){$("campaignBusiness").value=$("name").value||"";$("campaignCity").value=$("city").value||"";$("campaignType").value=state.biz.keyword||$("type").value||"";$("campaignService").value="";$("campaignExtra").value=""}
function getCampaignPrompts(silent){
 const name=$("campaignBusiness").value.trim(),city=$("campaignCity").value.trim(),type=$("campaignType").value.trim(),service=$("campaignService").value.trim(),extra=$("campaignExtra").value.trim();
 if(!city||(!name&&!type&&!service)){if(!silent)toast("Renseignez au minimum la ville et le nom ou l’activité.");return []}
 const kt=BIZ_TYPES.find(t=>t.kw&&norm(t.kw)===norm(type));const typeP=type?(kt?artOf(kt.label)+type:"un établissement « "+type+" »"):"";
 const subject=name||typeP,campaignId=String(Date.now());
 const prompts=[
  {id:campaignId+"-1",kind:"Découverte locale",text:"Je cherche "+(typeP||"un commerce")+" à "+city+". Quels établissements me recommandes-tu ?"},
  {id:campaignId+"-2",kind:"Besoin principal",text:"Quel est le meilleur choix à "+city+" pour "+(service||(typeP?"trouver "+typeP:"ce type de service"))+" ?"+(extra?" Critère important : "+extra+".":"")},
  {id:campaignId+"-3",kind:"Recommandation précise",text:"Peux-tu comparer "+subject+" à "+city+" avec d’autres établissements locaux pour "+(service||(typeP?"trouver "+typeP:"ce besoin"))+" ? Cite tes sources si possible."},
  {id:campaignId+"-4",kind:"Marque exacte",text:"Que peux-tu me dire sur "+subject+" à "+city+" ? Donne son site officiel, ses services et les sources qui confirment ces informations."},
  {id:campaignId+"-5",kind:"Recherche sans marque",text:"Je suis à "+city+" et je cherche "+(service||typeP||"un établissement adapté")+(extra?" avec ces critères : "+extra:"")+". Quels sont les meilleurs choix et pourquoi ?"},
  {id:campaignId+"-6",kind:"Sources et fiabilité",text:"Quelles sources fiables permettent de vérifier les horaires, les tarifs et les avis de "+subject+" à "+city+" ? Signale les incertitudes."}];
 state.campaign={id:campaignId,name,city,type,service,extra,createdAt:today()};state.campaignPrompts=prompts;persistLocal();renderCampaignPrompts();return prompts;
}
function prepareAiForm(platform,q,cid){$("aiPlatform").value=platform;$("aiPrompt").value=q.text;$("aiDate").value=today();$("aiPresence").value="partial";$("aiRank").value="";$("aiCompetitors").value="";$("aiSource").value="";$("aiNotes").value="Campagne : "+q.kind;state.activeCampaignId=cid;state.activeCampaignPromptId=q.id;persistLocal()}
function renderCampaignPrompts(){
 const p=state.campaignPrompts,cid=state.campaign&&state.campaign.id||"";
 const tests=state.aiTests.filter(t=>t.campaignId===cid),completed=tests.filter(t=>t.presence==="yes"||t.presence==="no"),mentions=completed.filter(t=>t.presence==="yes").length,rate=completed.length?Math.round(mentions/completed.length*100):null;
 $("campaignProgress").innerHTML='<div class="card s3"><div class="metric">'+p.length+'<small>Questions prévues</small></div></div><div class="card s3"><div class="metric">'+tests.length+'<small>Tests enregistrés</small></div></div><div class="card s3"><div class="metric">'+(rate===null?"—":rate+"%")+'<small>Taux de présence (oui/non)</small></div></div><div class="card s3"><div class="metric">'+tests.filter(t=>t.presence==="partial").length+'<small>Résultats incertains</small></div></div>';
 const perPlatform=AI_TARGETS.map(a=>{const ts=tests.filter(t=>t.platform===a.name&&(t.presence==="yes"||t.presence==="no"));const yes=ts.filter(t=>t.presence==="yes").length;return '<div class="priority"><b>'+esc(a.name)+'</b><small>'+ts.length+' test(s) terminé(s) · '+(ts.length?Math.round(yes/ts.length*100)+"% de présence":"pas encore testé")+'</small></div>'}).join("");
 const rows=p.map((q,i)=>{const qTests=tests.filter(t=>t.campaignPromptId===q.id);const done=new Set(qTests.map(t=>t.platform));
  return '<div class="priority"><b>'+(i+1)+'. '+esc(q.kind)+'</b><p>'+esc(q.text)+'</p><small>'+(qTests.length?qTests.length+" résultat(s) enregistré(s)":"Pas encore testé")+'</small><div class="actions">'+AI_TARGETS.map(a=>'<button class="btn" data-open-ai="'+esc(a.name)+'" data-ai-prompt="'+i+'">'+(done.has(a.name)?"✓ ":"")+'Ouvrir '+esc(a.name)+'</button>').join("")+'<button class="btn primary" data-record-campaign="'+i+'">Saisir un résultat</button><button class="btn" data-copy-prompt="'+i+'">Copier la question</button></div></div>'}).join("");
 $("campaignQuestions").innerHTML=p.length?'<h3>Questions comparables</h3><p class="muted">Chaque bouton copie la question et ouvre l’assistant avec la question déjà remplie quand il le permet (sinon, collez-la). Revenez ensuite ici pour noter le résultat.</p>'+rows+'<h3 style="margin-top:18px">Résultats par assistant</h3>'+perPlatform:'<p class="muted">Renseignez le commerce et générez une campagne pour commencer.</p>';
 $("campaignQuestions").querySelectorAll("[data-open-ai]").forEach(b=>b.onclick=()=>{const ai=AI_TARGETS.find(a=>a.name===b.dataset.openAi),q=p[Number(b.dataset.aiPrompt)];prepareAiForm(ai.name,q,cid);copyText(q.text);window.open(ai.q+encodeURIComponent(q.text),"_blank","noopener");toast("Question copiée et "+ai.name+" ouvert. Notez ensuite le résultat.");nav("research");setTimeout(()=>$("aiPresence").scrollIntoView({behavior:"smooth",block:"center"}),80)});
 $("campaignQuestions").querySelectorAll("[data-record-campaign]").forEach(b=>b.onclick=()=>{const q=p[Number(b.dataset.recordCampaign)];prepareAiForm($("aiPlatform").value,q,cid);nav("research");setTimeout(()=>$("aiPresence").scrollIntoView({behavior:"smooth",block:"center"}),80)});
 $("campaignQuestions").querySelectorAll("[data-copy-prompt]").forEach(b=>b.onclick=()=>copyText(p[Number(b.dataset.copyPrompt)].text,"Question copiée."));
}
function aiAutoChecks(){
 const has=n=>state.aiTests.filter(t=>t.platform===n&&(t.presence==="yes"||t.presence==="no"));
 [["4-0","ChatGPT"],["4-1","Claude"]].forEach(([k,n])=>{const ts=has(n);if(ts.length){const yes=ts.filter(t=>t.presence==="yes").length;setAuto(k,yes?"ok":"issue",n+" : cité dans "+yes+" test(s) sur "+ts.length+".","Tests IA enregistrés")}});
 {const ts=has("Google Mode IA");if(ts.length){const yes=ts.filter(t=>t.presence==="yes").length;setAuto("4-6",yes?"ok":"issue","Google Mode IA : cité dans "+yes+" test(s) sur "+ts.length+".","Tests IA enregistrés")}}
 const others=["Google Gemini","Perplexity","Microsoft Copilot"].map(n=>[n,has(n)]).filter(x=>x[1].length);
 if(others.length){const yes=others.reduce((s,x)=>s+x[1].filter(t=>t.presence==="yes").length,0),tot=others.reduce((s,x)=>s+x[1].length,0);setAuto("4-5",yes?"ok":"issue",others.map(x=>x[0]).join(", ")+" : cité dans "+yes+" test(s) sur "+tot+".","Tests IA enregistrés")}
}
function drawAiTests(){
 const tests=state.aiTests,completed=tests.filter(t=>t.presence==="yes"||t.presence==="no"),yes=completed.filter(t=>t.presence==="yes").length,rate=completed.length?Math.round(yes/completed.length*100):null;
 const byPlatform=[...new Set(tests.map(t=>t.platform||"Assistant inconnu"))].map(name=>{const rows=tests.filter(t=>(t.platform||"Assistant inconnu")===name),measured=rows.filter(t=>t.presence==="yes"||t.presence==="no"),hits=measured.filter(t=>t.presence==="yes").length;return {name,total:rows.length,measured:measured.length,hits,rate:measured.length?Math.round(hits/measured.length*100):null,last:rows.map(t=>t.date).filter(Boolean).sort().pop()||""}}).sort((a,b)=>b.total-a.total);
 $("aiSummary").innerHTML='<div class="card s3"><div class="metric">'+tests.length+'<small>Tests enregistrés</small></div></div><div class="card s3"><div class="metric">'+(rate===null?"—":rate+"%")+'<small>Taux de présence (oui/non)</small></div></div><div class="card s3"><div class="metric">'+tests.filter(t=>t.presence==="no").length+'<small>Tests sans présence</small></div></div>'+(byPlatform.length?'<div class="card full"><h3>Comparaison par assistant</h3><p class="muted">Seuls les résultats « Présent » et « Absent » entrent dans le taux. Les réponses « Incertain » restent visibles mais ne sont pas comptées. Comparez des questions similaires et des dates proches.</p><div class="tablewrap"><table class="t"><thead><tr><th>Assistant</th><th>Tests</th><th>Présent</th><th>Taux de présence</th><th>Dernier test</th></tr></thead><tbody>'+byPlatform.map(x=>'<tr><td>'+esc(x.name)+'</td><td>'+x.total+' ('+x.measured+' mesurés)</td><td>'+x.hits+' / '+x.measured+'</td><td>'+(x.rate===null?"Non calculable":x.rate+"%")+(x.measured?'<div class="bar"><div class="fill" style="width:'+x.rate+'%"></div></div>':"")+'</td><td>'+esc(x.last||"—")+'</td></tr>').join("")+'</tbody></table></div></div>':"");
 $("aiTestsList").innerHTML=tests.length?'<h3 style="margin:16px 0 8px">Historique des tests</h3>'+tests.slice().reverse().map((t,idx)=>'<div class="priority"><b>'+esc(t.platform)+' · '+esc(t.date)+'</b><small>'+esc(t.prompt)+'</small><p>'+(t.presence==="yes"?"Présent":t.presence==="no"?"Absent":"Incertain")+(t.rank?" · Position notée : "+esc(t.rank):"")+(t.competitors?" · Concurrents : "+esc(t.competitors):"")+'</p>'+(safeUrl(t.source)?'<a target="_blank" rel="noopener" href="'+esc(safeUrl(t.source))+'">Source citée ↗</a>':"")+(t.notes?'<p>'+esc(t.notes)+'</p>':"")+'<div class="actions"><button class="btn" data-delete-ai="'+(tests.length-1-idx)+'">Supprimer ce test</button></div></div>').join(""):'<p class="muted">Aucun test enregistré. Ouvrez « Visibilité IA » pour lancer une question en un clic.</p>';
 $("aiTestsList").querySelectorAll("[data-delete-ai]").forEach(b=>b.onclick=()=>{if(!confirm("Supprimer ce test ?"))return;state.aiTests.splice(Number(b.dataset.deleteAi),1);persistLocal();drawAiTests();renderCampaignPrompts();update()});
}

/* ---------- Tests web (PageSpeed réel) ---------- */
function renderWebResults(rows){$("webResults").innerHTML=rows.map(r=>'<div class="priority"><b>'+esc(r.title)+'</b><small>'+esc(r.detail)+'</small></div>').join("");glossify($("webResults"))}
async function runWebChecks(){
 const u=normalizeUrl($("webUrl").value||$("site").value);
 if(!u){renderWebResults([{title:"Adresse invalide",detail:"Entrez une adresse complète, par exemple https://exemple.fr"}]);return}
 $("webUrl").value=u.href;$("runWebChecks").disabled=true;$("webResults").innerHTML='<div class="step run"><span class="ico"><span class="spin">◌</span></span><div><b>Analyse en cours sur les serveurs Google…</b><small>Compter 20 à 60 secondes.</small></div></div>';
 try{const r=await pageSpeed(u.href);if(normalizeUrl(state.biz.site)&&normalizeUrl(state.biz.site).hostname===u.hostname){state.data=state.data||{};state.data.psi=r;persistLocal()}
  const a=r.audits,ok=v=>v===false?"✕ à corriger":v===true?"✓ conforme":"non mesuré";
  $("webResults").innerHTML='<div class="kpis">'+kpiBox(r.scores.perf??"—","Performance",scoreColor(r.scores.perf))+kpiBox(r.scores.seo??"—","SEO",scoreColor(r.scores.seo))+kpiBox(r.scores.a11y??"—","Accessibilité",scoreColor(r.scores.a11y))+kpiBox(r.scores.bp??"—","Bonnes pratiques",scoreColor(r.scores.bp))+'</div>'+(r.shot?'<img class="shot" style="margin-top:12px" src="'+esc(r.shot)+'" alt="Capture mobile">':'')
  +[["Affichage du contenu principal (LCP)",r.lab.lcp],["Premier affichage (FCP)",r.lab.fcp],["Temps de blocage (TBT)",r.lab.tbt],["Stabilité visuelle (CLS)",r.lab.cls],["Core Web Vitals réels",r.field.lcp?"LCP "+cwvLabel(r.field.lcp,"s")+" · INP "+cwvLabel(r.field.inp,"ms")+" · CLS "+cwvLabel(r.field.cls,"cls"):"Pas assez de visiteurs mesurés par Chrome"],["HTTPS",ok(a.https)],["Adapté au mobile (viewport)",ok(a.viewport)],["Titre de page",ok(a.title)],["Méta-description",ok(a.meta)],["Indexable par Google",ok(a.crawlable)],["Textes alternatifs des images",ok(a.alt)],["Outils de suivi détectés",r.tracking.join(", ")||"aucun"],["Services tiers chargés",r.entities.slice(0,10).join(", ")||"aucun"]].map(x=>'<div class="priority"><b>'+esc(x[0])+'</b><small>'+esc(x[1]||"—")+'</small></div>').join("")+'<p class="muted">'+esc(r.url)+' · '+esc(r.fetchedAt)+'</p>';
 }catch(e){renderWebResults([{title:"Analyse impossible",detail:e.status===429?"Quota gratuit PageSpeed épuisé : ajoutez votre clé Google dans Réglages.":e.message}])}
 finally{$("runWebChecks").disabled=false}
}

/* ---------- Recherche internet ---------- */
let lastSearches=[];
function buildResearch(){
 const name=$("researchName").value.trim(),city=$("researchCity").value.trim(),site=$("researchSite").value.trim(),kw=$("researchKeyword").value.trim();
 if(!name&&!kw&&!site){toast("Renseignez au moins le nom, un site ou un mot-clé.");return}
 const q=s=>encodeURIComponent(s.trim()),s=[];
 if(name&&city)s.push(["Nom + ville","https://www.google.com/search?q="+q('"'+name+'" '+city)]);
 if(name&&city)s.push(["Google Maps","https://www.google.com/maps/search/"+q(name+" "+city)]);
 if(kw&&city)s.push(["Mot-clé local Google","https://www.google.com/search?q="+q(kw+" "+city)]);
 if(kw&&city)s.push(["Mot-clé local Bing","https://www.bing.com/search?q="+q(kw+" "+city)]);
 if(name)s.push(["Avis et réputation","https://www.google.com/search?q="+q('"'+name+'" avis '+city)]);
 if(name){
  const target=name+" "+city;
  s.push(["Réseaux sociaux — recherche large","https://www.google.com/search?q="+q('"'+name+'" '+city+" (site:instagram.com OR site:facebook.com OR site:tiktok.com OR site:youtube.com OR site:snapchat.com)")]);
  s.push(["TikTok — Google","https://www.google.com/search?q="+q(target+" site:tiktok.com")]);
  s.push(["TikTok — Bing","https://www.bing.com/search?q="+q(target+" site:tiktok.com")]);
  s.push(["TikTok — recherche dans l’application web","https://www.tiktok.com/search?q="+q(name+" "+city)]);
  s.push(["Instagram — Google","https://www.google.com/search?q="+q(target+" site:instagram.com")]);
  s.push(["Facebook — Google","https://www.google.com/search?q="+q(target+" site:facebook.com")]);
  s.push(["YouTube — Google","https://www.google.com/search?q="+q(target+" site:youtube.com")]);
  s.push(["Snapchat — Google","https://www.google.com/search?q="+q(target+" site:snapchat.com")]);
 }
 if(name)s.push(["Presse et articles locaux","https://www.google.com/search?tbm=nws&q="+q('"'+name+'" '+city)]);
 const u=normalizeUrl(site);if(u)s.push(["Pages indexées du site","https://www.google.com/search?q="+q("site:"+u.hostname)]);
 if(kw)s.push(["Questions / FAQ","https://www.google.com/search?q="+q(kw+" "+city+" questions avis prix")]);
 if(name)s.push(["Publicités Meta actives","https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&search_type=keyword_unordered&q="+q(name)]);
 lastSearches=s;$("researchResults").innerHTML=s.map(x=>'<a target="_blank" rel="noopener" href="'+esc(x[1])+'"><span><b>'+esc(x[0])+'</b><br><span class="muted">Ouvrir les résultats ↗</span></span></a>').join("");
}

/* ---------- Événements ---------- */
function bind(){
 $("runSocial").onclick=runSocial;$("socUrl").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();runSocial()}});
 const opts=[...new Set(BIZ_TYPES.map(t=>t.grp))].map(g=>'<optgroup label="'+esc(g)+'">'+BIZ_TYPES.filter(t=>t.grp===g).map(t=>'<option>'+esc(t.label)+'</option>').join("")+'</optgroup>').join("");$("type").innerHTML=opts;$("autoType").innerHTML=opts;
 document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.view)));
 $("navNewClient").addEventListener("click",()=>{nav("auto");requestAnimationFrame(()=>{$("autoName").focus({preventScroll:true})})});
 $("navMore").addEventListener("click",e=>{e.stopPropagation();const n=document.querySelector(".nav"),o=!n.classList.contains("open");n.classList.toggle("open",o);$("navMore").setAttribute("aria-expanded",String(o))});
 document.addEventListener("click",e=>{if(!e.target.closest(".nav"))closeMore()});
 document.addEventListener("keydown",e=>{if(e.key==="Escape")closeMore()});
 document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.go)));
 fields.forEach(id=>$(id).addEventListener("input",()=>{read();renderReport();persistLocal()}));
 $("autoType").addEventListener("change",()=>{$("autoType").dataset.touched="1";if(!$("autoKeyword").dataset.touched)$("autoKeyword").value=defaultKeywords($("autoType").value)});
 $("autoKeyword").addEventListener("input",()=>$("autoKeyword").dataset.touched="1");
 $("autoName").addEventListener("input",()=>{if(state.biz.placeId||state.biz.osmPick)clearPick();queueSuggest()});
 $("autoCity").addEventListener("input",()=>{if(!state.biz.placeId&&!state.biz.osmPick)queueSuggest()});
 $("autoName").addEventListener("blur",()=>setTimeout(closeSuggest,150));
 $("autoName").addEventListener("keydown",e=>{const open=!$("suggest").classList.contains("hidden")&&suggestItems.length;
  if(open&&(e.key==="ArrowDown"||e.key==="ArrowUp")){e.preventDefault();suggestIdx=(suggestIdx+(e.key==="ArrowDown"?1:-1)+suggestItems.length)%suggestItems.length;renderSuggest();$("autoName").setAttribute("aria-activedescendant","sg"+suggestIdx);return}
  if(e.key==="Escape"){closeSuggest();return}
  if(e.key==="Enter"){e.preventDefault();if(open&&suggestIdx>=0)pickSuggestion(suggestItems[suggestIdx]);else runAuto()}});
 $("autoCity").addEventListener("keydown",e=>{if(e.key==="Enter")runAuto()});
 $("runAuto").onclick=runAuto;$("autoToReport").onclick=()=>nav("report");
 $("notes").addEventListener("input",()=>{update();persistLocal()});
 $("pdf").onclick=$("printReport").onclick=()=>{nav("report");makePdf()};
 $("printFull").onclick=()=>{nav("report");setTimeout(()=>window.print(),300)};
 document.querySelectorAll("[data-repfmt]").forEach(b=>b.onclick=()=>setReportFormat(b.dataset.repfmt));
 $("copy").onclick=()=>{read();const c=calc(),d=state.data||{};const txt="AUDIT AFFIADS 360°\nCommerce : "+(state.biz.name||"Non renseigné")+"\nVille : "+(state.biz.city||"Non renseignée")+"\nScore indicatif : "+(c.score===null?"non calculé":c.score+"/100")+"\nContrôles : "+c.n+"/"+keys.length+" · Points à améliorer : "+c.issues+((d.findings||[]).length?"\n\nCONSTATS\n"+d.findings.map(f=>"- "+f.text).join("\n"):"")+"\n\nPLAN D'ACTION\n"+issuesList().map((p,i)=>(i+1)+". "+p.it+" — "+p.reco).join("\n")+"\n\nNotes : "+(state.notes||"Aucune");copyText(txt,"Résumé copié.")};
 
 document.querySelectorAll("[data-theme-set]").forEach(b=>b.onclick=()=>{settings.theme=b.dataset.themeSet;saveSettings();applyTheme()});
 $("installApp").onclick=async()=>{if(!installEvt)return;installEvt.prompt();try{await installEvt.userChoice}catch(e){}installEvt=null;$("installApp").classList.add("hidden")};
 $("shareReport").onclick=()=>shareText("Audit AffiAds",summaryText());
 $("pitchShare").onclick=()=>shareText("Message",$("pitchText").value);
 $("clientSearch").addEventListener("input",renderClientSelect);
 $("newClient").onclick=()=>{read();persistLocal();state=blankState();persistLocal();hydrate();nav("auto");setTimeout(()=>$("autoName").focus(),200)};
 /* IA */
 $("campaignFill").onclick=campaignInputFromBiz;$("generateCampaign").onclick=()=>getCampaignPrompts(false);
 $("clearCampaign").onclick=()=>{state.campaignPrompts=[];persistLocal();renderCampaignPrompts()};
 $("exportAiCsv").onclick=()=>{const tests=state.aiTests;if(!tests.length){toast("Aucun résultat à exporter.");return}const cols=["date","platform","prompt","presence","rank","competitors","source","notes","campaignId","campaignPromptId"];const csv=[cols.join(";"),...tests.map(t=>cols.map(k=>'"'+String(t[k]??"").replace(/"/g,'""')+'"').join(";"))].join("\r\n");download("﻿"+csv,"affiads-visibilite-ia.csv","text/csv;charset=utf-8")};
 $("aiDate").value=today();
 $("saveAiTest").onclick=()=>{const prompt=$("aiPrompt").value.trim();if(!prompt){toast("Indiquez la question posée à l’IA.");return}const source=$("aiSource").value.trim();if(source&&!/^https?:\/\//i.test(source)){toast("La source doit commencer par https:// ou http://");return}
  state.aiTests.push({platform:$("aiPlatform").value,date:$("aiDate").value||today(),prompt,presence:$("aiPresence").value,rank:$("aiRank").value.trim(),competitors:$("aiCompetitors").value.trim(),source,notes:$("aiNotes").value.trim(),campaignDate:state.campaign&&state.campaign.createdAt||"",campaignId:state.activeCampaignId||"",campaignPromptId:state.activeCampaignPromptId||""});
  aiAutoChecks();persistLocal();drawAiTests();renderCampaignPrompts();renderChecklist();update();toast("Test IA enregistré.");nav("campaign")};
 $("clearAiForm").onclick=()=>["aiPrompt","aiRank","aiCompetitors","aiSource","aiNotes"].forEach(id=>$(id).value="");
 /* Web & recherche */
 $("runWebChecks").onclick=runWebChecks;
 $("openPageSpeed").onclick=()=>{const u=normalizeUrl($("webUrl").value||$("site").value);if(!u){toast("Renseignez d’abord une adresse valide.");return}window.open("https://pagespeed.web.dev/analysis?url="+encodeURIComponent(u.href),"_blank","noopener")};
 $("fillResearch").onclick=()=>{$("researchName").value=$("name").value||"";$("researchCity").value=$("city").value||"";$("researchSite").value=$("site").value||"";$("researchKeyword").value=state.biz.keyword||""};
 $("buildResearch").onclick=buildResearch;
 $("openAllResearch").onclick=()=>{if(!lastSearches.length)buildResearch();let opened=0;lastSearches.forEach(s=>{if(window.open(s[1],"_blank","noopener"))opened++});if(opened<lastSearches.length)toast("Le navigateur a bloqué certains onglets : autorisez les fenêtres pour ce site.")};
 /* Message */
 $("pitchRegen").onclick=()=>{$("pitchText").value=state.pitch=buildPitch();persistLocal()};
 $("pitchTone").onchange=$("pitchRegen").onclick;$("pitchContact").onchange=$("pitchRegen").onclick;
 $("pitchText").addEventListener("input",()=>{state.pitch=$("pitchText").value;persistLocal()});
 $("pitchCopy").onclick=()=>copyText($("pitchText").value,"Message copié.");
 $("pitchWhatsapp").onclick=()=>window.open("https://wa.me/?text="+encodeURIComponent($("pitchText").value),"_blank","noopener");
 $("pitchMail").onclick=()=>{let t=$("pitchText").value,sub="Audit de visibilité";const m=t.match(/^Objet : (.*)\n+/);if(m){sub=m[1];t=t.slice(m[0].length)}location.href="mailto:?subject="+encodeURIComponent(sub)+"&body="+encodeURIComponent(t)};
 /* Réglages */
 $("saveKey").onclick=()=>{const k=$("googleKey").value.trim();if(k&&!keyLooksValid(k)){$("keyStatus").innerHTML='<span class="keybad">✕ '+esc(WRONG_KEY_MSG)+'</span>';$("help-key").open=true;return}settings.googleKey=k;saveSettings();renderKeyNotice();toast(k?"Clé enregistrée.":"Clé retirée.")};
 $("removeKey").onclick=()=>{settings.googleKey="";saveSettings();renderKeyNotice();toast("Clé retirée de ce navigateur.")};
 $("testKey").onclick=async()=>{const k=$("googleKey").value.trim();if(k&&!keyLooksValid(k)){$("keyStatus").innerHTML='<span class="keybad">✕ '+esc(WRONG_KEY_MSG)+'</span>';$("help-key").open=true;return}settings.googleKey=k;saveSettings();if(!hasKey()){$("keyStatus").innerHTML='<span class="keybad">Collez d’abord une clé.</span>';return}$("keyStatus").textContent="Test en cours…";
  const res=[];try{const l=await placesSearch("Tour Eiffel Paris","places.id,places.displayName",1);res.push(l.length?'<span class="keyok">✓ Places API (New) fonctionne.</span>':'<span class="keybad">Places API : réponse vide.</span>')}catch(e){{const f=frErr(e);res.push('<span class="keybad">✕ Places API (New) : '+esc(f.text)+'</span>'+(f.link&&!f.link.href.startsWith("#")?' <a class="steplink" href="'+esc(f.link.href)+'" target="_blank" rel="noopener">'+esc(f.link.label)+'</a>':''))}}
  try{await fetchJson("https://www.googleapis.com/pagespeedonline/v5/runPagespeed?strategy=mobile&category=seo&url="+encodeURIComponent("https://example.com")+"&key="+encodeURIComponent(settings.googleKey),{},90000);res.push('<span class="keyok">✓ PageSpeed Insights API fonctionne.</span>')}catch(e){{const f=frErr(e);res.push('<span class="keybad">✕ PageSpeed Insights API : '+esc(f.text)+'</span>'+(f.link&&!f.link.href.startsWith("#")?' <a class="steplink" href="'+esc(f.link.href)+'" target="_blank" rel="noopener">'+esc(f.link.label)+'</a>':''))}}
  $("keyStatus").innerHTML=res.join("<br>");renderKeyNotice2()};
 function renderKeyNotice2(){const s=$("keyStatus").innerHTML;renderKeyNotice();$("keyStatus").innerHTML=s}
 $("senderName").value=settings.senderName;$("senderLine").value=settings.senderLine;$("senderContact").value=settings.senderContact;
 $("saveSender").onclick=()=>{settings.senderName=$("senderName").value.trim();settings.senderLine=$("senderLine").value.trim();settings.senderContact=$("senderContact").value.trim();saveSettings();toast("Signature enregistrée.")};
 $("exportJson").onclick=()=>{read();const saved=persistLocal();const safeSettings={...settings};delete safeSettings.googleKey;const audits=Object.values(db.audits);const payload={app:"affiads-audit-360",schemaVersion:4,exportedAt:new Date().toISOString(),current:state.id,auditCount:audits.length,integrity:{auditsWithId:audits.filter(a=>a&&a.id).length,auditsWithBusiness:audits.filter(a=>a&&a.biz&&typeof a.biz==="object").length},settings:safeSettings,audits:db.audits,deleted:db.deleted||{},note:"Sauvegarde locale. La clé API Google est volontairement exclue."};download(JSON.stringify(payload,null,2),"affiads-sauvegarde-"+today()+".json","application/json");toast(saved?"Sauvegarde exportée : "+audits.length+" audit(s). Clé API exclue.":"Sauvegarde exportée depuis la mémoire, mais l’enregistrement local a échoué. Conservez ce fichier immédiatement.")};
 $("importJson").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>25*1024*1024)throw new Error("fichier trop volumineux (maximum 25 Mo)");const backup=JSON.parse(await f.text());if(!backup||typeof backup!=="object"||Array.isArray(backup))throw new Error("format JSON invalide");if(backup.app&&backup.app!=="affiads-audit-360")throw new Error("cette sauvegarde ne provient pas d’AffiAds Audit");if(Number(backup.schemaVersion||1)>4)throw new Error("version de sauvegarde plus récente : mettez l’application à jour avant l’import");const list=backup.audits?(Array.isArray(backup.audits)?backup.audits:Object.values(backup.audits)):(backup.checks?[backup]:[]);if(!Array.isArray(list)||!list.length)throw new Error("aucun audit trouvé");if(list.length>500)throw new Error("plus de 500 audits : import refusé par sécurité");const valid=list.filter(a=>a&&typeof a==="object"&&!Array.isArray(a)&&a.biz&&typeof a.biz==="object");if(!valid.length)throw new Error("aucun audit valide avec fiche commerce");if(!confirm("Importer "+valid.length+" audit(s) en les fusionnant avec les données actuelles ? Les réglages et la clé Google actuels seront conservés. Les identifiants déjà utilisés seront dupliqués, sans écraser les audits existants."))return;read();const imported=[],idMap={};for(const raw of valid){const a=fixState(raw),original=String(a.id||"");if(db.audits[a.id]){a.id=uid();a.importedFrom=original}idMap[original]=a.id;db.audits[a.id]=a;imported.push(a.id)}const preferred=backup.current&&idMap[String(backup.current)]&&db.audits[idMap[String(backup.current)]]?idMap[String(backup.current)]:imported[0];state=fixState(db.audits[preferred]);db.current=state.id;if(!persistLocal())throw new Error("stockage insuffisant : exportez les données et libérez de l’espace avant de réessayer");hydrate();renderClientSelect();toast(imported.length+" audit(s) importé(s), sans écraser les audits existants.")}catch(err){toast("Import impossible : "+(err&&err.message||"fichier invalide"))}finally{e.target.value=""}};
}
function download(content,name,type){const blob=new Blob([content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}


/* ---------- 2026 : thème, installation, hors ligne, partage ---------- */
function applyTheme(){const t=settings.theme||"auto";const effective=t==="auto"?(window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"):t;document.documentElement.dataset.theme=effective;const meta=document.getElementById("themeColor");if(meta)meta.setAttribute("content",effective==="dark"?"#080d2d":"#f5f7ff");document.querySelectorAll("[data-theme-set]").forEach(b=>{b.setAttribute("aria-checked",String(b.dataset.themeSet===t));b.setAttribute("aria-pressed",String(b.dataset.themeSet===t))});document.documentElement.style.colorScheme=effective}const systemTheme=window.matchMedia?window.matchMedia("(prefers-color-scheme: dark)"):null;if(systemTheme){const onSystemThemeChange=()=>{if((settings.theme||"auto")==="auto")applyTheme()};if(systemTheme.addEventListener)systemTheme.addEventListener("change",onSystemThemeChange);else if(systemTheme.addListener)systemTheme.addListener(onSystemThemeChange)}
let installEvt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();installEvt=e;const b=$("installApp");if(b)b.classList.remove("hidden")});
window.addEventListener("appinstalled",()=>{installEvt=null;const b=$("installApp");if(b)b.classList.add("hidden");toast("Appli installée sur l’écran d’accueil.")});
function initInstallHelp(){
 const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone;
 const ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
 if(standalone)$("installHelp").textContent="L’appli est installée sur cet appareil. L’interface reste disponible même sans réseau.";
 else if(ios)$("installHelp").textContent="Sur iPhone : touchez le bouton Partager de Safari, puis « Sur l’écran d’accueil ». L’appli s’ouvrira en plein écran.";
}
async function shareText(title,text){
 if(navigator.share){try{await navigator.share({title,text});return}catch(e){if(e&&e.name==="AbortError")return}}
 copyText(text,"Texte copié : collez-le où vous voulez.");
}
function summaryText(){read();const c=calc(),d=state.data||{};return "Audit de visibilité AffiAds : "+(state.biz.name||"commerce")+(state.biz.city?" ("+state.biz.city+")":"")+"\nScore indicatif : "+(c.score===null?"non calculé":c.score+"/100")+((d.findings||[]).length?"\n\nOpportunités repérées :\n"+d.findings.slice(0,6).map(f=>"• "+f.text).join("\n"):"")+"\n\n"+(settings.senderName?settings.senderName+", ":"")+(settings.senderLine||"AffiAds")}
if("serviceWorker" in navigator&&location.protocol==="https:")window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));

/* ---------- Écran d'accueil et code d'accès ---------- */
const LOCK_KEY="affiads-lock",LOCK_SESSION="affiads-unlocked";
const Lock={cfg:null,mode:"unlock",first:"",entry:"",lastActive:Date.now(),timer:null};
/* Couleur de la barre d’état (iPhone / Android) : violet de l’écran d’accueil, puis couleur de marque dans l’appli */
function setBarColor(c){const m=$("themeColor");if(m)m.setAttribute("content",c)}
function lockLoad(){try{Lock.cfg=JSON.parse(localStorage.getItem(LOCK_KEY)||"null")}catch(e){Lock.cfg=null}}
function lockSave(){try{if(Lock.cfg)localStorage.setItem(LOCK_KEY,JSON.stringify(Lock.cfg));else localStorage.removeItem(LOCK_KEY)}catch(e){}}
function b64(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)))}
async function pinHash(pin,saltB64){
 const salt=Uint8Array.from(atob(saltB64),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);
 return b64(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},key,256));
}
async function pinSet(pin){const salt=b64(crypto.getRandomValues(new Uint8Array(16)));Lock.cfg={salt,hash:await pinHash(pin,salt),len:pin.length,delay:(Lock.cfg&&Lock.cfg.delay)??-1,forceLock:false,v:3,fails:0,until:0,bio:Lock.cfg&&Lock.cfg.bio||null};lockSave()}
const LOCK_SEEN="affiads-last-seen";
function lockDelay(){return Lock.cfg?(Lock.cfg.delay??1440):1440}
function markSeen(){Lock.lastActive=Date.now();try{localStorage.setItem(LOCK_SEEN,String(Lock.lastActive))}catch(e){}}
function stillTrusted(){if(Lock.cfg&&Lock.cfg.forceLock)return false;const d=lockDelay();if(d<0)return true;if(d===0)return false;let t=0;try{t=+localStorage.getItem(LOCK_SEEN)||0}catch(e){}return t>0&&Date.now()-t<d*60000}
function unlockedThisSession(){try{if(sessionStorage.getItem(LOCK_SESSION)==="1")return true}catch(e){}return stillTrusted()}
function setSession(v){try{if(v){sessionStorage.setItem(LOCK_SESSION,"1");markSeen()}else{sessionStorage.removeItem(LOCK_SESSION);localStorage.removeItem(LOCK_SEEN)}}catch(e){}}
function gateText(title,hint){$("gateTitle").textContent=title;$("gateHint").textContent=hint}
function renderDots(){const n=(Lock.mode==="unlock"||Lock.mode==="verify")?(Lock.cfg&&Lock.cfg.len||4):Math.max(4,Lock.entry.length);$("pinDots").innerHTML=Array.from({length:n},(_,i)=>'<i class="'+(i<Lock.entry.length?"on":"")+'"></i>').join("")}
function gateMsg(t,bad){const m=$("gateMsg");m.textContent=t||"";m.classList.toggle("bad",!!bad);if(bad){const d=$("pinDots");d.classList.remove("shake");void d.offsetWidth;d.classList.add("shake")}}
function buildPad(){
 const keys=["1","2","3","4","5","6","7","8","9","ok","0","del"];
 $("pinPad").innerHTML=keys.map(k=>k==="del"?'<button type="button" data-k="del" aria-label="Effacer">⌫</button>':k==="ok"?'<button type="button" data-k="ok" class="ok" aria-label="Valider">OK</button>':'<button type="button" data-k="'+k+'">'+k+'</button>').join("");
 $("pinPad").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>pinKey(b.dataset.k)));
}
function showGate(mode){
 setBarColor("#5544f7");Lock.mode=mode;Lock.entry="";Lock.first="";$("gateLoad").hidden=true;$("gateTag").hidden=true;document.body.classList.add("locked");$("gate").classList.remove("hidden","leaving");$("gateLock").hidden=false;
 $("gateForgot").hidden=mode!=="unlock";$("gateBio").hidden=!((mode==="unlock"||mode==="verify")&&Lock.cfg&&Lock.cfg.bio);$("gateBio").textContent="Déverrouiller avec "+bioLabel();
 $("gateCancel").hidden=!(mode==="verify"||mode==="change");$("rememberWrap").hidden=mode==="verify";$("rememberMe").checked=mode==="create"||!Lock.cfg||lockDelay()<0||mode==="unlock";
 if(mode==="unlock")gateText("Entrez votre code","Votre code protège vos audits et votre clé sur cet appareil.");
 else if(mode==="verify")gateText("Confirmez que c’est vous",Lock.verifyWhy||"Saisissez votre code pour continuer.");
 else if(mode==="create")gateText("Créez votre code","Choisissez un code de 4 à 6 chiffres pour protéger l’appli sur cet appareil.");
 else if(mode==="change")gateText("Nouveau code","Choisissez un nouveau code de 4 à 6 chiffres.");
 gateMsg("");renderDots();setTimeout(()=>{try{$("pinInput").focus({preventScroll:true})}catch(e){}},60);
}
function applyRemember(){const cb=$("rememberMe");if(!Lock.cfg||!cb||$("rememberWrap").hidden)return;if(cb.checked)Lock.cfg.delay=-1;else if(lockDelay()<0)Lock.cfg.delay=1440;Lock.cfg.forceLock=false;lockSave()}
function hideGate(){setBarColor("#4a3aff");if(Lock.cfg){if(["unlock","create","change"].includes(Lock.mode))applyRemember();else{Lock.cfg.forceLock=false;lockSave()}if(Lock.mode==="unlock"){Lock.cfg.pwaTrusted=true;Lock.cfg.forceLock=false;lockSave()}}const cb=Lock.onVerify;Lock.onVerify=null;Lock.verifyWhy="";if(cb)setTimeout(cb,320);setSession(true);setTimeout(()=>{if(typeof syncHandlePending==="function")syncHandlePending()},400);Lock.lastActive=Date.now();const g=$("gate");g.classList.add("leaving");document.body.classList.remove("locked");setTimeout(()=>{g.classList.add("hidden");g.classList.remove("leaving")},matchMedia("(prefers-reduced-motion: reduce)").matches?0:260);renderPinSettings()}
async function pinKey(k){
 if(k==="del"){Lock.entry=Lock.entry.slice(0,-1);renderDots();return}
 if(k==="ok"){return pinSubmit()}
 if(!/^\d$/.test(k)||Lock.entry.length>=6)return;
 Lock.entry+=k;renderDots();gateMsg("");
 if((Lock.mode==="unlock"||Lock.mode==="verify")&&Lock.cfg&&Lock.entry.length===Lock.cfg.len)pinSubmit();
}
async function pinSubmit(){
 const v=Lock.entry;
 if(Lock.mode==="unlock"||Lock.mode==="verify"){
  const now=Date.now();if(Lock.cfg.until>now){gateMsg("Trop d’essais : réessayez dans "+Math.ceil((Lock.cfg.until-now)/1000)+" s.",true);Lock.entry="";renderDots();return}
  if(await pinHash(v,Lock.cfg.salt)===Lock.cfg.hash){Lock.cfg.fails=0;Lock.cfg.until=0;lockSave();hideGate();return}
  Lock.cfg.fails=(Lock.cfg.fails||0)+1;if(Lock.cfg.fails>=5)Lock.cfg.until=now+Math.min(300,30*2**(Lock.cfg.fails-5))*1000;lockSave();
  Lock.entry="";renderDots();gateMsg(Lock.cfg.fails>=5?"Code incorrect. Patientez "+Math.round((Lock.cfg.until-now)/1000)+" s avant de réessayer.":"Code incorrect ("+(5-Lock.cfg.fails)+" essai"+(5-Lock.cfg.fails>1?"s":"")+" avant attente).",true);return;
 }
 if(v.length<4){gateMsg("Le code doit comporter au moins 4 chiffres.",true);return}
 if(!Lock.first){Lock.first=v;Lock.entry="";gateText("Confirmez le code","Saisissez le même code une deuxième fois.");gateMsg("");renderDots();return}
 if(v!==Lock.first){Lock.first="";Lock.entry="";gateText(Lock.mode==="create"?"Créez votre code":"Nouveau code","Les deux codes ne correspondent pas : recommencez.");gateMsg("Codes différents.",true);renderDots();return}
 await pinSet(v);toast("Code enregistré. L’appli est protégée sur cet appareil.");hideGate();
}
function pinDelayDescription(value){
 const descriptions={"-1":"Le code ne sera pas redemandé automatiquement. Vous pouvez toujours verrouiller l’application manuellement.","0":"Le code sera demandé à chaque nouvelle ouverture de l’application.","5":"Le code sera redemandé après 5 minutes sans activité.","60":"Le code sera redemandé après 1 heure sans activité.","1440":"Le code sera redemandé après 1 jour sans activité.","10080":"Le code sera redemandé après 1 semaine sans activité."};
 return descriptions[String(value)]||"Choisissez quand l’application doit redemander le code.";
}
function renderPinSettings(){
 if(!$("pinStatus"))return;const on=!!(Lock.cfg&&Lock.cfg.hash);
 $("pinStatus").textContent="Choisissez quand le code doit être redemandé. Votre préférence est enregistrée sur cet appareil.";
 $("pinChange").textContent=on?"Changer le code":"Créer un code";$("pinDisable").hidden=!on;$("pinLockNow").hidden=!on;
 const delay=$("pinDelay");if(delay){delay.value=String(lockDelay());delay.disabled=!on;const help=$("pinDelayHelp");if(help)help.textContent=pinDelayDescription(delay.value)}
 const pb=$("pinBio");if(pb){pb.hidden=!(on&&Lock.bioOk);pb.textContent=(Lock.cfg&&Lock.cfg.bio?"Désactiver ":"Activer ")+bioLabel()}
}
async function bioAvailable(){try{return !!(window.PublicKeyCredential&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())}catch(e){return false}}
function bioLabel(){return /iphone|ipad|mac/i.test(navigator.userAgent)?"Face ID / Touch ID":"empreinte ou visage"}
async function bioEnable(){
 const uid=crypto.getRandomValues(new Uint8Array(16));
 const cred=await navigator.credentials.create({publicKey:{rp:{name:"AffiAds Audit 360°"},user:{id:uid,name:"affiads-audit",displayName:"AffiAds Audit"},challenge:crypto.getRandomValues(new Uint8Array(32)),pubKeyCredParams:[{type:"public-key",alg:-7},{type:"public-key",alg:-257}],authenticatorSelection:{authenticatorAttachment:"platform",userVerification:"required",residentKey:"discouraged"},timeout:60000,attestation:"none"}});
 Lock.cfg.bio=b64(cred.rawId);lockSave();
}
async function bioUnlock(){
 if(!Lock.cfg||!Lock.cfg.bio)return false;
 try{const id=Uint8Array.from(atob(Lock.cfg.bio),c=>c.charCodeAt(0));
  const a=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:"public-key",id,transports:["internal"]}],userVerification:"required",timeout:60000}});
  if(a&&a.response&&a.response.authenticatorData){const flags=new Uint8Array(a.response.authenticatorData)[32];if(flags&4){Lock.cfg.fails=0;Lock.cfg.until=0;lockSave();hideGate();return true}}
 }catch(e){gateMsg(e&&e.name==="NotAllowedError"?"Reconnaissance annulée : utilisez le code ou réessayez.":"Reconnaissance indisponible : utilisez le code.",false)}
 return false;
}
function requireOwner(why,then){if(!Lock.cfg||!Lock.cfg.hash){then();return}Lock.onVerify=then;Lock.verifyWhy=why;showGate("verify");if(Lock.cfg.bio)bioUnlock()}
function cancelGate(){if(!["verify","change"].includes(Lock.mode))return;setBarColor("#4a3aff");Lock.onVerify=null;Lock.verifyWhy="";const g=$("gate");document.body.classList.remove("locked");g.classList.add("hidden");Lock.mode="unlock"}
function lockNow(manual){if(Lock.cfg&&Lock.cfg.hash){if(manual!==false){Lock.cfg.forceLock=true;lockSave()}setSession(false);showGate("unlock")}}
function lockTick(){if(!Lock.cfg||!Lock.cfg.hash||document.body.classList.contains("locked"))return;const d=lockDelay();if(d>0&&Date.now()-Lock.lastActive>d*60000)lockNow(false)}
function initLock(){
 /* Code propriétaire fixe : seule l’empreinte PBKDF2 est livrée au navigateur. */
 lockLoad();
 const previous=Lock.cfg||{};
 const standalone=matchMedia("(display-mode: standalone)").matches||navigator.standalone===true;
 const unlockedPwaSession=previous.pwaTrusted===true&&stillTrusted();
 const savedDelay=Number(previous.delay);
 Lock.cfg={salt:"WvBnvwkkNWY8vvBNaMjAtQ==",hash:"WyE3o7n321trIKqmY9nrK+tZpoNP588bJpc5ezs+fFY=",len:6,delay:Number.isFinite(savedDelay)?savedDelay:-1,forceLock:!unlockedPwaSession,v:7,pwaTrusted:previous.pwaTrusted===true,fails:Math.max(0,Number(previous.fails)||0),until:Math.max(0,Number(previous.until)||0),bio:previous.bio||null};
 lockSave();buildPad();
 const pin=$("pinInput");
 pin.addEventListener("input",()=>{const v=pin.value.replace(/\D/g,"");pin.value="";for(const ch of v)pinKey(ch)});
 document.addEventListener("keydown",e=>{if(!document.body.classList.contains("locked")||$("gateLock").hidden)return;if(/^\d$/.test(e.key)){e.preventDefault();pinKey(e.key)}else if(e.key==="Backspace"){e.preventDefault();pinKey("del")}else if(e.key==="Enter"&&!(e.target&&e.target.closest&&e.target.closest("button"))){e.preventDefault();pinKey("ok")}});
 $("gate").addEventListener("click",e=>{if(!e.target.closest("button"))pin.focus({preventScroll:true})});
 $("gateForgot").hidden=true;$("gateBio").hidden=true;$("rememberWrap").hidden=true;
 ["pointerdown","keydown","touchstart","scroll"].forEach(ev=>document.addEventListener(ev,()=>{if(document.body.classList.contains("locked"))return;if(Date.now()-Lock.lastActive>20000)markSeen();else Lock.lastActive=Date.now()},{passive:true}));
 document.addEventListener("visibilitychange",()=>{if(document.hidden){Lock.hiddenAt=Date.now();if(lockDelay()===0&&!document.body.classList.contains("locked"))lockNow(false)}else{const away=Lock.hiddenAt?Date.now()-Lock.hiddenAt:0;Lock.hiddenAt=0;if(!document.body.classList.contains("locked")){if(lockDelay()>0&&away>=lockDelay()*60000)lockNow(false);else{Lock.lastActive=Date.now();markSeen()}}}});
 clearInterval(Lock.timer);Lock.timer=setInterval(lockTick,15000);
 $("pinChange").hidden=true;
 $("gateCancel").onclick=cancelGate;
 $("pinLockNow").onclick=lockNow;
 $("gateBio").onclick=()=>bioUnlock();
 $("pinBio").onclick=async()=>{if(!Lock.cfg||!Lock.cfg.hash){toast("Créez d’abord un code.");return}if(Lock.cfg.bio){Lock.cfg.bio=null;lockSave();renderPinSettings();toast(bioLabel()+" désactivé.");return}try{await bioEnable();renderPinSettings();toast(bioLabel()+" activé : plus besoin de taper le code.")}catch(e){toast(e&&e.name==="NotAllowedError"?"Activation annulée.":"Cet appareil ne permet pas la reconnaissance ici.")}};
 bioAvailable().then(ok=>{Lock.bioOk=ok;renderPinSettings()});
 $("pinDisable").hidden=true;
 $("pinDelay").addEventListener("change",()=>{if(!Lock.cfg||!Lock.cfg.hash)return;const chosen=Number($("pinDelay").value);if(![-1,0,5,60,1440,10080].includes(chosen))return;Lock.cfg.delay=chosen;Lock.cfg.forceLock=false;Lock.cfg.pwaTrusted=true;lockSave();markSeen();const help=$("pinDelayHelp");if(help)help.textContent=pinDelayDescription(chosen);toast("Préférence de code enregistrée.");});
 /* Écran d'accueil : le logo s'affiche, puis le code (ou sa création au premier lancement) */
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 setTimeout(()=>{
  if(unlockedPwaSession){document.body.classList.remove("locked");$("gate").classList.add("hidden");setBarColor(document.documentElement.dataset.theme==="dark"?"#080d2d":"#f5f7ff");Lock.lastActive=Date.now();markSeen();renderPinSettings()}
  else showGate("unlock");
 },reduce?0:900);
}

/* ---------- Synchronisation chiffrée entre appareils (Supabase) ----------
   Le secret (128 bits) ne quitte jamais les appareils reliés : le serveur reçoit
   seulement son empreinte SHA-256 (identifiant) et des données chiffrées AES-GCM. */
const SYNC_URL="https://vfxblubjsxwseacmslnu.supabase.co/rest/v1/rpc/",SYNC_KEY="sb_publishable_HojETqgwpBMQ_cjDzMNaAg_WGCFMaED",SYNC_LS="affiads-sync";
const Sync={secret:"",id:"",key:null,timer:null,busy:false,last:null,err:""};
function b64u(bytes){return btoa(String.fromCharCode(...bytes)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
async function syncPrepare(secret){
 const enc=new TextEncoder();
 const idBuf=await crypto.subtle.digest("SHA-256",enc.encode("affiads-id:"+secret));
 Sync.id=[...new Uint8Array(idBuf)].map(b=>b.toString(16).padStart(2,"0")).join("");
 const kBuf=await crypto.subtle.digest("SHA-256",enc.encode("affiads-key:"+secret));
 Sync.key=await crypto.subtle.importKey("raw",kBuf,"AES-GCM",false,["encrypt","decrypt"]);Sync.secret=secret;
}
async function rpc(fn,args){const r=await fetch(SYNC_URL+fn,{method:"POST",headers:{"apikey":SYNC_KEY,"Content-Type":"application/json"},body:JSON.stringify(args)});const t=await r.text();if(!r.ok){let m=t;try{m=JSON.parse(t).message||t}catch(e){}throw new Error(m)}return t?JSON.parse(t):null}
async function syncEncrypt(obj){const iv=crypto.getRandomValues(new Uint8Array(12));const c=await crypto.subtle.encrypt({name:"AES-GCM",iv},Sync.key,new TextEncoder().encode(JSON.stringify(obj)));return {data:b64(c),iv:b64(iv)}}
async function syncDecrypt(data,iv){const p=await crypto.subtle.decrypt({name:"AES-GCM",iv:Uint8Array.from(atob(iv),c=>c.charCodeAt(0))},Sync.key,Uint8Array.from(atob(data),c=>c.charCodeAt(0)));return JSON.parse(new TextDecoder().decode(p))}
function syncSnapshot(){
 const audits={};Object.values(db.audits).forEach(a=>{const c=JSON.parse(JSON.stringify(a));if(c.data&&c.data.psi)delete c.data.psi.shot;audits[c.id]=c});
 const {theme,...shared}=settings;
 return {v:1,audits,deleted:db.deleted||{},settings:shared,settingsAt:settings.updatedAt||0};
}
function syncMerge(remote){
 let changed=false;db.deleted=db.deleted||{};
 Object.entries(remote.deleted||{}).forEach(([id,t])=>{if(!db.deleted[id]||db.deleted[id]<t){db.deleted[id]=t;changed=true}});
 Object.values(remote.audits||{}).forEach(r=>{const l=db.audits[r.id];const rt=String(r.updatedAt||r.createdAt||"");if(db.deleted[r.id]&&String(db.deleted[r.id])>=rt)return;if(!l||String(l.updatedAt||"")<rt){db.audits[r.id]=fixState(r);changed=true}});
 Object.keys(db.audits).forEach(id=>{const a=db.audits[id];if(db.deleted[id]&&String(db.deleted[id])>=String(a.updatedAt||a.createdAt||"")){delete db.audits[id];changed=true}});
 const isBlank=x=>!(x.biz&&x.biz.name)&&!(x.data&&x.data.fetchedAt)&&!Object.keys(x.checks||{}).length&&!(x.aiTests||[]).length;
 const ids=Object.keys(db.audits);if(ids.length>1)ids.forEach(id=>{if(isBlank(db.audits[id])&&Object.keys(db.audits).length>1){delete db.audits[id];changed=true}});
 if(remote.settings&&(remote.settingsAt||0)>(settings.updatedAt||0)){const theme=settings.theme;settings={...settings,...remote.settings,theme,updatedAt:remote.settingsAt};saveSettings();changed=true}
 return changed;
}
function syncSetStatus(t,bad){Sync.err=bad?t:"";const el=$("syncStatus");if(el){el.textContent=t;el.classList.toggle("keybad",!!bad)}const sv=$("savedState");if(sv&&Sync.secret&&!bad)sv.textContent="Synchronisé"}
async function syncNow(silent){
 if(!Sync.secret||Sync.busy)return;Sync.busy=true;
 try{
  const res=await rpc("affiads_pull",{p_id:Sync.id});const row=res&&res[0];
  if(row){const remote=await syncDecrypt(row.data,row.iv);if(syncMerge(remote)){const cur=db.audits[state.id]?state.id:Object.values(db.audits).sort((x,y)=>String(y.updatedAt||y.createdAt).localeCompare(String(x.updatedAt||x.createdAt))).map(x=>x.id)[0];if(cur){state=fixState(db.audits[cur]);db.current=cur}else{state=blankState();db.audits[state.id]=state;db.current=state.id}try{localStorage.setItem(STORE,JSON.stringify(db));writeDeviceBackup()}catch(e){}if(!document.body.classList.contains("locked"))hydrate();else renderClientSelect()}}
  const enc=await syncEncrypt(syncSnapshot());await rpc("affiads_push",{p_id:Sync.id,p_data:enc.data,p_iv:enc.iv});
  Sync.last=new Date();syncSetStatus("Synchronisé à "+Sync.last.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+".");
 }catch(e){syncSetStatus("Synchronisation impossible pour le moment ("+frErr(e).text+"). Vos données restent sur cet appareil.",true);if(!silent)toast("Synchronisation impossible pour le moment.")}
 finally{Sync.busy=false}
}
function syncSoon(){if(!Sync.secret)return;clearTimeout(Sync.timer);Sync.timer=setTimeout(()=>syncNow(true),2500)}
function syncLink(){return location.origin+location.pathname+"#sync="+Sync.secret}
async function syncEnable(secret,isJoin){
 await syncPrepare(secret);try{localStorage.setItem(SYNC_LS,secret)}catch(e){}
 syncSetStatus(isJoin?"Récupération de vos données…":"Activation…");await syncNow(false);renderSyncCard();
 if(!Sync.err)toast(isJoin?"Appareil relié : vos audits sont à jour.":"Synchronisation activée. Scannez le QR code avec votre autre appareil.");
}
async function syncInit(){
 let s="";try{s=localStorage.getItem(SYNC_LS)||""}catch(e){}
 if(s){await syncPrepare(s);syncNow(true)}
 renderSyncCard();
 document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncNow(true)});
 window.addEventListener("online",()=>syncNow(true));
 setInterval(()=>{if(!document.hidden)syncNow(true)},120000);
}
let qrLib=null;
function loadQr(){if(window.qrcode)return Promise.resolve();if(qrLib)return qrLib;qrLib=new Promise((ok,ko)=>{const sc=document.createElement("script");sc.src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js";sc.onload=ok;sc.onerror=ko;document.head.appendChild(sc)});return qrLib}
async function renderSyncCard(){
 const box=$("syncBox");if(!box)return;
 if(!Sync.secret){box.innerHTML='<p class="muted">Retrouvez les mêmes audits, clients et réglages sur votre téléphone et votre ordinateur. Les données sont chiffrées sur l’appareil avant l’envoi.</p><div class="actions"><button class="btn primary" id="syncOn">Activer la synchronisation</button></div><details class="help"><summary>J’ai déjà activé la synchronisation sur un autre appareil</summary><p>Sur l’autre appareil, ouvrez Réglages → Synchronisation et scannez le QR code avec l’appareil photo de celui-ci. Ou collez le lien de liaison ici :</p><div class="field"><label for="syncPaste" class="sr">Lien de liaison</label><input id="syncPaste" placeholder="https://…#sync=…" autocomplete="off"></div><div class="actions" style="margin-top:10px"><button class="btn" id="syncJoin">Relier cet appareil</button></div></details>';
  $("syncOn").onclick=async()=>{if(!crypto.subtle){toast("Ce navigateur ne permet pas le chiffrement.");return}const sec=b64u(crypto.getRandomValues(new Uint8Array(16)));await syncEnable(sec,false)};
  $("syncJoin").onclick=async()=>{const m=$("syncPaste").value.match(/sync=([A-Za-z0-9_-]{20,})/);if(!m){toast("Lien de liaison invalide.");return}await syncEnable(m[1],true)};
  return}
 box.innerHTML='<p class="keyok" id="syncStatus">'+esc(Sync.err||(Sync.last?"Synchronisé à "+Sync.last.toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})+".":"Synchronisation active."))+'</p><div class="syncpair"><div id="syncQr" class="syncqr" aria-label="QR code de liaison"></div><div><b>Relier un autre appareil</b><ol class="muted"><li>Ouvrez l’appareil photo du téléphone.</li><li>Visez ce QR code et touchez le lien.</li><li>Saisissez ou créez le code d’accès : les audits apparaissent.</li></ol><div class="actions"><button class="btn" id="syncCopy">Copier le lien</button><button class="btn" id="syncRun">Synchroniser maintenant</button></div></div></div><p class="muted"><small>Gardez ce lien pour vous : il donne accès à vos audits.</small></p><div class="actions"><button class="btn" id="syncOff">Arrêter sur cet appareil</button></div>';
 if(Sync.err)$("syncStatus").classList.add("keybad");
 $("syncCopy").onclick=()=>copyText(syncLink(),"Lien de liaison copié.");
 $("syncRun").onclick=()=>syncNow(false);
 $("syncOff").onclick=()=>{if(!confirm("Arrêter la synchronisation sur cet appareil ? Les données restent sur l’appareil et en ligne pour vos autres appareils."))return;try{localStorage.removeItem(SYNC_LS)}catch(e){}Sync.secret="";Sync.id="";Sync.key=null;$("savedState").textContent="Enregistré";renderSyncCard()};
 try{await loadQr();const q=qrcode(0,"M");q.addData(syncLink());q.make();$("syncQr").innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true})}catch(e){$("syncQr").innerHTML='<p class="muted">QR code indisponible : utilisez « Copier le lien ».</p>'}
}
/* Lien de liaison ouvert depuis le QR code */
let pendingSync="";
{const m=location.hash.match(/^#sync=([A-Za-z0-9_-]{20,})$/);if(m){pendingSync=m[1];history.replaceState(null,"",location.pathname+"#settings")}}
async function syncHandlePending(){
 if(!pendingSync)return;const s=pendingSync;pendingSync="";
 if(Sync.secret===s){toast("Cet appareil est déjà relié.");return}
 if(!confirm("Relier cet appareil à votre synchronisation AffiAds ? Les audits des deux appareils seront réunis."))return;
 await syncEnable(s,true);nav("clients");
}

/* ---------- Assistant AffiAds (bulle en bas à droite) ----------
   Comprend les demandes courantes et agit directement ; les actions sensibles
   redemandent le code ou Face ID. Questions libres : Gemini si la clé le permet. */
const Bot={open:false,history:[],started:false,rec:null};
const BOT_START=[
 ["find","Trouver un client","Par nom, ville, téléphone ou site"],
 ["info","Fiche client","Coordonnées, audit, score et priorités"],
 ["recent","Derniers clients","Rouvrir rapidement un dossier"],
 ["sum","Résumer l’audit","Score, constats et prochaines actions"],
 ["offer","Que proposer ?","Prestations adaptées à l’audit"],
 ["new","Nouvel audit","Analyser un autre commerce"]];
const BOT_ICO={sum:'<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>',offer:'<path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z"/>',find:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',new:'<path d="M12 5v14M5 12h14"/>',lock:'<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',sync:'<rect x="3" y="5" width="12" height="9" rx="1.5"/><rect x="16" y="9" width="5" height="10" rx="1.2"/><path d="M6 18h7"/>'};
const BOT_ASK={find:"Trouver un client",info:"Informations sur le client actuel",recent:"Mes derniers clients",sum:"Résume l’audit en cours",offer:"Que proposer à ce client ?",new:"Nouvel audit"};
function botEsc(t){return esc(t).replace(/\n/g,"<br>")}
/* Mise en forme légère des réponses de l'IA : gras, listes, paragraphes */
function botMd(t){
 const lines=esc(String(t||"").replace(/^#+\s*/gm,"")).split(/\n/);let out="",list=null;
 const inl=x=>x.replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/\*(.+?)\*/g,"$1");
 lines.forEach(l=>{const m=l.match(/^\s*(?:[-*•]|(\d+)[.)])\s+(.*)$/);if(m){const tag=m[1]?"ol":"ul";if(list!==tag){if(list)out+="</"+list+">";out+="<"+tag+' class="blist">';list=tag}out+="<li>"+inl(m[2])+"</li>"}else{if(list){out+="</"+list+">";list=null}if(l.trim())out+="<p>"+inl(l)+"</p>"}});
 if(list)out+="</"+list+">";return out;
}
function botTime(){return new Date().toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}
function botScroll(el){try{el.scrollIntoView({block:"end",behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}catch(e){}}
function botSay(html,actions,suggest){
 const el=document.createElement("div");el.className="bmsg bot";
 el.innerHTML='<span class="bav" aria-hidden="true"><img src="assets/assistant-64.png" alt="" width="18" height="18"></span><div class="bcol"><div class="bbub">'+html+(actions&&actions.length?'<div class="bacts">'+actions.map((a,i)=>'<button type="button" class="'+(i===0?"bact main":"bact")+'" data-i="'+i+'">'+esc(a[0])+'</button>').join("")+'</div>':'')+'</div><span class="btime">'+botTime()+'</span></div>';
 (actions||[]).forEach((a,i)=>{const b=el.querySelector('[data-i="'+i+'"]');if(b)b.onclick=()=>a[1]()});
 $("botLog").appendChild(el);botScroll(el);Bot.history.push({who:"bot",text:el.querySelector(".bbub").textContent.slice(0,500)});
 renderBotChips(suggest);
}
function botUser(t){const el=document.createElement("div");el.className="bmsg me";el.innerHTML='<div class="bcol"><div class="bbub">'+botEsc(t)+'</div><span class="btime">'+botTime()+'</span></div>';$("botLog").appendChild(el);botScroll(el);Bot.history.push({who:"me",text:t});const w=$("botLog").querySelector(".bwelcome");if(w)w.classList.add("small")}
function botTyping(on){let t=$("botTyping");if(on&&!t){t=document.createElement("div");t.id="botTyping";t.className="bmsg bot";t.innerHTML='<span class="bav" aria-hidden="true"><img src="assets/assistant-64.png" alt="" width="18" height="18"></span><div class="bbub typing" aria-label="L’assistant écrit"><i></i><i></i><i></i></div>';$("botLog").appendChild(t);botScroll(t)}if(!on&&t)t.remove()}
function botWelcome(){
 const name=settings.senderName?" "+botEsc(settings.senderName.split(" ")[0]):"";const h=new Date().getHours();
 const cur=state.biz&&state.biz.name&&state.data&&state.data.fetchedAt?state.biz.name:"";
 const w=document.createElement("div");w.className="bwelcome";
 w.innerHTML='<div class="bhero"><span class="botav big"><img src="assets/assistant-64.png" alt="" width="34" height="34"></span><h3>'+(h<18&&h>=5?"Bonjour":"Bonsoir")+name+' 👋</h3><p>Que voulez-vous faire ?'+(cur?' L’audit ouvert est <b>'+botEsc(cur)+'</b>.':'')+'</p></div><div class="bgrid">'+BOT_START.map(([k,t,sx])=>'<button type="button" class="bcard" data-k="'+k+'"><span class="bico"><svg viewBox="0 0 24 24" aria-hidden="true">'+BOT_ICO[k]+'</svg></span><b>'+esc(t)+'</b><small>'+esc(sx)+'</small></button>').join("")+'</div>';
 w.querySelectorAll(".bcard").forEach(b=>b.onclick=()=>botAsk(BOT_ASK[b.dataset.k]));
 $("botLog").appendChild(w);
}
function botReset(){Bot.history=[];$("botLog").innerHTML="";botWelcome();renderBotChips()}
function botToggle(open){
 Bot.open=open??!Bot.open;$("botPanel").hidden=!Bot.open;$("botFab").setAttribute("aria-expanded",String(Bot.open));document.body.classList.toggle("botopen",Bot.open);
 if(Bot.open){if(!Bot.started){Bot.started=true;botReset()}setTimeout(()=>{if(matchMedia("(min-width:901px)").matches)$("botInput").focus()},80)}
 else if(Bot.rec){try{Bot.rec.stop()}catch(e){}}
}
const BOT_CHIPS=["Trouver un client","Infos sur le client actuel","Mes derniers clients","Coordonnées du client","Que proposer ?","Rédiger un message"];
function renderBotChips(list){const L=list&&list.length?list:BOT_CHIPS;$("botChips").innerHTML=L.map(c=>'<button type="button" class="chipq">'+esc(c)+'</button>').join("");$("botChips").querySelectorAll(".chipq").forEach(b=>b.onclick=()=>botAsk(b.textContent))}
/* Synthèse de l'audit ouvert, à partir des données réelles */
function botHasAudit(){return !!(state.biz&&state.biz.name&&(state.data&&state.data.fetchedAt||calc().n))}
function botNoAudit(){botSay("Aucun audit n’est ouvert pour l’instant.",[["Lancer un audit",()=>{botToggle(false);nav("auto");setTimeout(()=>$("autoName").focus(),300)}],["Ouvrir un audit",()=>botAsk("Mes derniers audits")]])}
function botSummary(){
 if(!botHasAudit())return botNoAudit();
 const b=state.biz,c=calc(),[vt]=verdict(c.score),F=(state.data.findings||[]).slice(0,3),I=issuesList().slice(0,3);
 botSay("<b>"+botEsc(b.name)+"</b>"+(b.city?" · "+botEsc(b.city):"")+"<br>Score indicatif <b>"+(c.score??"—")+"/100</b> : "+botEsc(vt.toLowerCase())+" ("+c.n+" contrôles, "+c.issues+" point"+(c.issues>1?"s":"")+" à améliorer)."
  +(F.length?'<p class="bsub">Constats clés</p><ol class="blist">'+F.map(f=>"<li>"+botEsc(f.text)+"</li>").join("")+"</ol>":"")
  +(I.length?'<p class="bsub">Priorités</p><ol class="blist">'+I.map(p=>"<li><b>"+botEsc(p.it)+"</b>"+(p.goal?"<br><small>"+botEsc(p.goal)+"</small>":"")+"</li>").join("")+"</ol>":""),
  [["Ouvrir le rapport",()=>{botToggle(false);nav("report")}],["Rédiger le message",()=>{botToggle(false);nav("pitch")}]],["Que proposer ?","Explique le score","Ce qu’il reste à vérifier"]);
}
function botOffer(){
 if(!botHasAudit())return botNoAudit();
 const by={};issuesList().forEach(p=>{if(p.offer)(by[p.offer]=by[p.offer]||[]).push(p)});
 const L=Object.entries(by).sort((a,b)=>b[1].reduce((s,p)=>s+p.prio,0)-a[1].reduce((s,p)=>s+p.prio,0)).slice(0,3);
 if(!L.length)return botSay("Aucun point à améliorer n’est relevé sur cet audit : proposez plutôt un suivi (nouvel audit dans 3 mois) et des contenus vidéo pour garder l’avance.");
 const f=(state.data.findings||[])[0];
 botSay("Pour <b>"+botEsc(state.biz.name)+"</b>, je proposerais dans cet ordre :<ol class=\"blist\">"+L.map(([o,ps])=>"<li><b>"+botEsc(o)+"</b><br><small>"+botEsc(ps.slice(0,3).map(p=>p.it).join(" · "))+"</small></li>").join("")+"</ol>"+(f?'<p class="bsub">Accroche conseillée</p><p>« '+botEsc(f.text)+' »</p>':"")+"<p><small>Ne promettez pas de position ou de chiffre d’affaires : appuyez-vous sur les constats datés du rapport.</small></p>",
  [["Rédiger le message",()=>{botToggle(false);nav("pitch")}],["Voir le plan d’action",()=>{botToggle(false);nav("report")}]],["Résumer l’audit","Explique le score","Ce qu’il reste à vérifier"]);
}
function botToCheck(){
 if(!botHasAudit())return botNoAudit();
 const L=keys.filter(k=>!state.checks[k]||(state.auto[k]&&state.auto[k].status==="info")).map(k=>{const [gi,ii]=k.split("-").map(Number);return groups[gi].items[ii]});
 botSay(L.length?"Points à confirmer avec le commerçant ou à la main ("+L.length+") :<ul class=\"blist\">"+L.slice(0,8).map(x=>"<li>"+botEsc(x)+"</li>").join("")+"</ul>"+(L.length>8?"<small>+ "+(L.length-8)+" autres dans la checklist.</small>":""):"Tous les points ont été vérifiés.",[["Ouvrir la checklist",()=>{botToggle(false);nav("audit")}]],["Résumer l’audit","Que proposer ?"]);
}
function botScore(){
 const c=calc(),gs=groupScores();
 botSay("Le score est la part des contrôles réussis parmi ceux vérifiés, <b>pondérée par l’importance</b> de chaque point : les avis ou la position locale comptent trois fois plus qu’un point secondaire. Les points non vérifiés ne comptent pas."+(c.score!=null?'<p class="bsub">Audit ouvert : '+c.score+'/100</p><ul class="blist">'+gs.map(g=>"<li>"+botEsc(g.title.replace(/^[A-E] · /,""))+" : <b>"+(g.score==null?"non évalué":g.score+"/100")+"</b></li>").join("")+"</ul>":""),null,["Résumer l’audit","Que proposer ?"]);
}
function auditsSorted(){return Object.values(db.audits).filter(a=>a.biz&&a.biz.name).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)))}
function auditLine(a){const sc=scoreOf(a);return "<b>"+botEsc(a.biz.name)+"</b>"+(a.biz.city?" · "+botEsc(a.biz.city):"")+(sc!=null?" · score "+sc+"/100":"")+(a.biz.date?" · "+botEsc(frDate(a.biz.date)):"")}
function botShowAudits(list,title){
 if(!list.length){botSay(title?"Aucun audit ne correspond.":"Aucun audit enregistré pour l’instant.",[["Lancer un audit",()=>{botToggle(false);nav("auto");setTimeout(()=>$("autoName").focus(),300)}]]);return}
 const top=list.slice(0,5);
 botSay((title||"Vos audits")+" :<ul class=\"blist\">"+top.map(a=>"<li>"+auditLine(a)+"</li>").join("")+"</ul>"+(list.length>5?"<small>+ "+(list.length-5)+" autre(s) dans l’écran Clients.</small>":""),
  top.slice(0,3).flatMap(a=>[["Ouvrir "+a.biz.name,()=>{switchTo(a.id);botToggle(false);nav("auto")}],["Rapport "+a.biz.name,()=>{switchTo(a.id);botToggle(false);nav("report")}]]).slice(0,4).concat(list.length>3?[["Voir tous les clients",()=>{botToggle(false);nav("clients")}]]:[]));
}
function botClientSearchText(a){
 const b=a.biz||{},d=a.data||{};
 return norm([b.name,b.city,b.type,b.site,b.maps,b.phone,b.address,b.context,b.keyword,a.notes,a.pitch,
  ...(d.findings||[]).map(x=>x.text),
  ...Object.values(a.auto||{}).map(x=>typeof x==="string"?x:JSON.stringify(x||{})),
  ...Object.values(a.socialAudits||{}).map(x=>JSON.stringify(x||{}))].filter(Boolean).join(" "));
}
function botClientActions(a){
 return [["Ouvrir la fiche",()=>{switchTo(a.id);botToggle(false);nav("auto")}],["Voir le rapport",()=>{switchTo(a.id);botToggle(false);nav("report")}],["Message prospect",()=>{switchTo(a.id);botToggle(false);nav("pitch")}]];
}
function botClientDetail(a){
 const b=a.biz||{},d=a.data||{},score=scoreOf(a),findings=(d.findings||[]).slice(0,3);
 const rows=[["Ville",b.city],["Activité",b.type],["Téléphone",b.phone],["Adresse",b.address],["Site web",b.site],["Fiche Google",b.maps],["Note Google",b.rating!=null?b.rating+(b.reviews!=null?" ("+b.reviews+" avis)":""):null],["Date de la fiche",b.date?frDate(b.date):null],["Notes",a.notes]];
 const info=rows.filter(([k,v])=>v!==undefined&&v!==null&&String(v).trim()!=="").map(([k,v])=>"<li><b>"+botEsc(k)+" :</b> "+(k==="Site web"||k==="Fiche Google"&&/^https?:/i.test(String(v))?'<a href="'+botEsc(safeUrl(v)||"#")+'" target="_blank" rel="noopener">'+botEsc(v)+'</a>':botEsc(String(v)))+"</li>").join("");
 const status=d.fetchedAt?"Audit réalisé":Object.keys(a.checks||{}).some(k=>a.checks[k])?"Audit en cours":"Fiche enregistrée";
 const facts=findings.length?findings.map(x=>"<li>"+botEsc(x.text)+"</li>").join(""):"";
 botSay("<b>"+botEsc(b.name||"Client sans nom")+"</b><p>"+botEsc(status)+(score!=null?" · Score indicatif : <b>"+score+"/100</b>":" · Score pas encore disponible")+"</p>"+(info?'<p class="bsub">Informations enregistrées</p><ul class="blist">'+info+"</ul>":"<p>Aucune coordonnée complémentaire n’est enregistrée dans cette fiche.</p>")+(facts?'<p class="bsub">Constats de l’audit</p><ul class="blist">'+facts+"</ul>":""),botClientActions(a),["Trouver un autre client","Que proposer ?","Rédiger un message"]);
}
function botFind(q){
 const stop=/\b(trouve[rz]?|cherche[rz]?|recherche|retrouve[rz]?|ouvre[rz]?|ouvrir|affiche[rz]?|montre[rz]?|audit|audits|rapport|le|la|les|l|de|du|des|d|mon|mes|pour|sur|a|à|svp|stp|moi|client|clients|commerce|resto|restaurant|ville|fiche|infos?|informations?|coordonnees?|telephone|adresse|site|web|dernier|recents?|actuel|actuelle)\b/gi;
 const term=norm(q.replace(stop," ")),words=term.split(" ").filter(w=>w.length>1);
 if(!words.length){botShowAudits(auditsSorted(),"Vos clients les plus récents");return}
 const res=auditsSorted().map(a=>({a,text:botClientSearchText(a)})).map(x=>({...x,score:words.reduce((n,w)=>n+(x.text.includes(w)?(norm(x.a.biz.name).includes(w)?3:1):0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score||String(b.a.updatedAt||b.a.createdAt).localeCompare(String(a.a.updatedAt||a.a.createdAt))).map(x=>x.a);
 if(res.length===1){botClientDetail(res[0]);return}
 botShowAudits(res,res.length?"J’ai trouvé "+res.length+" client"+(res.length>1?"s":"")+" correspondant à « "+botEsc(term)+" »":"Aucun client ne correspond à « "+botEsc(term)+" »");
}
function botInfo(q){
 const cleaned=norm(q).replace(/\b(donne|donnez|montre|montrez|affiche|affichez|cherche|trouve|retrouve|infos?|informations?|details?|fiche|coordonnees?|telephone|numero|adresse|site|web|email|mail|sur|pour|du|de|des|la|le|les|l|mon|ma|mes|ce|cet|cette|client|clients|commerce|actuel|actuelle|enregistre|enregistres|dernier|derniers|audit|audits|svp|stp)\b/g," ").trim();
 const words=cleaned.split(/\s+/).filter(w=>w.length>1);
 if(!words.length){if(state.biz&&state.biz.name){botClientDetail(state);return}botSay("Quel client recherchez-vous ? Donnez-moi son nom, sa ville, son téléphone ou son site.",[["Trouver un client",()=>botAsk("Trouver un client")],["Mes derniers clients",()=>botAsk("Mes derniers clients")]]);return}
 const matches=auditsSorted().map(a=>({a,t:botClientSearchText(a)})).map(x=>({...x,score:words.reduce((n,w)=>n+(x.t.includes(w)?(norm(x.a.biz.name).includes(w)?4:1):0),0)})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).map(x=>x.a);
 if(matches.length===1){botClientDetail(matches[0]);return}
 if(matches.length>1){botShowAudits(matches,"Plusieurs clients correspondent. Choisissez le bon dossier.");return}
 botSay("Je n’ai pas trouvé de dossier correspondant à « "+botEsc(cleaned)+" ». Je peux rechercher par nom, ville, téléphone ou site.",[["Voir tous les clients",()=>botShowAudits(auditsSorted(),"Vos clients enregistrés")],["Nouvel audit",()=>botAsk("Nouvel audit")]])
}
const INTENTS=[
 {re:/(infos?|informations?|details?|fiche|coordonnees?|telephone|numero|adresse|site web).*(client|commerce|sur|de|du|actuel|actuelle)?|^(qui est|donne moi|donnez moi).*(client|commerce)/,run:botInfo},
 {re:/(instagram|youtube|insta\b|chaine youtube|reels|shorts)/,run:()=>botSay("L’écran « Instagram et YouTube » analyse un compte : niche, SEO, régularité, engagement et plan d’action. Le résultat s’ajoute au rapport du client.",[["Ouvrir l’audit Instagram / YouTube",()=>{botToggle(false);nav("social");setTimeout(()=>$("socUrl").focus(),300)}]])},
 {re:/(resum|synthese|bilan|recap).*(audit|client|en cours)?|^resume/,run:botSummary},
 {re:/(propos|vendre|offre|prestation|quoi faire pour|que faire pour)/,run:botOffer},
 {re:/(reste a verifier|a verifier|manque|manquant|verifier avec)/,run:botToCheck},
 {re:/(explique|comment).*(score)|^score|calcul.*score/,run:botScore},
 {re:/(chang|modifi|nouveau|oubli).*(code|mot de passe|mdp|pin)|(code|mot de passe|mdp).*(chang|modifi)/,run:q=>{
   if(/oubli/.test(norm(q)))return botSay("Sans le code, seule l’option « Code oublié ? » de l’écran de verrouillage permet de repartir de zéro : elle efface les données de cet appareil. Si la synchronisation est active, vous les récupérez ensuite en reliant l’appareil avec le QR code.");
   if(!Lock.cfg||!Lock.cfg.hash)return botSay("Aucun code n’est encore défini sur cet appareil.",[["Créer un code",()=>{botToggle(false);showGate("create")}]]);
   botSay("Pour changer votre code, je dois d’abord vérifier que c’est bien vous (code actuel ou Face ID).",[["Changer mon code",()=>{botToggle(false);requireOwner("Saisissez votre code actuel pour en choisir un nouveau.",()=>showGate("change"))}]])}},
 {re:/(ajout|donn|partag|reli|connect|synchro|autre).*(acc[eè]s|appareil|telephone|téléphone|ordi|ordinateur|mac|tablette|iphone)|synchronis/,run:()=>{
   if(!Sync.secret)return botSay("Pour donner accès à un autre appareil, activez d’abord la synchronisation : un QR code s’affichera, à scanner avec l’autre appareil.",[["Activer la synchronisation",()=>requireOwner("Confirmez avant d’activer la synchronisation.",async()=>{await syncEnable(b64u(crypto.getRandomValues(new Uint8Array(16))),false);botQr()})]]);
   botSay("Le lien de liaison donne accès à tous vos audits : je vérifie d’abord que c’est vous.",[["Afficher le QR code",()=>requireOwner("Confirmez pour afficher le QR code de liaison.",botQr)]])}},
 {re:/face ?id|touch ?id|empreinte|biometr|visage/,run:()=>{
   if(!Lock.cfg||!Lock.cfg.hash)return botSay("Créez d’abord un code d’accès, puis activez Face ID / Touch ID.",[["Créer un code",()=>{botToggle(false);showGate("create")}]]);
   if(Lock.cfg.bio)return botSay(bioLabel()+" est déjà activé sur cet appareil.",[["Désactiver",()=>requireOwner("Confirmez pour désactiver "+bioLabel()+".",()=>{Lock.cfg.bio=null;lockSave();renderPinSettings();botSay(bioLabel()+" désactivé.")})]]);
   if(!Lock.bioOk)return botSay("Cet appareil ou ce navigateur ne propose pas la reconnaissance biométrique ici. Sur iPhone, ouvrez l’appli dans Safari ou depuis l’écran d’accueil.");
   botSay("Je peux activer "+bioLabel()+" : vous n’aurez plus à taper le code.",[["Activer "+bioLabel(),async()=>{try{await bioEnable();renderPinSettings();botSay(bioLabel()+" activé.")}catch(e){botSay("Activation annulée ou impossible sur cet appareil.")}}]])}},
 {re:/(redemand|demand|tape|saisi|chaque fois|tout le temps|delai|délai|verrouill)/,run:()=>botSay("Le code est redemandé après la durée d’absence choisie (actuellement : "+({"-1":"jamais, l’appareil se souvient de vous","0":"à chaque ouverture","5":"5 minutes","60":"1 heure","1440":"1 jour","10080":"1 semaine"}[String(lockDelay())]||lockDelay()+" min")+"). Vous pouvez la changer, ou verrouiller tout de suite.",[["Régler le délai",()=>{botToggle(false);nav("settings");setTimeout(()=>$("pinDelay").focus(),300)}],["Verrouiller maintenant",()=>{botToggle(false);lockNow()}]])},
 {re:/(nouvel|nouveau|lanc|fai[st]|commenc|demarr|démarr).*(audit)|^audit(e|er)? /,run:q=>{
   const m=q.match(/audit(?:e|er)?\s+(?:de\s+|du\s+|pour\s+)?(.+?)(?:\s+(?:à|a|sur)\s+(.+))?$/i);
   botToggle(false);state=fixState(state);read();persistLocal();state=blankState();persistLocal();hydrate();nav("auto");
   if(m&&m[1]&&!/^(un|une|le|nouvel?)$/i.test(m[1].trim())){$("autoName").value=m[1].trim();if(m[2])$("autoCity").value=m[2].trim();queueSuggest();toast("Choisissez le commerce dans la liste pour lancer l’audit.")}
   setTimeout(()=>$("autoName").focus(),300)}},
 {re:/(export|sauvegard|backup|import)/,run:()=>botSay("Vous pouvez exporter tous vos audits dans un fichier, ou importer un fichier exporté.",[["Exporter maintenant",()=>$("exportJson").click()],["Ouvrir les réglages",()=>{botToggle(false);nav("settings")}]])},
 {re:/(dernier|recent|récent|liste|tous|combien).*(audit|client)|mes (audits|clients)/,run:q=>{const L=auditsSorted();if(/combien/.test(norm(q)))return botSay("Vous avez "+L.length+" audit"+(L.length>1?"s":"")+" enregistré"+(L.length>1?"s":"")+".");botShowAudits(L,"Vos audits les plus récents")}},
 {re:/(meilleur|pire|plus (bas|faible|haut)|mauvais).*(score|audit|client)|(prospect|priorit|opportunit)/,run:q=>{const L=auditsSorted().filter(a=>scoreOf(a)!=null);if(!L.length)return botSay("Aucun audit avec un score pour l’instant.");const best=/meilleur|plus haut/.test(norm(q));L.sort((a,b)=>best?scoreOf(b)-scoreOf(a):scoreOf(a)-scoreOf(b));botShowAudits(L,best?"Les mieux notés":"Les commerces avec le plus d’opportunités (scores les plus bas)")}},
 {re:/(trouv|cherch|retrouv|ouvr|affich|montr|ou est|où est)/,run:botFind},
 {re:/(supprim|efface).*(audit|client)/,run:()=>botSay("Pour supprimer un audit, ouvrez l’écran Clients et touchez la corbeille à côté du commerce. La suppression est aussi appliquée à vos autres appareils.",[["Ouvrir Clients",()=>{botToggle(false);nav("clients")}]])},
 {re:/(cle|clé|api|google cloud|places|pagespeed|gemini|generative)/,run:()=>botSay("La clé Google (qui commence par « AIza ») se crée dans Google Cloud → Identifiants → Créer des identifiants → Clé API. Activez Places API (New), PageSpeed Insights API et Generative Language API (pour Gemini), puis cochez-les dans les restrictions de la clé.",[["Ouvrir les réglages",()=>{botToggle(false);nav("settings");setTimeout(()=>{$("help-key").open=true},300)}],["Google Cloud",()=>window.open("https://console.cloud.google.com/apis/credentials?project=affiads-audit","_blank","noopener")]])},
 {re:/(pdf|imprim|rapport)/,run:()=>botSay("Touchez « PDF » en haut de l’écran : l’appli crée un PDF d’une page, que vous pouvez envoyer par WhatsApp ou Mail, ou enregistrer dans Fichiers.",[["Créer le PDF",()=>{botToggle(false);nav("report");makePdf()}],["Voir le rapport",()=>{botToggle(false);nav("report")}]])},
 {re:/(message|prospect|whatsapp|mail|e-mail|email)/,run:()=>botSay("Le message de prospection est rédigé à partir des constats de l’audit, au format Instagram, e-mail ou WhatsApp.",[["Rédiger le message",()=>{botToggle(false);nav("pitch")}]])},
 {re:/(sombre|clair|theme|thème|dark)/,run:q=>{const t=/sombre|dark/.test(norm(q))?"dark":/clair/.test(norm(q))?"light":"auto";settings.theme=t;saveSettings();applyTheme();botSay("Thème "+({dark:"sombre",light:"clair",auto:"automatique"})[t]+" appliqué.")}},
 {re:/(score|calcul|note sur 100)/,run:botScore},
 {re:/(install|ecran d.accueil|écran d.accueil|appli sur)/,run:()=>botSay("Sur iPhone : ouvrez l’appli dans Safari, touchez Partager puis « Sur l’écran d’accueil ». Sur ordinateur : bouton d’installation dans la barre d’adresse, ou Réglages → Installer l’appli.")},
 {re:/^(bonjour|salut|hello|coucou|merci)/,run:q=>botSay(/merci/.test(norm(q))?"Avec plaisir !":"Bonjour ! Que puis-je faire pour vous ?")}
];
function botQr(){
 botToggle(true);
 const box=document.createElement("div");box.className="bqr";box.innerHTML='<div class="bqrimg">…</div>';
 botSay("Scannez ce QR code avec l’appareil photo de l’autre appareil, puis touchez le lien. Il faudra y créer ou saisir le code d’accès.",[["Copier le lien",()=>copyText(syncLink(),"Lien de liaison copié.")]]);
 const last=$("botLog").lastElementChild.querySelector(".bbub");last.insertBefore(box,last.querySelector(".bacts"));
 loadQr().then(()=>{const q=qrcode(0,"M");q.addData(syncLink());q.make();box.querySelector(".bqrimg").innerHTML=q.createSvgTag({cellSize:4,margin:2,scalable:true})}).catch(()=>{box.innerHTML='<small>QR code indisponible : utilisez « Copier le lien ».</small>'});
}
const BOT_GUIDE="Tu es l’assistant intégré de l’appli AffiAds Audit 360° de Denis (AffiAds : visibilité en ligne des commerces locaux : fiche Google, photos et vidéos, réseaux sociaux, site mobile, avis). Réponds en français, au vouvoiement, simplement, en 5 phrases maximum ou une courte liste. Appuie-toi uniquement sur les données d’audit fournies ; si une donnée manque, dis-le au lieu d’inventer. Ne promets jamais de position ni de résultat chiffré. Écrans de l’appli : Audit (taper le nom du commerce, le choisir, puis lancer), Clients, Rapport (PDF), Message (prospection), Plus → Fiche commerce, Checklist, Visibilité IA, Recherche web, Tests du site, Boîte à outils, Réglages (thème, Face ID, code, synchronisation, clé Google, signature, export). Si la question ne concerne ni l’appli ni le marketing local, dis-le poliment.";
function botContext(){
 const L="Dossiers clients enregistrés (recherche locale sur cet appareil) : "+auditsSorted().slice(0,40).map(a=>{
  const b=a.biz||{};return [b.name,b.city,b.type,b.phone,b.site,b.address,scoreOf(a)!=null?"score "+scoreOf(a)+"/100":""].filter(Boolean).join(" · ");
 }).join(" ; ")+".";
 if(!botHasAudit())return L;
 const b=state.biz,c=calc();
 return L+"\nFiche actuellement ouverte : "+[b.name,b.city,b.type,b.phone,b.address,b.site,b.maps,b.rating!=null?"note "+b.rating:"",b.reviews!=null?b.reviews+" avis":"",b.date?"date "+b.date:"",state.notes?"notes "+state.notes:""].filter(Boolean).join(" · ")+". Score "+(c.score??"—")+"/100. Constats : "+(state.data.findings||[]).map(f=>f.text).join(" | ")+"\nPlan d’action : "+issuesList().slice(0,8).map(p=>p.it+" → "+p.reco+(p.goal?" (objectif : "+p.goal+")":"")).join(" | ");
}
async function botAsk(text){
 text=String(text||"").trim();if(!text)return;botUser(text);$("botInput").value="";botGrow();
 const n=norm(text);const it=INTENTS.find(i=>i.re.test(n));
 if(it){try{await it.run(text)}catch(e){botSay("Une erreur est survenue : "+botEsc(frErr(e).text))}return}
 if(hasKey()){botTyping(true);try{const hist=Bot.history.slice(-7,-1).map(h=>(h.who==="me"?"Utilisateur : ":"Assistant : ")+h.text).join("\n");const t=await geminiChat(BOT_GUIDE+"\n\n"+botContext()+(hist?"\n\nConversation récente :\n"+hist:"")+"\n\nQuestion : "+text);botTyping(false);botSay(botMd(t)||"Je n’ai pas de réponse pour le moment.",null,["Résumer l’audit","Que proposer ?"])}catch(e){botTyping(false);const f=frErr(e);botSay("Je n’ai pas pu interroger Gemini : "+botEsc(f.text),f.link?[[f.link.label,()=>window.open(f.link.href,"_blank","noopener")]]:[])}return}
 botSay("Je n’ai pas compris cette demande. Choisissez une action ci-dessous, ou ajoutez une clé Google dans Réglages pour que je puisse répondre à toutes vos questions avec Gemini.",[["Résumer l’audit",()=>botAsk("Résume l’audit en cours")],["Trouver un audit",()=>botAsk("Trouver un audit")],["Changer mon code",()=>botAsk("Changer mon code")]]);
}
function botGrow(){const t=$("botInput");t.style.height="auto";t.style.height=Math.min(t.scrollHeight,120)+"px"}
function initBot(){
 $("botFab").onclick=()=>botToggle();$("botClose").onclick=()=>botToggle(false);$("botNew").onclick=botReset;
 $("botForm").onsubmit=e=>{e.preventDefault();botAsk($("botInput").value)};
 $("botInput").addEventListener("input",botGrow);
 $("botInput").addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey&&!e.isComposing){e.preventDefault();botAsk($("botInput").value)}});
 document.addEventListener("keydown",e=>{if(e.key==="Escape"&&Bot.open)botToggle(false)});
 const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(SR){const mic=$("botMic");mic.hidden=false;mic.onclick=()=>{
  if(Bot.rec){try{Bot.rec.stop()}catch(e){}return}
  const r=new SR();r.lang="fr-FR";r.interimResults=true;r.maxAlternatives=1;Bot.rec=r;mic.classList.add("on");mic.setAttribute("aria-label","Arrêter la dictée");
  let finalText="";r.onresult=ev=>{let t="";for(const res of ev.results)t+=res[0].transcript;$("botInput").value=t;botGrow();if(ev.results[ev.results.length-1].isFinal)finalText=t};
  r.onend=()=>{Bot.rec=null;mic.classList.remove("on");mic.setAttribute("aria-label","Dicter la question");if(finalText.trim())botAsk(finalText)};
  r.onerror=ev=>{if(ev.error==="not-allowed")toast("Autorisez le micro pour dicter vos questions.")};
  try{r.start()}catch(e){Bot.rec=null;mic.classList.remove("on")}}}
}

/* ---------- Démarrage ---------- */
bind();loadAll();applyTheme();initInstallHelp();hydrate();initLock();renderPinSettings();syncInit();initBot();
{const h=location.hash.slice(1);if(h&&TITLES[h])nav(h);else document.body.dataset.view="auto"}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(h&&TITLES[h]&&h!==curView)nav(h)});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme);

/* Keep automatic theme synchronized with iOS/macOS without overriding manual choices. */
try {
  const themeMedia = window.matchMedia("(prefers-color-scheme: dark)");
  const onThemeChange = () => {
    if ((settings.theme || "auto") === "auto") applyTheme();
  };
  if (themeMedia.addEventListener) themeMedia.addEventListener("change", onThemeChange);
  else if (themeMedia.addListener) themeMedia.addListener(onThemeChange);
} catch (e) {}
