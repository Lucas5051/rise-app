/* =====================================================================
   MODULE 17 · ÉVÉNEMENTS (toucher, clavier, formulaires)
   ===================================================================== */
const val=id=>{const e=document.getElementById(id);return e?e.value:""};
function readZones(prefix,from){const z=[];for(let i=from;i<from+5;i++)z.push(num(val(prefix+i),0,300));return z.some(isNum)?z:null}
document.addEventListener("click",ev=>{
  const tg=ev.target;
  if(tg.closest(".media-modal")&&tg.closest('[data-act="closeMedia"]')){closeMedia();return}
  if(tg.closest(".media-modal")&&tg.closest("[data-padapt]")){playerAdapt(tg.closest("[data-padapt]").dataset.padapt);return}
  const tab=tg.closest("[data-tab]");if(tab){goTo(tab.dataset.tab);return}
  if(suppressClick){suppressClick=false;return}
  const q=s=>tg.closest(s);
  let el;
  /* ---- Lecteur de séance ---- */
  if(tg.closest("#player")){
    if((el=q("[data-media]"))){openMedia(+el.dataset.media);return}
    if((el=q("[data-warm]"))){openWarm(el.dataset.warm);return}
    if((el=q("[data-recst]"))){document.querySelectorAll("[data-recst]").forEach(b=>b.setAttribute("aria-checked",b===el?"true":"false"));const w=document.getElementById("recAdapt");if(w)w.hidden=el.dataset.recst!=="adapted";return}
    if((el=q("[data-reason]"))){pickReason(el);return}
    const pa=q("[data-act]");if(pa)switch(pa.dataset.act){
      case "playerMin":minimizePlayer();return;
      case "playerPause":playerPause();return;case "playerSetDone":playerSetDone(false);return;case "playerSkip":playerSkip();return;
      case "playerNextEx":playerNextEx();return;case "playerNextPhase":playerNextPhase();return;case "playerAdapt":playerAdaptMenu();return;
      case "playerFinish":playerFinish();return;case "recValidate":recValidate();return;case "recResume":S.active.endedAt=null;if(S.active.phase==="cd")S.active.ph.cd.e=null;save();drawPlayer();return;}
    return;
  }
  /* ---- Authentification et inscription ---- */
  if(tg.closest(".auth")){if(authClick(tg))return}
  /* ---- Espace coach ---- */
  if((el=q("[data-ctab]"))){if(!isCoachAccount()){TAB="home";render();return}CTAB=el.dataset.ctab;COACH_TH=CTAB==="group"?"group":null;CATH=null;render();window.scrollTo(0,0);focusMain&&focusMain();return}
  if((el=q("[data-cath]"))){if(!isCoachAccount())return;CATH=el.dataset.cath;CTAB="athlete";CATH_SUB="plan";render();window.scrollTo(0,0);return}
  if((el=q("[data-cathsub]"))){CATH_SUB=el.dataset.cathsub;render();return}
  if((el=q("[data-cdur]"))){openCoachDur(el.dataset.cdur);return}
  if((el=q("[data-revoke]"))){const i=PL.invites.find(x=>x.code===el.dataset.revoke);if(i){i.revokedAt=nowISO();PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Code "+i.code+" révoqué"});plSave();render();toast("Code révoqué")}return}
  if((el=q("[data-copycode]"))){const c=el.dataset.copycode;(navigator.clipboard?navigator.clipboard.writeText(c):Promise.reject()).then(()=>toast("Code copié : "+c),()=>toast("Code : "+c));return}
  /* ---- Athlète ---- */
  if((el=q("[data-start]"))){if(S.active&&S.active.id!==el.dataset.start){toast("Une autre séance est en cours");openPlayer();return}if(S.active){closeSheet(false);openPlayer();return}closeSheet(false);openStartFlow(el.dataset.start);return}
  if((el=q("[data-hist]"))){closeSheet(false);openHistory(el.dataset.hist);return}
  if((el=q("[data-stform]"))){openStatusForm(openId,el.dataset.stform);return}
  if((el=q("[data-reason]"))){pickReason(el);return}
  if((el=q("[data-durfix]"))){closeSheet(false);openDurFix(el.dataset.durfix);return}
  if((el=q("[data-mediaex]"))){openMediaByName(el.dataset.mediaex);return}
  if((el=q("[data-warm]"))){openWarm(el.dataset.warm);return}
  if((el=q("[data-goto]"))){const [t,sub]=el.dataset.goto.split(":");goTo(t,sub);return}
  if((el=q("[data-durmode]"))){const [p0,k]=el.dataset.durmode.split(":");el.closest("[role=radiogroup]").querySelectorAll("[data-durmode]").forEach(b=>b.setAttribute("aria-checked",b===el));document.getElementById(p0+"DurMode").value=k;
    document.getElementById(p0+"DurW").hidden=k!=="dur";document.getElementById(p0+"TimesW").hidden=k!=="times";document.getElementById(p0+"UnkW").hidden=k!=="unknown";const f=k==="dur"?document.getElementById(p0+"Dur"):k==="times"?document.getElementById(p0+"Start"):null;f&&f.focus();return}
  if((el=q("[data-rpemode]"))){const [p0,k]=el.dataset.rpemode.split(":");el.closest("[role=radiogroup]").querySelectorAll("[data-rpemode]").forEach(b=>b.setAttribute("aria-checked",b===el));document.getElementById(p0+"RpeMode").value=k;document.getElementById(p0+"RpeW").hidden=k!=="now";return}
  if((el=q("[data-mdst]"))){el.closest("[role=radiogroup]").querySelectorAll("[data-mdst]").forEach(b=>b.setAttribute("aria-checked",b===el));document.getElementById("mdAdapt").hidden=el.dataset.mdst!=="adapted";return}
  if((el=q("[data-sub]"))){const [n,k]=el.dataset.sub.split(":");if(n==="train")TRAIN_SUB=k;else SUIVI_SUB=k;render();const b=document.querySelector('[data-sub="'+n+":"+k+'"]');b&&b.focus({preventScroll:true});return}
  if((el=q("[data-period]"))){PROG_PERIOD=+el.dataset.period;render();return}
  if((el=q("[data-scope]"))){PROG_SCOPE=el.dataset.scope;render();return}
  if((el=q("[data-testk]"))){openTestHistory(el.dataset.testk);return}
  if((el=q("[data-setpage]"))){SET_PAGE=el.dataset.setpage;render();window.scrollTo(0,0);return}
  if((el=q("[data-units]"))){PL.prefs.units=el.dataset.units;plSave();render();toast("Unité : "+(el.dataset.units==="lb"?"livres":"kilogrammes"));return}
  if((el=q("[data-stripday]"))){selDay=el.dataset.stripday;calMonth=selDay.slice(0,7);goTo("cal");return}
  if((el=q("[data-pickreward]"))){const r=S.rewards[REWARD_ID];if(r){r.used=todayISO();r.choice=el.dataset.pickreward;save();closeSheet(false);render();toast("Profite bien : "+el.dataset.pickreward.toLowerCase()+" !")}return}
  if((el=q("[data-open]"))){openSession(el.dataset.open);return}
  if((el=q("[data-otherv]"))){const d=el.dataset.otherv;closeSheet(false);sheetMode="otherVerdict";openSheet(sheetOtherVerdict(d),"Analyse de ta charge");return}
  if((el=q("[data-msgch]"))){CLIENT_CH=el.dataset.msgch;render();return}
  if((el=q("[data-askcoach]"))){askCoach(el.dataset.askcoach);return}
  if((el=q("[data-coachth]"))){if(!isCoachAccount())return;COACH_TH=el.dataset.coachth;CTAB=COACH_TH==="group"?"group":"msgs";CATH=null;render();window.scrollTo(0,0);return}
  if((el=q("[data-rewarduse]"))){const r=S.rewards[el.dataset.rewarduse];if(r&&!r.used){if(r.label==="Récompense au choix"){openRewardChoice(el.dataset.rewarduse)}else{r.used=todayISO();save();render();toast("Profite bien, tu l'as mérité !")}}return}
  if((el=q("[data-remday]"))){remRead();const d=+el.dataset.remday;REMD.days=REMD.days.includes(d)?REMD.days.filter(x=>x!==d):[...REMD.days,d];remRefresh();return}
  if((el=q("[data-remdel]"))){remRead();REMD.times.splice(+el.dataset.remdel,1);remRefresh();return}
  if((el=q("[data-otsport]"))){setOtherSport(el.dataset.otsport);return}
  if((el=q("[data-addother]"))){openOther(el.dataset.addother);return}
  if((el=q("[data-other]"))){const o=S.other[el.dataset.other];if(o)openOther(o.date,el.dataset.other);return}
  if((el=q("[data-caenset]"))){setCaen(el.dataset.caenset);return}
  if((el=q("[data-caen]"))){openCaen(el.dataset.caen);return}
  if((el=q("[data-club]"))){openClub(el.dataset.club);return}
  if((el=q("[data-rpe]"))){openRpe(el.dataset.rpe);return}
  if((el=q("[data-addclub]"))){openAddClub(el.dataset.addclub,el.dataset.kind);return}
  if((el=q(".ev.sess"))&&!reorg){openSession(el.dataset.sid);return}
  if((el=q(".cell"))&&!reorg){selDay=el.dataset.date;render();const c=document.querySelector('.cell[data-date="'+selDay+'"]');if(c)c.focus({preventScroll:true});return}
  if((el=q("[data-factor]"))){el.setAttribute("aria-pressed",el.getAttribute("aria-pressed")==="true"?"false":"true");return}
  if((el=q("[data-cflag]"))){const k=el.dataset.cflag;const on=el.getAttribute("aria-pressed")!=="true";el.setAttribute("aria-pressed",on);clubDraft.flags=on?[...new Set([...clubDraft.flags,k])]:clubDraft.flags.filter(f=>f!==k);return}
  if((el=q("[data-rpev]"))){const g=el.dataset.rpeg,v=+el.dataset.rpev;document.querySelectorAll('[data-rpeg="'+g+'"]').forEach(b=>b.setAttribute("aria-pressed",b===el?"true":"false"));document.getElementById(g+"Rpe").value=v;document.getElementById(g+"RpeTxt").textContent=v+" : "+RPE_LABELS[v];updateSrpe(g);return}
  if((el=q("[data-edit]"))){editTest=+el.dataset.edit;render();window.scrollTo(0,0);return}
  if((el=q("[data-movepick]"))){const id=(pendingMove&&pendingMove.id)||openId;setSheet(sheetVerdict(id,el.dataset.movepick,el.dataset.swap||null));return}
  if((el=q("[data-variant]"))){const s=sessionById(openId);if(el.dataset.variant===s.defaultCode)delete S.cond[openId];else S.cond[openId]=el.dataset.variant;save();setSheet(sheetSession(openId));render();toast("Variante choisie : "+TYPES[effCode(s)].name);return}
  if((el=q("[data-timer]"))){startTimer(+el.dataset.timer,el.dataset.tlabel);return}
  if((el=q("[data-prog]"))){progClick(el.dataset.prog,el.dataset.res);return}
  if((el=q("[data-progapply]"))){const l=el.dataset.progapply,d=+el.dataset.delta;const it=(sessionById(openId)?sessionItems(sessionById(openId)):[]).find(e=>e.lift===l);const kb=it?(loadInfo(it)||{}).kgNum:null;S.loadAdj[l]=(+S.loadAdj[l]||0)+d;S.loadAdjLog.push({date:todayISO(),lift:l,delta:d,at:nowISO()});save();setSheet(sheetSession(openId));if(d>0&&it){const ka=(loadInfo(it)||{}).kgNum;if(isNum(kb)&&isNum(ka))celebrateLoad(l,kb,ka)}toast(LIFT_NAME[l]+" : "+(d>0?"+":"")+fmt(d)+" kg pour les prochaines séances");return}
  if((el=q("[data-pconnect]"))){polarConnect(el.dataset.pconnect);return}
  if((el=q("[data-linkto]"))){linkHr(el.dataset.rec,el.dataset.linkto,el.dataset.ltype);closeSheet(false);render();toast("Données cardiaques associées. Pense au RPE dans 30 min.");return}
  if((el=q("[data-linkhr]"))){const r=S.hr.find(x=>x.id===el.dataset.linkhr);if(r)openLinkHr(r);return}
  const a=q("[data-act]");if(!a)return;const act=a.dataset.act;
  if(act==="closeBg"){if(tg===a)closeSheet();return}
  if(act==="celNextBg"){if(tg===a)closeSheet(false);return}
  if(act==="closeDoneBg"){if(tg===a){closeSheet();offerUndo()}return}
  switch(act){
   case "closeSheet":closeSheet();break;
   case "closeDone":closeSheet();offerUndo();break;
   case "celNext":closeSheet(false);break;
   case "rpeNow":{const id=a.dataset.sid;closeSheet(false);openRpe(id);break}
   case "openWellness":openWellness();break;
   case "saveOther":saveOther();break;
   case "openReminders":openReminders();break;
   case "openAlerts":openAlerts();break;
   case "msgSend":msgSend();break;
   case "msgRefClear":MSG_REF=null;render();break;
   case "msgMediaClear":MSG_MEDIA=null;render();break;
   case "coachBack":COACH_TH=null;if(CTAB==="group")CTAB="msgs";render();break;
   case "playerGo":closeSheet(false);playerStart(a.dataset.sid);break;
   case "openSettings":goTo("settings");break;
   case "closeSettings":goTo("home");break;
   case "setBack":SET_PAGE=null;render();window.scrollTo(0,0);break;
   case "logout":doLogout();break;
   case "seeBadge":{S.meta.badgeSeen=S.meta.badgeSeen||{};S.meta.badgeSeen[a.dataset.bid]=true;save();closeSheet(false);CELEB.length=0;TAB="suivi";SUIVI_SUB="badges";render();window.scrollTo(0,0);break}
   case "openTodo":openTodo();break;
   case "addTest":editTest=null;openTestForm();break;
   case "saveStatus":saveStatus(a.dataset.kind);break;
   case "forgotSave":{const v=val("fgEnd");if(!v){toast("Indique l'heure de fin");break}const st=new Date(S.active.startedAt);const [h,m]=v.split(":").map(Number);const end=new Date(st);end.setHours(h,m,0,0);if(end<st)end.setDate(end.getDate()+1);forgotFinalize(end.getTime(),false);break}
   case "forgotUnknown":forgotFinalize(null,true);break;
   case "forgotContinue":S.active.snoozeUntil=nowMs()+30*60e3;save();closeSheet(false);openPlayer();break;
   case "durFixSave":durFixSave();break;
   case "rpeLater":{const id=a.dataset.sid;const l=S.log[id]||{};const due=nowMs()+30*60e3;S.log[id]={...l,rpeDue:due};save();Notify.scheduleRpe("rpe-"+id,due,tpl(sessionById(id)).name);closeSheet(false);offerUndo();render();toast("Rappel prévu vers "+hhmm(due)+" (visible dans Suivi › éléments à compléter)");break}
   case "showOffers":AUTH={screen:"offers",inApp:true};openOffersInApp();break;
   case "saveProfil":{const ac=me();ac.first=val("pfirst").trim()||ac.first;ac.last=val("plast").trim()||ac.last;plSave();S.profile.first=ac.first;S.profile.last=ac.last;const bw=num(val("pbw"),35,200);if(isNum(bw))S.settings.bw=bw;if(document.getElementById("spos")){S.settings.pos=val("spos").slice(0,40)||S.settings.pos;S.settings.pos2=val("spos2").slice(0,40)}save();render();toast("Profil enregistré");break}
   case "saveCompte":{const e=val("aemail").trim().toLowerCase();if(e&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)){toast("Adresse e-mail invalide");break}if(e&&Object.values(PL.accounts).some(x=>x.id!==me().id&&(x.email||"").toLowerCase()===e)){toast("Adresse déjà utilisée par un autre compte");break}me().email=e;plSave();render();toast("Compte enregistré");break}
   case "askNotifPerm":if("Notification" in window){Notification.requestPermission().then(()=>render())}else toast("Notifications indisponibles dans ce navigateur");break;
   case "toggleFaceId":toggleFaceId();break;
   case "coachDurSave":coachDurSave();break;
   case "saveFormulas":Object.keys(PL.formulas).forEach(k=>{const f=PL.formulas[k];f.price=val("fp_"+k).trim();f.engagement=val("fe_"+k).trim();f.recommended=!!(document.getElementById("fr_"+k)||{}).checked;if(k==="coaching"){f.placesLimited=!!(document.getElementById("fl_"+k)||{}).checked;f.callsNote=val("fc_"+k).trim()}});PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Formules mises à jour"});plSave();render();toast("Formules enregistrées");break;
   case "remSave":remSave();break;
   case "remIcs":remIcs();break;
   case "remAdd":remRead();if(REMD.times.length<3){const last=REMD.times[REMD.times.length-1]||"08:00";const h=Math.min(23,+last.slice(0,2)+4);REMD.times.push(pad(h)+":00")}remRefresh();break;
   case "deleteOther":deleteOther();break;
   case "saveWellness":saveWellness();break;
   case "saveFatigue":{const t=todayISO();const sc=num(val("fscore"),0,100),cm=num(val("fcmj"),10,80);const fs=[...document.querySelectorAll("[data-factor]")].filter(b=>b.getAttribute("aria-pressed")==="true").map(b=>b.dataset.factor);
     if(sc===""&&cm===""&&!fs.length)delete S.fatigue[t];else S.fatigue[t]={score:sc,cmj:cm,factors:fs,src:"saisie manuelle",at:nowISO()};save();render();toast("Bien-être enregistré");break}
   case "toggleMore":showMore=!showMore;{const p=document.getElementById("morePanel");if(p)p.hidden=!showMore;a.setAttribute("aria-expanded",showMore)}break;
   case "manualDone":openManualDone(openId);break;
   case "saveManualDone":saveManualDone();break;
   case "lighten":if(!athleteMayAdapt(sessionById(openId),"volume"))break;S.adapt[openId]={mode:"volume",targets:[],reasons:["Allégement choisi"],at:nowISO()};save();setSheet(sheetSession(openId));render();toast("Version allégée : une série de moins, RIR + 1");break;
   case "undoAdapt":delete S.adapt[openId];save();setSheet(sheetSession(openId));render();toast("Séance prévue rétablie");break;
   case "applyReco":{const s=sessionById(openId);const r=recommend(s);if(r.mode==="none")break;if(["painAsk","coach"].includes(r.mode))break;S.adapt[openId]={mode:r.mode,targets:r.targets,reasons:r.why,trig:r.trig,painZone:r.painZone,painRef:r.painRef,rule:r.rule,at:nowISO()};save();setSheet(sheetSession(openId));render();toast("Adaptation appliquée : "+r.label);break}
   case "keep":toast("Séance conservée telle qu'elle est prévue");break;
   case "replace":openSheet(`<div class="sheet-scroll">${head("Remplacer la séance","Par quoi ?")}<div class="stack tight">${[["upper","Haut du corps + mobilité"],["micro","Microdose de puissance"],["active","Récupération active"]].filter(([m])=>ruleOk(sessionById(openId),m)).map(([m,l])=>`<button class="date-pick" data-act="replaceWith" data-mode="${m}"><span class="grow"><b>${l}</b></span></button>`).join("")}</div></div>`,"Remplacer",true);break;
   case "replaceWith":if(!athleteMayAdapt(sessionById(openId),a.dataset.mode))break;S.adapt[openId]={mode:a.dataset.mode,targets:[],reasons:["Remplacement choisi (fatigue)"],rule:{asked:a.dataset.mode,used:a.dataset.mode,refused:[],auto:false},at:nowISO()};save();openSheet(sheetSession(openId),"Séance",true);render();toast("Séance remplacée : "+ADAPT_LABEL[a.dataset.mode]);break;
   case "skipFatigue":S.status[openId]={s:"missed",reason:"fatigue",comment:"",at:nowISO()};save();closeSheet();render();toast("Noté. Récupérer fait aussi partie de l'entraînement.");break;
   case "markMissed":openStatusForm(openId,"missed");break;
   case "clearStatus":delete S.status[openId];save();setSheet(sheetSession(openId));render();toast("Statut annulé");break;
   case "resetMove":delete S.moves[openId];save();closeSheet();render();toast("Séance remise à sa date");break;
   case "openPain":openPain(openId);break;
   case "savePain":savePain();break;
   case "move":if(!athleteMayMove(sessionById(openId)))break;pendingMove={id:openId};setSheet(sheetMovePicker(openId));break;
   case "confirmMove":applyMove();break;
   case "forceMove":if(!pendingMove.force){pendingMove.force=1;a.textContent="Confirmer : forcer malgré l'analyse";a.focus()}else applyMove();break;
   case "cancelMove":pendingMove=null;setSheet(sheetSession(openId));break;
   case "saveLog":{const s=sessionById(openId);const l=S.log[openId]||{};const rpe=num(val("lgRpe"),0,10);const d=num(val("lgDur"),1,300);
     const durChanged=d!==""&&d!==l.dur;S.log[openId]={...l,dur:d===""?(l.dur??null):d,durPending:d===""?!!l.durPending||!isNum(l.dur):false,hrAvg:num(val("lgHr"),30,230),rpe,rpeAt:rpe!==""?nowISO():l.rpeAt||null,
       ...(durChanged?{durHist:[...(l.durHist||[]),{old:l.dur??null,nw:d,at:nowISO(),by:"athlète",reason:"saisie de la durée réelle"}]}:{})};save();render();
     if(sheetMode==="session")setSheet(sheetSession(openId));else closeSheet();toast("Séance enregistrée"+(srpe(S.log[openId])!=null?" · "+srpe(S.log[openId])+" UA":""));break}
   case "saveClub":saveClub();break;
   case "savePlannedClub":savePlannedClub();break;
   case "toggleCancel":{const e=clubEvents().find(x=>x.id===CLUB_ID);S.club[CLUB_ID]={...(S.club[CLUB_ID]||{}),cancelled:!e.cancelled};save();openClub(CLUB_ID);render();toast(e.cancelled?"Séance rétablie":"Séance annulée : non comptée dans la charge");break}
   case "deleteClub":{delete S.club[CLUB_ID];save();closeSheet(false);render();toast("Séance ajoutée supprimée");break}
   case "createClub":createClub(a.dataset.kind);break;
   case "goTests":closeSheet(false);TAB="suivi";SUIVI_SUB="progres";render();window.scrollTo(0,0);break;
   case "prevM":{const b=calBounds();const m=addMonth(calMonth,-1);if(m>=b.min)calMonth=m;selDay=null;render();break}
   case "nextM":{const b=calBounds();const m=addMonth(calMonth,1);if(m<=b.max)calMonth=m;selDay=null;render();break}
   case "todayM":{calMonth=todayISO().slice(0,7);selDay=null;render();break}
   case "endReorg":reorg=false;render();break;
   case "cancelEdit":editTest=null;render();break;
   case "saveSettings":S.settings.barInc=num(val("sbar"),.5,10)||2.5;S.settings.dbInc=num(val("sdb"),.5,10)||2;save();render();toast("Réglages enregistrés");break;
   case "saveHrSettings":{const hm=num(val("shm"),120,230);S.settings.hrMax=hm;S.settings.hrMaxSource=val("shms");S.settings.hrMaxDate=hm?todayISO():"";save();render();toast(hm?"FC max enregistrée : zones activées":"Mode sans zones");break}
   case "saveFat":if(isCoachAccount()&&a.dataset.uid){const uid=a.dataset.uid;const vals={fatAbs:num(val("sfa"),0,100)||60,fatDrop:num(val("sfd"),1,50)||10};[["soz","otZone",1.2,1,3],["soa","otAlert",1.5,1,4],["smo","monoMax",2,1,10],["sst","strainMax",6000,500,50000]].forEach(([i,k,d,mn,mx])=>{const v=num(val(i),mn,mx);vals[k]=isNum(v)?v:d});writeAthlete(uid,X=>{Object.assign(X.settings,vals)});PL.coachLog.unshift({at:nowISO(),by:"coach",uid,what:"Seuils d'adaptation modifiés"});plSave();render();toast("Seuils enregistrés");break}
     S.settings.fatAbs=num(val("sfa"),0,100)||60;S.settings.fatDrop=num(val("sfd"),1,50)||10;[["soz","otZone",1.2,1,3],["soa","otAlert",1.5,1,4],["smo","monoMax",2,1,10],["sst","strainMax",6000,500,50000]].forEach(([i,k,d,mn,mx])=>{const v=num(val(i),mn,mx);S.settings[k]=isNum(v)?v:d});if(S.settings.otAlert<S.settings.otZone)S.settings.otAlert=S.settings.otZone;save();render();toast("Seuils enregistrés");break;
   case "resetAdj":S.loadAdjLog.push({date:todayISO(),reset:{...S.loadAdj},at:nowISO()});S.loadAdj={};save();render();toast("Progressions remises à zéro");break;
   case "timerPlus":if(TIMER){TIMER.end+=15000;clearInterval(TIMER.iv);TIMER.iv=setInterval(drawTimer,250);drawTimer()}break;
   case "timerStop":stopTimer();break;
   case "saveHrManual":saveHrManual();break;
   case "export":exportData();break;
   case "askDelete":openDeleteAccount();break;
   case "confirmDelete":deleteAccountConfirmed();break;
   case "exportCsv":exportCsv(a.dataset.kind);break;
   case "consentOk":S.settings.consent={at:nowISO()};save();closeSheet(false);polarScan();break;
   case "pConnect":if(!S.settings.consent)openConsent();else polarScan();break;
   case "pStart":POLAR.adapter.startSession({mode:POLAR.offlineMode}).catch(e=>{POLAR.error=e.message;updatePolarUI()});break;
   case "pPause":POLAR.adapter.pauseSession();break;
   case "pResume":POLAR.adapter.resumeSession();break;
   case "pStop":polarStop();break;
   case "pDisconnect":POLAR.adapter.disconnect();break;
   case "pReconnect":(POLAR.adapter.reconnect?POLAR.adapter.reconnect():POLAR.adapter.connect(POLAR.adapter.device&&POLAR.adapter.device.id)).catch(e=>{POLAR.error=e.message;POLAR.adapter.setState("error")});break;
   case "pSimLoss":POLAR.adapter.simulateLoss&&POLAR.adapter.simulateLoss();break;
   case "pSync":polarSync();break;
  }
});
document.addEventListener("change",ev=>{
  const t=ev.target;
  if(t.id==="mockToggle"){S.settings.mock=t.checked;save();POLAR.adapter&&POLAR.adapter.disconnect&&POLAR.adapter.disconnect();POLAR.adapter=null;render();toast(t.checked?"Simulation activée : données fictives":"Simulation désactivée")}
  if(t.name==="pmode")POLAR.offlineMode=t.value;
  if(t.id==="hrFile"&&t.files&&t.files[0])importHrFile(t.files[0]);
  if(t.id==="msgFile"&&t.files&&t.files[0]){const txt=val("msgTxt");msgPickFile(t.files[0]);setTimeout(()=>{const ta=document.getElementById("msgTxt");if(ta&&txt)ta.value=txt},400)}
});
document.addEventListener("input",ev=>{const id=ev.target.id;if(id==="cDur")updateSrpe("c");if(id==="oDur")updateSrpe("o");if(id==="lgDur")updateSrpe("lg")});
function updateSrpe(g){const ids={c:["cDur","cOut"],lg:["lgDur","lgOut"],o:["oDur","oOut"]}[g];if(!ids)return;const d=num(val(ids[0]),0,600),r=num(val(g+"Rpe"),0,10);const o=document.getElementById(ids[1]);if(!o)return;
  o.innerHTML=isNum(d)&&isNum(r)?"Charge interne : "+d+" min × RPE "+r+" = <b>"+Math.round(d*r)+" UA</b>":"sRPE = durée × RPE, calculé automatiquement."}
document.addEventListener("submit",ev=>{if(ev.target.id!=="testForm")return;ev.preventDefault();const prevRM=oneRMs();
  const rec={date:val("tdate")||todayISO(),bw:num(val("tbw"),40,150),cmj:num(val("tcmj"),10,80),squat3:num(val("tsquat"),20,300),bench3:num(val("tbench"),20,250),dl3:num(val("tdl"),20,350),pullReps:num(val("tpreps"),0,60),pullLoad3:num(val("tpload"),0,100),dm8:num(val("tdm8"),1,80),rdlRefW:num(val("trdlw"),20,300),rdlRefR:num(val("trdlr"),1,10),src:"saisie manuelle"};
  document.querySelectorAll("#testForm [data-ctest]").forEach(i=>{const x=num(i.value,0,100000);rec[i.dataset.ctest]=x});
  if(isNum(rec.bw))S.settings.bw=rec.bw;
  if(editTest!=null)S.tests[editTest]={...S.tests[editTest],...rec};
  else{const i=S.tests.findIndex(x=>x.date===rec.date);if(i>=0)S.tests[i]={...S.tests[i],...Object.fromEntries(Object.entries(rec).filter(([,v])=>v!==""))};else S.tests.push(rec)}
  editTest=null;save();closeSheet(false);render();toast("Résultats enregistrés, charges recalculées");celebrateTests(prevRM);
});
document.addEventListener("keydown",ev=>{
  if((ev.key==="Enter"||ev.key===" ")&&ev.target.classList&&ev.target.classList.contains("cell")&&!$("#layer [role=dialog]")){ev.preventDefault();ev.target.click()}
});
function offerUndo(){if(!UNDO)return;const u=UNDO;UNDO=null;toast("Séance validée",{label:"Annuler",fn:()=>{if(u.prev)S.status[u.id]=u.prev;else delete S.status[u.id];save();render();toast("Validation annulée")}})}
function progClick(l,res){
  const box=document.getElementById("pg-"+l);if(!box)return;const st=progStep(l);
  if(l==="pull"&&!oneRMs().pull){box.insertAdjacentHTML("beforeend",`<p class="small">${res==="ok"?"Ajoute 1 répétition par série la prochaine fois, ou fais un 3RM lesté pour passer aux charges calculées.":"Garde la même plage de répétitions."}</p>`);return}
  box.querySelectorAll(".prop").forEach(e=>e.remove());
  box.insertAdjacentHTML("beforeend",res==="ok"?`<div class="prop stack tight"><p class="small">Proposition : +${fmt(st)} kg pour les prochaines séances (incrément de ton matériel).</p><div class="grid2"><button class="btn small" data-progapply="${l}" data-delta="${st}">Appliquer +${fmt(st)} kg</button><button class="btn ghost small" data-act="keep">Garder la charge</button></div></div>`:`<div class="prop stack tight"><p class="small">Proposition : garder la charge, ou la baisser de ${fmt(st)} kg si la technique s'est dégradée.</p><div class="grid2"><button class="btn ghost small" data-act="keep">Maintenir</button><button class="btn secondary small" data-progapply="${l}" data-delta="${-st}">Baisser de ${fmt(st)} kg</button></div></div>`);
}
let CLUB_ID=null;
function saveClub(){
  const e=clubEvents().find(x=>x.id===CLUB_ID);if(!e)return;
  const rpe=num(val("cRpe"),0,10);const o=S.club[CLUB_ID]||{};const prev=o.actual||{};
  const a=sanitizeActual({...prev,dur:val("cDur"),rpe,hrAvg:val("cHrAvg"),hrMax:val("cHrMax"),zones:readZones("cZ",0)||prev.zones,pos:val("cPos"),minutes:e.kind==="match"?val("cMin"):"",content:val("cContent"),comment:val("cCom"),flags:clubDraft.flags,src:prev.src&&prev.src!=="manuel"?prev.src+" + saisie manuelle":"saisie manuelle",at:nowISO(),rpeAt:rpe!==""?(prev.rpe===rpe&&prev.rpeAt?prev.rpeAt:nowISO()):null});
  S.club[CLUB_ID]={...o,actual:a};save();closeSheet(false);render();
  const v=srpe(a);toast(v!=null?"Séance enregistrée · "+v+" UA":"Séance enregistrée (RPE à compléter)");
  if(a.flags.includes("douleur"))setTimeout(()=>toast("Douleur signalée : si elle persiste, demande l'avis d'un professionnel."),2700);
}
function savePlannedClub(){
  const e=clubEvents().find(x=>x.id===CLUB_ID);if(!e)return;const o=S.club[CLUB_ID]||{};
  const d=val("eDate");if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast("Date invalide");return}
  const ch={date:d,time:val("eTime")||e.time,dur:num(val("eDur"),10,240)||e.dur,plannedRPE:num(val("eRpe"),0,10)||e.plannedRPE,content:val("eContent").slice(0,500),intensity:val("eInt").slice(0,80)};
  if(e.kind==="match")ch.title=val("eTitle").slice(0,120)||e.title;
  S.club[CLUB_ID]={...o,...ch};save();openClub(CLUB_ID);render();toast(e.kind==="match"&&d!==e.date?"Match reporté : séances recalculées":"Séance prévue mise à jour");
}
function createClub(kind){
  const d=val("nDate");if(!/^\d{4}-\d{2}-\d{2}$/.test(d)){toast("Choisis une date");return}
  const id=uid(kind==="match"?"m":"c");
  S.club[id]={added:true,kind,date:d,time:val("nTime")||(kind==="match"?"15:00":"19:30"),dur:num(val("nDur"),10,240)||(kind==="match"?90:105),plannedRPE:num(val("nRpe"),0,10)||(kind==="match"?8:6),
    title:kind==="match"?(val("nTitle").slice(0,120)||"Match ajouté"):"Séance club",comp:kind==="match"?val("nComp").slice(0,60):"",venue:kind==="match"?val("nVenue"):"",content:kind==="match"?(val("nComp")||"Match ajouté"):(val("nContent").slice(0,500)||"Séance imprévue"),intensity:kind==="match"?"Maximale":"Inconnue avant la séance",speed:false};
  save();closeSheet(false);selDay=d;render();toast(kind==="match"?"Match ajouté : séances recalculées":"Séance club ajoutée");
}
/* ---------- Polar : actions ---------- */
async function polarScan(){const a=POLAR.adapter;POLAR.error=null;POLAR.devices=[];
  try{const list=await a.scan();list.forEach(d=>{if(!POLAR.devices.some(x=>x.id===d.id))POLAR.devices.push(d)});if(POLAR.devices.length===1&&a.kind==="simulation")await polarConnect(POLAR.devices[0].id);else updatePolarUI()}
  catch(e){POLAR.error=e.message;if(a.kind!=="manual")a.setState("error");updatePolarUI()}}
