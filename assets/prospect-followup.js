/* AffiAds Audit 360° — suivi prospects local, sans service externe */
(function () {
  "use strict";
  const KEY = "affiads.audit360.prospect-followup.v1";
  const STATUSES = [["a-contacter","À contacter"],["contacte","Contacté"],["interesse","Intéressé"],["client","Client"],["sans-suite","Sans suite"]];
  const $ = (s, root = document) => root.querySelector(s);
  const esc = v => String(v == null ? "" : v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  function read(){try{const v=JSON.parse(localStorage.getItem(KEY)||"{}");return v&&typeof v==="object"?v:{}}catch(_){return {}}}
  let records=read();
  function save(){try{localStorage.setItem(KEY,JSON.stringify(records));return true}catch(_){const n=$("#aaProspectStatus");if(n)n.textContent="Enregistrement impossible : espace de stockage indisponible.";return false}}
  function rows(){return Array.from(document.querySelectorAll("#clientList .clientrow [data-open]")).map(b=>({id:b.getAttribute("data-open"),name:($(".who b",b)||{}).textContent||"Entreprise",detail:($(".who span",b)||{}).textContent||""}))}
  function options(value){return STATUSES.map(([k,l])=>'<option value="'+k+'"'+(value===k?" selected":"")+'>'+l+"</option>").join("")}
  function exportCSV(list){const q=v=>'"'+String(v==null?"":v).replace(/"/g,'""')+'"';const lines=[["Entreprise","Statut","Date de relance","Notes"],...list.map(x=>[x.name,(STATUSES.find(s=>s[0]===x.status)||STATUSES[0])[1],x.due,x.note])];const blob=new Blob(["\ufeff"+lines.map(a=>a.map(q).join(";")).join("\r\n")],{type:"text/csv;charset=utf-8"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="affiads-suivi-prospects.csv";document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url)}
  function render(){
    const section=$("#view-clients"),list=$("#clientList");if(!section||!list)return;
    let panel=$("#aaProspectPanel");if(!panel){panel=document.createElement("section");panel.id="aaProspectPanel";panel.className="aa-prospect-panel";panel.setAttribute("aria-labelledby","aaProspectTitle");list.parentNode.insertBefore(panel,list)}
    const today=new Date().toISOString().slice(0,10),clients=rows().map(c=>Object.assign({},c,records[c.id]||{status:"a-contacter",due:"",note:""}));
    const counts=STATUSES.map(([key,label])=>({label,count:clients.filter(x=>(x.status||"a-contacter")===key).length}));
    const due=clients.filter(x=>x.due&&x.due<=today&&x.status!=="client"&&x.status!=="sans-suite").length;
    panel.innerHTML='<div class="aa-prospect-head"><div><p class="aa-prospect-eyebrow">PROSPECTION</p><h2 id="aaProspectTitle">Suivi des prospects</h2><p class="aa-prospect-sub">Suivez les contacts et les relances depuis vos audits. Données conservées sur cet appareil.</p></div><button type="button" class="btn aa-prospect-export" id="aaProspectExport">Exporter CSV</button></div>'+
    '<div class="aa-prospect-stats">'+counts.map(x=>'<div class="aa-prospect-stat"><span>'+esc(x.label)+'</span><b>'+x.count+'</b></div>').join("")+'</div>'+
    '<div class="aa-prospect-alert" role="status">'+(due?'<b>'+due+' relance'+(due>1?"s":"")+' à faire</b> : vérifiez les dates échues.':'Aucune relance échue parmi les audits affichés.')+'</div>'+
    (clients.length?'<div class="aa-prospect-list">'+clients.map(c=>'<article class="aa-prospect-item" data-prospect-id="'+esc(c.id)+'"><div class="aa-prospect-name">'+esc(c.name)+'</div><label>Statut<select data-prospect-field="status">'+options(c.status||"a-contacter")+'</select></label><label>Relance<input type="date" data-prospect-field="due" value="'+esc(c.due||"")+'"></label><label class="aa-prospect-notes">Notes<textarea data-prospect-field="note" rows="2" maxlength="500" placeholder="Dernier échange, besoin, prochaine action…">'+esc(c.note||"")+'</textarea></label><small class="aa-prospect-hint">'+(c.due&&c.due<=today&&c.status!=="client"&&c.status!=="sans-suite"?"Relance à faire":c.due?"Relance prévue le "+esc(new Date(c.due+"T12:00:00").toLocaleDateString("fr-FR")):"Aucune relance planifiée")+'</small></article>').join("")+'</div>':'<p class="aa-prospect-empty">Créez un audit pour ajouter automatiquement une entreprise à ce suivi.</p>')+
    '<p id="aaProspectStatus" class="aa-prospect-foot" aria-live="polite">Suivi indépendant des données d’audit ; aucune donnée n’est envoyée à un service externe.</p>';
    $("#aaProspectExport",panel).addEventListener("click",()=>exportCSV(clients));
    panel.querySelectorAll("[data-prospect-field]").forEach(input=>input.addEventListener("change",()=>{
      const card=input.closest("[data-prospect-id]"),id=card&&card.getAttribute("data-prospect-id");if(!id)return;
      records[id]=Object.assign({status:"a-contacter",due:"",note:""},records[id]||{});records[id][input.getAttribute("data-prospect-field")]=input.value;
      const ok=save(),field=input.getAttribute("data-prospect-field"),status=$("#aaProspectStatus",panel);if(status)status.textContent=ok?"Suivi enregistré sur cet appareil.":"Enregistrement impossible : exportez vos données et vérifiez le stockage.";
      if(field==="status"||field==="due"){render();const next=panel.querySelector('[data-prospect-id="'+CSS.escape(id)+'"] [data-prospect-field="'+field+'"]');if(next)next.focus()}
    }));
  }
  function visible(){const s=$("#view-clients");return s&&!s.classList.contains("hidden")}
  function refresh(){if(visible())render()}
  document.addEventListener("DOMContentLoaded",()=>{
    refresh();const list=$("#clientList");if(list&&window.MutationObserver)new MutationObserver(refresh).observe(list,{childList:true,subtree:true});
    document.querySelectorAll('[data-view="clients"],#navMore,#newClient').forEach(el=>el.addEventListener("click",()=>window.setTimeout(refresh,0)));
    document.addEventListener("click",e=>{if(e.target.closest('[data-open]'))window.setTimeout(refresh,0)});
  });
  if(document.readyState!=="loading")refresh();
})();