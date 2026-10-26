
/* =====================================================================
   DOMAINE · CONFIGURATION
   Configuration centrale de la marque. Le nom visible reste « USCI Muscu » dans cette version :
   le changer ici (et dans build.py, qui le lit) suffit pour renommer l'application.
   ===================================================================== */
const APP_CONFIG=Object.freeze({
  name:"USCI Muscu",
  shortName:"USCI",
  coachBrand:"USCI Coach",
  logo:null,                 // chemin ou data-URI du logo quand il existera (aucun logo inventé)
  primaryColor:"#2563EB",
  secondaryColor:"#4F46E5",
  supportEmail:"",           // à renseigner : affiché dans Paramètres › Confidentialité
  coachName:"Lucas Besnard", // nom affiché du coach de la plateforme
  legal:{editor:"",address:"",host:"Supabase (UE, Paris) · hébergement de l'appli à préciser",privacyUrl:"",termsUrl:""}, // mentions légales à compléter
  links:{website:"",instagram:"",tiktok:""},
  version:"10",
  schema:5,
  /* Serveur de production (Supabase, région Paris). La clé « publishable » est publique par conception :
     elle n'ouvre AUCUN accès sans les règles RLS du serveur. Aucune clé d'administration ici. */
  cloud:{url:"https://oabmnqyymksswnnwglrq.supabase.co",publishableKey:"sb_publishable_TC53fqwW6XHjV0iVFNmoMw_FsWVHy_S"}
});
/* Logos de marques tierces (Apple, Google, Instagram, TikTok, Facebook, YouTube, App Store).
   Ils ne sont pas dessinés à la main dans ce fichier : chaque marque fournit ses fichiers officiels et ses règles
   (taille minimale, zone de protection, couleurs). Pour les afficher, déposer le fichier officiel (SVG) en data-URI ici.
   Tant qu'un emplacement est vide, l'appli affiche une pastille neutre + le nom complet du service (jamais seulement l'initiale). */
const BRAND_ASSETS={apple:null,google:null,instagram:null,tiktok:null,facebook:null,youtube:null,appstore:null};

"use strict";
