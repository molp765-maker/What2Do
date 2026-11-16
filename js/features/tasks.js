// Tasks: grouped list view and the task dialog
import {ic} from '../core/icons.js';
import {TODAY, dShort, esc, uid} from '../core/utils.js';
import {CATS, PRI, col} from '../core/config.js';
import {S, cmp, tcmp} from '../storage/store.js';
import {catO, dlg, errCard, fld, opts} from '../ui/components.js';

function tkRow(t){const ev=S.events.find(e=>e.id===t.eventId),p=PRI[t.pri||2];
return `<div class="tkl ${t.done?'done':''} ${!t.done&&t.due&&t.due<TODAY?'late':''}"><button class="ck" data-chk="${t.id}" role="checkbox" aria-checked="${!!t.done}" aria-label="Complete ${esc(t.title)}">${ic('tasks')}</button><button class="lt" data-tk="${t.id}"><span class="tt">${esc(t.title)}</span><span class="mt">${t.due?dShort(t.due):'No date'}${t.est?' · '+esc(t.est)+' min':''} · <i class="dt" style="--cc:${col(t)}"></i> ${CATS[t.cat]?CATS[t.cat][0]:'Personal'}${ev?' · '+esc(ev.title):''}</span></button><i class="pr" style="--p:${p[1]}" title="${p[0]} priority"></i></div>`}
export function taskView(){const op=S.tasks.filter(t=>!t.done).sort(tcmp),dn=S.tasks.filter(t=>t.done),sec=(t,a)=>a.length?`<h2 class="sh">${t}<span>${a.length}</span></h2><div class="card list">${a.map(tkRow).join('')}</div>`:'';
return `<div class="page"><div class="bar"><div><h1>Tasks</h1><p class="sub">${op.length} open · ${dn.length} completed</p></div><div class="tools"><button class="btn pri" data-newtk>New task</button></div></div>${S.err?errCard():''}<input class="in qa" id="qa" placeholder="Add a task and press Enter" aria-label="Quick add task">`+
(S.tasks.length?sec('Overdue',op.filter(t=>t.due&&t.due<TODAY))+sec('Today',op.filter(t=>t.due===TODAY))+sec('Upcoming',op.filter(t=>t.due>TODAY))+sec('No date',op.filter(t=>!t.due))+sec('Completed',dn):`<div class="card"><div class="empty"><b>No tasks yet</b><span>Type above and press Enter, or choose New task.</span></div></div>`)+'</div>'}
export function tkDlg(id){const t=S.tasks.find(x=>x.id===id)||{cat:'personal',pri:2,due:''};
const evo=[['','None'],...S.events.slice().sort(cmp).map(e=>[e.id,dShort(e.date)+' · '+e.title])];
dlg(`<h3>${id?'Edit task':'New task'}</h3>${fld('Title',`<input name="title" required value="${esc(t.title)}">`)}<div class="two">${fld('Due date',`<input type="date" name="due" value="${t.due||''}">`)}${fld('Priority',`<select name="pri">${opts([[1,'High'],[2,'Medium'],[3,'Low']],t.pri)}</select>`)}</div><div class="two">${fld('Category',`<select name="cat">${opts(catO,t.cat)}</select>`)}${fld('Estimate (minutes)',`<input type="number" min="0" name="est" value="${esc(t.est)}">`)}</div>${fld('Linked event',`<select name="eventId">${opts(evo,t.eventId||'')}</select>`)}${fld('Notes',`<textarea name="notes" rows="2">${esc(t.notes)}</textarea>`)}`,
async f=>{await S.save('tasks',{...t,id:t.id||uid(),title:f.title.trim(),due:f.due,pri:+f.pri,cat:f.cat,est:f.est,eventId:f.eventId,notes:f.notes,done:!!t.done})},id&&(()=>S.remove('tasks',id)))}
