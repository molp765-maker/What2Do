// App shell: nav circles with the droplet pin, add button, profile menu and drawer
import {ic} from '../core/icons.js';
import {NAV} from '../core/config.js';
import {esc} from '../core/utils.js';
import {Prefs} from '../storage/prefs.js';
import {Cloud} from '../storage/cloud.js';
import {Friends} from '../features/friends.js';
import {Sch} from '../features/schedule.js';

export const Shell={open:''};
const $=id=>document.getElementById(id);

export function renderNav(v){const idx=NAV.findIndex(([k])=>k===v);
$('nav').innerHTML=NAV.map(([k,l,i],n)=>`<button class="nvb${k==='home'?' is-home':''}" data-go="${k}" aria-label="${l}" title="${l}" ${n===idx?'aria-current="page"':''}>${ic(i)}</button>`).join('');
placePin(idx)}
export function placePin(idx){const band=document.querySelector('.band'),bg=document.querySelector('.bbg');if(!band||!bg)return;
if(idx===undefined)idx=NAV.findIndex(([k])=>k===document.body.dataset.view);
bg.style.setProperty('--px',idx<0?'-200px':((band.clientWidth-275)/2+idx*59)+'px')}

export function renderFab(v){const f=$('fab');let kind='';
if(v==='calendar'||v==='plans'||(v==='schedule'&&Sch.tab!=='tasks'))kind='ev';else if(v==='schedule')kind='tk';
f.hidden=!kind;f.removeAttribute('data-newev');f.removeAttribute('data-newtk');
if(kind){f.setAttribute(kind==='ev'?'data-newev':'data-newtk','');f.setAttribute('aria-label',kind==='ev'?'New event':'New task');f.innerHTML=ic('plus')}}

const initial=()=>(Prefs.get('name','')[0]||'M').toUpperCase();
function profile(){const n=Prefs.get('name',''),req=Friends.incoming.length;
return `<div class="scrim clear" data-scrim></div><div class="pmenu" role="menu" aria-label="Profile"><div class="pm-head"><span class="pm-av">${esc(initial())}</span><div><b>${esc(n||'Your name')}</b><small>${esc(Cloud.signedIn?Cloud.email||'Cloud account':'Local profile')}</small></div></div>
<button role="menuitem" data-go="friends">Friends &amp; sharing${req?`<em>${req}</em>`:''}</button><button role="menuitem" data-go="settings">Settings</button><button role="menuitem" class="out" data-cloud-signout>Sign out</button></div>`}
function drawer(v){const req=Friends.incoming.length;
return `<div class="scrim" data-scrim></div><nav class="drawer" aria-label="Menu"><b>Planner</b>${NAV.map(([k,l])=>`<button data-go="${k}" ${k===v?'aria-current="page"':''}>${l}</button>`).join('')}<b>More</b><button data-go="friends" ${v==='friends'?'aria-current="page"':''}>Friends &amp; sharing${req?`<em>${req}</em>`:''}</button><button data-go="settings" ${v==='settings'?'aria-current="page"':''}>Settings</button><button data-go="assistant" ${v==='assistant'?'aria-current="page"':''}>Assistant<small>Coming later</small></button></nav>`}
export function renderOverlay(v=document.body.dataset.view){const o=$('ov');
o.innerHTML=Shell.open==='profile'?profile():Shell.open==='drawer'?drawer(v):'';
document.querySelector('[data-profile]')?.setAttribute('aria-expanded',String(Shell.open==='profile'));
document.querySelector('[data-drawer]')?.setAttribute('aria-expanded',String(Shell.open==='drawer'))}
export function closeMenus(){if(!Shell.open)return false;Shell.open='';renderOverlay();return true}

export function bindShell(){
document.addEventListener('click',e=>{const t=e.target;
const tog=t.closest('[data-profile],[data-drawer]');
if(tog){const k=tog.hasAttribute('data-profile')?'profile':'drawer';Shell.open=Shell.open===k?'':k;if(Shell.open)Friends.refresh();renderOverlay();$('ov').querySelector('button')?.focus();return}
if(t.closest('[data-scrim],[data-go],[data-cloud-signout]'))closeMenus()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMenus()});
addEventListener('resize',()=>placePin())}
