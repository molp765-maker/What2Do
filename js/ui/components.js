// Shared presentational components and the modal dialog
import {ic} from '../core/icons.js';
import {TODAY, dShort, esc, t12} from '../core/utils.js';
import {CATS, col} from '../core/config.js';
import {emit} from '../core/bus.js';
import {S} from '../storage/store.js';

export const soon=(phase,title,hint)=>`<div class="empty"><b>${title}</b><span>${hint}</span></div>`;
export const card=(t,cls,badge,body)=>`<section class="card ${cls}"><h2>${t}${badge?`<span class="badge">${badge}</span>`:''}</h2>${body}</section>`;
export const errCard=()=>`<section class="card w" style="margin-bottom:14px"><h2>Storage problem</h2><div class="empty"><b>Your data can’t be saved</b><span>${esc(S.err)}. Try a normal, non-private browser window.</span></div></section>`;
export const evLine=(e,d)=>`<button class="ln" data-ev="${e.id}" style="--cc:${col(e)}"><i class="dt"></i><span class="tm">${d?dShort(e.date)+' · ':''}${e.start?t12(e.start):'All day'}</span>${e.important?'★ ':''}${esc(e.title)}</button>`;
export const tkLine=t=>`<div class="ln ${t.done?'done':''}"><button class="ck" data-chk="${t.id}" role="checkbox" aria-checked="${!!t.done}" aria-label="Complete ${esc(t.title)}">${ic('tasks')}</button><button class="lt" data-tk="${t.id}"><span class="tt">${esc(t.title)}</span></button><span class="tm">${t.due<TODAY?'Overdue':''}</span></div>`;
export const chip=e=>`<button class="chip" data-ev="${e.id}" style="--cc:${col(e)}" title="${esc(e.title)}">${e.important?'★ ':''}${e.start?`<b>${t12(e.start)}</b> `:''}${esc(e.title)}</button>`;
export const tchip=t=>`<button class="chip tk ${t.done?'done':''}" data-tk="${t.id}" style="--cc:${col(t)}" title="${esc(t.title)}">${t.done?'✓':'○'} ${esc(t.title)}</button>`;
export const fld=(l,h)=>`<label class="f"><span>${l}</span>${h}</label>`,opts=(a,v)=>a.map(([k,l])=>`<option value="${k}" ${String(k)===String(v)?'selected':''}>${l}</option>`).join('');
export const catO=Object.entries(CATS).map(([k,c])=>[k,c[0]]);
export function dlg(html,onsave,ondel){const d=document.getElementById('dlg');d.innerHTML=`<form>${html}<p class="err" role="alert"></p><div class="acts">${ondel?'<button type="button" class="btn dng" id="del">Delete</button>':''}<span></span><button type="button" class="btn" id="cx">Cancel</button><button class="btn pri">Save</button></div></form>`;
const f=d.querySelector('form');f.onsubmit=async e=>{e.preventDefault();try{const r=await onsave(Object.fromEntries(new FormData(f)));if(r)f.querySelector('.err').textContent=r;else{d.close();emit('render')}}catch(x){f.querySelector('.err').textContent='Couldn’t save: '+x.message}};
d.querySelector('#cx').onclick=()=>d.close();if(ondel)d.querySelector('#del').onclick=async()=>{if(confirm('Delete this permanently?')){try{await ondel();d.close();emit('render')}catch(x){f.querySelector('.err').textContent=x.message}}};d.showModal()}
