// Home: task-status donut from real data, next three events, open tasks by priority
import {ic} from '../core/icons.js';
import {TODAY, addD, esc, hm, t12, today, ymd} from '../core/utils.js';
import {Prefs} from '../storage/prefs.js';
import {S, evOn} from '../storage/store.js';
import {errCard} from '../ui/components.js';
import {tkRow} from './tasks.js';

export const H={pf:1};
export const PN={1:['Urgent','#e5312f'],2:['Important','#c98024'],3:['Low','#7b6a86']};
const R=39.5,C=2*Math.PI*R;
export const openP=p=>S.tasks.filter(t=>!t.done&&(t.pri||2)===p);

// Largest-remainder rounding so the whole percentages always add up to 100
export function lr(a,tot){if(!tot)return a.map(()=>0);const ex=a.map(x=>x/tot*100),fl=ex.map(Math.floor);let rem=100-fl.reduce((s,x)=>s+x,0);ex.map((x,i)=>[x-fl[i],i]).sort((p,q)=>q[0]-p[0]).slice(0,rem).forEach(([,i])=>fl[i]++);return fl}
// Completed = done. In progress = open and due today or overdue. Pending = open and due later (or undated).
export function dnData(tasks=S.tasks,day=TODAY){const tot=tasks.length,dn=tasks.filter(t=>t.done).length,ac=tasks.filter(t=>!t.done&&t.due&&t.due<=day).length,pe=tot-dn-ac,p=lr([ac,dn,pe],tot),f=x=>tot?x/tot:0;
return {tot,seg:[{id:'a',lab:'In progress',n:ac,p:p[0],f:f(ac),s:0,col:'#2a0044'},{id:'c',lab:'Completed',n:dn,p:p[1],f:f(dn),s:f(ac),col:'#8a2a78'},{id:'p',lab:'Pending',n:pe,p:p[2],f:f(pe),s:f(ac)+f(dn),col:'#e0aaf0'}]}}
const dnLabel=D=>`${D.tot} ${D.tot===1?'task':'tasks'}: ${D.seg.map(g=>`${g.p}% ${g.lab.toLowerCase()}`).join(', ')}`;
const donut=D=>`<svg class="h-dn" viewBox="0 0 104 104" role="img" aria-label="${dnLabel(D)}"><circle r="${R}" cx="52" cy="52" fill="none" stroke="#e3d6a3" stroke-width="27"/>${D.seg.map(g=>`<circle data-id="${g.id}" r="${R}" cx="52" cy="52" fill="none" stroke="${g.col}" stroke-width="27" stroke-dasharray="${g.f*C} ${C}" stroke-dashoffset="${-g.s*C}"${g.f>0?'':' style="display:none"'} transform="rotate(-90 52 52)"/>`).join('')}<text x="52" y="60.35" text-anchor="middle" class="h-n">${D.tot}</text><text x="52" y="73" text-anchor="middle" class="h-nt">${D.tot===1?'task':'tasks'}</text></svg>`;
const legend=D=>{const by=Object.fromEntries(D.seg.map(g=>[g.id,g]));return `<ul class="h-lg">${['c','a','p'].map(id=>{const g=by[id];return `<li style="--c:${g.col}" title="${g.n} of ${D.tot} tasks"><span>${g.lab}</span><b data-pc="${id}">${g.p}%</b></li>`}).join('')}</ul>`};

export function nextEv(){const now=new Date(),nh=now.getHours()+now.getMinutes()/60,out=[];
for(let i=0;i<14&&out.length<3;i++){const d=addD(today,i);for(const e of evOn(ymd(d))){if(i===0&&e.start&&hm(e.end||e.start)<=nh)continue;out.push({e,i,d});if(out.length===3)break}}return out}
const dayLab=x=>x.i===0?'Today':x.i===1?'Tomorrow':x.d.toLocaleDateString('en-NZ',{weekday:'short'});
const tile=(x,small)=>x?(small?`<button class="h-tile sm" data-ev="${x.e.id}" aria-label="${esc(x.e.title)}, ${dayLab(x)} ${x.e.start?t12(x.e.start):'all day'}"><small>${dayLab(x)}</small><b>${x.e.start?t12(x.e.start):'All day'}</b><span>${esc(x.e.title)}</span></button>`:`<button class="h-tile wide" data-ev="${x.e.id}" aria-label="Next up: ${esc(x.e.title)}"><small>Next up</small><b>${esc(x.e.title)}</b><span>${dayLab(x)} · ${x.e.start?t12(x.e.start):'All day'}</span></button>`):`<div class="h-tile${small?' sm':' wide'}"><span>${small?'':'Nothing coming up'}</span></div>`;

