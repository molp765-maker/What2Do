// Settings view and storage status check

import {Prefs} from '../storage/prefs.js';
import {DB} from '../storage/db.js';
import {card} from '../ui/components.js';
import {notifySettingsHTML} from '../notifications/settings-view.js';
import {Cloud} from '../storage/cloud.js';

export function settingsView(){return `<div class="page"><h1>Settings</h1><p class="sub">Your account syncs between devices.</p><div class="grid">${card('Account','w','',Cloud.view())}${card('Profile and appearance','w','',`
<div class="row"><div><b>Your name</b><span>Used in your greeting.</span></div><input class="in" id="name" value="${Prefs.get('name','').replace(/"/g,'&quot;')}" placeholder="Name" aria-label="Your name"></div>
<div class="row"><div><b>Theme</b><span>Match your device or choose one.</span></div><div class="seg" role="group" aria-label="Theme">${['system','light','dark'].map(t=>`<button data-th="${t}" aria-pressed="${Prefs.get('theme','system')===t}">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}</div></div>`)}
${notifySettingsHTML()}
${card('Local storage','w','',`<div class="row"><div><b>Database</b><span id="dbs">Checking…</span></div></div><div class="row"><div><b>Records</b><span id="dbc">Checking…</span></div></div>`)}</div></div>`}
export async function storageStatus(){const s=document.getElementById('dbs'),c=document.getElementById('dbc');
try{await DB.open();s.innerHTML='<span class="st" style="--c:var(--ok)">IndexedDB ready</span> · stores: '+DB.stores.join(', ');
const k=await Promise.all(DB.stores.map(x=>DB.count(x)));c.textContent=DB.stores.map((x,i)=>`${x} ${k[i]}`).join(' · ')}
catch(e){s.innerHTML='<span class="st" style="--c:#e5484d">Unavailable</span> '+e.message;c.textContent='Data can’t be saved in this browser mode.'}}
