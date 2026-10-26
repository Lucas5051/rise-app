/* =====================================================================
   MODULE 2 ter · CONTRAT AVEC LA COUCHE NATIVE iPHONE (Capacitor)
   Dans le navigateur, aucune de ces fonctions n'existe : l'appli l'affiche clairement et ne simule rien.
   Dans l'appli iPhone, chaque fonction appelle un plugin (voir docs/IPHONE.md).
   Noms des plugins et signatures : À VÉRIFIER au moment de l'intégration.
   ===================================================================== */
const Native={
  cap(){return window.Capacitor&&window.Capacitor.Plugins||null},
  isApp(){return !!(window.Capacitor&&window.Capacitor.isNativePlatform&&window.Capacitor.isNativePlatform())},
  has(f){const P=this.cap();if(!P)return false;return !!({biometric:P.NativeBiometric,secure:P.NativeBiometric,notif:P.LocalNotifications,widget:P.UsciWidget,health:P.UsciHealth,haptics:P.Haptics}[f])},
  /* Face ID, avec repli automatique sur le code de l'iPhone (useFallback) */
  async biometricAvailable(){if(!this.has("biometric"))return{ok:false,why:"web"};try{const r=await this.cap().NativeBiometric.isAvailable();return{ok:!!r.isAvailable,type:r.biometryType}}catch(e){return{ok:false,why:"erreur"}}},
  async verify(reason){if(!this.has("biometric"))throw new Error("Face ID indisponible hors de l'appli iPhone");return this.cap().NativeBiometric.verifyIdentity({reason,title:APP_CONFIG.name,useFallback:true})},
  /* Jeton de session dans le trousseau iOS (jamais le mot de passe) */
  async saveToken(server,user,token){if(!this.has("secure"))return false;await this.cap().NativeBiometric.setCredentials({username:user,password:token,server});return true},
  async readToken(server){if(!this.has("secure"))return null;try{const c=await this.cap().NativeBiometric.getCredentials({server});return c&&c.password||null}catch(e){return null}},
  async deleteToken(server){if(!this.has("secure"))return;try{await this.cap().NativeBiometric.deleteCredentials({server})}catch(e){}},
  /* Session du serveur dans le trousseau iOS (appli iPhone uniquement) : adaptateur de stockage pour supabase-js.
     Le jeton de session n'est alors jamais écrit dans localStorage. Dans le navigateur : undefined → stockage web standard. */
  authStorage(){if(!this.isApp()||!this.has("secure"))return undefined;const self=this,srv=k=>"usci-auth:"+k;
    return{getItem:k=>self.readToken(srv(k)),setItem:(k,v)=>self.saveToken(srv(k),"session",v),removeItem:k=>self.deleteToken(srv(k))}},
  /* Données du widget (App Group partagé avec l'extension WidgetKit) */
  async pushWidget(payload){if(!this.has("widget"))return false;try{await this.cap().UsciWidget.update({json:JSON.stringify(payload)});return true}catch(e){return false}},
  haptic(kind="light"){try{if(this.has("haptics")){this.cap().Haptics.impact({style:kind==="heavy"?"HEAVY":kind==="medium"?"MEDIUM":"LIGHT"});return}navigator.vibrate&&navigator.vibrate(kind==="heavy"?[200,100,200]:kind==="medium"?60:20)}catch(e){}}
};

