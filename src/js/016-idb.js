/* =====================================================================
   DOMAINE · STOCKAGE HORS LIGNE (IndexedDB)
   - « kv » : copies locales (programme, séances, dernière synchro)
   - « outbox » : file des modifications en attente d'envoi au serveur (survit à la fermeture de l'appli)
   Repli automatique sur localStorage si IndexedDB est indisponible (navigation privée, aperçu).
   ===================================================================== */
const IDB={db:null,ok:false,mem:{kv:{},outbox:{}},
  async open(){if(this.db)return this.db;
    if(!("indexedDB" in window))return null;
    try{this.db=await new Promise((res,rej)=>{const r=indexedDB.open("usci-muscu",1);
      r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains("kv"))d.createObjectStore("kv");if(!d.objectStoreNames.contains("outbox"))d.createObjectStore("outbox",{keyPath:"id"})};
      r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);setTimeout(()=>rej(new Error("idb timeout")),3000)});this.ok=true}catch(e){this.db=null;this.ok=false}
    return this.db},
  async tx(store,mode,fn){const d=await this.open();
    if(!d){ // repli : localStorage (persistant) puis mémoire
      const LK="usci-idb-fallback-"+store;let m=this.mem[store];try{const r=localStorage.getItem(LK);if(r)m=this.mem[store]=JSON.parse(r)}catch(e){}
      const out=await fn({get:k=>m[k],put:(v,k)=>{m[store==="outbox"?v.id:k]=v},delete:k=>{delete m[k]},all:()=>Object.values(m)});
      if(mode==="readwrite")try{localStorage.setItem(LK,JSON.stringify(m))}catch(e){}
      return out}
    return new Promise((res,rej)=>{const t=d.transaction(store,mode);const os=t.objectStore(store);let out;
      const api={get:k=>new Promise(r=>{const q=os.get(k);q.onsuccess=()=>r(q.result)}),put:(v,k)=>os.put(v,k),delete:k=>os.delete(k),all:()=>new Promise(r=>{const q=os.getAll();q.onsuccess=()=>r(q.result||[])})};
      Promise.resolve(fn(api)).then(v=>{out=v});t.oncomplete=()=>res(out);t.onerror=()=>rej(t.error);t.onabort=()=>rej(t.error)})},
  get(k){return this.tx("kv","readonly",s=>s.get(k))},
  set(k,v){return this.tx("kv","readwrite",s=>{s.put(v,k)})},
  del(k){return this.tx("kv","readwrite",s=>{s.delete(k)})},
  outAll(){return this.tx("outbox","readonly",s=>s.all())},
  outPut(op){return this.tx("outbox","readwrite",s=>{s.put(op)})},
  outDel(id){return this.tx("outbox","readwrite",s=>{s.delete(id)})}
};
