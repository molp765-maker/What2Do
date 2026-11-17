// Calendar: month, week and day views and the event dialog
import {ic} from '../core/icons.js';
import {TODAY, addD, dShort, esc, hm, mon, t12, today, uid, ymd} from '../core/utils.js';
import {col} from '../core/config.js';
<<<<<<< HEAD
import {remindField, readRemind, wireRemind} from '../notifications/forms.js';
import {getNP} from '../notifications/prefs.js';
=======
>>>>>>> 485537a8f97ba35a1f8e8387d5d413df86e8589b
import {S, diaryDays, evOn, tkOn} from '../storage/store.js';
import {catO, chip, dlg, errCard, fld, opts, tchip} from '../ui/components.js';

const dyBtn=k=>`<button class="btn" data-dydate="${k}">${diaryDays().has(k)?'Open diary entry':'Write diary entry'}</button>`;
export const C={view:'month',d:new Date(today)};
export function calView(){const v=C.d,w=C.view,r=a=>a.toLocaleDateString('en-NZ',{day:'numeric',month:'short'});
const title=w==='month'?v.toLocaleDateString('en-NZ',{month:'long',year:'numeric'}):w==='day'?v.toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long'}):r(mon(v))+' to '+r(addD(mon(v),6));
return `<div class="page wide"><div class="bar"><h1>${title}</h1><div class="tools"><div class="seg" role="group" aria-label="View">${['day','week','month'].map(x=>`<button data-cv="${x}" aria-pressed="${x===w}">${x[0].toUpperCase()+x.slice(1)}</button>`).join('')}</div><button class="btn" data-cal="-1" aria-label="Previous">${ic('l')}</button><button class="btn" data-cal="0">Today</button><button class="btn" data-cal="1" aria-label="Next">${ic('r')}</button>${w==='day'?dyBtn(ymd(v)):''}<button class="btn pri" data-newev>New event</button></div></div>${S.err?errCard():''}${w==='month'?monthV():tlV(w==='day'?[v]:Array.from({length:7},(_,i)=>addD(mon(v),i)))}</div>`}
function monthV(){const dd=diaryDays(),f=new Date(C.d.getFullYear(),C.d.getMonth(),1),s=mon(f);
let h='<div class="month">'+['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<div class="dow">${x}</div>`).join('');
for(let i=0;i<42;i++){const d=addD(s,i),k=ymd(d),it=[...evOn(k).map(chip),...tkOn(k).map(tchip)];
h+=`<div class="cell ${i%7>4?'we':''} ${d.getMonth()!==f.getMonth()?'out':''} ${k===TODAY?'today':''}" data-date="${k}"><button class="n" data-day="${k}" aria-label="Open ${dShort(k)}">${d.getDate()}</button>${dd.has(k)?`<button class="dy" data-dydate="${k}" title="Diary entry" aria-label="Open diary entry for ${dShort(k)}"></button>`:''}${it.slice(0,3).join('')}${it.length>3?`<button class="more" data-day="${k}">+${it.length-3} more</button>`:''}</div>`}
return h+'</div>'}
function tlV(days){const dd=diaryDays(),g=`52px repeat(${days.length},minmax(0,1fr))`;
let h=`<div class="tl"><div class="tlh" style="grid-template-columns:${g}"><div></div>${days.map(d=>`<button class="${ymd(d)===TODAY?'today':''}" data-day="${ymd(d)}">${d.toLocaleDateString('en-NZ',{weekday:'short'})}<b>${d.getDate()}</b>${dd.has(ymd(d))?'<i class="dyd" title="Diary entry"></i>':''}</button>`).join('')}</div>`;
h+=`<div class="tlh ad" style="grid-template-columns:${g}"><div>All day</div>${days.map(d=>{const k=ymd(d);return `<div>${evOn(k).filter(e=>!e.start).map(chip).join('')}${tkOn(k).map(tchip).join('')}</div>`}).join('')}</div>`;
h+=`<div class="tb" style="grid-template-columns:${g}"><div class="hrs">${Array.from({length:18},(_,i)=>`<div>${i?t12(String(6+i).padStart(2,'0')+':00'):''}</div>`).join('')}</div>`;
days.forEach(d=>{const k=ymd(d),L=[],es=evOn(k).filter(e=>e.start).map(e=>({e,s:hm(e.start),f:e.end?hm(e.end):hm(e.start)+1}));
es.forEach(x=>{let i=L.findIndex(z=>z<=x.s);if(i<0){i=L.length;L.push(0)}L[i]=x.f;x.l=i});const n=L.length||1;
h+=`<div class="col ${days.length>1&&(d.getDay()%6===0)?'we':''}" data-date="${k}">`+es.map(x=>`<button class="blk" data-ev="${x.e.id}" style="--cc:${col(x.e)};top:${Math.max(0,(x.s-6)*48)+1}px;height:${Math.max(22,(Math.min(x.f,24)-Math.max(x.s,6))*48-2)}px;left:${x.l/n*100+1}%;width:${100/n-2}%">${x.e.important?'★ ':''}${esc(x.e.title)}<span>${t12(x.e.start)}${x.e.end?' to '+t12(x.e.end):''}</span></button>`).join('');
if(k===TODAY){const w=new Date(),x=w.getHours()+w.getMinutes()/60;if(x>=6)h+=`<div class="now" style="top:${(x-6)*48}px"></div>`}
h+='</div>'});return h+'</div></div>'}
export function evDlg(id,date,start){const e=S.events.find(x=>x.id===id)||{date:date||TODAY,cat:'personal',remind:id?'':getNP().events.defaultRemind,start:start||'',repeatDays:[]};
const days=[[1,'Mon'],[2,'Tue'],[3,'Wed'],[4,'Thu'],[5,'Fri'],[6,'Sat'],[0,'Sun']];
dlg(`<h3>${id?'Edit event':'New event'}</h3>${fld('Title',`<input name="title" required value="${esc(e.title)}">`)}<div class="two">${fld('Date',`<input type="date" name="date" required value="${e.date}">`)}${fld('Category',`<select name="cat">${opts(catO,e.cat)}</select>`)}</div><div class="two">${fld('Starts',`<input type="time" name="start" value="${e.start||''}">`)}${fld('Ends',`<input type="time" name="end" value="${e.end||''}">`)}</div>${remindField(e.remind)}${fld('Notes',`<textarea name="notes" rows="2">${esc(e.notes)}</textarea>`)}<label class="chk2"><input type="checkbox" name="imp" ${e.important?'checked':''}> Mark as important</label>${fld('Repeat weekly on',`<div class="repeat-days">${days.map(([day,label])=>`<label class="repeat-day"><input type="checkbox" name="repeat${day}" value="${day}" ${e.repeatDays?.includes(day)?'checked':''}> ${label}</label>`).join('')}</div>`)}${fld('Repeat until',`<input type="date" name="repeatUntil" value="${e.repeatUntil||''}">`)}<p class="repeat-hint">Leave all days unchecked for a one-time event. The end date is included.</p>`,
async f=>{if(f.end&&!f.start)return 'Add a start time, or clear the end time.';if(f.end&&f.end<=f.start)return 'End time must be after the start time.';
const rm=readRemind(f);if(rm.err)return rm.err;
const repeatDays=days.filter(([day])=>f[`repeat${day}`]).map(([day])=>day);
if(repeatDays.length&&!f.repeatUntil)return 'Choose an end date for this repeating event.';
if(repeatDays.length&&f.repeatUntil<f.date)return 'Repeat until must be on or after the event date.';
await S.save('events',{...e,id:e.id||uid(),title:f.title.trim(),date:f.date,cat:f.cat,start:f.start,end:f.end,remind:rm.v,notes:f.notes,important:!!f.imp,repeatDays,repeatUntil:repeatDays.length?f.repeatUntil:''})},
id&&(async()=>{await S.remove('events',id);for(const t of S.tasks.filter(t=>t.eventId===id))await S.save('tasks',{...t,eventId:''})}));wireRemind('custom','.rc')}
