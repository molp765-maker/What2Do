// Wiring: where a notification should take the user. Lives at the top level because it knows about several features.
import {C, evDlg} from './features/calendar.js';
import {tkDlg} from './features/tasks.js';
import {writeFor} from './features/diary.js';
import {S} from './storage/store.js';
import {emit} from './core/bus.js';
import {pd} from './core/utils.js';

const go=h=>location.hash==='#'+h?emit('render'):(location.hash=h);
export function openRelated(n){
const r=n.related||{};
if(r.type==='event'){
if(!S.events.some(e=>e.id===r.id))return emit('notify:info','That event no longer exists.');
C.view='day';C.d=pd(r.date);go('calendar');evDlg(r.id,r.date)}
else if(r.type==='task'){
if(!S.tasks.some(t=>t.id===r.id))return emit('notify:info','That task no longer exists.');
go('tasks');tkDlg(r.id)}
else if(r.type==='diary')writeFor(r.date)}
