// Future plans: what's coming up from events and tasks
import {TODAY, addD, dShort, esc, t12, today, ymd} from '../core/utils.js';
import {col} from '../core/config.js';
import {S, evNext} from '../storage/store.js';

export function plansView(){const lim=ymd(addD(today,7)),items=[];
for(const e of evNext(TODAY,60)){if(e.repeatDays?.length&&e.date>lim)continue;items.push({k:e.date,t:e.title,m:(e.start?t12(e.start):'All day')+' · event',c:col(e),a:`data-ev="${e.id}"`})}
for(const t of S.tasks)if(!t.done&&t.due&&t.due>TODAY)items.push({k:t.due,t:t.title,m:'task due',c:col(t),a:`data-tk="${t.id}"`});
items.sort((a,b)=>a.k<b.k?-1:a.k>b.k?1:0);
const row=x=>`<button class="plan-row" ${x.a} style="--cc:${x.c}"><i class="bar2"></i><span><b>${esc(x.t)}</b><small>${dShort(x.k)} · ${x.m}</small></span></button>`,
wk=items.filter(x=>x.k<=lim),later=items.filter(x=>x.k>lim).slice(0,80),
sec=(n,a,none)=>`<h2 class="sh">${n}<span>${a.length}</span></h2><div class="card plan-list">${a.map(row).join('')||`<p class="plan-empty">${none}</p>`}</div>`;
return `<div class="page plans-page"><h1>Future plans</h1><p class="sub">What’s coming up</p>${sec('Next 7 days',wk,'Nothing this week.')}${sec('Later',later,'Nothing planned further ahead.')}</div>`}
