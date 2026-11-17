// Notification center: bell badge, popover list, toasts. Reads state from the store; never schedules anything.
import {ic} from '../core/icons.js';
import {addD, esc, t12, ymd} from '../core/utils.js';
import {S} from '../storage/store.js';
import {Prefs} from '../storage/prefs.js';
import {emit, on} from '../core/bus.js';
import {permission, requestPermission, supported} from './delivery.js';

const CAT={diary:['Diary','var(--warm)'],calendar:['Calendar','var(--acc)'],tasks:['Task','var(--ok)'],deadlines:['Deadline','#e5484d'],system:['System','var(--mute)']};
const $=id=>document.getElementById(id);
let isOpen=false,opener=null;

const dayOf=n=>ymd(new Date(n.createdAt));
const when=n=>{const d=new Date(n.createdAt),k=ymd(d);return k===ymd(new Date())||k===ymd(addD(new Date(),-1))?t12(d.toTimeString().slice(0,5)):d.toLocaleDateString('en-NZ',{day:'numeric',month:'short'})};
const item=n=>{const c=CAT[n.category]||CAT.system;
return `<div class="ni${n.read?'':' unread'}" role="listitem"><button class="nb" data-nopen="${n.id}"><span class="nc" style="--cc:${c[1]}">${c[0]}</span><b>${esc(n.title)}</b><span class="nm">${esc(n.message)}</span><time>${when(n)}</time></button><span class="nx"><button data-nread="${n.id}" aria-label="${n.read?'Mark as unread':'Mark as read'}" title="${n.read?'Mark as unread':'Mark as read'}">${ic('tasks')}</button><button data-ndel="${n.id}" aria-label="Delete notification" title="Delete">${ic('x')}</button></span></div>`};
function listHTML(){
const list=[...S.notifications].sort((a,b)=>a.createdAt<b.createdAt?1:-1);
if(!list.length)return `<div class="nempty"><b>You’re all caught up</b>Reminders for events, tasks and your diary will appear here.</div>`;
const today=ymd(new Date()),yest=ymd(addD(new Date(),-1)),g={Today:[],Yesterday:[],Earlier:[]};
for(const n of list)g[dayOf(n)===today?'Today':dayOf(n)===yest?'Yesterday':'Earlier'].push(n);
return Object.entries(g).filter(([,a])=>a.length).map(([k,a])=>`<div class="ng">${k}</div>${a.map(item).join('')}`).join('')}
const banner=()=>supported()&&permission()==='default'&&Prefs.get('notifyBanner','1')==='1'?`<div class="nbn"><b>Get reminders outside this tab</b><span>Allow browser notifications so reminders can reach you while this app is in the background. You can change this any time in Settings.</span><div class="row2"><button class="btn pri sm" data-nperm>Enable</button><button class="btn sm" data-nlater>Not now</button></div></div>`:'';
function html(){const unread=S.notifications.filter(n=>!n.read).length;
return `<div class="nh"><b>Notifications</b><span class="na">${unread?'<button class="btn sm" data-nall>Mark all read</button>':''}${S.notifications.length?'<button class="btn sm" data-nclear>Clear all</button>':''}<button class="btn sm" data-nclose aria-label="Close notifications">${ic('x')}</button></span></div>${banner()}<div class="nl" role="list">${listHTML()}</div>`}
function refresh(){const p=$('npop'),y=p.querySelector('.nl')?.scrollTop||0;p.innerHTML=html();const l=p.querySelector('.nl');if(l)l.scrollTop=y}
function show(btn){isOpen=true;opener=btn;const p=$('npop');p.hidden=false;p.innerHTML=html();document.querySelectorAll('[data-bell]').forEach(b=>b.setAttribute('aria-expanded','true'));p.querySelector('button')?.focus()}
function close(){if(!isOpen)return;isOpen=false;$('npop').hidden=true;document.querySelectorAll('[data-bell]').forEach(b=>b.setAttribute('aria-expanded','false'));opener?.focus()}

export function updateBadge(){const c=S.notifications.filter(n=>!n.read).length;
document.querySelectorAll('.nbadge').forEach(el=>{el.hidden=!c;el.textContent=c>9?'9+':String(c)});
document.querySelectorAll('[data-bell]').forEach(b=>b.setAttribute('aria-label',c?`Notifications, ${c} unread`:'Notifications'))}

const mutate=async f=>{try{await f()}catch(e){S.err=e.message}emit('notify:changed')};
export async function openNotification(id){const n=S.notifications.find(x=>x.id===id);if(!n)return;
if(!n.read)await mutate(()=>S.save('notifications',{...n,read:true}));emit('open-related',n)}

function toast(text,id){let box=$('ntoasts');if(!box){box=document.createElement('div');box.id='ntoasts';box.className='ntoasts';document.body.appendChild(box)}
const t=document.createElement('div');t.className='nt';t.setAttribute('role','status');
t.innerHTML=`<button ${id?`data-ntoast="${id}"`:'data-ntclose'}>${text}</button><button data-ntclose aria-label="Dismiss">${ic('x')}</button>`;
box.appendChild(t);while(box.children.length>3)box.firstChild.remove();setTimeout(()=>t.remove(),7000)}

export function bindCenter(){
on('notify:changed',()=>{updateBadge();if(isOpen)refresh()});
on('notify:toast',n=>toast(`<b>${esc(n.title)}</b><span>${esc(n.message)}</span>`,n.id));
on('notify:info',m=>toast(`<span>${esc(m)}</span>`));
on('notify:click',id=>openNotification(id));
document.addEventListener('click',async e=>{const t=e.target;
const b=t.closest('[data-bell],[data-nopen],[data-nread],[data-ndel],[data-nall],[data-nclear],[data-nclose],[data-nperm],[data-nlater],[data-ntoast],[data-ntclose]');
if(!b){if(isOpen&&!t.closest('#npop'))close();return}
const d=b.dataset;
if(d.ntclose!==undefined&&!d.ntoast){b.closest('.nt')?.remove();return}
if(d.ntoast){b.closest('.nt')?.remove();return openNotification(d.ntoast)}
if(d.bell!==undefined){isOpen?close():show(b);return}
if(d.nclose!==undefined)return close();
if(d.nopen){close();return openNotification(d.nopen)}
const n=S.notifications.find(x=>x.id===(d.nread||d.ndel));
if(d.nread&&n)return mutate(()=>S.save('notifications',{...n,read:!n.read}));
if(d.ndel&&n)return mutate(()=>S.remove('notifications',n.id));
if(d.nall!==undefined)return mutate(async()=>{for(const x of S.notifications.filter(x=>!x.read))await S.save('notifications',{...x,read:true})});
if(d.nclear!==undefined){if(confirm('Delete all notifications? This can’t be undone.'))mutate(async()=>{for(const x of [...S.notifications])await S.remove('notifications',x.id)});return}
if(d.nlater!==undefined){Prefs.set('notifyBanner','0');return refresh()}
if(d.nperm!==undefined){await requestPermission();refresh();emit('render')}});
document.addEventListener('keydown',e=>{if(e.key==='Escape')close()})}
