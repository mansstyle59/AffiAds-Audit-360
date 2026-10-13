/* AffiAds Audit 360° — v2
   Audit automatique à partir de sources réelles :
   - Google Places API (New)  : fiche, note, avis, photos, horaires, concurrents, position locale (clé Google)
   - Google PageSpeed Insights : Lighthouse mobile + Core Web Vitals (clé recommandée)
   - OpenStreetMap (Nominatim + Overpass) : secours sans clé (coordonnées, site, réseaux, concurrents)
   Tout est stocké localement dans le navigateur. Aucune clé n'est écrite dans le code. */
"use strict";

/* ---------- Référentiels ---------- */
const BIZ_TYPES=[
 {label:"Restaurant",kw:"restaurant",g:["restaurant"],osm:'["amenity"~"^(restaurant|fast_food)$"]'},
 {label:"Café / bar",kw:"bar",g:["cafe","bar"],osm:'["amenity"~"^(cafe|bar|pub)$"]'},
 {label:"Boulangerie",kw:"boulangerie",g:["bakery"],osm:'["shop"~"^(bakery|pastry)$"]'},
 {label:"Commerce de proximité",kw:"épicerie",g:["convenience_store","grocery_store","supermarket"],osm:'["shop"~"^(convenience|supermarket|greengrocer|butcher|deli)$"]'},
 {label:"Salon / beauté",kw:"coiffeur",g:["hair_salon","beauty_salon"],osm:'["shop"~"^(hairdresser|beauty)$"]'},
 {label:"Hôtel / hébergement",kw:"hôtel",g:["lodging"],osm:'["tourism"~"^(hotel|guest_house|motel)$"]'},
 {label:"Artisan / dépannage",kw:"artisan",g:["plumber","electrician","painter","general_contractor"],osm:'["craft"]'},
 {label:"Boutique / mode",kw:"boutique",g:["clothing_store","store"],osm:'["shop"~"^(clothes|shoes|boutique|gift)$"]'},
 {label:"Garage / auto",kw:"garage automobile",g:["car_repair"],osm:'["shop"~"^(car_repair|car|tyres)$"]'},
 {label:"Santé / bien-être",kw:"bien-être",g:["spa","physiotherapist"],osm:'["leisure"~"^(spa|sauna)$"]'},
 {label:"Autre commerce",kw:"",g:[],osm:""}
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
function normalizeUrl(raw){if(!raw)return null;raw=String(raw).trim();if(!/^https?:\/\//i.test(raw))raw="https://"+raw;try{let u=new URL(raw);if(!["http:","https:"].includes(u.protocol)||!u.hostname.includes("."))return null;return u}catch(e){return null}}
const fr1=n=>Number(n).toLocaleString("fr-FR",{maximumFractionDigits:1});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function typeInfo(label){return BIZ_TYPES.find(t=>t.label===label)||BIZ_TYPES[BIZ_TYPES.length-1]}
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
let settings={googleKey:"",senderName:"",senderLine:"AffiAds — Votre image, notre expertise",senderContact:""};
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
function fixState(s){s=s||blankState();["checks","issues","auto","biz","campaign","data"].forEach(k=>{if(!s[k]||typeof s[k]!=="object")s[k]={}});["aiTests","campaignPrompts"].forEach(k=>{if(!Array.isArray(s[k]))s[k]=[]});if(!s.id)s.id=uid();return s}
function markSaved(ok){const el=$("savedState");if(!el)return;el.textContent=ok?"✓ Enregistré":"⚠ Non enregistré";el.classList.toggle("bad",!ok)}
function persistLocal(){const ok=persistRaw();markSaved(ok);if(typeof syncSoon==="function")syncSoon();return ok}
function persistRaw(){state.updatedAt=new Date().toISOString();db.audits[state.id]=state;db.current=state.id;try{localStorage.setItem(STORE,JSON.stringify(db));return true}catch(e){
 /* Quota dépassé : on retire la capture d'écran, la plus lourde */
 try{Object.values(db.audits).forEach(a=>{if(a.data&&a.data.psi)delete a.data.psi.shot});localStorage.setItem(STORE,JSON.stringify(db));return true}catch(e2){return false}}}
function saveSettings(keepStamp){if(!keepStamp)settings.updatedAt=Date.now();try{localStorage.setItem(SETTINGS,JSON.stringify(settings))}catch(e){}if(!keepStamp&&typeof syncSoon==="function")syncSoon()}
function auditLabel(s){const d=s.biz&&s.biz.date||s.createdAt||"";return (s.biz&&s.biz.name?s.biz.name:"Nouveau client")+(s.biz&&s.biz.city?", "+s.biz.city:"")+(d?" ("+new Date(d+"T12:00:00").toLocaleDateString("fr-FR",{day:"numeric",month:"short"})+")":"")}
function renderClientSelect(){
 const all=Object.values(db.audits).sort((a,b)=>String(b.updatedAt||b.createdAt).localeCompare(String(a.updatedAt||a.createdAt)));
 const q=norm(($("clientSearch")&&$("clientSearch").value)||"");
 const list=all.filter(a=>!q||norm((a.biz&&a.biz.name||"")+" "+(a.biz&&a.biz.city||"")).includes(q));
 $("clientChipName").textContent=state.biz&&state.biz.name?state.biz.name:"Nouveau client";
 $("clientCount").textContent=all.length+" audit"+(all.length>1?"s":"")+" enregistré"+(all.length>1?"s":"")+" sur cet appareil";
 $("clientList").innerHTML=list.length?list.map(a=>{const sc=scoreOf(a),nm=a.biz&&a.biz.name||"Nouveau client",f=(a.data&&a.data.findings||[]).length;
  return '<div class="clientrow'+(a.id===state.id?" cur":"")+'"><button class="open" data-open="'+esc(a.id)+'"><span class="tile xs"><span class="sig"></span><span class="n">'+(sc??"—")+'</span></span><span class="who"><b>'+esc(nm)+'</b><span>'+esc([a.biz&&a.biz.city,a.biz&&a.biz.date?frDate(a.biz.date):""].filter(Boolean).join(", "))+(f?". "+f+" opportunité"+(f>1?"s":""):"")+'</span></span></button><button class="btn iconbtn del" data-del="'+esc(a.id)+'" aria-label="Supprimer '+esc(nm)+'" title="Supprimer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/></svg></button></div>'}).join(""):'<p class="muted" style="padding:14px 0">'+(q?"Aucun client ne correspond à cette recherche.":"Aucun audit pour l’instant.")+'</p>';
 $("clientList").querySelectorAll("[data-open]").forEach(b=>b.onclick=()=>{switchTo(b.dataset.open);nav("auto")});
 $("clientList").querySelectorAll("[data-del]").forEach(b=>b.onclick=()=>{const a=db.audits[b.dataset.del];if(!a||!confirm("Supprimer définitivement l’audit « "+auditLabel(a)+" » de cet appareil ?"))return;(db.deleted=db.deleted||{})[a.id]=new Date().toISOString();delete db.audits[a.id];if(a.id===state.id){const ids=Object.keys(db.audits);state=ids.length?fixState(db.audits[ids[0]]):blankState();persistLocal();hydrate()}else{try{localStorage.setItem(STORE,JSON.stringify(db))}catch(e){}renderClientSelect();syncSoon()}toast("Audit supprimé.")});
}
function scoreOf(a){const ks=keys;let n=ks.filter(k=>a.checks&&a.checks[k]).length,bad=ks.filter(k=>a.checks&&a.checks[k]&&a.issues&&a.issues[k]).length;return n?Math.round((n-bad)/n*100):null}
function switchTo(id){read();persistLocal();state=fixState(db.audits[id]);db.current=id;persistLocal();hydrate()}
function hydrate(){
 fields.forEach(id=>{$(id).value=state.biz[id]??(id==="date"?today():"")});
 if(!$("type").value)$("type").value=BIZ_TYPES[0].label;
 $("notes").value=state.notes||"";
 $("autoName").value=state.biz.name||"";$("autoCity").value=state.biz.city||"";$("autoType").value=state.biz.type||BIZ_TYPES[0].label;$("autoSite").value=state.biz.site||"";$("autoKeyword").value=state.biz.keyword||"";
 ["autoType","autoKeyword"].forEach(id=>delete $(id).dataset.touched);if(state.biz.keyword)$("autoKeyword").dataset.touched="1";setPickInfo();renderPlaceChoice();closeSuggest();
 renderClientSelect();renderChecklist();update();drawAiTests();renderCampaignPrompts();renderAutoSteps(state.data.steps||[]);renderAutoSummary();$("pitchText").value=state.pitch||"";renderTools();renderKeyNotice();
}

/* ---------- Checklist & score ---------- */
function read(){fields.forEach(id=>state.biz[id]=$(id).value);state.notes=$("notes").value}
function renderChecklist(){
 $("checklist").innerHTML=groups.map((g,gi)=>'<div class="group"><div class="group-head"><h3>'+esc(g.title)+'</h3><span class="pill" id="g'+gi+'">0/'+g.items.length+'</span></div><div class="checks">'+g.items.map((item,ii)=>{const k=gi+"-"+ii,a=state.auto[k];
  return '<div class="check"><input type="checkbox" id="c'+k+'" data-check="'+k+'" '+(state.checks[k]?"checked":"")+' aria-label="Vérifié : '+esc(item)+'"><label for="c'+k+'">'+esc(item)+(a?' <span class="badge b-auto">AUTO</span>':'')+'<em><input type="checkbox" data-issue="'+k+'" '+(state.issues[k]?"checked":"")+' aria-label="À améliorer : '+esc(item)+'"> À améliorer</em>'+(a?'<span class="evid">'+esc(a.evidence)+(a.source?' · '+esc(a.source):'')+'</span>':'')+'</label></div>'}).join("")+'</div></div>').join("");
 $("checklist").querySelectorAll("[data-check]").forEach(el=>el.addEventListener("change",()=>{state.checks[el.dataset.check]=el.checked;update();persistLocal()}));
 $("checklist").querySelectorAll("[data-issue]").forEach(el=>el.addEventListener("change",()=>{state.issues[el.dataset.issue]=el.checked;if(el.checked)state.checks[el.dataset.issue]=true;renderChecklist();update();persistLocal()}));
}
function calc(subset){const ks=subset||keys;let n=ks.filter(k=>state.checks[k]).length,issues=ks.filter(k=>state.issues[k]).length,bad=ks.filter(k=>state.checks[k]&&state.issues[k]).length;return {n,issues,score:n?Math.round((n-bad)/n*100):null,pct:Math.round(n/ks.length*100)}}
function groupScores(){return groups.map((g,gi)=>({title:g.title,...calc(g.items.map((_,ii)=>gi+"-"+ii))}))}
function issuesList(){
 const out=[];groups.forEach((g,gi)=>g.items.forEach((it,ii)=>{const k=gi+"-"+ii;if(state.issues[k]){const r=RECO[k]||["Corriger ce point.",2,2,""];out.push({k,it,group:g.title,reco:r[0],impact:r[1],effort:r[2],offer:r[3],evidence:state.auto[k]&&state.auto[k].evidence,prio:r[1]*2-r[2]})}}));
 return out.sort((a,b)=>b.prio-a.prio||b.impact-a.impact);
}
function prioLabel(p){return p.impact>=3&&p.effort<=1?["Gain rapide","b-ok"]:p.prio>=4?["Priorité haute","b-bad"]:p.prio>=2?["Priorité moyenne","b-mid"]:["À planifier","b-auto"]}
function scoreColor(s){return s===null?"":s>=85?"good":s>=60?"mid":"bad"}
function update(){
 read();const c=calc();
 $("mDone").innerHTML=c.pct+"%<small>Audit complété</small>";$("mIssues").innerHTML=c.issues+"<small>Points à améliorer</small>";$("mScore").innerHTML=(c.score===null?"—":c.score)+"<small>Score indicatif</small>";$("mChecks").innerHTML=c.n+"<small>Contrôles effectués</small>";
 $("gaugeHome").innerHTML=gauge(c.score);$("count").textContent=c.n+" / "+keys.length+" vérifiés";
 $("scoreText").textContent=c.score===null?"Lance l'audit automatique ou coche les contrôles pour calculer un indicateur.":c.score>=85?"Bon résultat sur les éléments évalués ; traite les points signalés.":c.score>=60?"Des améliorations sont à prioriser.":"Plusieurs points évalués restent à améliorer.";
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
 const jobs=OVERPASS.map(u=>fetchJson(u,{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:"data="+encodeURIComponent(q)},22000));
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
async function osmLookup(name,center,type){
 let meN=null;try{meN=await osmMe(name,state.biz.city||"")}catch(e){}
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
const BOOKING_RX=/thefork|lafourchette|zenchef|resy\.com|sevenrooms|guestonline|planity|treatwell|calendly|doctolib|booking\.com|airbnb|ubereats|deliveroo|just-?eat|bookingpage|tablebooker|mybusinessplanner|kalendes|simplybook|resengo|covermanager|opentable/i;
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
 const booking=[...new Set(links.filter(l=>BOOKING_RX.test(l.href)||/r[ée]serv|commander|prendre rendez|book now|order/i.test(l.text)).map(l=>{try{return new URL(l.href,base||undefined).hostname.replace(/^www\./,"")}catch(e){return l.text}}))].slice(0,4);
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
 [/(^|_)restaurant$|meal_takeaway|meal_delivery|pizza|sandwich_shop|brunch|diner|steak_house|food_court/,"Restaurant"],
 [/^(cafe|bar|pub|wine_bar|coffee_shop|cocktail_bar|tea_house|night_club|cafeteria|juice_shop)$/,"Café / bar"],
 [/^(bakery|pastry_shop|confectionery|dessert_shop|chocolate_shop)$/,"Boulangerie"],
 [/^(convenience_store|grocery_store|supermarket|butcher_shop|food_store|market|liquor_store|health_food_store|asian_grocery_store)$/,"Commerce de proximité"],
 [/^(hair_salon|beauty_salon|nail_salon|barber_shop|hair_care|beautician|makeup_artist|tanning_studio)$/,"Salon / beauté"],
 [/^(lodging|hotel|bed_and_breakfast|guest_house|motel|hostel|inn|resort_hotel|campground|cottage)$/,"Hôtel / hébergement"],
 [/^(plumber|electrician|painter|roofing_contractor|general_contractor|locksmith|moving_company|carpenter|hvac_contractor)$/,"Artisan / dépannage"],
 [/^(clothing_store|shoe_store|jewelry_store|gift_shop|book_store|furniture_store|home_goods_store|florist|store|shopping_mall|sporting_goods_store|electronics_store)$/,"Boutique / mode"],
 [/^(car_repair|car_dealer|car_wash|auto_parts_store|car_rental|tire_shop)$/,"Garage / auto"],
 [/^(spa|physiotherapist|massage|wellness_center|gym|fitness_center|yoga_studio|sauna|dentist|doctor|chiropractor)$/,"Santé / bien-être"]];
function typeFromGoogle(types){for(const t of types||[])for(const [rx,label] of G_TYPE_MAP)if(rx.test(t))return label;return null}
function typeFromOsm(key,val){const v=String(val||"");if(key==="amenity"&&/^(restaurant|fast_food|food_court)$/.test(v))return "Restaurant";if(key==="amenity"&&/^(cafe|bar|pub|biergarten)$/.test(v))return "Café / bar";if(key==="shop"&&/^(bakery|pastry|confectionery)$/.test(v))return "Boulangerie";if(key==="shop"&&/^(convenience|supermarket|greengrocer|butcher|deli|cheese|wine|alcohol|farm)$/.test(v))return "Commerce de proximité";if(key==="shop"&&/^(hairdresser|beauty|cosmetics)$/.test(v))return "Salon / beauté";if(key==="tourism"&&/^(hotel|guest_house|motel|hostel|apartment|chalet|camp_site)$/.test(v))return "Hôtel / hébergement";if(key==="craft")return "Artisan / dépannage";if(key==="shop"&&/^(car_repair|car|tyres|car_parts)$/.test(v))return "Garage / auto";if(key==="shop")return "Boutique / mode";if(/^(leisure|healthcare)$/.test(key))return "Santé / bien-être";return null}
function defaultKeywords(label){const k=typeInfo(label).kw;return k?k+", meilleur "+k:""}
function applyDetectedType(label){if(!label||$("autoType").dataset.touched)return;$("autoType").value=label;if(!$("autoKeyword").dataset.touched)$("autoKeyword").value=defaultKeywords(label)}
let sessionToken=uid(),suggestTimer=null,suggestItems=[],suggestIdx=-1,suggestSeq=0;
async function googleSuggest(input){
 const body={input,languageCode:"fr",includedRegionCodes:["fr","be","ch","lu","mc"],sessionToken};
 const r=await fetchJson("https://places.googleapis.com/v1/places:autocomplete",{method:"POST",headers:{"Content-Type":"application/json","X-Goog-Api-Key":settings.googleKey.trim()},body:JSON.stringify(body)},12000);
 return (r.suggestions||[]).map(s=>s.placePrediction).filter(Boolean).map(p=>({src:"google",id:p.placeId,main:p.structuredFormat&&p.structuredFormat.mainText&&p.structuredFormat.mainText.text||p.text&&p.text.text||"",secondary:p.structuredFormat&&p.structuredFormat.secondaryText&&p.structuredFormat.secondaryText.text||"",types:p.types||[]}));
}
async function photonSuggest(input){
 const r=await fetchJson("https://photon.komoot.io/api/?lang=fr&limit=8&q="+encodeURIComponent(input),{},12000);
 return (r.features||[]).filter(f=>f.properties&&f.properties.name&&["FR","BE","CH","LU","MC"].includes(String(f.properties.countrycode).toUpperCase())&&f.properties.osm_key!=="place"&&f.properties.osm_key!=="highway"&&f.properties.osm_key!=="boundary").slice(0,6).map(f=>{const p=f.properties;return {src:"osm",main:p.name,secondary:[[p.housenumber,p.street].filter(Boolean).join(" "),[p.postcode,p.city||p.town||p.village].filter(Boolean).join(" ")].filter(Boolean).join(", "),city:p.city||p.town||p.village||"",lat:f.geometry.coordinates[1],lng:f.geometry.coordinates[0],key:p.osm_key,value:p.osm_value,osmType:p.osm_type,osmId:p.osm_id}});
}
function cityFromSecondary(sec){const parts=String(sec||"").split(",").map(x=>x.trim()).filter(Boolean);if(parts.length>=2&&/france|belgique|suisse|luxembourg|monaco/i.test(parts[parts.length-1]))parts.pop();const last=parts[parts.length-1]||"";return last.replace(/^\d{4,5}\s*/,"").trim()}
function closeSuggest(){$("suggest").classList.add("hidden");$("autoName").setAttribute("aria-expanded","false");suggestIdx=-1}
function renderSuggest(){
 const box=$("suggest");
 if(!suggestItems.length){closeSuggest();return}
 box.innerHTML=suggestItems.map((s,i)=>'<button type="button" role="option" id="sg'+i+'" aria-selected="'+(i===suggestIdx)+'" data-sg="'+i+'"><b>'+esc(s.main)+'</b><span>'+esc(s.secondary||"")+'</span></button>').join("")+'<div class="src">'+(suggestItems[0].src==="google"?"Suggestions Google":"Suggestions OpenStreetMap — ajoutez une clé Google pour des résultats plus complets")+'</div>';
 box.classList.remove("hidden");$("autoName").setAttribute("aria-expanded","true");
 box.querySelectorAll("[data-sg]").forEach(b=>b.addEventListener("mousedown",e=>{e.preventDefault();pickSuggestion(suggestItems[Number(b.dataset.sg)])}));
}
function queueSuggest(){
 clearTimeout(suggestTimer);
 const name=$("autoName").value.trim();if(name.length<3){suggestItems=[];closeSuggest();return}
 const q=name+($("autoCity").value.trim()?" "+$("autoCity").value.trim():"");
 suggestTimer=setTimeout(async()=>{const seq=++suggestSeq;try{let items=[];if(hasKey()){try{items=await googleSuggest(q)}catch(e){items=[]}}if(!items.length)items=await photonSuggest(q);if(seq!==suggestSeq)return;suggestItems=items;suggestIdx=-1;renderSuggest()}catch(e){suggestItems=[];closeSuggest()}},hasKey()?280:650);
}
function setPickInfo(){const b=state.biz;$("pickInfo").textContent=b.placeId?"✓ Établissement Google sélectionné : "+(b.pickLabel||b.name):b.osmPick?"✓ Établissement OpenStreetMap sélectionné : "+(b.pickLabel||b.name):""}
function clearPick(){delete state.biz.placeId;delete state.biz.osmPick;delete state.biz.pickLabel;setPickInfo()}
function pickSuggestion(s){
 if(!s)return;closeSuggest();clearPick();
 $("autoName").value=s.main;
 const city=s.city||cityFromSecondary(s.secondary);if(city)$("autoCity").value=city;
 state.biz.pickLabel=s.main+(s.secondary?" — "+s.secondary:"");
 if(s.src==="google"){state.biz.placeId=s.id;applyDetectedType(typeFromGoogle(s.types))}
 else{state.biz.osmPick={lat:s.lat,lng:s.lng,key:s.key,value:s.value,osmType:s.osmType,osmId:s.osmId};applyDetectedType(typeFromOsm(s.key,s.value))}
 setPickInfo();persistLocal();
 if($("autoCity").value.trim())setTimeout(runAuto,60);else $("autoCity").focus();
}
async function placeDetails(id){
 const r=await fetchJson("https://places.googleapis.com/v1/places/"+encodeURIComponent(id)+"?languageCode=fr&regionCode=FR&sessionToken="+encodeURIComponent(sessionToken),{headers:{"X-Goog-Api-Key":settings.googleKey.trim(),"X-Goog-FieldMask":DETAIL_FIELDS}},20000);
 sessionToken=uid();return r;
}
function renderPlaceChoice(){
 const box=$("placeChoice"),d=state.data||{},c=(d.placeCandidates||[]);
 if(c.length<2||!d.place){box.classList.add("hidden");box.innerHTML="";return}
 box.classList.remove("hidden");
 box.innerHTML='<h2>Est-ce le bon établissement ?</h2><p class="muted">Google a trouvé plusieurs fiches proches. Si l\'analyse ne porte pas sur le bon commerce, choisissez-le et relancez.</p>'+c.map(x=>'<div class="choice'+(x.id===d.place.id?" cur":"")+'"><span><b>'+esc(x.name)+'</b><br><span class="muted">'+esc(x.address||"")+(x.rating!=null?" · "+fr1(x.rating)+"/5 ("+(x.count||0)+" avis)":"")+'</span></span>'+(x.id===d.place.id?'<span class="badge b-ok">Analysé</span>':'<button class="btn" data-repick="'+esc(x.id)+'">Analyser celui-ci</button>')+'</div>').join("");
 box.querySelectorAll("[data-repick]").forEach(b=>b.onclick=()=>{const x=c.find(y=>y.id===b.dataset.repick);state.biz.placeId=x.id;state.biz.pickLabel=x.name+" — "+(x.address||"");setPickInfo();runAuto()});
}
function keywordList(type,city){
 let raw=$("autoKeyword").value.split(/[,;\n]/).map(s=>s.trim()).filter(Boolean);
 const base=typeInfo(type).kw||type.toLowerCase();
 if(!raw.length)raw=[base,"meilleur "+base];
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
function matchBiz(row,name,siteHost){if(siteHost&&row.host&&(row.host===siteHost||row.host.endsWith("."+siteHost)))return "site";const t=norm(row.title+" "+row.url.replace(/[-_/]/g," "));const tk=toks(name);return tk.length&&tk.every(w=>t.includes(w))?"mention":null}
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
function aiMentions(text,name){const t=norm(text),tk=toks(name);return tk.length?tk.every(w=>t.includes(w)):false}
function aiRank(text,name){const lines=String(text).split(/\n+/).filter(l=>/^\s*(\d+[.)]|[-*•])\s+/.test(l));const i=lines.findIndex(l=>aiMentions(l,name));return i>=0?i+1:null}

/* Réseaux sociaux : site du commerce + OpenStreetMap + recherche Bing ciblée */
const NETS=[["Facebook","facebook.com"],["Instagram","instagram.com"],["TikTok","tiktok.com"],["YouTube","youtube.com"],["Snapchat","snapchat.com"]];
function netOf(host){host=String(host||"").replace(/^(www|m|fr-fr|fr)\./,"");const n=NETS.find(([,d])=>host===d||host.endsWith("."+d)||(d==="youtube.com"&&host==="youtu.be")||(d==="facebook.com"&&host==="fb.com"));return n?n[0]:null}
function profileOk(u){try{const x=new URL(u);return !/\/(sharer|share|intent|dialog|plugins|login|hashtag|explore|search|watch\?)/i.test(x.pathname+x.search)&&x.pathname.length>1}catch(e){return false}}
async function socialScan(name,city,known){
 const found={};(known||[]).forEach(s=>{const n=netOf(hostOf(s.url))||s.net;if(n&&NETS.some(x=>x[0]===n)&&!found[n])found[n]={url:s.url,src:s.src||"site"}});
 const q='"'+name+'" '+city+' (site:facebook.com OR site:instagram.com OR site:tiktok.com OR site:youtube.com OR site:snapchat.com)';
 let rows=[],engine="";try{const r=await bingSearch(q);rows=r.rows;engine=r.engine}catch(e){}
 const tk=toks(name);
 rows.forEach(r=>{const n=netOf(r.host);if(!n||found[n]||!profileOk(r.url))return;const t=norm(r.title+" "+decodeURIComponent(r.url).replace(/[-_./]/g," "));const hit=tk.filter(w=>t.includes(w)).length;if(tk.length&&hit>=Math.max(1,Math.ceil(tk.length*0.6)))found[n]={url:r.url,src:"recherche",title:r.title}});
 return {found,engine,checked:NETS.map(n=>n[0])};
}
/* ---------- Audit automatique ---------- */
let steps=[];
function setStep(id,status,title,detail,link){let s=steps.find(x=>x.id===id);if(!s){s={id};steps.push(s)}Object.assign(s,{status,title,detail:detail||"",link:link||null});renderAutoSteps(steps)}
/* Erreurs Google et réseau traduites en consignes claires */
function frErr(e){
 const m=String(e&&e.message||e||"");const url=(m.match(/https:\/\/console\.(?:developers|cloud)\.google\.com\/[^\s"']+/)||[])[0]||"";
 if(/has not been used|is disabled|SERVICE_DISABLED|API_NOT_ACTIVATED|not been enabled/i.test(m)){const api=/generativelanguage|generative language/i.test(m+url)?"Generative Language API (Gemini)":/pagespeed/i.test(m+url)?"PageSpeed Insights API":"Places API (New)";return {code:"disabled",text:"« "+api+" » n’est pas encore activée dans votre projet Google. Touchez « Activer l’API », puis « Activer », attendez 2 minutes et relancez l’audit.",link:{href:url||(api.startsWith("Places")?"https://console.cloud.google.com/apis/library/places.googleapis.com":api.startsWith("Generative")?"https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com":"https://console.cloud.google.com/apis/library/pagespeedonline.googleapis.com"),label:"Activer l’API"}}}
 if(/API keys are not supported|Expected OAuth2|CREDENTIALS_MISSING|ACCESS_TOKEN_TYPE_UNSUPPORTED/i.test(m))return {code:"badkey",text:WRONG_KEY_MSG,link:{href:"#settings",label:"Ouvrir les réglages"}};
 if(/are blocked|API_KEY_SERVICE_BLOCKED/i.test(m)){const api=/generativelanguage|generative language/i.test(m)?"Generative Language API (Gemini)":/pagespeed/i.test(m)?"PageSpeed Insights API":"Places API (New)";return {code:"blocked",text:"Votre clé n’a pas le droit d’utiliser « "+api+" ». Dans Google Cloud → Identifiants, ouvrez la clé, cochez « "+api+" » dans « Restrictions relatives aux API », puis Enregistrer (prise en compte en 2 à 5 minutes).",link:{href:"https://console.cloud.google.com/apis/credentials",label:"Modifier la clé"}}}
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
}
function setAuto(k,status,evidence,source){state.auto[k]={status,evidence,source:source||"",at:today()};if(status==="ok"||status==="issue"){state.checks[k]=true;state.issues[k]=status==="issue"}}
let running=false;
async function runAuto(){
 if(running)return;
 const name=$("autoName").value.trim(),city=$("autoCity").value.trim();let type=$("autoType").value;
 if(!name||!city){toast("Renseignez le nom du commerce et la ville.");($("autoName").value?$("autoCity"):$("autoName")).focus();return}
 running=true;document.body.classList.add("scanning");closeSuggest();$("runAuto").disabled=true;$("runAuto").textContent="Analyse en cours…";$("progDetails").open=true;$("progTitle").textContent="Analyse en cours…";$("progDetails").scrollIntoView({behavior:"smooth",block:"start"});
 steps=[];const data={fetchedAt:nowLabel(),steps};const findings=[];let googleBlocked=null;
 Object.keys(state.auto).forEach(k=>{const a=state.auto[k];if(a&&(a.status==="ok"||a.status==="issue")){delete state.checks[k];delete state.issues[k]}});state.auto={};
 state.biz.name=name;state.biz.city=city;state.biz.date=today();
 let site=$("autoSite").value.trim();
 try{
  /* 1. Ville */
  setStep("geo","run","Localisation");
  let center=null;
  if(state.biz.osmPick){center={lat:state.biz.osmPick.lat,lng:state.biz.osmPick.lng,label:"Position de l'établissement choisi"};setStep("geo","ok","Établissement localisé",state.biz.pickLabel||"")}
  else{try{center=await nominatimCity(city);setStep("geo",center?"ok":"warn",center?"Ville localisée":"Ville introuvable sur OpenStreetMap",center?center.label:"Les recherches se feront sans centre géographique.")}catch(e){setStep("geo","warn","Localisation indisponible",e.message)}}
  data.center=center;
  /* 2. Fiche Google */
  let place=null;
  if(hasKey()){
   setStep("place","run","Recherche de la fiche Google");
   try{
    let list=[];try{list=await placesSearch(name+" "+city,PLACE_FIELDS,5,center)}catch(e){if(!state.biz.placeId)throw e}
    if(state.biz.placeId){place=list.find(p=>p.id===state.biz.placeId)||await placeDetails(state.biz.placeId)}
    else place=pickPlace(list,name,city);
    data.place=place;
    const cands=list.filter(p=>p.id);if(place&&!cands.some(p=>p.id===place.id))cands.unshift(place);
    data.placeCandidates=cands.slice(0,5).map(p=>({id:p.id,name:p.displayName&&p.displayName.text,address:p.formattedAddress,rating:p.rating,count:p.userRatingCount}));
    if(place){
     setStep("place","ok","Fiche Google trouvée : "+(place.displayName&&place.displayName.text),(place.formattedAddress||"")+(state.biz.placeId?" · sélection exacte":" · meilleure correspondance"));
     const pl=place.location&&{lat:place.location.latitude,lng:place.location.longitude};
     const dup=list.filter(p=>p.id!==place.id&&similar(p.displayName&&p.displayName.text,place.displayName&&place.displayName.text||name)&&distKm(pl,p.location&&{lat:p.location.latitude,lng:p.location.longitude})<1);data.duplicates=dup.map(p=>({name:p.displayName&&p.displayName.text,address:p.formattedAddress,url:p.googleMapsUri}));
     const det=typeFromGoogle([place.primaryType,...(place.types||[])]);if(det&&!$("autoType").dataset.touched&&det!==type){type=det;$("autoType").value=det;if(!$("autoKeyword").dataset.touched)$("autoKeyword").value=defaultKeywords(det)}
    }else setStep("place","warn","Aucune fiche Google trouvée","Vérifiez l'orthographe ou choisissez le commerce dans les suggestions en tapant son nom.");
   }catch(e){const f=frErr(e);googleBlocked=f.code;setStep("place","err",f.code==="disabled"?"Fiche Google : API à activer":f.code==="badkey"||f.code==="referer"?"Fiche Google : clé à corriger":"Fiche Google non disponible",f.text,f.link)}
  }else setStep("place","skip","Fiche Google non analysée","Ajoutez une clé Google dans Réglages pour obtenir note, avis, photos et concurrents.");
  state.biz.type=type;
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
   setAuto("0-10",ph&&own>=Math.min(4,ph)?"ok":"issue",ph?own+" photo(s) du propriétaire parmi les "+ph+" photos que Google met en avant"+(own<4?" : la fiche est surtout illustrée par les clients.":"."):"Aucune photo sur la fiche.","Google Places, "+data.fetchedAt);
   if(ph&&own<3)findings.push({sev:2,text:"Sur les "+ph+" photos que Google met en avant, seulement "+own+" vien"+(own>1?"nent":"t")+" du propriétaire : l’image du commerce dépend des photos de clients."});
   setStep("photos","run","Récupération des photos de la fiche");
   try{data.photoList=await photoUris(p,6);setStep("photos",data.photoList.length?"ok":"warn",data.photoList.length?data.photoList.length+" photos récupérées · "+own+" / "+ph+" publiées par le propriétaire":"Photos non disponibles","Les photos s’affichent dans les résultats et le rapport.")}catch(e){setStep("photos","warn","Photos non disponibles",frErr(e).text)}
   setAuto("0-4",ph<5?"issue":"info",ph<5?"Seulement "+ph+" photo(s) visible(s) via Google.":"Au moins "+ph+" photos publiées (Google en renvoie 10 au maximum). Récence et qualité à contrôler visuellement.",src);
   if(ph<5)findings.push({sev:2,text:"Très peu de photos sur la fiche Google ("+ph+")."});
   const rv=(p.reviews||[]).map(r=>({rating:r.rating,when:r.relativePublishTimeDescription||"",time:r.publishTime||"",text:(r.text&&r.text.text||r.originalText&&r.originalText.text||"").slice(0,280)}));
   data.reviews=rv;
   const last=rv.map(r=>Date.parse(r.time)).filter(Boolean).sort((a,b)=>b-a)[0];const daysSince=last?Math.round((Date.now()-last)/864e5):null;data.daysSinceReview=daysSince;
   const rProb=[];if(p.rating!=null&&p.rating<4.2)rProb.push("note de "+fr1(p.rating)+"/5");if(p.userRatingCount!=null&&p.userRatingCount<50)rProb.push("seulement "+p.userRatingCount+" avis");if(daysSince!=null&&daysSince>45)rProb.push("dernier avis il y a "+daysSince+" jours");if(p.rating==null)rProb.push("aucune note");
   setAuto("0-5",rProb.length?"issue":"ok",(p.rating!=null?fr1(p.rating)+"/5 sur "+p.userRatingCount+" avis":"Aucun avis")+(daysSince!=null?" · avis le plus récent il y a "+daysSince+" j":"")+(rProb.length?" — à améliorer : "+rProb.join(", ")+".":"."),src);
   if(rProb.length)findings.push({sev:3,text:"Avis Google : "+rProb.join(", ")+"."});
   const neg=rv.filter(r=>r.rating&&r.rating<=3);
   if(rv.length){setAuto("3-0","info",rv.filter(r=>r.rating>=4).length+" avis positifs parmi les "+rv.length+" plus pertinents (extraits dans le rapport).",src);setAuto("3-1",neg.length?"issue":"info",neg.length?neg.length+" avis à 3 étoiles ou moins parmi les "+rv.length+" plus pertinents : critiques à lire dans le rapport.":"Aucun avis négatif parmi les "+rv.length+" plus pertinents.",src)}
   const st=p.businessStatus||"";setAuto("0-9",st&&st!=="OPERATIONAL"?"issue":"ok",st==="OPERATIONAL"?"Fiche active (ouverte).":st==="CLOSED_TEMPORARILY"?"Fiche marquée « fermée temporairement ».":st==="CLOSED_PERMANENTLY"?"Fiche marquée « définitivement fermée ».":"Statut non communiqué.",src);
   if(st&&st!=="OPERATIONAL")findings.push({sev:3,text:"Google affiche le commerce comme fermé ("+st.toLowerCase().replace(/_/g," ")+")."});
   setAuto("0-8",(data.duplicates||[]).length?"issue":"ok",(data.duplicates||[]).length?"Fiche(s) similaire(s) à proximité : "+data.duplicates.map(d=>d.name).join(", ")+".":"Aucun doublon évident dans les résultats.",src);
   if((data.duplicates||[]).length)findings.push({sev:2,text:"Une ou plusieurs fiches Google en double semblent exister ("+data.duplicates.map(d=>d.name).join(", ")+")."});
   if(p.editorialSummary&&p.editorialSummary.text)setAuto("0-2","info","Résumé Google : « "+p.editorialSummary.text+" ». Description du propriétaire et lien de réservation à vérifier.",src);
   const serv=[p.reservable&&"réservation",p.delivery&&"livraison",p.takeout&&"à emporter",p.dineIn&&"sur place"].filter(Boolean);if(serv.length)data.services=serv;
  }
  /* 3. OpenStreetMap */
  if(center){setStep("osm","run","Recherche OpenStreetMap");
   try{const o=await osmLookup(name,data.loc||center,type);data.osm=o;const t=o.me&&o.me.tags||{};
    if(!site&&(t.website||t["contact:website"]))site=t.website||t["contact:website"];
    const socials=[["Facebook",t["contact:facebook"]||t.facebook],["Instagram",t["contact:instagram"]||t.instagram],["TikTok",t["contact:tiktok"]]].filter(x=>x[1]);data.socials=socials.map(s=>({net:s[0],url:s[1]}));
    if(!place&&o.me){state.biz.phone=state.biz.phone||t.phone||t["contact:phone"]||"";state.biz.address=state.biz.address||[t["addr:housenumber"],t["addr:street"],t["addr:postcode"],t["addr:city"]].filter(Boolean).join(" ");if(t.opening_hours){data.hours=[t.opening_hours];setAuto("0-0","info","Horaires OpenStreetMap : "+t.opening_hours+". À comparer avec la fiche Google.","OpenStreetMap")}}
    if(socials.length)setAuto("2-0","info","Réseaux déclarés sur OpenStreetMap : "+socials.map(s=>s[0]).join(", ")+". Activité à vérifier.","OpenStreetMap");
    setStep("osm",o.me?"ok":"warn",o.me?"Commerce présent sur OpenStreetMap":"Commerce absent d'OpenStreetMap",(o.me?(o.me.tags&&(o.me.tags.website||o.me.tags["contact:website"])?"Site web trouvé. ":""):"Une fiche OpenStreetMap alimente Apple Plans et de nombreuses applis. ")+(o.compError?"Commerces voisins non chargés : serveur saturé, réessayez plus tard.":o.competitors.length+" commerce(s) similaire(s) à proximité."));
   }catch(e){setStep("osm","warn","OpenStreetMap indisponible",frErr(e).text)}}
  /* 4. Visibilité locale sur plusieurs recherches + concurrents */
  const queries=keywordList(type,city);state.biz.keyword=$("autoKeyword").value.trim()||queries.map(q=>q.replace(new RegExp("\\s*"+rxEscape(city)+"$","i"),"")).join(", ");
  if(hasKey()){
   data.rankings=[];const myId=place&&place.id;const agg={};
   if(googleBlocked&&["disabled","badkey","referer","billing"].includes(googleBlocked))setStep("rank","skip","Positions et concurrents Google non mesurés","Ils seront analysés dès que la clé Google fonctionnera.");
   else for(const [qi,q] of queries.entries()){
    setStep("rank"+qi,"run","Position sur « "+q+" »");
    try{const list=await placesSearch(q,RANK_FIELDS,20,data.loc||center);
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
    setAuto("3-5",top3.length===R.length?"ok":"issue","Top 3 sur "+top3.length+" recherche(s) sur "+R.length+" · "+R.map(r=>"« "+r.query+" » : "+(r.rank?"n° "+r.rank:"absent")).join(" · ")+" (Google Places, indicatif).","Google Places, "+data.fetchedAt);
    const comps=Object.values(agg).sort((a,b)=>b.hits-a.hits||a.bestRank-b.bestRank).slice(0,8);data.competitors=comps;
    if(found.length<R.length){const miss=R.filter(r=>!r.rank);findings.push({sev:3,text:"Le commerce n'apparaît pas dans les "+miss[0].total+" premiers résultats Google sur "+miss.map(r=>"« "+r.query+" »").join(", ")+(comps.length?" — on y trouve notamment "+comps.slice(0,3).map(c=>c.name).join(", "):"")+"."})}
    const behind=found.filter(r=>r.rank>3);if(behind.length)findings.push({sev:2,text:"Sur "+behind.map(r=>"« "+r.query+" » (n° "+r.rank+")").join(", ")+", le commerce est devancé par "+behind[0].rows.filter(x=>x.rank<behind[0].rank).slice(0,3).map(x=>x.name).join(", ")+"."});
    if(comps.length>=3){const med=a=>{a=a.filter(x=>x!=null).sort((x,y)=>x-y);return a.length?a[Math.floor(a.length/2)]:null};const mR=med(comps.map(c=>c.rating)),mC=med(comps.map(c=>c.count||0)),mP=med(comps.map(c=>c.photos));data.median={rating:mR,count:mC,photos:mP};
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
    setStep("grid",g.top3>=6?"ok":"warn","Top 3 depuis "+g.top3+" point(s) sur "+g.total+" · visible depuis "+g.found+" / "+g.total,"Points espacés de 1,5 km autour du commerce.");
    setAuto("3-5",(state.auto["3-5"]&&state.auto["3-5"].status==="issue")||g.top3<6?"issue":"ok",(state.auto["3-5"]?state.auto["3-5"].evidence+" ":"")+"Carte de visibilité : top 3 depuis "+g.top3+" / "+g.total+" points autour du commerce.","Google Places, "+data.fetchedAt);
    if(g.top3<g.total)findings.push({sev:g.top3<=3?3:2,text:"Carte de visibilité sur « "+gq+" » : le commerce n’est dans le top 3 que depuis "+g.top3+" point(s) sur "+g.total+" autour de lui"+(g.found<g.total?", et il est invisible (hors des 20 premiers) depuis "+(g.total-g.found)+" point(s)":"")+"."});
   }catch(e){const f=frErr(e);setStep("grid","warn","Carte de visibilité non mesurée",f.text,f.link)}
  }
  /* 4 ter. Bing (et moteurs alimentés par Bing : DuckDuckGo, Copilot, Ecosia) */
  {const siteHost=hostOf((normalizeUrl(site)||{}).href||"");const kq=queries[0],bq=name+" "+city;
   setStep("bing","run","Recherche sur Bing","« "+kq+" » et « "+bq+" »");
   const [rk,rb]=await Promise.allSettled([bingSearch(kq),bingSearch(bq)]);
   const mk=(r,q)=>{if(r.status!=="fulfilled")return null;const rows=r.value.rows.slice(0,10).map((x,i)=>({...x,pos:i+1,match:matchBiz(x,name,siteHost)}));const hit=rows.find(x=>x.match);return {query:q,engine:r.value.engine,rows,pos:hit?hit.pos:null,hitType:hit?hit.match:null}};
   const K=mk(rk,kq),B=mk(rb,bq);data.bing={keyword:K,brand:B,fetchedAt:nowLabel()};
   if(K||B){
    const dirs=[...new Set(((K&&K.rows)||[]).map(x=>x.host).filter(h=>/tripadvisor|pagesjaunes|restaurantguru|yelp|thefork|lafourchette|facebook|instagram|petitfute|google|booking|mappy|justacote|118712|ville-data|lacarte/i.test(h)))].slice(0,6);data.bing.directories=dirs;
    const brandOk=B&&B.pos&&B.pos<=3;const kwOk=K&&K.pos&&K.pos<=5;
    setAuto("3-6",brandOk&&kwOk?"ok":"issue",(K?"« "+kq+" » : "+(K.pos?"n° "+K.pos+(K.hitType==="site"?" (site officiel)":" (mention)"):"absent des 10 premiers")+". ":"")+(B?"Recherche du nom : "+(B.pos?"n° "+B.pos:"absent des 10 premiers")+".":""),(K||B).engine+", "+data.bing.fetchedAt);
    if(K&&!K.pos)findings.push({sev:2,text:"Sur Bing (qui alimente aussi DuckDuckGo et Copilot), le commerce n’apparaît pas dans les 10 premiers résultats pour « "+kq+" »"+(dirs.length?" ; Bing y met en avant "+dirs.slice(0,3).join(", "):"")+"."});
    if(B&&!B.pos)findings.push({sev:3,text:"Même en cherchant son nom sur Bing (« "+bq+" »), le commerce n’apparaît pas dans les 10 premiers résultats."});
    setStep("bing",K&&K.pos||B&&B.pos?"ok":"warn",(K?"« "+kq+" » : "+(K.pos?"n° "+K.pos:"absent du top 10"):"")+(B?" · nom : "+(B.pos?"n° "+B.pos:"absent du top 10"):""),(K||B).engine);
   }else setStep("bing","warn","Bing non mesuré","Le service de lecture est saturé : réessayez dans un instant.");
  }
  /* 5. Site web : Lighthouse + lecture du contenu + capture + domaine (en parallèle, sans clé) */
  const u=normalizeUrl(site);
  const compSites=hasKey()&&$("autoCompSpeed").checked?(data.competitors||[]).filter(c=>normalizeUrl(c.website)).slice(0,3):[];
  if(compSites.length)setStep("psic","run","Vitesse des sites concurrents",compSites.map(c=>c.name).join(", "));
  const compJobs=compSites.map(c=>pageSpeed(normalizeUrl(c.website).href,["performance"]).then(r=>{c.perf=r.scores.perf;c.lcp=r.lab.lcp}).catch(()=>{c.perf=null}));
  if(!u){setAuto("1-0","issue","Aucun site web trouvé (fiche Google et OpenStreetMap).","Audit automatique, "+data.fetchedAt);findings.push({sev:3,text:"Aucun site web n'est associé au commerce."+(compSites.length?" "+compSites.length+" des concurrents principaux en ont un.":"")});setStep("psi","warn","Pas de site web à analyser","Aucun site trouvé : c'est en soi une opportunité.")}
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
   if(H||P)setAuto("1-4",seoProbs.length?"issue":"ok",(P&&P.scores.seo!=null?"SEO technique "+P.scores.seo+"/100 · ":"")+(H&&H.title?"titre « "+H.title.slice(0,70)+" »":"")+(seoProbs.length?" · à corriger : "+seoProbs.join(", "):" · titre, description et H1 présents"),H?srcH:srcP);
   if(seoProbs.length)findings.push({sev:2,text:"Référencement du site : "+seoProbs.join(", ")+"."});
   /* Suivi publicitaire */
   const track=[...new Set([...(H?H.tracking:[]),...(P?P.tracking:[])])];data.tracking=track;
   if(H||P){const meta=track.includes("Pixel Meta");setAuto("1-8",meta?"ok":"issue",track.length?"Outils détectés : "+track.join(", ")+(meta?"":" · Pixel Meta absent."):"Aucun outil de mesure (Pixel Meta, Google Analytics) détecté.",H?srcH:srcP);
    if(!meta)findings.push({sev:1,text:"Aucun Pixel Meta détecté : les futures publicités Facebook / Instagram ne pourraient pas être mesurées."})}
   if(H){
    setStep("html","ok","Site lu : "+(H.title?"« "+H.title.slice(0,60)+" »":"sans titre"),[H.socials.length?"Réseaux : "+H.socials.map(s=>s.net).join(", "):"aucun lien vers les réseaux",H.tel.length?"bouton d'appel":"pas de bouton d'appel",H.booking.length?"réservation : "+H.booking.join(", "):"pas de lien de réservation",H.cms?"site "+H.cms:""].filter(Boolean).join(" · "));
    /* Cohérence avec la fiche */
    if(H.phoneOnSite!=null||H.hoursOnSite||H.addressOnSite){const miss=[H.phoneOnSite===false&&"le téléphone de la fiche",!H.hoursOnSite&&"les horaires",!H.addressOnSite&&"l'adresse"].filter(Boolean);
     setAuto("1-2",miss.length?"issue":"ok",miss.length?"Absent(s) de la page d'accueil : "+miss.join(", ")+".":"Téléphone, horaires et adresse visibles sur le site et cohérents avec la fiche.",srcH);
     setAuto("4-2",miss.length?"issue":"ok",miss.length?"Infos pratiques incomplètes sur le site : "+miss.join(", ")+".":"Infos pratiques claires sur la page d'accueil.",srcH);
     if(H.phoneOnSite===false)findings.push({sev:2,text:"Le numéro de téléphone public du commerce ("+(place?"fiche Google":"OpenStreetMap")+") n'apparaît pas sur la page d'accueil du site."})}
    /* Boutons d'action */
    const ctas=[H.tel.length&&"appel",H.whatsapp&&"WhatsApp",H.booking.length&&"réservation/commande ("+H.booking.join(", ")+")"].filter(Boolean);
    setAuto("1-3",ctas.length?"ok":"issue",ctas.length?"Boutons d'action présents : "+ctas.join(", ")+".":"Aucun bouton d'appel cliquable, WhatsApp ou lien de réservation sur la page d'accueil.",srcH);
    if(!ctas.length)findings.push({sev:2,text:"Le site n'a ni bouton d'appel cliquable, ni WhatsApp, ni lien de réservation : les visiteurs mobiles doivent chercher comment vous contacter."});
    /* Données structurées */
    const local=H.ldTypes.filter(t=>LOCAL_TYPES.test(t));
    setAuto("1-5",local.length?"ok":"issue",local.length?"Données structurées présentes : "+local.join(", ")+".":"Aucune donnée structurée LocalBusiness (adresse, horaires) pour Google et les IA"+(H.ldTypes.length?" (types présents : "+H.ldTypes.slice(0,4).join(", ")+")":"")+".",srcH);
    if(!local.length)findings.push({sev:1,text:"Le site ne fournit pas de données structurées « commerce local » : Google et les assistants IA lisent moins bien ses informations."});
    /* Réseaux sociaux */
    const allSoc=[...(data.socials||[])];H.socials.forEach(s=>{if(!allSoc.some(x=>x.net===s.net))allSoc.push(s)});data.socials=allSoc;
    const hasFbIg=allSoc.some(s=>/Facebook|Instagram/.test(s.net));
    setAuto("2-0",hasFbIg?"ok":"issue",hasFbIg?"Comptes liés : "+allSoc.map(s=>s.net).join(", ")+". Activité récente à vérifier.":"Aucun lien vers Facebook ou Instagram depuis le site.",srcH);
    if(!hasFbIg)findings.push({sev:2,text:"Le site ne renvoie vers aucun compte Facebook ou Instagram."});
    if(allSoc.some(s=>s.net==="TikTok"))setAuto("2-1","ok","Compte TikTok lié depuis le site.",srcH);
    setAuto("2-4",allSoc.length?"info":"issue",allSoc.length?"Liens réseaux trouvés : "+allSoc.map(s=>s.net).join(", ")+". Vérifier nom, logo et coordonnées identiques.":"Aucun réseau lié : identité en ligne dispersée.",srcH);
    if(H.menuOnSite)setAuto("0-3","info","Le site présente une carte, des tarifs ou des prestations.",srcH);
    if(H.copyrightYear&&H.copyrightYear<new Date().getFullYear()-1)findings.push({sev:1,text:"La mention © du site indique "+H.copyrightYear+" : le site semble ne pas avoir été mis à jour depuis."});
   }else setStep("html","warn","Contenu du site non lu","Le site bloque peut-être la lecture automatique. "+frErr(rHtml.reason).text);
   const cmsName=(H&&H.cms)||(data.tech.find(t=>/CMS|Ecommerce|Website builder/i.test(t.cat))||{}).name||"";data.cms=cmsName;
   setStep("shot",M?"ok":"warn",M?"Capture mobile réalisée"+(data.tech.length?" · technologies : "+data.tech.slice(0,5).map(t=>t.name).join(", "):""):"Capture non disponible",M?(D&&D.created?"Nom de domaine enregistré en "+new Date(D.created).getFullYear():""):"Service de capture saturé : réessayez plus tard.");
   if(!M&&D&&D.created)setStep("dom","ok","Nom de domaine enregistré en "+new Date(D.created).getFullYear(),D.domain);
  }
  if(compJobs.length){await Promise.all(compJobs);const done=compSites.filter(c=>c.perf!=null);setStep("psic",done.length?"ok":"warn",done.length?"Vitesse comparée avec "+done.length+" site(s) concurrent(s)":"Vitesse des concurrents non mesurée",done.map(c=>c.name+" : "+c.perf+"/100").join(" · "));
   const mine=data.psi&&data.psi.scores.perf;const faster=done.filter(c=>mine!=null&&c.perf>mine);if(mine!=null&&faster.length)findings.push({sev:2,text:faster.length+" concurrent(s) sur "+done.length+" ont un site plus rapide sur mobile ("+faster.map(c=>c.name+" : "+c.perf+"/100").join(", ")+", contre "+mine+"/100)."});}
  /* 5 bis. Réseaux sociaux */
  setStep("social","run","Présence sur les réseaux sociaux","Facebook, Instagram, TikTok, YouTube, Snapchat");
  try{const known=[...(data.socials||[]).map(s=>({...s,src:"site ou OpenStreetMap"}))];const sc=await socialScan(name,city,known);data.social=sc;
   const F=sc.found,list=NETS.map(n=>n[0]).filter(n=>F[n]);
   setAuto("2-0",F.Facebook||F.Instagram?"ok":"issue",(F.Facebook||F.Instagram)?"Comptes trouvés : "+list.join(", ")+". Fréquence des publications à vérifier.":"Aucun compte Facebook ni Instagram trouvé (site, OpenStreetMap et recherche Bing).","Recherche des réseaux, "+data.fetchedAt);
   setAuto("2-1",F.TikTok?"ok":"info",F.TikTok?"Compte TikTok trouvé.":"Aucun compte TikTok trouvé : à envisager si la clientèle visée y est présente.","Recherche des réseaux, "+data.fetchedAt);
   setAuto("2-4",list.length?"info":"issue",list.length?"Réseaux trouvés : "+list.join(", ")+". Vérifier nom, logo et coordonnées identiques.":"Aucun réseau trouvé : identité en ligne absente.","Recherche des réseaux, "+data.fetchedAt);
   if(!F.Facebook&&!F.Instagram)findings.push({sev:3,text:"Aucun compte Facebook ni Instagram n’a été trouvé pour le commerce : ce sont pourtant les premiers réseaux consultés avant de choisir un commerce local."});
   else{const miss=["Instagram","Facebook","TikTok"].filter(n=>!F[n]);if(miss.length)findings.push({sev:1,text:"Réseaux trouvés : "+list.join(", ")+". Absent de : "+miss.join(", ")+"."})}
   setStep("social",list.length?"ok":"warn",list.length?"Réseaux trouvés : "+list.join(", "):"Aucun réseau social trouvé",NETS.map(n=>n[0]).filter(n=>!F[n]).length?"Non trouvés : "+NETS.map(n=>n[0]).filter(n=>!F[n]).join(", "):"");
  }catch(e){setStep("social","warn","Réseaux sociaux non vérifiés",frErr(e).text)}
  /* 6. Visibilité IA : Gemini avec Recherche Google, puis questions prêtes pour les autres assistants */
  $("campaignBusiness").value=name;$("campaignCity").value=city;$("campaignType").value=typeInfo(type).kw||type;$("campaignService").value="";
  if(!state.campaignPrompts.length||state.campaign.name!==name)getCampaignPrompts(true);
  if(hasKey()){
   const kw=typeInfo(type).kw||type.toLowerCase();
   const QS=[["Découverte locale","Je cherche "+(/^[aeiouyhé]/i.test(kw)?"un ":"un ")+kw+" à "+city+". Quels établissements me recommandes-tu ? Réponds avec une liste numérotée."],["Meilleur choix","Quel est le meilleur "+kw+" à "+city+" et dans les environs ? Donne une liste numérotée de 5 établissements maximum avec la raison."],["Marque exacte","Que sais-tu de « "+name+" » à "+city+" ? Adresse, horaires, avis, site officiel et réseaux sociaux."]];
   setStep("ai","run","Test IA : Gemini avec Recherche Google","3 questions de clients");
   state.aiTests=state.aiTests.filter(t=>!t.auto);const out=[];let aiErr=null;
   for(const [kind,q] of QS){try{const r=await geminiAsk(q);const neg=/(pas (pu )?trouv|aucune information|pas d.information|ne (dispose|trouve) pas|introuvable)/i.test(r.text);const present=aiMentions(r.text,name)&&!(kind==="Marque exacte"&&neg);const rank=kind!=="Marque exacte"?aiRank(r.text,name):null;const comps=(data.competitors||[]).filter(c=>c.name&&aiMentions(r.text,c.name)).map(c=>c.name);
     out.push({kind,q,present,rank,partial:kind==="Marque exacte"&&neg,competitors:comps,sources:r.sources.slice(0,5),excerpt:r.text.slice(0,700),model:r.model});
     state.aiTests.push({auto:true,platform:"Google Gemini",date:today(),prompt:q,presence:present?"yes":(kind==="Marque exacte"&&neg?"partial":"no"),rank:rank?String(rank):"",competitors:comps.join(", "),source:(r.sources[0]||{}).uri||"",notes:"Test automatique ("+r.model+" + Recherche Google) · "+kind,campaignId:"",campaignPromptId:""});
    }catch(e){aiErr=e;break}}
   data.aiAuto=out;
   if(out.length){const yes=out.filter(o=>o.present).length;setStep("ai",yes?"ok":"warn","Gemini cite le commerce dans "+yes+" réponse(s) sur "+out.length,"Les 6 questions pour ChatGPT, Claude, Perplexity… sont prêtes dans « Visibilité IA ».");
    const disc=out.filter(o=>o.kind!=="Marque exacte");if(disc.length&&!disc.some(o=>o.present))findings.push({sev:3,text:"Quand on demande à l’IA de Google (Gemini, avec recherche web) "+(disc[0].competitors.length?"où manger à "+city+", elle recommande "+disc[0].competitors.slice(0,3).join(", ")+", mais jamais le commerce.":"de recommander un établissement à "+city+", elle ne cite pas le commerce.")});
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
 }catch(e){setStep("fatal","err","Erreur inattendue",frErr(e).text)}
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
  return '<div class="kpis">'+kpiBox(ps&&ps.scores.perf!=null?ps.scores.perf+"/100":(hasSite?"—":"Aucun site"),"Vitesse du site (mobile)",ps?scoreColor(ps.scores.perf):(hasSite?"":"bad"))+kpiBox(H?ctas+"<small style=font-size:12px> / 3</small>":"—","Boutons d’action (appel, WhatsApp, réservation)",H?(ctas>=2?"good":ctas?"mid":"bad"):"")+kpiBox(soc,"Réseaux sociaux liés",soc>=2?"good":soc?"mid":"bad")+kpiBox(comp,"Concurrents à moins de 2,5 km","")+'</div>'}
 return '<div class="kpis">'+kpiBox(p&&p.rating!=null?fr1(p.rating)+"/5":"—","Note Google",p&&p.rating!=null?(p.rating>=4.5?"good":p.rating>=4.2?"mid":"bad"):"")+kpiBox(p&&p.userRatingCount!=null?p.userRatingCount:"—","Avis Google",p&&p.userRatingCount!=null?(p.userRatingCount>=100?"good":p.userRatingCount>=50?"mid":"bad"):"")
 +(vis&&vis.n>1?kpiBox(vis.top3+'<small style="font-size:12px"> / '+vis.n+'</small>',"Recherches où il est dans le top 3",vis.top3===vis.n?"good":vis.top3?"mid":"bad"):kpiBox(rk?(rk.rank?rk.rank+'<small style="font-size:12px"> / '+rk.total+'</small>':"Absent"):"—","Position « "+esc(rk?rk.query:"recherche locale")+" »",rk?(rk.rank&&rk.rank<=3?"good":rk.rank&&rk.rank<=10?"mid":"bad"):""))
 +kpiBox(ps&&ps.scores.perf!=null?ps.scores.perf+"/100":(d.fetchedAt&&!normalizeUrl(state.biz.site)?"Aucun site":"—"),"Vitesse du site (mobile)",ps?scoreColor(ps.scores.perf):(d.fetchedAt&&!normalizeUrl(state.biz.site)?"bad":""))+'</div>';
}
function findingsHtml(){const f=(state.data&&state.data.findings)||[];return f.length?'<ul class="findings">'+f.map(x=>'<li>'+esc(x.text)+'</li>').join("")+'</ul>':''}
function strengths(){return keys.filter(k=>state.auto[k]&&state.auto[k].status==="ok"||(!state.auto[k]&&state.checks[k]&&!state.issues[k])).map(k=>{const [gi,ii]=k.split("-").map(Number);return {it:groups[gi].items[ii],ev:state.auto[k]&&state.auto[k].evidence}})}
function siteBlock(){
 const d=state.data||{},ps=d.psi,H=d.html;if(!ps&&!H&&!d.shotUrl)return "";
 const shot=d.shotUrl||(ps&&ps.shot)||"";
 const yes=(ok,t,extra)=>'<li class="'+(ok?"ok":"ko")+'"><span aria-hidden="true">'+(ok?"✓":"✕")+'</span> '+esc(t)+(extra?' <span class="muted">— '+esc(extra)+'</span>':'')+'</li>';
 const track=d.tracking||(ps&&ps.tracking)||[];
 const checks=H?'<ul class="ticks">'+yes(H.viewport,"Adapté aux téléphones")+yes(!(state.biz.site||"").startsWith("http:")&&!H.mixed,"Connexion sécurisée HTTPS")+yes(H.tel.length>0,"Bouton d’appel cliquable")+yes(H.whatsapp,"Contact WhatsApp")+yes(H.booking.length>0,"Réservation ou commande en ligne",H.booking.join(", "))+yes(H.socials.length>0,"Liens vers les réseaux sociaux",H.socials.map(s=>s.net).join(", "))+yes(!!H.title&&!!H.metaDesc,"Titre et description pour Google")+yes(H.hoursOnSite&&H.addressOnSite,"Horaires et adresse visibles")+yes(H.ldTypes.some(t=>LOCAL_TYPES.test(t)),"Données structurées « commerce local »")+yes(track.includes("Pixel Meta"),"Pixel Meta (mesure des publicités)")+'</ul>':'';
 const info=[d.cms&&"Réalisé avec "+d.cms,d.domain&&d.domain.created&&"domaine enregistré en "+new Date(d.domain.created).getFullYear(),H&&H.copyrightYear&&"mention © "+H.copyrightYear,track.length&&"suivi : "+track.join(", ")].filter(Boolean).join(" · ");
 return '<div class="siteblock">'+(shot?'<img class="shot" src="'+esc(shot)+'" alt="Capture du site sur téléphone" loading="lazy">':'')+'<div style="flex:1 1 280px;min-width:0">'
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
   +hbars("Photos du propriétaire","Parmi les 10 photos que Google met en avant",mk(c=>c.ownerPhotos??null,d.ownerPhotos??null),v=>v+" / 10")
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
 return '<div class="kpis">'+kpiBox(p.rating!=null?fr1(p.rating)+"/5":"—","Note",p.rating!=null?(p.rating>=4.5?"good":p.rating>=4.2?"mid":"bad"):"")+kpiBox(p.userRatingCount??"—","Avis",p.userRatingCount!=null?(p.userRatingCount>=100?"good":p.userRatingCount>=50?"mid":"bad"):"")+kpiBox((d.ownerPhotos??"—")+(d.photos!=null?'<small style="font-size:13px"> / '+d.photos+'</small>':""),"Photos du propriétaire",d.ownerPhotos==null?"":d.ownerPhotos>=6?"good":d.ownerPhotos>=3?"mid":"bad")+kpiBox(d.daysSinceReview!=null?d.daysSinceReview+" j":"—","Depuis le dernier avis",d.daysSinceReview==null?"":d.daysSinceReview<=30?"good":d.daysSinceReview<=60?"mid":"bad")+'</div>'
 +'<div class="twocol" style="margin-top:12px"><div class="box"><h3>Informations affichées</h3><ul><li>Catégorie : '+esc((p.primaryTypeDisplayName&&p.primaryTypeDisplayName.text)||p.primaryType||"non communiquée")+'</li><li>Adresse : '+esc(p.formattedAddress||"absente")+'</li><li>Téléphone : '+esc(p.nationalPhoneNumber||"absent")+'</li><li>Site : '+esc(p.websiteUri||"absent")+'</li>'+(d.services?'<li>Services : '+esc(d.services.join(", "))+'</li>':'')+'</ul></div><div class="box"><h3>Horaires</h3>'+((d.hours||[]).length?'<ul class="hours">'+d.hours.map(h=>'<li>'+esc(h)+'</li>').join("")+'</ul>':'<p class="muted">Aucun horaire publié.</p>')+'</div></div>'
 +((d.reviews||[]).length?'<h3 style="margin-top:14px">Avis les plus pertinents selon Google</h3>'+d.reviews.map(r=>'<div class="review"><b aria-label="'+(r.rating||0)+' sur 5">'+"★".repeat(r.rating||0)+"☆".repeat(5-(r.rating||0))+'</b> <span class="muted">'+esc(r.when)+'</span><br>'+esc(r.text||"(sans texte)")+'</div>').join(""):"");
}
function renderAutoSummary(){
 const d=state.data||{};
 $("autoToReport").classList.toggle("hidden",!d.fetchedAt);
 if(!d.fetchedAt){$("autoSummaryCard").classList.add("hidden");$("autoSummary").innerHTML="";return}
 $("autoSummaryCard").classList.remove("hidden");const sc=calc().score;
 $("autoSummary").innerHTML='<h2 style="margin-bottom:14px">'+esc(state.biz.name||"Résultats")+'</h2>'+scoreTile(sc)+kpiRow()+(d.findings&&d.findings.length?'<h3 style="margin-top:22px">Opportunités repérées</h3>'+findingsHtml():'')+(socialBlock(false)?'<h3 style="margin-top:22px">Réseaux sociaux</h3>'+socialBlock(false):'')+(d.place?'<h3 style="margin-top:22px">Photos de la fiche</h3>'+photosBlock():'')+(gridBlock()?'<h3 style="margin-top:22px">Carte de visibilité</h3>'+gridBlock():'')+compBlock(false)+(bingBlock(false)?'<h3 style="margin-top:22px">Visibilité sur Bing</h3>'+bingBlock(false):'')+(aiAutoBlock(false)?'<h3 style="margin-top:22px">Ce que répond l’IA de Google</h3>'+aiAutoBlock(false):'')+((d.psi||d.html)?'<h3 style="margin-top:22px">Le site sur téléphone</h3>'+siteBlock():'')+'<div class="actions" style="margin-top:14px"><button class="btn primary" data-go2="report">Ouvrir le rapport client</button><button class="btn" data-go2="pitch">Rédiger le message</button></div>';
 $("autoSummary").querySelectorAll("[data-go2]").forEach(b=>b.onclick=()=>nav(b.dataset.go2));
}

/* ---------- Blocs d'affichage v5 ---------- */
function socialBlock(forReport){
 const S=(state.data||{}).social;if(!S)return "";
 return '<div class="socials">'+NETS.map(([n])=>{const f=S.found[n];let handle="";if(f){try{handle=decodeURIComponent(new URL(f.url).pathname).replace(/^\/|\/$/g,"").split("/")[0]}catch(e){}}
  return '<div class="soc '+(f?"on":"off")+'"><span class="sname">'+esc(n)+'</span><span class="sstate">'+(f?(forReport?esc(handle?"@"+handle.replace(/^@/,""):"Trouvé"):'<a href="'+esc(safeUrl(f.url))+'" target="_blank" rel="noopener">'+esc(handle?"@"+handle.replace(/^@/,""):"Voir le compte")+'</a>'):"Non trouvé")+'</span></div>'}).join("")+'</div><p class="muted"><small>Recherche sur le site du commerce, OpenStreetMap et Bing. Un compte peut exister sans être trouvé s’il n’est relié nulle part : c’est déjà un signal de faible visibilité. Activité récente à vérifier sur chaque compte.</small></p>';
}
function photosBlock(){
 const d=state.data||{},L=d.photoList||[];if(!d.place)return "";
 const comps=(d.competitors||[]).filter(c=>c.ownerPhotos!=null);const med=comps.length?comps.map(c=>c.ownerPhotos).sort((a,b)=>a-b)[Math.floor(comps.length/2)]:null;
 return '<div class="photohead"><b>'+(d.ownerPhotos??0)+' / '+(d.photos??0)+'</b><span>photos publiées par le propriétaire, parmi celles que Google met en avant'+(med!=null?'. Médiane des concurrents : '+med+' / 10':'')+'.</span></div>'
  +(L.length?'<div class="photostrip">'+L.map(ph=>'<figure><img src="'+esc(ph.uri)+'" alt="Photo de la fiche Google" loading="lazy" referrerpolicy="no-referrer"><figcaption>'+(ph.owner?'Propriétaire':'Client'+(ph.author?' · '+esc(ph.author):''))+'</figcaption></figure>').join("")+'</div>':'');
}
function gridBlock(){
 const g=(state.data||{}).grid;if(!g)return "";
 const cell=pt=>{const r=pt.rank,cls=!pt.ok?"na":r&&r<=3?"g":r&&r<=10?"m":"b";return '<div class="gcell '+cls+(pt.dx===0&&pt.dy===0?" me":"")+'" title="'+(pt.ok?(r?"Position "+r:"Hors des 20 premiers"):"Non mesuré")+'"><b>'+(pt.ok?(r||"20+"):"–")+'</b></div>'};
 return '<div class="gridwrap"><div class="ggrid" role="img" aria-label="Carte de visibilité : top 3 depuis '+g.top3+' points sur '+g.total+'">'+g.points.map(cell).join("")+'</div><div class="gtext"><b>Top 3 depuis '+g.top3+' point'+(g.top3>1?"s":"")+' sur '+g.total+'</b><span>Position du commerce sur « '+esc(g.query)+' » vue depuis 9 points espacés de '+String(g.spacingKm).replace(".",",")+' km autour de lui (le centre est le commerce).</span><span class="glegend"><i class="g"></i>1 à 3 <i class="m"></i>4 à 10 <i class="b"></i>au-delà</span></div></div>';
}
function bingBlock(forReport){
 const B=(state.data||{}).bing;if(!B||(!B.keyword&&!B.brand))return "";
 const one=(x,label)=>x?'<div class="box"><h3>'+esc(label)+'</h3><p class="bigpos '+(x.pos?(x.pos<=3?"g":"m"):"b")+'">'+(x.pos?"n° "+x.pos+(x.hitType==="site"?" (site officiel)":" (mention)"):"Absent du top 10")+'</p><ol class="serp">'+x.rows.slice(0,5).map(r=>'<li class="'+(r.match?"hit":"")+'">'+(forReport?esc(r.title):'<a href="'+esc(safeUrl(r.url))+'" target="_blank" rel="noopener">'+esc(r.title)+'</a>')+'<small>'+esc(r.host)+'</small></li>').join("")+'</ol></div>':"";
 return '<div class="twocol">'+one(B.keyword,"« "+(B.keyword&&B.keyword.query||"")+" »")+one(B.brand,"Recherche du nom")+'</div>'+((B.directories||[]).length?'<p class="muted" style="margin-top:8px">Sites que Bing met en avant sur cette recherche : '+esc(B.directories.join(", "))+'. Être bien présent sur ces annuaires améliore la visibilité sur Bing, DuckDuckGo et Copilot.</p>':'')+'<p class="muted"><small>'+esc((B.keyword||B.brand).engine)+', le '+esc(B.fetchedAt)+'.</small></p>';
}
function aiAutoBlock(forReport){
 const A=(state.data||{}).aiAuto;if(!A||!A.length)return "";
 return '<div class="aiq">'+A.map(o=>'<div class="box"><div class="aihead"><span class="badge '+(o.present?"b-ok":o.partial?"b-mid":"b-bad")+'">'+(o.present?"Cité"+(o.rank?" · n° "+o.rank:""):o.partial?"Infos incomplètes":"Non cité")+'</span><b>'+esc(o.kind)+'</b></div><p class="muted q">« '+esc(o.q)+' »</p>'+(o.competitors.length?'<p><small>Concurrents cités : '+esc(o.competitors.join(", "))+'</small></p>':'')+'<p class="excerpt">'+esc(o.excerpt.replace(/[*#]/g,"").slice(0,forReport?420:600))+(o.excerpt.length>420?"…":"")+'</p>'+(o.sources.length?'<p><small>Sources citées : '+o.sources.map(s=>forReport?esc(s.title||hostOf(s.uri)):'<a href="'+esc(safeUrl(s.uri))+'" target="_blank" rel="noopener">'+esc(s.title||hostOf(s.uri))+'</a>').join(", ")+'</small></p>':'')+'</div>').join("")+'</div><p class="muted"><small>Réponses de Gemini avec Recherche Google ('+esc(A[0].model)+'), le '+esc((state.data||{}).fetchedAt||"")+'. Les réponses des assistants varient selon le moment et la formulation.</small></p>';
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
  ["Photos et vidéos sur mesure","Photos professionnelles et pubs vidéo verticales (15 s et plus, format Reels) au goût du commerce, pour la fiche Google, le site et les réseaux"+(d.ownerPhotos!=null&&d.ownerPhotos<4?", là où l’audit montre peu de photos du propriétaire.":".")],
  ["Réseaux sociaux","Contenus réguliers pour Instagram, Facebook, TikTok et YouTube, avec une identité cohérente partout."],
  ["Site web mobile",normalizeUrl(state.biz.site)?"Améliorer le site existant : vitesse, boutons d’appel et de réservation, infos pratiques et données pour Google et les IA.":"Créer un site mobile simple : infos pratiques, carte, bouton d’appel, liens vers les réseaux."],
  ["Collecte d’avis","Outils simples pour obtenir plus d’avis récents (QR code, message après la visite) et réponses aux avis."],
  ["Présence sur Bing et les assistants IA","Fiches et annuaires cohérents (Bing Places, PagesJaunes, TripAdvisor…) pour être mieux cité par Bing, Gemini, ChatGPT et Copilot."],
  ["Suivi des progrès","Nouvel audit après les actions pour mesurer l’évolution, avec les mêmes indicateurs datés."]];
 const cannot=[
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
  +'<span class="eyebrow">Audit de visibilité en ligne</span><h1>'+esc(b.name||"Commerce à renseigner")+'</h1>'
  +'<div class="meta">'+esc([b.type,b.city&&("à "+b.city)].filter(Boolean).join(" "))+(b.address?" · "+esc(b.address):"")+'<br>Audit du '+esc(frDate(b.date||today()))+(d.fetchedAt?" · données publiques collectées le "+esc(d.fetchedAt):"")+'</div>'
  +scoreTile(totals.score)+kpiRow()
  +(top3.length?'<div class="covertop"><h3>Les 3 constats à retenir</h3><ol>'+top3.map(f=>'<li>'+esc(f.text)+'</li>').join("")+'</ol></div>':'')
  +'<div class="coverfoot"><b>'+esc(sender?sender+", ":"")+esc(line)+'</b>'+(contact?'<span>'+esc(contact)+'</span>':'')+'</div></div>';
 const toc='<div class="toc"><h3>Sommaire</h3><ol><li>Synthèse</li><li>Fiche Google, photos et réseaux sociaux</li><li>Visibilité locale et concurrence</li><li>Visibilité sur Bing</li><li>Visibilité dans les assistants IA</li><li>Site web sur mobile</li><li>Plan d’action</li><li>Ce qu’AffiAds peut apporter</li><li>Méthode et détail des contrôles</li></ol></div>';
 const syn='<p class="lead">'+esc(b.name||"Le commerce")+' obtient un score indicatif de <b>'+(totals.score??"—")+'/100</b> : '+esc(vt.toLowerCase())+'. '+esc(vsub)+' L’analyse porte sur '+totals.n+' contrôles ; '+issues.length+' point'+(issues.length>1?"s":"")+' à améliorer '+(issues.length>1?"ont":"a")+' été identifié'+(issues.length>1?"s":"")+'.</p>'
  +'<div class="twocol"><div class="box good"><h3>Points forts</h3>'+(good.length?'<ul>'+good.slice(0,6).map(g=>'<li><b>'+esc(g.it)+'</b>'+(g.ev?'<br><span class="muted">'+esc(g.ev)+'</span>':'')+'</li>').join("")+'</ul>':'<p class="muted">À confirmer après vérification.</p>')+'</div><div class="box bad"><h3>Opportunités prioritaires</h3>'+(issues.length?'<ul>'+issues.slice(0,6).map(p=>'<li><b>'+esc(p.it)+'</b><br><span class="muted">'+esc(p.reco)+'</span></li>').join("")+'</ul>':'<p class="muted">Aucune priorité relevée.</p>')+'</div></div>'
  +'<h3 style="margin-top:20px">Score par catégorie</h3><div class="catbars">'+gs.map(g=>'<div class="catbar">'+esc(g.title)+' — <b>'+(g.score===null?"non évalué":g.score+"/100")+'</b><div class="bar"><div class="s-'+(scoreColor(g.score)||"good")+'" style="width:'+(g.score||0)+'%"></div></div></div>').join("")+'</div>'
  +((d.findings||[]).length>3?'<h3 style="margin-top:20px">Tous les constats</h3>'+findingsHtml():'')
  +(b.context?'<p><b>Première impression :</b> '+esc(b.context)+'</p>':"");
 const gHtml=(d.place?googleBlock():'<ul><li>Adresse : '+esc(b.address||"non relevée")+'</li><li>Téléphone : '+esc(b.phone||"non relevé")+'</li><li>Note : '+(b.rating!==""&&b.rating!=null&&!isNaN(b.rating)?fr1(b.rating):"non relevée")+' / 5 · Avis : '+esc(b.reviews||"non relevé")+'</li></ul><p class="muted">Ajoutez une clé Google pour analyser la fiche, les avis et les photos.</p>')
  +(d.place?'<h3 style="margin-top:18px">Photos de la fiche</h3>'+photosBlock():'')+(socialBlock(true)?'<h3 style="margin-top:18px">Réseaux sociaux</h3>'+socialBlock(true):((d.socials||[]).length?'<p>Réseaux sociaux liés : '+d.socials.map(s=>esc(s.net)).join(", ")+'.</p>':''));
 const vis=(gridBlock()?'<h3>Carte de visibilité</h3>'+gridBlock():'')+(compBlock(true)||'<p class="muted">Concurrence non analysée : ajoutez une clé Google pour comparer notes, avis et positions.</p>');
 const bing=bingBlock(true)||'<p class="muted">Bing n’a pas pu être interrogé lors de cet audit.</p>';
 const completed=ai.filter(t=>!t.auto&&(t.presence==="yes"||t.presence==="no"));
 const aiHtml=(aiAutoBlock(true)||'<p class="muted">Test automatique non réalisé : ajoutez une clé Google avec Gemini activé.</p>')
  +(completed.length?'<h3 style="margin-top:16px">Tests manuels dans les autres assistants</h3><div class="tablewrap"><table class="t"><thead><tr><th>IA / date</th><th>Question</th><th>Résultat</th></tr></thead><tbody>'+ai.filter(t=>!t.auto).map(t=>'<tr><td>'+esc(t.platform)+'<br>'+esc(t.date)+'</td><td>'+esc(t.prompt)+'</td><td>'+(t.presence==="yes"?"Cité":t.presence==="no"?"Non cité":"Incertain")+(t.rank?" · n° "+esc(t.rank):"")+(t.competitors?"<br><small>Concurrents : "+esc(t.competitors)+"</small>":"")+'</td></tr>').join("")+'</tbody></table></div>':'');
 const siteHtml=(d.psi||d.html||d.shotUrl)?siteBlock():'<p>'+(safeUrl(b.site)?'Site : '+esc(b.site)+' : analyse non réalisée.':'Aucun site web n’a été trouvé pour ce commerce. Un site mobile simple (infos pratiques, carte, bouton d’appel) aide Google, Bing et les assistants IA à le recommander.')+'</p>';
 const buckets=[["Gain rapide","À faire tout de suite"],["Priorité haute","Dans le mois"],["Priorité moyenne","Ensuite"],["À planifier","À planifier"]];
 const plan=issues.length?buckets.map(([lab,title])=>{const its=issues.filter(p=>prioLabel(p)[0]===lab);return its.length?'<h3 style="margin-top:12px">'+esc(title)+'</h3>'+its.map(p=>{const l=prioLabel(p);return '<div class="reco"><b>'+esc(p.it)+'</b>'+esc(p.reco)+(p.evidence?'<br><small>Constat : '+esc(p.evidence)+'</small>':'')+'<div class="tags"><span class="badge '+l[1]+'">'+l[0]+'</span><span class="badge b-auto">Impact '+"●".repeat(p.impact)+"○".repeat(3-p.impact)+'</span><span class="badge b-auto">Effort '+"●".repeat(p.effort)+"○".repeat(3-p.effort)+'</span></div></div>'}).join(""):""}).join(""):"<p>Aucun point signalé.</p>";
 const detail=groups.map((g,gi)=>{const rows=g.items.map((it,ii)=>({it,k:gi+"-"+ii})).filter(x=>state.checks[x.k]||state.issues[x.k]);return rows.length?'<h3>'+esc(g.title)+'</h3><ul class="detail">'+rows.map(x=>'<li class="'+(state.issues[x.k]?"ko":"ok")+'">'+esc(x.it)+' : '+(state.issues[x.k]?'<b>à améliorer</b>':'vérifié')+(state.auto[x.k]?' <span class="muted">('+esc(state.auto[x.k].evidence)+')</span>':'')+'</li>').join("")+'</ul>':""}).join("")||'<p class="muted">Aucun contrôle renseigné.</p>';
 const sources=[d.place&&"Google Places API (fiche, avis, photos, concurrents, carte de visibilité)",d.psi&&(d.psi.via||"Lighthouse")+" (site mobile)",d.html&&"lecture du site (Jina Reader)",d.bing&&"Bing France",d.aiAuto&&d.aiAuto.length&&"Gemini avec Recherche Google",d.osm&&"OpenStreetMap"].filter(Boolean);
 const method='<p>L’audit combine des données publiques collectées automatiquement et des vérifications manuelles. Le score indicatif correspond à la part des contrôles réussis parmi ceux effectués ; il ne s’agit pas d’un classement officiel.</p>'+(sources.length?'<p><b>Sources :</b> '+esc(sources.join(" ; "))+'.</p>':'')+'<p class="muted">Les positions Google et Bing sont mesurées depuis des recherches neutres : les résultats réels varient selon la position, l’appareil et l’historique de chaque personne. Les statistiques privées (vues de la fiche, Search Console) nécessitent l’accès du propriétaire. Aucun résultat n’est garanti.</p>'+detail+(state.notes?'<h3>Observations complémentaires</h3><p>'+esc(state.notes)+'</p>':'');
 const closing='<div class="closing"><b style="font-size:17px">Prochaine étape</b><p class="muted" style="margin:6px 0 12px">Un échange de 10 minutes pour parcourir ce rapport et choisir ensemble les actions prioritaires. Démo et devis gratuits, sans engagement.</p><div class="brandline"><img src="assets/logo-64.png" alt="" width="36" height="36"><div><b>'+esc(sender?sender+", ":"")+esc(line)+'</b>'+(contact?'<br><span class="muted">'+esc(contact)+'</span>':'')+'</div></div></div>';
 const body=cover+toc
  +sec(1,"Synthèse",syn)
  +sec(2,"Fiche Google, photos et réseaux sociaux",gHtml)
  +sec(3,"Visibilité locale et concurrence",vis,"newpage")
  +sec(4,"Visibilité sur Bing",bing+'<p class="muted"><small>Bing alimente aussi DuckDuckGo, Ecosia et Microsoft Copilot.</small></p>')
  +sec(5,"Visibilité dans les assistants IA",aiHtml)
  +sec(6,"Site web sur mobile",siteHtml)
  +sec(7,"Plan d’action recommandé",'<p class="muted">Classé par priorité : impact attendu sur la visibilité, puis effort de mise en œuvre.</p>'+plan,"newpage")
  +sec(8,"Ce qu’AffiAds peut apporter",scopeBlock(issues)+'<h3 style="margin-top:20px">Proposition adaptée à cet audit</h3><p>Les actions du plan regroupées par prestation, de la plus utile à la moins urgente :</p>'+offersBlock(issues)+closing,"newpage")
  +sec(9,"Méthode et détail des contrôles",method);
 const head='<div class="phead"><span><img src="assets/logo-64.png" alt="" width="18" height="18"> AffiAds Audit 360°</span><span>'+esc(b.name||"")+(b.city?" · "+esc(b.city):"")+'</span></div>';
 const foot='<div class="pfoot"><span>'+esc(line)+(contact?" · "+esc(contact):"")+'</span><span>Audit du '+esc(frDate(b.date||today()))+'</span></div>';
 $("report").innerHTML='<table class="printwrap"><thead><tr><td>'+head+'</td></tr></thead><tbody><tr><td>'+body+'</td></tr></tbody><tfoot><tr><td>'+foot+'</td></tr></tfoot></table>';
}

/* ---------- Message prospect ---------- */
function buildPitch(){
 const b=state.biz,d=state.data||{},tone=$("pitchTone").value,who=$("pitchContact").value.trim();
 const sender=settings.senderName||"Denis",line=settings.senderLine||"AffiAds",contact=settings.senderContact||"";
 let facts=(d.findings||[]).slice(0,tone==="sms"?2:3).map(f=>f.text);
 if(!facts.length)facts=issuesList().slice(0,3).map(p=>p.it.toLowerCase()+" : "+p.reco.charAt(0).toLowerCase()+p.reco.slice(1));
 const hello="Bonjour"+(who?" "+who:"")+",";
 const biz=b.name||"votre établissement",city=b.city?" à "+b.city:"";
 if(tone==="sms")return hello+" je suis "+sender+" ("+line.split("—")[0].trim()+"). J'ai fait un audit gratuit de la visibilité en ligne de "+biz+". "+(facts.length?"Exemple : "+facts[0]+" ":"")+"Je peux vous envoyer le rapport complet ? Sans engagement.";
 const bullets=facts.length?facts.map(f=>"• "+f).join("\n"):"• Plusieurs points simples à améliorer sur la fiche Google et les réseaux.";
 if(tone==="email")return "Objet : Audit de visibilité de "+biz+" — vos résultats\n\n"+hello+"\n\nJe m'appelle "+sender+" et j'accompagne les commerces dans leur visibilité en ligne : fiche Google, réseaux sociaux, vidéos et site mobile.\n\nJ'ai réalisé un audit gratuit de "+biz+city+" à partir des données publiques (fiche Google, avis, site, concurrents). Voici les principaux constats :\n\n"+bullets+"\n\nCe sont des points concrets, qui se corrigent rapidement. Je peux vous présenter le rapport complet en dix minutes, avec les actions prioritaires, gratuitement et sans engagement.\n\nSeriez-vous disponible cette semaine pour un court échange ?\n\nBien cordialement,\n"+sender+"\n"+line+(contact?"\n"+contact:"");
 return hello+"\n\nJe suis "+sender+", "+line+". J'ai fait un petit audit gratuit de la visibilité en ligne de "+biz+city+". Quelques constats :\n\n"+bullets+"\n\nJe peux vous envoyer le rapport complet avec les actions prioritaires, sans engagement. Ça vous intéresse ?\n\n"+sender;
}

/* ---------- Navigation ---------- */
const VIEWS=["auto","clients","home","audit","report","pitch","campaign","research","webcheck","tools","settings"];
const TITLES={auto:["Audit","Un nom, une ville : l'application collecte les données publiques pour vous."],clients:["Clients","Tous vos audits, enregistrés sur cet appareil."],campaign:["Visibilité IA","Lancez des tests comparables dans les assistants IA, question déjà remplie."],research:["Recherche web","Recherches publiques ciblées pour documenter l’audit."],webcheck:["Tests du site","Vitesse, SEO et qualité du site sur téléphone."],home:["Fiche commerce","Coordonnées du commerce et diagnostic par catégorie."],audit:["Checklist","Points automatiques avec preuve, et points à vérifier à la main."],report:["Rapport client","Prêt à imprimer ou enregistrer en PDF."],pitch:["Message prospect","Un message basé sur les constats réels de l'audit."],tools:["Boîte à outils","Liens directs vers les outils de vérification."],settings:["Réglages","Thème, installation, clé Google, signature et sauvegardes."]};
function closeMore(){const n=document.querySelector(".nav");n.classList.remove("open");$("navMore").setAttribute("aria-expanded","false")}
let curView="auto";
function nav(v){
 closeMore();if(!TITLES[v])v="auto";
 const swap=()=>{VIEWS.forEach(x=>$("view-"+x).classList.toggle("hidden",x!==v));document.querySelectorAll(".nav button[data-view]").forEach(b=>{const on=b.dataset.view===v;b.classList.toggle("active",on);if(on)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")});$("navMore").classList.toggle("active",!["auto","clients","report","pitch"].includes(v));$("pageTitle").textContent=TITLES[v][0];$("pageSub").textContent=TITLES[v][1];document.body.dataset.view=v;if(v==="report")renderReport();if(v==="tools")renderTools();if(v==="clients")renderClientSelect();if(v==="pitch"&&!$("pitchText").value.trim()){$("pitchText").value=state.pitch=buildPitch()}};
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 if(document.startViewTransition&&!reduce&&v!==curView)document.startViewTransition(swap);else swap();
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
  ["Instagram / Facebook","https://www.google.com/search?q="+q(n+" "+c+" (site:instagram.com OR site:facebook.com)"),"Comptes sociaux"],
  ["TikTok","https://www.tiktok.com/search?q="+q(n+" "+c),"Présence TikTok"],
  ["PagesJaunes","https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui="+q(n)+"&ou="+q(c),"Annuaire"],
  ["Tripadvisor","https://www.tripadvisor.fr/Search?q="+q(n+" "+c),"Avis touristiques"],
  ["OpenStreetMap",state.data&&state.data.osm&&state.data.osm.me?state.data.osm.me.url:"https://www.openstreetmap.org/search?query="+q(n+" "+c),"Alimente Apple Plans et de nombreuses applis"],
  ["Search Console","https://search.google.com/search-console/about?hl=fr","SEO du site (accès propriétaire)"]];
 $("links").innerHTML=list.map(t=>'<a href="'+esc(t[1])+'" target="_blank" rel="noopener"><span><b>'+esc(t[0])+'</b><br><span class="muted">'+esc(t[2])+' ↗</span></span></a>').join("");
}

/* ---------- Visibilité IA ---------- */
function campaignInputFromBiz(){$("campaignBusiness").value=$("name").value||"";$("campaignCity").value=$("city").value||"";$("campaignType").value=state.biz.keyword||$("type").value||"";$("campaignService").value="";$("campaignExtra").value=""}
function getCampaignPrompts(silent){
 const name=$("campaignBusiness").value.trim(),city=$("campaignCity").value.trim(),type=$("campaignType").value.trim(),service=$("campaignService").value.trim(),extra=$("campaignExtra").value.trim();
 if(!city||(!name&&!type&&!service)){if(!silent)toast("Renseignez au minimum la ville et le nom ou l’activité.");return []}
 const subject=name||("un "+type),campaignId=String(Date.now());
 const prompts=[
  {id:campaignId+"-1",kind:"Découverte locale",text:"Je cherche "+(type||"un commerce")+" à "+city+". Quels établissements me recommandes-tu ?"},
  {id:campaignId+"-2",kind:"Besoin principal",text:"Quel est le meilleur choix à "+city+" pour "+(service||type||"ce type de service")+" ?"+(extra?" Critère important : "+extra+".":"")},
  {id:campaignId+"-3",kind:"Recommandation précise",text:"Peux-tu comparer "+subject+" à "+city+" avec d’autres établissements locaux pour "+(service||type||"ce besoin")+" ? Cite tes sources si possible."},
  {id:campaignId+"-4",kind:"Marque exacte",text:"Que peux-tu me dire sur "+subject+" à "+city+" ? Donne son site officiel, ses services et les sources qui confirment ces informations."},
  {id:campaignId+"-5",kind:"Recherche sans marque",text:"Je suis à "+city+" et je cherche "+(service||type||"un établissement adapté")+(extra?" avec ces critères : "+extra:"")+". Quels sont les meilleurs choix et pourquoi ?"},
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
 $("aiSummary").innerHTML='<div class="card s3"><div class="metric">'+tests.length+'<small>Tests enregistrés</small></div></div><div class="card s3"><div class="metric">'+(rate===null?"—":rate+"%")+'<small>Taux de présence (oui/non)</small></div></div><div class="card s3"><div class="metric">'+tests.filter(t=>t.presence==="no").length+'<small>Tests sans présence</small></div></div>';
 $("aiTestsList").innerHTML=tests.length?'<h3 style="margin:16px 0 8px">Historique des tests</h3>'+tests.slice().reverse().map((t,idx)=>'<div class="priority"><b>'+esc(t.platform)+' · '+esc(t.date)+'</b><small>'+esc(t.prompt)+'</small><p>'+(t.presence==="yes"?"Présent":t.presence==="no"?"Absent":"Incertain")+(t.rank?" · Position notée : "+esc(t.rank):"")+(t.competitors?" · Concurrents : "+esc(t.competitors):"")+'</p>'+(safeUrl(t.source)?'<a target="_blank" rel="noopener" href="'+esc(safeUrl(t.source))+'">Source citée ↗</a>':"")+(t.notes?'<p>'+esc(t.notes)+'</p>':"")+'<div class="actions"><button class="btn" data-delete-ai="'+(tests.length-1-idx)+'">Supprimer ce test</button></div></div>').join(""):'<p class="muted">Aucun test enregistré. Ouvrez « Visibilité IA » pour lancer une question en un clic.</p>';
 $("aiTestsList").querySelectorAll("[data-delete-ai]").forEach(b=>b.onclick=()=>{if(!confirm("Supprimer ce test ?"))return;state.aiTests.splice(Number(b.dataset.deleteAi),1);persistLocal();drawAiTests();renderCampaignPrompts();update()});
}

/* ---------- Tests web (PageSpeed réel) ---------- */
function renderWebResults(rows){$("webResults").innerHTML=rows.map(r=>'<div class="priority"><b>'+esc(r.title)+'</b><small>'+esc(r.detail)+'</small></div>').join("")}
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
 if(name)s.push(["Réseaux sociaux","https://www.google.com/search?q="+q(name+" "+city+" (site:instagram.com OR site:facebook.com OR site:tiktok.com)")]);
 if(name)s.push(["Presse et articles locaux","https://www.google.com/search?tbm=nws&q="+q('"'+name+'" '+city)]);
 const u=normalizeUrl(site);if(u)s.push(["Pages indexées du site","https://www.google.com/search?q="+q("site:"+u.hostname)]);
 if(kw)s.push(["Questions / FAQ","https://www.google.com/search?q="+q(kw+" "+city+" questions avis prix")]);
 if(name)s.push(["Publicités Meta actives","https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=FR&search_type=keyword_unordered&q="+q(name)]);
 lastSearches=s;$("researchResults").innerHTML=s.map(x=>'<a target="_blank" rel="noopener" href="'+esc(x[1])+'"><span><b>'+esc(x[0])+'</b><br><span class="muted">Ouvrir les résultats ↗</span></span></a>').join("");
}

/* ---------- Événements ---------- */
function bind(){
 const opts=BIZ_TYPES.map(t=>'<option>'+esc(t.label)+'</option>').join("");$("type").innerHTML=opts;$("autoType").innerHTML=opts;
 document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>nav(b.dataset.view)));
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
 $("pdf").onclick=$("printReport").onclick=()=>{nav("report");setTimeout(()=>window.print(),300)};
 $("copy").onclick=()=>{read();const c=calc(),d=state.data||{};const txt="AUDIT AFFIADS 360°\nCommerce : "+(state.biz.name||"Non renseigné")+"\nVille : "+(state.biz.city||"Non renseignée")+"\nScore indicatif : "+(c.score===null?"non calculé":c.score+"/100")+"\nContrôles : "+c.n+"/"+keys.length+" · Points à améliorer : "+c.issues+((d.findings||[]).length?"\n\nCONSTATS\n"+d.findings.map(f=>"- "+f.text).join("\n"):"")+"\n\nPLAN D'ACTION\n"+issuesList().map((p,i)=>(i+1)+". "+p.it+" — "+p.reco).join("\n")+"\n\nNotes : "+(state.notes||"Aucune");copyText(txt,"Résumé copié.")};
 $("clientChip").onclick=()=>nav("clients");
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
 $("exportJson").onclick=()=>{read();persistLocal();download(JSON.stringify({app:"affiads-audit-360",version:2,exportedAt:new Date().toISOString(),audits:db.audits},null,1),"affiads-audits-"+today()+".json","application/json")};
 $("importJson").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const j=JSON.parse(await f.text());const list=j.audits?Object.values(j.audits):(j.checks?[j]:[]);if(!list.length)throw new Error("aucun audit trouvé");list.forEach(a=>{a=fixState(a);db.audits[a.id]=a});state=fixState(list[0]);persistLocal();hydrate();toast(list.length+" audit(s) importé(s).")}catch(err){toast("Import impossible : "+err.message)}e.target.value=""};
}
function download(content,name,type){const blob=new Blob([content],{type});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}


/* ---------- 2026 : thème, installation, hors ligne, partage ---------- */
function applyTheme(){const t=settings.theme||"auto";if(t==="auto")delete document.documentElement.dataset.theme;else document.documentElement.dataset.theme=t;document.querySelectorAll("[data-theme-set]").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.themeSet===t)))}
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
function lockLoad(){try{Lock.cfg=JSON.parse(localStorage.getItem(LOCK_KEY)||"null")}catch(e){Lock.cfg=null}}
function lockSave(){try{if(Lock.cfg)localStorage.setItem(LOCK_KEY,JSON.stringify(Lock.cfg));else localStorage.removeItem(LOCK_KEY)}catch(e){}}
function b64(buf){return btoa(String.fromCharCode(...new Uint8Array(buf)))}
async function pinHash(pin,saltB64){
 const salt=Uint8Array.from(atob(saltB64),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(pin),"PBKDF2",false,["deriveBits"]);
 return b64(await crypto.subtle.deriveBits({name:"PBKDF2",salt,iterations:150000,hash:"SHA-256"},key,256));
}
async function pinSet(pin){const salt=b64(crypto.getRandomValues(new Uint8Array(16)));Lock.cfg={salt,hash:await pinHash(pin,salt),len:pin.length,delay:(Lock.cfg&&Lock.cfg.delay)??5,fails:0,until:0};lockSave()}
function unlockedThisSession(){try{return sessionStorage.getItem(LOCK_SESSION)==="1"}catch(e){return false}}
function setSession(v){try{if(v)sessionStorage.setItem(LOCK_SESSION,"1");else sessionStorage.removeItem(LOCK_SESSION)}catch(e){}}
function gateText(title,hint){$("gateTitle").textContent=title;$("gateHint").textContent=hint}
function renderDots(){const n=Lock.mode==="unlock"?(Lock.cfg&&Lock.cfg.len||4):Math.max(4,Lock.entry.length);$("pinDots").innerHTML=Array.from({length:n},(_,i)=>'<i class="'+(i<Lock.entry.length?"on":"")+'"></i>').join("")}
function gateMsg(t,bad){const m=$("gateMsg");m.textContent=t||"";m.classList.toggle("bad",!!bad);if(bad){const d=$("pinDots");d.classList.remove("shake");void d.offsetWidth;d.classList.add("shake")}}
function buildPad(){
 const keys=["1","2","3","4","5","6","7","8","9","ok","0","del"];
 $("pinPad").innerHTML=keys.map(k=>k==="del"?'<button type="button" data-k="del" aria-label="Effacer">⌫</button>':k==="ok"?'<button type="button" data-k="ok" class="ok" aria-label="Valider">OK</button>':'<button type="button" data-k="'+k+'">'+k+'</button>').join("");
 $("pinPad").querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>pinKey(b.dataset.k)));
}
function showGate(mode){
 Lock.mode=mode;Lock.entry="";Lock.first="";document.body.classList.add("locked");$("gate").classList.remove("hidden","leaving");$("gateLock").hidden=false;
 $("gateForgot").hidden=mode!=="unlock";
 if(mode==="unlock")gateText("Entrez votre code","Votre code protège vos audits et votre clé sur cet appareil.");
 else if(mode==="create")gateText("Créez votre code","Choisissez un code de 4 à 6 chiffres pour protéger l’appli sur cet appareil.");
 else if(mode==="change")gateText("Nouveau code","Choisissez un nouveau code de 4 à 6 chiffres.");
 gateMsg("");renderDots();setTimeout(()=>{try{$("pinInput").focus({preventScroll:true})}catch(e){}},60);
}
function hideGate(){setSession(true);setTimeout(()=>{if(typeof syncHandlePending==="function")syncHandlePending()},400);Lock.lastActive=Date.now();const g=$("gate");g.classList.add("leaving");document.body.classList.remove("locked");setTimeout(()=>{g.classList.add("hidden");g.classList.remove("leaving")},matchMedia("(prefers-reduced-motion: reduce)").matches?0:260);renderPinSettings()}
async function pinKey(k){
 if(k==="del"){Lock.entry=Lock.entry.slice(0,-1);renderDots();return}
 if(k==="ok"){return pinSubmit()}
 if(!/^\d$/.test(k)||Lock.entry.length>=6)return;
 Lock.entry+=k;renderDots();gateMsg("");
 if(Lock.mode==="unlock"&&Lock.cfg&&Lock.entry.length===Lock.cfg.len)pinSubmit();
}
async function pinSubmit(){
 const v=Lock.entry;
 if(Lock.mode==="unlock"){
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
function renderPinSettings(){
 if(!$("pinStatus"))return;const on=!!(Lock.cfg&&Lock.cfg.hash);
 $("pinStatus").textContent=on?"Code actif : l’appli demande votre code à l’ouverture et après une période d’inactivité.":"Aucun code : n’importe qui utilisant cet appareil peut ouvrir l’appli.";
 $("pinChange").textContent=on?"Changer le code":"Créer un code";$("pinDisable").hidden=!on;$("pinLockNow").hidden=!on;
 $("pinDelay").value=String(on?(Lock.cfg.delay??5):5);$("pinDelay").disabled=!on;
}
function lockNow(){if(Lock.cfg&&Lock.cfg.hash){setSession(false);showGate("unlock")}}
function lockTick(){if(!Lock.cfg||!Lock.cfg.hash||document.body.classList.contains("locked"))return;const d=Lock.cfg.delay??5;if(d>0&&Date.now()-Lock.lastActive>d*60000)lockNow()}
function initLock(){
 lockLoad();buildPad();
 const pin=$("pinInput");
 pin.addEventListener("input",()=>{const v=pin.value.replace(/\D/g,"");pin.value="";for(const ch of v)pinKey(ch)});
 document.addEventListener("keydown",e=>{if(!document.body.classList.contains("locked")||$("gateLock").hidden)return;if(/^\d$/.test(e.key)){e.preventDefault();pinKey(e.key)}else if(e.key==="Backspace"){e.preventDefault();pinKey("del")}else if(e.key==="Enter"&&!(e.target&&e.target.closest&&e.target.closest("button"))){e.preventDefault();pinKey("ok")}});
 $("gate").addEventListener("click",e=>{if(!e.target.closest("button"))pin.focus({preventScroll:true})});
 $("gateForgot").onclick=()=>{if(!confirm("Sans le code, la seule solution est d’effacer toutes les données de l’appli sur cet appareil : audits, clients, clé Google et réglages. Pensez à vos exports. Tout effacer ?"))return;try{localStorage.removeItem(STORE);localStorage.removeItem(OLD);localStorage.removeItem(SETTINGS);localStorage.removeItem(LOCK_KEY)}catch(e){}setSession(false);location.reload()};
 ["pointerdown","keydown","touchstart","scroll"].forEach(ev=>document.addEventListener(ev,()=>{Lock.lastActive=Date.now()},{passive:true}));
 document.addEventListener("visibilitychange",()=>{if(document.hidden)Lock.hiddenAt=Date.now();else if(Lock.hiddenAt){const d=Lock.cfg&&(Lock.cfg.delay??5);if(Lock.cfg&&Lock.cfg.hash&&d>0&&Date.now()-Lock.hiddenAt>d*60000)lockNow();Lock.hiddenAt=0}});
 clearInterval(Lock.timer);Lock.timer=setInterval(lockTick,15000);
 $("pinChange").onclick=()=>showGate(Lock.cfg&&Lock.cfg.hash?"change":"create");
 $("pinLockNow").onclick=lockNow;
 $("pinDisable").onclick=()=>{if(!confirm("Désactiver le code ? L’appli s’ouvrira sans protection sur cet appareil."))return;Lock.cfg=null;lockSave();renderPinSettings();toast("Code désactivé.")};
 $("pinDelay").onchange=()=>{if(Lock.cfg){Lock.cfg.delay=+$("pinDelay").value;lockSave();toast("Verrouillage automatique mis à jour.")}};
 /* Écran d'accueil : le logo s'affiche, puis le code (ou sa création au premier lancement) */
 const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
 setTimeout(()=>{
  if(Lock.cfg&&Lock.cfg.hash){if(unlockedThisSession()){hideGate()}else showGate("unlock")}
  else showGate("create");
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
  if(row){const remote=await syncDecrypt(row.data,row.iv);if(syncMerge(remote)){const cur=db.audits[state.id]?state.id:Object.values(db.audits).sort((x,y)=>String(y.updatedAt||y.createdAt).localeCompare(String(x.updatedAt||x.createdAt))).map(x=>x.id)[0];if(cur){state=fixState(db.audits[cur]);db.current=cur}else{state=blankState();db.audits[state.id]=state;db.current=state.id}try{localStorage.setItem(STORE,JSON.stringify(db))}catch(e){}if(!document.body.classList.contains("locked"))hydrate();else renderClientSelect()}}
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

/* ---------- Démarrage ---------- */
bind();loadAll();applyTheme();initInstallHelp();hydrate();initLock();renderPinSettings();syncInit();
{const h=location.hash.slice(1);if(h&&TITLES[h])nav(h);else document.body.dataset.view="auto"}
window.addEventListener("hashchange",()=>{const h=location.hash.slice(1);if(h&&TITLES[h]&&h!==curView)nav(h)});
matchMedia("(prefers-color-scheme: dark)").addEventListener("change",applyTheme);
