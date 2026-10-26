/* =====================================================================
   DÉMARRAGE
   ===================================================================== */
try{Cloud.init();initStore()}catch(e){console.error(e);$("#app").innerHTML='<div class="alert pain"><span class="dot"></span><div>Erreur au démarrage : '+esc(e.message)+'</div></div>'}
/* iPhone : pendant le glisser, bloque le défilement pour que le doigt reste sur la séance */
document.addEventListener("touchmove",ev=>{if(drag||pressStart)ev.cancelable&&drag&&ev.preventDefault()},{passive:false});

