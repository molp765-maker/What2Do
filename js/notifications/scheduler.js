// Scheduler: every 30 seconds (and whenever data changes) asks the rules what is due, creates one record per
// reminder, hands it to delivery, and tidies up reminders that no longer matter.
import {S, diaryOn, evOn} from '../storage/store.js';
import {emit, on} from '../core/bus.js';
import {uid} from '../core/utils.js';
import {computeDue} from './rules.js';
import {deliver} from './delivery.js';
import {getNP} from './prefs.js';

let busy=false;
export async function tick(now=new Date()){
if(busy)return;busy=true;let changed=false;
try{
const np=getNP();
if(np.on){
const seen=new Set(S.notifications.map(n=>n.key)),fresh=[];
for(const c of computeDue({eventsOn:evOn,tasks:S.tasks,diaryOn},now,np)){
if(seen.has(c.key))continue;seen.add(c.key);
fresh.push({id:uid(),key:c.key,category:c.category,title:c.title,message:c.message,related:c.related,scheduledFor:c.scheduledFor,createdAt:now.toISOString(),read:false,delivery:{status:'pending',channels:[]}})}
for(const n of fresh){await deliver(n);changed=true}}
// A diary reminder is finished once the day's entry exists; a task reminder once the task is done or gone.
for(const n of S.notifications){if(n.read)continue;const r=n.related||{};
const t=r.type==='task'&&S.tasks.find(x=>x.id===r.id);
if((r.type==='diary'&&diaryOn(r.date).length)||(r.type==='task'&&(!t||t.done))){n.read=true;await S.save('notifications',n);changed=true}}
const cutoff=now.getTime()-60*864e5;
for(const n of S.notifications.filter(x=>Date.parse(x.createdAt)<cutoff)){await S.remove('notifications',n.id);changed=true}
}finally{busy=false}
if(changed)emit('notify:changed')}

export function startScheduler(){
tick();setInterval(tick,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick()});
let t;on('data:changed',()=>{clearTimeout(t);t=setTimeout(tick,300)})}
