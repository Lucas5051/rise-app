/* =====================================================================
   MODULE 13 · RAPPEL RPE (≈ 30 min après la séance, recommandé par le cours)
   Version iPhone : notification locale native (Capacitor LocalNotifications).
   Version web : rappel visible dans « À renseigner » au prochain lancement. Aucun minuteur n'est présenté comme une notification garantie.
   ===================================================================== */
const Notify={
  native(){const C=window.Capacitor;return !!(C&&C.Plugins&&C.Plugins.LocalNotifications)},
  /* Rappels quotidiens du questionnaire (appli iOS uniquement). À VÉRIFIER sur l'appli native : format schedule.on de @capacitor/local-notifications. */
  async scheduleDaily(r){
    if(!this.native())return false;
    try{const LN=window.Capacitor.Plugins.LocalNotifications;const ids=[];for(let i=0;i<21;i++)ids.push({id:900000+i});await LN.cancel({notifications:ids});
      if(!r.on)return true;const p=await LN.checkPermissions();if(p.display!=="granted"){const q=await LN.requestPermissions();if(q.display!=="granted")return false}
      const list=[];let i=0;r.times.forEach(t=>{const [h,m]=t.split(":").map(Number);r.days.forEach(d=>{list.push({id:900000+(i++),title:"Questionnaire bien-être",body:"Remplis ton ressenti du jour (1 min).",schedule:{on:{weekday:d+1,hour:h,minute:m},allowWhileIdle:true}})})});
      await LN.schedule({notifications:list});return true}catch(e){return false}
  },
  async scheduleRpe(key,dueMs,label){
    if(!this.native()||dueMs<nowMs())return false;
    try{const LN=window.Capacitor.Plugins.LocalNotifications;const p=await LN.checkPermissions();if(p.display!=="granted"){const q=await LN.requestPermissions();if(q.display!=="granted")return false}
      const id=Math.abs([...key].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,7))%2000000000;
      await LN.schedule({notifications:[{id,title:"RPE à noter",body:"Note l'effort perçu de ta séance « "+label+" » (0 à 10).",schedule:{at:new Date(dueMs)}}]});return true}catch(e){return false}
  }
};

