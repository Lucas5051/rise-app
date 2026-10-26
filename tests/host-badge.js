// Site hébergé : le badge de l'hébergeur ne recouvre aucun bouton (accueil, onglets athlète, navigation coach, lecteur).
const { chromium } = require('playwright');const BASE=process.env.BASE||'https://usci-muscu.netlify.app/';
let pass=0,fail=0;const ok=(c,m)=>{c?pass++:fail++;console.log((c?'PASS ':'FAIL ')+m)};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const W of [375,390,430]){const p=await (await b.newContext({viewport:{width:W,height:812},isMobile:true,hasTouch:true})).newPage();p.setDefaultTimeout(8000);const E=(f,a)=>p.evaluate(f,a);
  const cover=()=>E(()=>{window.scrollTo(0,document.documentElement.scrollHeight);document.querySelectorAll('.coach-main,.sheet-scroll').forEach(x=>x.scrollTop=x.scrollHeight);const f=document.getElementById('nl-badge-frame');if(!f)return 'pas de badge';const r=f.getBoundingClientRect();
    return [...document.querySelectorAll('button,a,input,select,textarea,[role=tab]')].filter(e=>e.offsetParent!==null&&!e.closest('[inert]')).filter(e=>{const q=e.getBoundingClientRect();return q.width&&q.right>r.left+2&&q.left<r.right-2&&q.bottom>r.top+2&&q.top<r.bottom-2&&q.bottom<=innerHeight}).map(e=>(e.textContent||e.getAttribute('aria-label')||e.tagName).trim().slice(0,30))});
  await p.goto(BASE+'?demo');await p.waitForTimeout(3500);
  let c=await cover();ok(Array.isArray(c)&&!c.length,W+' accueil : aucun bouton sous le badge '+JSON.stringify(c));
  await E(()=>{doLogout()});await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');await p.waitForTimeout(500);
  c=await cover();ok(Array.isArray(c)&&!c.length,W+' coach : navigation libre '+JSON.stringify(c));
  await p.context().close();const ctx2=await b.newContext({viewport:{width:W,height:812},isMobile:true,hasTouch:true});
  await ctx2.addInitScript(()=>{if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('usci-muscu-state-v1',JSON.stringify({v:2,tests:[{date:"2026-10-12",bw:80,squat3:95,bench3:70,dl3:80,pullReps:11}],status:{},settings:{bw:80}}))}});
  const p2=await ctx2.newPage();await p2.goto(BASE+'?demo');await p2.waitForTimeout(3500);
  c=await p2.evaluate(()=>{window.scrollTo(0,document.documentElement.scrollHeight);const f=document.getElementById('nl-badge-frame');if(!f)return 'pas de badge';const r=f.getBoundingClientRect();const tb=document.querySelector('.tabbar');if(!tb)return 'pas de barre';
    return [...document.querySelectorAll('button,a,input,select,textarea,[role=tab]')].filter(e=>e.offsetParent!==null&&!e.closest('[inert]')).filter(e=>{const q=e.getBoundingClientRect();return q.width&&q.right>r.left+2&&q.left<r.right-2&&q.bottom>r.top+2&&q.top<r.bottom-2&&q.bottom<=innerHeight}).map(e=>(e.textContent||e.getAttribute('aria-label')||e.tagName).trim().slice(0,30))});
  ok(Array.isArray(c)&&!c.length,W+' athlète : barre d\'onglets libre '+JSON.stringify(c));
  await ctx2.close()}
 console.log(`\n${pass} réussis, ${fail} échoués`);await b.close()})();
