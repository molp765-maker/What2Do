// Hash router and the render loop
import {ic} from './core/icons.js';
import {NAV} from './core/config.js';
import {Prefs} from './storage/prefs.js';
import {storageStatus} from './features/settings.js';
import {Views} from './views.js';

export const Router={cur:'home',go(){const h=location.hash.slice(1);this.cur=Views[h]?h:'home';render()}};
export function render(){const v=Router.cur,m=document.getElementById('main');document.body.dataset.view=v;m.innerHTML=Views[v]();if(Router.last!==v)m.scrollTop=0;Router.last=v;
const btn=cls=>NAV.map(([k,l,i])=>`<button class="${cls}" data-go="${k}" ${k===v?'aria-current="page"':''} aria-label="${l}">${ic(i)}<span>${l}</span></button>`).join('');
document.getElementById('nav').innerHTML=btn('nav');document.getElementById('tabs').innerHTML=btn('');
const n=Prefs.get('name','');document.getElementById('av').textContent=(n[0]||'M').toUpperCase();document.getElementById('who').innerHTML=`<b style="font-weight:500">${n||'Your name'}</b><small>Local profile</small>`;
if(v==='settings')storageStatus()}
