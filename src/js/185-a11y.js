/* =====================================================================
   DOMAINE · ACCESSIBILITÉ DES FENÊTRES (feuilles, lecteur de séance, fiches d'exécution)
   - Une seule fenêtre active : la plus haute (fiche > feuille > lecteur). Tout le reste devient inerte (attribut inert).
   - Focus bloqué dans la fenêtre active (Tab / Maj+Tab), retour du focus au bouton d'origine à la fermeture.
   - Échap : ferme la fiche ; sur le lecteur, RÉDUIT la séance sans l'arrêter (le chronomètre continue).
   - Fenêtres imbriquées : la fiche ouverte depuis le lecteur rend le lecteur inerte, puis le réactive.
   ===================================================================== */
function topModal(){const mm=[...document.querySelectorAll(".media-modal")];if(mm.length)return mm[mm.length-1];
  if(document.querySelector("#layer [role=dialog]"))return document.getElementById("layer");return document.getElementById("player")}
function syncInert(){const top=topModal();[...document.body.children].forEach(c=>{if(c.tagName==="SCRIPT"||c.classList.contains("toast")||c.id==="sr-live")return;
  const v=!!top&&c!==top&&!c.contains(top);if(v)c.setAttribute("inert","");else c.removeAttribute("inert")})}
new MutationObserver(syncInert).observe(document.body,{childList:true});
(()=>{const l=document.getElementById("layer");if(l)new MutationObserver(syncInert).observe(l,{childList:true})})();
/* Réduire le lecteur : la séance continue (S.active est conservé), la carte « Séance en cours » permet de la reprendre */
function minimizePlayer(){if(!S.active)return;const ret=(document.getElementById("player")||{})._ret;closePlayer();render();
  toast("Séance réduite : elle continue. Reprends-la depuis l'accueil.");const b=document.querySelector('[data-start="'+S.active.id+'"]');(b||(ret&&document.contains(ret)?ret:null)||document.querySelector("#app h1"))?.focus?.({preventScroll:true})}
document.addEventListener("keydown",ev=>{const top=topModal();if(!top||top.id==="layer")return; // les feuilles ont leur propre gestion (50-sheets.js)
  if(ev.key==="Escape"){ev.preventDefault();if(top.classList.contains("media-modal"))closeMedia();else if(top.id==="player")minimizePlayer();return}
  if(ev.key==="Tab"){const f=[...top.querySelectorAll(FOCUSABLE)].filter(e=>e.offsetParent!==null&&!e.closest("[hidden]"));if(!f.length){ev.preventDefault();return}
    const first=f[0],last=f[f.length-1];
    if(!top.contains(document.activeElement)){ev.preventDefault();first.focus();return}
    if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus()}else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus()}}
});
/* Bouton « Retour » matériel (Android / navigateur) : réduit le lecteur au lieu de quitter l'appli */
window.addEventListener("popstate",()=>{if(document.querySelector(".media-modal")){closeMedia()}else if(document.getElementById("player")){minimizePlayer()}});

