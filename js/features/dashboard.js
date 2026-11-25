// Customizable Home: which widgets show, in what order (saved on this device)
import {emit} from '../core/bus.js';
import {esc} from '../core/utils.js';
import {Prefs} from '../storage/prefs.js';

export const WIDGETS=[['overview','Task overview'],['nextup','Next up'],['todo','Tasks to do'],['today','Today’s schedule'],['plans','Upcoming plans'],['diary','Diary'],['friends','Friends']];
export const DEFAULT_LAYOUT=['overview','nextup','todo'];
const known=new Set(WIDGETS.map(([id])=>id)),title=id=>(WIDGETS.find(w=>w[0]===id)||[,id])[1];

// null/undefined = never customized → default. '' = user hid everything.
export function parseLayout(raw){if(raw==null)return [...DEFAULT_LAYOUT];
const out=[];for(const id of String(raw).split(',').map(s=>s.trim()))if(known.has(id)&&!out.includes(id))out.push(id);return out}
export function moveWidget(ids,id,dir){const a=[...ids],i=a.indexOf(id),j=i+dir;if(i<0||j<0||j>=a.length)return a;[a[i],a[j]]=[a[j],a[i]];return a}
export function toggleWidget(ids,id,on){if(on)return ids.includes(id)?[...ids]:[...ids,id];return ids.filter(x=>x!==id)}
export const getLayout=()=>parseLayout(Prefs.get('dashboard',null));
export const setLayout=ids=>Prefs.set('dashboard',ids.join(','));

export function editorHTML(ids=getLayout()){
const hidden=WIDGETS.map(([id])=>id).filter(id=>!ids.includes(id)),n=ids.length;
const row=(id,i)=>{const on=i>=0,t=esc(title(id));
return `<div class="dash-row${on?'':' off'}"><label><input type="checkbox" data-dash-toggle="${id}"${on?' checked':''}><span>${t}</span></label>${on?`<span class="dash-mv"><button type="button" class="btn" data-dash-move="${id}" data-dir="-1" aria-label="Move ${t} up"${i===0?' disabled':''}>↑</button><button type="button" class="btn" data-dash-move="${id}" data-dir="1" aria-label="Move ${t} down"${i===n-1?' disabled':''}>↓</button></span>`:''}</div>`};
return `<div class="dash-editor">${ids.map(row).join('')}${hidden.map(id=>row(id,-1)).join('')}<div class="dash-foot"><button type="button" class="btn" data-dash-reset>Reset to default</button></div></div>`}

function apply(ids){setLayout(ids);document.querySelectorAll('.dash-editor').forEach(el=>{el.outerHTML=editorHTML(ids)});emit('render')}
function openEditor(){const d=document.getElementById('dlg');if(!d)return;
d.innerHTML=`<div class="dash-dlg"><h3>Customize Home</h3><p class="sub">Choose what Home shows first.</p>${editorHTML()}<div class="acts"><span></span><button type="button" class="btn pri" data-dash-done>Done</button></div></div>`;d.showModal()}

export function bindDashboard(){
// The editor is rebuilt after each change, so put keyboard focus back on the same widget's control
const refocus=(id,dir)=>(document.querySelector(`dialog[open] [data-dash-move="${id}"][data-dir="${dir}"]:not([disabled])`)||document.querySelector(`dialog[open] [data-dash-toggle="${id}"]`)||document.querySelector(`[data-dash-move="${id}"][data-dir="${dir}"]:not([disabled])`)||document.querySelector(`[data-dash-toggle="${id}"]`))?.focus();
document.addEventListener('change',e=>{const c=e.target.closest?.('[data-dash-toggle]');if(!c)return;const id=c.dataset.dashToggle;apply(toggleWidget(getLayout(),id,c.checked));refocus(id,0)});
document.addEventListener('click',e=>{const b=e.target.closest('[data-dash-move],[data-dash-reset],[data-dash-edit],[data-dash-done]');if(!b)return;const d=b.dataset;
if(d.dashMove){const id=d.dashMove;apply(moveWidget(getLayout(),id,+d.dir));refocus(id,d.dir)}
else if('dashReset' in d)apply([...DEFAULT_LAYOUT]);
else if('dashEdit' in d)openEditor();
else if('dashDone' in d)document.getElementById('dlg')?.close()})}