async function polarConnect(id){try{POLAR.error=null;await POLAR.adapter.connect(id)}catch(e){POLAR.error="Connexion impossible : "+e.message;POLAR.adapter.setState("error")}}
async function polarStop(){
  const a=POLAR.adapter;try{const rec=await a.stopSession();if(!rec)return;S.hr.push(rec);save();Notify.scheduleRpe("rpe-hr-"+rec.id,rec.end+18e5,"séance");openLinkHr(rec)}catch(e){POLAR.error="Arrêt impossible : "+e.message+" Les données déjà reçues sont conservées.";updatePolarUI()}}
async function polarSync(){try{const recs=await POLAR.adapter.fetchOfflineRecordings();recs.forEach(r=>S.hr.push(r));save();render();toast(recs.length?recs.length+" séance(s) récupérée(s) depuis la ceinture":"Aucune séance enregistrée dans la ceinture")}catch(e){POLAR.error="Synchronisation impossible : "+e.message;updatePolarUI()}}
function saveHrManual(){
  const d=val("hrDate")||todayISO(),dur=num(val("hrDur"),1,300),avg=num(val("hrAvgIn"),30,230),mx=num(val("hrMaxIn"),30,240);
  if(!isNum(dur)||!isNum(avg)){toast("Indique au moins la durée et la FC moyenne");return}
  const zm=readZones("hrZ",1);const start=dtMs(d,"12:00");
  const rec={id:uid("hr"),start,end:start+dur*60000,durMin:dur,avg,max:isNum(mx)?mx:null,zones:zm?zm.map(z=>isNum(z)?z*60:0):null,curve:[],source:"saisie manuelle (résumé Polar)",device:null,rrCount:0,linked:null};
  S.hr.push(rec);save();openLinkHr(rec);
}
function importHrFile(file){
  const msg=document.getElementById("hrImportMsg");const r=new FileReader();
  r.onload=()=>{try{const txt=String(r.result);const p=/<TrainingCenterDatabase/i.test(txt)?parseTCX(txt):parsePolarCSV(txt);
      if(!p.samples.length)throw new Error("aucune fréquence cardiaque trouvée");
      const rec=summarizeHR(p.samples,{start:p.start,end:p.start+(p.samples[p.samples.length-1][0]+1)*1000,source:"import "+p.kind,device:null});S.hr.push(rec);save();
      if(msg)msg.innerHTML=`Fichier importé : ${fmt(rec.durMin)} min, FC moy ${rec.avg}, max ${rec.max}.`+(p.hrMaxProfile&&!S.settings.hrMax?` <button class="btn ghost small" data-act="useProfileHrMax" data-v="${p.hrMaxProfile}">Utiliser la FC max de ton profil Polar (${p.hrMaxProfile} bpm)</button>`:"");
      if(p.hrMaxProfile)POLAR.profileHrMax=p.hrMaxProfile;
      openLinkHr(rec);
    }catch(e){if(msg)msg.textContent="Import impossible : "+e.message+". Essaie l'export TCX depuis Polar Flow."}};
  r.readAsText(file);
}
document.addEventListener("click",ev=>{const b=ev.target.closest('[data-act="useProfileHrMax"]');if(!b)return;S.settings.hrMax=+b.dataset.v;S.settings.hrMaxSource="Polar (profil)";S.settings.hrMaxDate=todayISO();save();render();toast("FC max du profil Polar enregistrée")});
function parseTCX(txt){
  const doc=new DOMParser().parseFromString(txt,"application/xml");const tps=[...doc.getElementsByTagName("Trackpoint")];
  let start=null;const samples=[];
  tps.forEach(tp=>{const t=tp.getElementsByTagName("Time")[0],h=tp.getElementsByTagName("HeartRateBpm")[0];if(!t||!h)return;const v=h.getElementsByTagName("Value")[0];const ms=Date.parse(t.textContent);const hr=+(v&&v.textContent);if(!isFinite(ms)||!hr)return;if(start==null)start=ms;samples.push([Math.round((ms-start)/1000),hr])});
  return{kind:"TCX",start:start||nowMs(),samples};
}
/* Export CSV de Polar Flow : format reconnu au mieux (non vérifié sur un vrai fichier) */
function parsePolarCSV(txt){
  const lines=txt.split(/\r?\n/).map(l=>l.split(","));let hi=-1;
  for(let i=0;i<lines.length;i++){const c=lines[i].map(x=>x.trim());if(c.includes("Time")&&c.some(x=>/^HR/i.test(x))){hi=i;break}}
  if(hi<0)throw new Error("colonnes « Time » et « HR (bpm) » introuvables");
  const cols=lines[hi].map(x=>x.trim());const ti=cols.indexOf("Time"),hiCol=cols.findIndex(x=>/^HR/i.test(x));
  const samples=[];for(let i=hi+1;i<lines.length;i++){const r=lines[i];if(!r[ti])continue;const p=r[ti].split(":").map(Number);const sec=p.length===3?p[0]*3600+p[1]*60+p[2]:NaN;const hr=+r[hiCol];if(isFinite(sec)&&hr>30)samples.push([sec,hr])}
  let start=nowMs(),hrMaxProfile=null;const h0=lines[0].map(x=>x.trim());
  if(lines[1]){const di=h0.indexOf("Date"),si=h0.indexOf("Start time"),mi=h0.indexOf("HR max");
    if(di>=0&&lines[1][di]){const dp=lines[1][di].split(/[-./]/);const t=(si>=0&&lines[1][si])||"12:00:00";const d=dp[0].length===4?dp.join("-"):dp.reverse().join("-");const ms=Date.parse(d+"T"+t);if(isFinite(ms))start=ms}
    if(mi>=0&&+lines[1][mi]>120)hrMaxProfile=+lines[1][mi]}
  return{kind:"CSV",start,samples,hrMaxProfile};
}
/* ---------- Appui long (2 s) + glisser-déposer, pensé pour Safari iPhone ---------- */
let pressTimer=null,pressStart=null,drag=null,suppressClick=false;
document.addEventListener("pointerdown",ev=>{
  const chip=ev.target.closest(".ev.sess");if(!chip||TAB!=="cal")return;
  if(reorg){ev.preventDefault();startDrag(chip,ev);return}
  pressStart={x:ev.clientX,y:ev.clientY,chip};
  if(!matchMedia("(prefers-reduced-motion: reduce)").matches){chip.style.transition="transform 2s linear";chip.style.transform="scale(1.1)"}
  pressStart.last=ev;
  pressTimer=setTimeout(()=>{pressTimer=null;const p=pressStart;pressStart=null;if(!p)return;Native.haptic("medium");suppressClick=true;chip.style.transform="";chip.style.transition="";
    startDrag(chip,p.last);markCompatible(chip.dataset.sid)},2000);
});
function cancelPress(){if(pressTimer){clearTimeout(pressTimer);pressTimer=null}if(pressStart&&pressStart.chip){pressStart.chip.style.transform="";pressStart.chip.style.transition=""}pressStart=null}
document.addEventListener("pointermove",ev=>{
  if(pressStart){pressStart.last=ev;if(Math.hypot(ev.clientX-pressStart.x,ev.clientY-pressStart.y)>10)cancelPress()}
  if(!drag)return;ev.preventDefault();drag.ghost.style.left=ev.clientX+"px";drag.ghost.style.top=ev.clientY+"px";
  document.querySelectorAll(".drop,.dragover").forEach(e=>e.classList.remove("drop","dragover"));
  const el=document.elementFromPoint(ev.clientX,ev.clientY);if(!el){drag.target=null;return}
  const c=el.closest(".ev.sess");if(c&&c.dataset.sid!==drag.id){c.classList.add("dragover");drag.target={swap:c.dataset.sid};return}
  const cell=el.closest(".cell");if(cell){cell.classList.add("drop");drag.target={date:cell.dataset.date}}else drag.target=null;
},{passive:false});
document.addEventListener("pointerup",()=>{cancelPress();if(drag)endDrag()});
document.addEventListener("pointercancel",()=>{cancelPress();if(drag){drag.ghost.remove();drag=null;render()}});
document.addEventListener("contextmenu",ev=>{if(ev.target.closest(".ev"))ev.preventDefault()});
/* Jours compatibles : aucun match ni séance déjà prévue, pas la veille d'un match (affichage indicatif, l'analyse vient au dépôt) */
function markCompatible(id){const s=sessionById(id);const m=new Set(clubEvents().filter(e=>e.kind==="match").map(e=>e.date));const busy=new Set(sessions().filter(x=>x.id!==id&&!isOpt(x)).map(x=>x.date));
  document.querySelectorAll(".cell[data-date]").forEach(c=>{const d=c.dataset.date;if(d<todayISO())return;const nx=iso(new Date(new Date(d+"T12:00").getTime()+864e5));if(!m.has(d)&&!busy.has(d)&&!m.has(nx))c.classList.add("ok-day")})}
function startDrag(chip,ev){const id=chip.dataset.sid;const g=document.createElement("div");g.className="drag-ghost";g.textContent=tpl(sessionById(id)).name;g.style.left=ev.clientX+"px";g.style.top=ev.clientY+"px";document.body.appendChild(g);drag={id,ghost:g,target:null};chip.style.opacity=".35"}
function endDrag(){
  const d=drag;drag=null;d.ghost.remove();document.querySelectorAll(".drop,.dragover,.ok-day").forEach(e=>e.classList.remove("drop","dragover","ok-day"));suppressClick=true;setTimeout(()=>suppressClick=false,350);
  const s=sessionById(d.id);if(!d.target){render();return}
  openId=d.id;
  if(d.target.swap){const o=sessionById(d.target.swap);openSheet(sheetVerdict(d.id,o.date,o.id),"Analyse du déplacement");return}
  if(d.target.date&&d.target.date!==s.date){const occ=sessions().find(x=>x.id!==d.id&&x.date===d.target.date&&!isOpt(x));openSheet(sheetVerdict(d.id,d.target.date,occ?occ.id:null),"Analyse du déplacement");return}
  render();
}

