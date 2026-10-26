// Audit automatique WCAG 2 A/AA (axe-core) sur les écrans principaux, mode démonstration, 390 px et 1280 px.
const { chromium } = require('playwright');const fs=require('fs');
const AXE=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');const URL='http://localhost:8765/index.html?demo';
const legacy={v:2,tests:[{date:"2026-10-12",bw:80,squat3:95,bench3:70,dl3:80,pullReps:11}],status:{},settings:{bw:80}};
let total=0;const all={};
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 for(const W of [390,1280]){const ctx=await b.newContext({viewport:{width:W,height:W<700?844:900},isMobile:W<700,hasTouch:W<700});
  await ctx.addInitScript(l=>{window.__NOW__="2026-10-26T18:00:00";if(!sessionStorage.getItem('x')){sessionStorage.setItem('x','1');localStorage.setItem('usci-muscu-state-v1',JSON.stringify(l))}},legacy);
  const p=await ctx.newPage();p.setDefaultTimeout(5000);const E=(f,a)=>p.evaluate(f,a);await p.goto(URL);await p.waitForTimeout(1200);await p.addScriptTag({content:AXE});
  const audit=async(name)=>{await p.waitForTimeout(300);const r=await E(()=>axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']},rules:{region:{enabled:false}}}).then(r=>r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,2).map(x=>x.target.join(' ')+' :: '+(x.failureSummary||'').split('\n')[1])}))));
    r.forEach(v=>{total+=v.n;(all[v.id]=all[v.id]||[]).push(W+' '+name+' ×'+v.n+' '+JSON.stringify(v.ex))});console.log(W,name,r.length?r.map(v=>v.id+'×'+v.n).join(', '):'0 violation')};
  await audit('accueil');
  await E(()=>goTo("cal"));await audit('calendrier');
  await E(()=>goTo("train"));await audit('entrainement');
  await E(()=>goTo("suivi"));await audit('suivi');
  await E(()=>goTo("train"));await p.click('.today-sess [data-start]');await p.click('[data-act="playerGo"]');await audit('lecteur');
  await E(()=>{closePlayer();S.active=null;save();doLogout()});await p.click('[data-act="authCoach"]');await p.click('[data-act="coachEnter"]');await audit('coach_tableau');
  await p.click('[data-ctab="programs"]');await audit('coach_programmes');
  await p.click('[data-pe="create"]');await p.click('[data-pe="addSession"]');await p.click('[data-pe="psGo"][data-step="3"]');await p.click('[data-pe="exAdd"]');await audit('coach_editeur');
  await E(()=>closeSheet(false));await E(()=>{CEDIT=null;CTAB="invites";render()});await audit('coach_invitations');
  await E(()=>doLogout());await p.click('[data-act="obStart"]');await audit('inscription');
  await ctx.close()}
 console.log('\nTOTAL noeuds en violation :',total);Object.entries(all).forEach(([k,v])=>console.log(k,'\n  '+v.join('\n  ')));await b.close()})();