function listHTML(){const a=openP(H.pf).sort((x,y)=>(x.due||'9')<(y.due||'9')?-1:1);
if(a.length)return a.map(tkRow).join('');
const sub={1:'Nothing needs you right now.',2:'Nothing important is waiting.',3:'No low priority tasks.'}[H.pf];
return `<div class="h-empty"><b>No ${PN[H.pf][0].toLowerCase()} tasks</b><span>${sub}</span></div>`}

export function homeView(){const n=Prefs.get('name',''),D=dnData(),ne=nextEv();
return `<div class="page home"><h1 class="h-hello">Kia Ora${n?', '+esc(n):''}!</h1>${S.err?errCard():''}
<div class="h-gr"><section class="card h-donut-card" aria-label="Task status"><div class="h-dt">${today.toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short'})}</div>${donut(D)}${legend(D)}</section>${tile(ne[0],0)}${tile(ne[1],1)}${tile(ne[2],1)}</div>
<div class="h-need"><h2>You need to do something!</h2><div class="h-prow"><div class="seg3" role="radiogroup" aria-label="Task priority" style="--i:${H.pf-1}"><i class="seg3-pill"></i>${[1,2,3].map(p=>`<button role="radio" aria-checked="${H.pf===p}" tabindex="${H.pf===p?0:-1}" data-pf="${p}" style="--c:${PN[p][1]}">${PN[p][0]}<em>${openP(p).length}</em></button>`).join('')}</div><button class="ntb" data-newtk aria-label="New task"><span>New task</span><i>${ic('plus')}</i></button></div><div class="card h-list" id="hl" aria-live="polite">${listHTML()}</div></div></div>`}

export function updateHome(){const seg=document.querySelector('.seg3');if(!seg)return;seg.style.setProperty('--i',H.pf-1);
seg.querySelectorAll('button').forEach((b,i)=>{b.setAttribute('aria-checked',i===H.pf-1);b.tabIndex=i===H.pf-1?0:-1;b.querySelector('em').textContent=openP(i+1).length});
const l=document.getElementById('hl');if(l)l.innerHTML=listHTML()}

// Donut animation: fills clockwise from zero when Home is entered, eases between values afterwards
let prev=null,raf=0;
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x)),ease=t=>1-Math.pow(1-t,3);
function paint(rings,pcs){const svg=document.querySelector('.h-dn');if(!svg)return;
rings.forEach(([id,s,f])=>{const c=svg.querySelector(`circle[data-id="${id}"]`);if(c){c.style.display=f>0.0004?'':'none';c.setAttribute('stroke-dasharray',`${Math.max(0,f)*C} ${C}`);c.setAttribute('stroke-dashoffset',String(-s*C))}});
if(pcs)pcs.forEach(([id,v])=>{const b=document.querySelector(`[data-pc="${id}"]`);if(b)b.textContent=Math.round(v)+'%'})}
export function homeAfter(entering){cancelAnimationFrame(raf);const D=dnData(),to=D.seg.map(g=>[g.id,g.s,g.f,g.p]),still=()=>paint(to.map(([i,s,f])=>[i,s,f]),to.map(([i,,,p])=>[i,p]));
const reduce=typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
const from=prev;prev=to;
if(reduce||!document.querySelector('.h-dn')||(!entering&&!from)){still();return}
if(!entering&&JSON.stringify(from)===JSON.stringify(to)){still();return}
const ms=entering?1500:600,t0=performance.now();paint(to.map(([i])=>[i,0,0]),to.map(([i])=>[i,0]));
const step=now=>{const t=ease(clamp((now-t0)/ms,0,1));
if(entering){paint(to.map(([i,s,f])=>[i,s,clamp(t-s,0,f)]),to.map(([i,s,f,p])=>[i,f?p*clamp((t-s)/f,0,1):0]))}
else paint(to.map(([i,s,f],k)=>[i,from[k][1]+(s-from[k][1])*t,from[k][2]+(f-from[k][2])*t]),to.map(([i,,,p],k)=>[i,from[k][3]+(p-from[k][3])*t]));
if(t<1)raf=requestAnimationFrame(step);else still()};
raf=requestAnimationFrame(step)}

export function setPriority(p){H.pf=clamp(p,1,3);updateHome()}
export function bindHome(){
document.addEventListener('click',e=>{const b=e.target.closest('[data-pf]');if(b)setPriority(+b.dataset.pf)});
document.addEventListener('keydown',e=>{const b=e.target.closest('.seg3 button');if(!b||!/^Arrow(Left|Right)$/.test(e.key))return;e.preventDefault();setPriority(H.pf+(e.key==='ArrowRight'?1:-1));document.querySelector(`.seg3 [data-pf="${H.pf}"]`)?.focus()})}
