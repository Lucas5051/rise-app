/* =====================================================================
   MODULE 11 · CEINTURE POLAR — interface PolarAdapter
   Méthodes communes : isAvailable · scan · connect · disconnect · getState · getCapabilities
   · startSession · pauseSession · resumeSession · stopSession · fetchOfflineRecordings
   Événements : state · device · hr {hr, rrs} · battery · capabilities · session
   ===================================================================== */
class PolarAdapter{
  constructor(kind,label){this.kind=kind;this.label=label;this.handlers={};this.state="disconnected";this.device=null;this.caps={hr:false,rr:false,battery:false,offlineRecording:false};this.battery=null;this.rec=null;this.lastHr=null;this.lastAt=null}
  on(ev,fn){(this.handlers[ev]=this.handlers[ev]||[]).push(fn)}
  emit(ev,d){(this.handlers[ev]||[]).forEach(f=>{try{f(d)}catch(e){console.warn(e)}})}
  setState(s,detail){this.state=s;this.emit("state",{state:s,detail})}
  isAvailable(){return false}
  getState(){return this.state}
  getCapabilities(){return{...this.caps}}
  async scan(){throw new Error("Recherche indisponible avec cet adaptateur.")}
  async connect(){throw new Error("Connexion indisponible avec cet adaptateur.")}
  async disconnect(){}
  async fetchOfflineRecordings(){return []}
  /* Séance : commune à tous les adaptateurs, alimentée par les événements "hr" */
  async startSession(opts={}){this.rec={start:nowMs(),pausedMs:0,pauseAt:null,samples:[],rr:0,mode:opts.mode||"live"};this.emit("session",{state:"running"})}
  pauseSession(){if(this.rec&&!this.rec.pauseAt){this.rec.pauseAt=nowMs();this.emit("session",{state:"paused"})}}
  resumeSession(){if(this.rec&&this.rec.pauseAt){this.rec.pausedMs+=nowMs()-this.rec.pauseAt;this.rec.pauseAt=null;this.emit("session",{state:"running"})}}
  async stopSession(){if(!this.rec)return null;if(this.rec.pauseAt)this.resumeSession();const r=this.rec;this.rec=null;
    const out=summarizeHR(r.samples,{start:r.start,end:nowMs(),pausedMs:r.pausedMs,source:this.kind,device:this.device&&this.device.name,rr:r.rr});
    this.emit("session",{state:"stopped"});return out}
  _hr(hr,rrs){this.lastHr=hr;this.lastAt=nowMs();
    if(this.rec&&!this.rec.pauseAt){this.rec.samples.push([Math.round((nowMs()-this.rec.start-this.rec.pausedMs)/1000),hr]);this.rec.rr+=(rrs||[]).length}
    this.emit("hr",{hr,rrs:rrs||[],at:this.lastAt})}
}
/* Résumé d'un enregistrement : durée, moyenne, max, temps par zone, courbe réduite */
function summarizeHR(samples,o){
  const hm=+S.settings.hrMax;const valid=samples.filter(s=>s[1]>30&&s[1]<240);
  const avg=valid.length?Math.round(valid.reduce((a,s)=>a+s[1],0)/valid.length):null;
  const max=valid.length?Math.max(...valid.map(s=>s[1])):null;
  const zones=hm?[0,0,0,0,0]:null;
  if(zones)valid.forEach((s,i)=>{const z=zoneOf(s[1],hm);const dt=i<valid.length-1?Math.min(10,valid[i+1][0]-s[0]):1;if(z>=0)zones[z]+=dt});
  const step=Math.max(1,Math.ceil(valid.length/300));const curve=valid.filter((_,i)=>i%step===0);
  const durMin=Math.round(((o.end-o.start-(o.pausedMs||0))/60000)*10)/10;
  return{id:uid("hr"),start:o.start,end:o.end,durMin,avg,max,zones,curve,source:o.source,device:o.device||null,rrCount:o.rr||0,linked:null};
}
/* Version web : aucune connexion Bluetooth (Safari iOS ne propose pas Web Bluetooth) */
class ManualPolarAdapter extends PolarAdapter{
  constructor(){super("manual","Saisie manuelle");this.state="manual"}
  isAvailable(){return true}
  async scan(){throw new Error("Connexion directe disponible dans la version iPhone de l'application. Tu peux actuellement saisir ou importer le résumé Polar.")}
}
/* Simulation clairement identifiée : sert uniquement à tester l'interface sans matériel */
class MockPolarAdapter extends PolarAdapter{
  constructor(){super("simulation","Simulation (données fictives)");this.timer=null;this.base=72}
  isAvailable(){return true}
  async scan(){this.setState("scanning");await wait(700);const d={id:"SIM-0001",name:"Capteur simulé · données fictives",rssi:-50};this.emit("device",d);this.setState("disconnected");return[d]}
  async connect(id){this.setState("connecting");await wait(600);this.device={id,name:"Capteur simulé · données fictives"};this.caps={hr:true,rr:true,battery:true,offlineRecording:false};this.battery=76;
    this.emit("capabilities",this.caps);this.emit("battery",{level:76});this.setState("connected");this._run()}
  _run(){clearInterval(this.timer);this.timer=setInterval(()=>{const target=this.rec&&!this.rec.pauseAt?150:80;this.base+= (target-this.base)*0.08+(Math.random()*6-3);const hr=Math.max(55,Math.min(195,Math.round(this.base)));this._hr(hr,[Math.round(60000/hr)])},1000)}
  simulateLoss(){clearInterval(this.timer);this.setState("lost")}
  async reconnect(){this.setState("connecting");await wait(500);this.setState(this.rec?"recording":"connected");this._run()}
  async disconnect(){clearInterval(this.timer);this.device=null;this.setState("disconnected")}
}
/* Version iPhone : passerelle native Capacitor « PolarBle » (SDK officiel Polar BLE) */
class NativePolarAdapter extends PolarAdapter{
  constructor(){super("natif","Ceinture Polar (application iPhone)");this.plugin=null;this.subs=[]}
  isAvailable(){const C=window.Capacitor;return !!(C&&C.Plugins&&C.Plugins.PolarBle&&(!C.isNativePlatform||C.isNativePlatform()))}
  async _init(){if(this.plugin)return;this.plugin=window.Capacitor.Plugins.PolarBle;const p=this.plugin;
    this.subs.push(await p.addListener("connectionState",e=>{if(e.state==="connected"){this.device={id:e.deviceId,name:e.name||e.deviceId};this.setState(this.rec?"recording":"connected")}else if(e.state==="connecting")this.setState("connecting");else if(e.state==="lost")this.setState("lost");else this.setState("disconnected")}));
    this.subs.push(await p.addListener("hr",e=>this._hr(e.hr,e.rrsMs)));
    this.subs.push(await p.addListener("battery",e=>{this.battery=e.level;this.emit("battery",{level:e.level})}));
    this.subs.push(await p.addListener("features",e=>{const f=e.features||[];this.caps={hr:f.includes("hr"),rr:f.includes("hr"),battery:f.includes("battery"),offlineRecording:f.includes("h10ExerciseRecording")||f.includes("offlineRecording")};this.emit("capabilities",this.caps)}));
    this.subs.push(await p.addListener("deviceFound",d=>this.emit("device",d)));
    this.subs.push(await p.addListener("error",e=>{POLAR.error=e.message;this.emit("state",{state:this.state})}));
  }
  async scan(){await this._init();this.setState("scanning");try{const r=await this.plugin.scan({timeoutMs:8000});return r.devices||[]}finally{if(this.state==="scanning")this.setState("disconnected")}}
  async connect(id){await this._init();this.setState("connecting");await this.plugin.connect({deviceId:id})}
  async disconnect(){if(this.plugin)await this.plugin.disconnect();this.setState("disconnected")}
  async startSession(o={}){await super.startSession(o);if(o.mode==="device")await this.plugin.startDeviceRecording({exerciseId:"usci-"+Date.now()})}
  async stopSession(){const mode=this.rec&&this.rec.mode;const r=await super.stopSession();if(mode==="device"){await this.plugin.stopDeviceRecording();if(r)r.pendingDeviceSync=true}return r}
  async fetchOfflineRecordings(){await this._init();this.setState("syncing");try{const list=(await this.plugin.listDeviceRecordings()).recordings||[];const out=[];for(const e of list){const d=await this.plugin.fetchDeviceRecording({entryId:e.entryId});const st=Date.parse(e.date)||nowMs();out.push(summarizeHR((d.samples||[]).map((hr,i)=>[i*(d.intervalS||1),hr]),{start:st,end:st+(d.samples||[]).length*(d.intervalS||1)*1000,source:"ceinture (mémoire)",device:this.device&&this.device.name}))}return out}finally{this.setState(this.device?"connected":"disconnected")}}
}
/* Polar Flow (AccessLink) : nécessite OAuth2 + un serveur qui garde les jetons. Rien n'est stocké côté navigateur. */
class PolarAccessLinkAdapter{
  constructor(){this.kind="accesslink"}
  status(){return S.settings.accessLinkUrl?{configured:true,label:"Serveur Polar Flow configuré (non testé)"}:{configured:false,label:"Connexion Polar Flow non configurée"}}
  async fetchExercises(since){const u=S.settings.accessLinkUrl;if(!u)throw new Error("Connexion Polar Flow non configurée");
    const r=await fetch(u.replace(/\/$/,"")+"/polar/exercises?since="+encodeURIComponent(since||""),{credentials:"include"});if(!r.ok)throw new Error("Serveur Polar Flow : erreur "+r.status);return r.json()}
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const POLAR_LABEL={manual:"Mode manuel",disconnected:"Non connectée",scanning:"Recherche…",connecting:"Connexion…",connected:"Connectée",recording:"Séance en cours",paused:"Séance en pause",lost:"Connexion perdue",syncing:"Synchronisation…",error:"Erreur"};
const POLAR={adapter:null,devices:[],error:null,lastRecord:null,offlineMode:"live",tick:null};
function pickAdapter(){
  const nat=new NativePolarAdapter();
  const a=nat.isAvailable()?nat:S.settings.mock?new MockPolarAdapter():new ManualPolarAdapter();
  if(POLAR.adapter&&POLAR.adapter.kind===a.kind)return;
  if(POLAR.adapter&&POLAR.adapter.disconnect)try{POLAR.adapter.disconnect()}catch(e){}
  POLAR.adapter=a;POLAR.devices=[];POLAR.error=null;
  a.on("state",()=>updatePolarUI());a.on("hr",()=>updatePolarUI(true));a.on("battery",()=>updatePolarUI());
  a.on("device",d=>{if(!POLAR.devices.some(x=>x.id===d.id))POLAR.devices.push(d);updatePolarUI()});
  a.on("session",e=>{if(e.state==="running")a.setState("recording");else if(e.state==="paused")a.setState("paused");else if(e.state==="stopped")a.setState(a.device?"connected":"disconnected")});
}
const PolarAccessLink=new PolarAccessLinkAdapter();

/* Saisie réelle d'une séance club : valeurs bornées */
function sanitizeActual(a){
  const fl=Array.isArray(a.flags)?a.flags.filter(f=>FLAG_LABEL[f]):[];
  const zones=Array.isArray(a.zones)&&a.zones.length===5?a.zones.map(z=>num(z,0,300)):null;
  return{dur:num(a.dur,0,300),rpe:num(a.rpe,0,10),hrAvg:num(a.hrAvg,30,230),hrMax:num(a.hrMax,30,240),zones,pos:String(a.pos||"").slice(0,40),minutes:num(a.minutes,0,130),content:String(a.content||"").slice(0,500),comment:String(a.comment||"").slice(0,500),flags:fl,at:a.at||nowISO(),src:a.src||"manuel",hrId:a.hrId||null,rpeAt:isNum(a.rpe)?(a.rpeAt||nowISO()):null};
}

