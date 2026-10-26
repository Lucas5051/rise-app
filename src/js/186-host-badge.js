/* =====================================================================
   DOMAINE · BADGE DE L'HÉBERGEUR
   Sur l'offre gratuite de Netlify, l'hébergeur ajoute en bas à droite un badge « Powered by Netlify »
   impossible à masquer (il fait partie de l'offre). Pour qu'il ne recouvre jamais un bouton (barre d'onglets,
   lecteur de séance, feuilles), l'appli réserve sa hauteur en bas de l'écran (variable CSS --host-badge).
   Disparaît tout seul avec une offre payante ou un autre hébergeur.
   ===================================================================== */
(function(){const set=()=>{const f=document.getElementById("nl-badge-frame");const h=f&&f.getBoundingClientRect().height;
    document.documentElement.style.setProperty("--host-badge",h?Math.ceil(h+8)+"px":"0px");
    if(f&&!f._watched){f._watched=1;[300,1200,3000].forEach(t=>setTimeout(set,t))}};
  try{new MutationObserver(set).observe(document.body,{childList:true});addEventListener("resize",set)}catch(e){}})();
