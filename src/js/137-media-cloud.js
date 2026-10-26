/* =====================================================================
   DOMAINE · MÉDIAS D'EXERCICES SUR LE SERVEUR (Supabase Storage)
   - Plus aucun média lourd dans localStorage en production : photos (compressées sur l'appareil, 720 px, JPEG)
     et vidéos (MP4/MOV, 50 Mo max) vont dans le compartiment privé « exercise-media/<coach>/<exercice>/ ».
   - Formats et tailles contrôlés deux fois : dans l'appli et par le serveur (règles du compartiment).
   - Lecture par URL signée temporaire (1 h) ; les clients ne voient que les fiches PUBLIÉES de LEUR coach.
   - Droits d'utilisation obligatoires avant tout envoi ; suppression réelle du fichier.
   - Mode démonstration : comportement v9 (photo compressée sur l'appareil).
   ===================================================================== */
const MEDIA_URLS={};let MEDIA_FETCH=new Set();
const isSbMedia=v=>typeof v==="string"&&v.startsWith("sb:");
const slugEx=n=>n.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,60)||"exercice";
/* Source affichable d'un média (URL signée récupérée à la demande, puis nouvel affichage) */
function mediaSrc(v){if(!isSbMedia(v))return v;const path=v.slice(3);const c=MEDIA_URLS[path];if(c&&c.exp>Date.now())return c.url;
  if(Cloud.isCloud()&&!MEDIA_FETCH.has(path)){MEDIA_FETCH.add(path);Cloud.sb.storage.from("exercise-media").createSignedUrl(path,3600).then(r=>{MEDIA_FETCH.delete(path);
    if(r.data&&r.data.signedUrl){MEDIA_URLS[path]={url:r.data.signedUrl,exp:Date.now()+3500e3};document.querySelectorAll(`[data-sbmedia="${CSS.escape(path)}"]`).forEach(el=>{el.src=r.data.signedUrl})}})}
  return ""}
const mediaAttr=v=>isSbMedia(v)?` data-sbmedia="${esc(v.slice(3))}"`:"";
function dataUrlBlob(d){const [h,b]=d.split(",");const mime=(/data:([^;]+)/.exec(h)||[])[1]||"image/jpeg";const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:mime})}
/* Fiche d'exercice ↔ table « exercises » */
const libRow=(name,c)=>{const f=exLib(name);return{coach_id:sidOf("coach"),name,category:c.cat||f.cat||"",cues:(c.cues&&c.cues.length?c.cues:f.cues)||[],errors:(c.errors&&c.errors.length?c.errors:f.errors)||[],
  muscles:String(c.muscles||f.muscles||"").split(",").map(x=>x.trim()).filter(Boolean),equipment:c.equip||f.equip||"",alternative:c.alt||f.alt||"",status:(c.status||f.status)==="publie"?"published":"draft",
  extra:{video_link:c.video&&!isSbMedia(c.video)?c.video:null,rights:c.rights||""}}};
async function ensureExerciseRow(name){const c=PL.library[name]||{};const r=await Cloud.sb.from("exercises").upsert(libRow(name,c),{onConflict:"coach_id,name"}).select("id").single();if(r.error)throw r.error;return r.data.id}
async function uploadMedia(name,k,blob,mime){
  if(!Cloud.isCloud())return false;if(navigator.onLine===false){toast("Connexion requise pour envoyer un média");return false}
  const c=PL.library[name]=PL.library[name]||{};if(!c.rights||c.rights.trim().length<3){toast("Indique d'abord l'origine et les droits d'utilisation du média (champ « Droits »), puis enregistre la fiche.");return false}
  const okMime=["image/jpeg","image/png","image/webp","video/mp4","video/quicktime"];if(!okMime.includes(mime)){toast("Format non accepté");return false}
  if(blob.size>(mime.startsWith("video")?50:10)*1024*1024){toast(mime.startsWith("video")?"Vidéo trop lourde (50 Mo maximum)":"Image trop lourde");return false}
  const view={photo:"main",photoFront:"front",photoSide:"side",video:"video"}[k]||"main";
  const path=`${sidOf("coach")}/${slugEx(name)}/${view}-${Date.now().toString(36)}.${mime==="video/quicktime"?"mov":mime.split("/")[1].replace("jpeg","jpg")}`;
  toast("Envoi du média…");
  try{const exId=await ensureExerciseRow(name);
    const up=await Cloud.sb.storage.from("exercise-media").upload(path,blob,{contentType:mime,upsert:false});if(up.error)throw up.error;
    const ins=await Cloud.sb.from("exercise_media").insert({exercise_id:exId,coach_id:sidOf("coach"),view,storage_path:path,mime,bytes:blob.size,rights:c.rights,status:(c.status==="publie"?"published":"draft")});
    if(ins.error){await Cloud.sb.storage.from("exercise-media").remove([path]);throw ins.error}
    const prev=c[k];c[k]="sb:"+path;PL.coachLog.unshift({at:nowISO(),by:"coach",what:"Média envoyé ("+view+") : "+name+" · "+fmtKb(blob.size)});plSave();
    if(isSbMedia(prev))await deleteMedia(prev.slice(3));
    if(sheetMode==="libEdit")openLibEdit(name);render();toast("Média enregistré sur le serveur");return true}
  catch(e){toast("Envoi impossible : "+(e.message||"erreur serveur"));return false}}
async function deleteMedia(path){try{await Cloud.sb.storage.from("exercise-media").remove([path]);await Cloud.sb.from("exercise_media").delete().eq("storage_path",path)}catch(e){}}
/* Lecture serveur des fiches (coach : les siennes ; client : les fiches publiées de son coach) */
async function pullLibrary(){if(!Cloud.isCloud())return;try{
  const ex=await Cloud.sb.from("exercises").select("id,name,category,cues,errors,muscles,equipment,alternative,status,extra");if(ex.error)return;
  const md=await Cloud.sb.from("exercise_media").select("exercise_id,view,storage_path,status,rights");const byEx={};(md.data||[]).forEach(m=>{(byEx[m.exercise_id]=byEx[m.exercise_id]||[]).push(m)});
  const keyOf={main:"photo",front:"photoFront",side:"photoSide",video:"video"};
  (ex.data||[]).forEach(e=>{const c=PL.library[e.name]=PL.library[e.name]||{};Object.assign(c,{cat:e.category||c.cat,cues:e.cues,errors:e.errors,muscles:(e.muscles||[]).join(", "),equip:e.equipment,alt:e.alternative,
    status:e.status==="published"?"publie":"a_completer",rights:(e.extra||{}).rights||c.rights||"",srv:true});if((e.extra||{}).video_link)c.video=e.extra.video_link;
    (byEx[e.id]||[]).forEach(m=>{c[keyOf[m.view]]="sb:"+m.storage_path})});
  plSave(true)}catch(e){console.warn(e)}}
