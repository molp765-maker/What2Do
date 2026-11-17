// Pure scheduling rules. Given the current data and "now", decide which reminders are due.
// No DOM, no storage, no timers: everything is passed in, so it is easy to test.
// Each candidate has a stable `key`; the scheduler uses it to make sure a reminder fires only once.
import {addD, dShort, pd, ymd} from '../core/utils.js';

export const REMIND_PRESETS=[['','No reminder'],['0','At the time of the event'],['5','5 minutes before'],['10','10 minutes before'],['15','15 minutes before'],['30','30 minutes before'],['60','1 hour before'],['1440','1 day before'],['custom','Custom…']];
export const MAX_REMIND_MIN=7*1440;
const at=(ds,hhmm)=>{const[y,m,d]=ds.split('-'),[h,mi]=hhmm.split(':');return new Date(+y,m-1,+d,+h,+mi)};
export const lead=ms=>{const m=Math.max(0,Math.round(ms/60000));
if(m<60)return `${m} minute${m===1?'':'s'}`;
if(m<1440){const h=Math.floor(m/60),r=m%60;return `${h} hour${h===1?'':'s'}${r?` ${r} minutes`:''}`}
const d=Math.floor(m/1440),h=Math.round((m%1440)/60);return `${d} day${d===1?'':'s'}${h?` ${h} hour${h===1?'':'s'}`:''}`};
const cand=(key,category,title,message,related,when)=>({key,category,title,message,related,scheduledFor:when.toISOString()});
const rel=(due,today)=>due===today?'today':due===ymd(addD(pd(today),1))?'tomorrow':'on '+dShort(due);

// Events: every occurrence from yesterday to 8 days ahead (repeating events included).
// A reminder is due once its time has passed, and stays valid until 15 minutes after the event starts
// (all-day events: 10 hours after 8:00). Events that are already over are skipped.
export function eventCandidates(ctx,now,np){
if(!np.events.on)return [];const out=[];
for(let i=-1;i<=8;i++){const ds=ymd(addD(now,i));
for(const e of ctx.eventsOn(ds)){
if(e.remind===''||e.remind==null||isNaN(+e.remind))continue;
const mins=+e.remind,allDay=!e.start,start=at(ds,e.start||'08:00'),fire=new Date(+start-mins*60000),grace=allDay?10*3600e3:15*60e3;
if(fire>now||now>=new Date(+start+grace))continue;
const ms=start-now;
const msg=allDay?`Your all-day event is ${ds===ymd(now)?'today':'coming up on '+dShort(ds)}.`:Math.abs(ms)<60e3?'Your event is starting now.':ms<0?`Your event started ${lead(-ms)} ago.`:`Your event starts in ${lead(ms)}.`;
out.push(cand(`ev:${e.id}:${ds}:${e.start||''}:${mins}`,'calendar',`Upcoming event: ${e.title}`,msg,{type:'event',id:e.id,date:ds},fire))}}
return out}

// Tasks: never for completed tasks or tasks with reminders turned off.
//  ''   -> default rule: the morning of the due date (if enabled in settings)
//  'eve'-> 6:00pm the evening before   'at' -> a custom date and time   'off' -> nothing
// Plus one "overdue" notice the morning after the due date (up to 8 days late).
export function taskCandidates(ctx,now,np){
const out=[],today=ymd(now);
for(const t of ctx.tasks){if(t.done||t.remind==='off')continue;const r=t.remind||'';
if(r==='at'&&t.remindAt){const fire=new Date(t.remindAt);if(isNaN(fire)||fire>now)continue;
const end=t.due?at(t.due,'23:59'):new Date(+fire+864e5);if(now>end)continue;
out.push(cand(`tk:${t.id}:at:${t.remindAt}`,'tasks',`Reminder: ${t.title}`,t.due?`It’s due ${rel(t.due,today)}.`:'You asked to be reminded about this task.',{type:'task',id:t.id},fire));continue}
if(!t.due)continue;
if(r==='eve'||(r===''&&np.tasks.dueDay)){
const fire=r==='eve'?at(ymd(addD(pd(t.due),-1)),'18:00'):at(t.due,np.tasks.dueTime);
if(fire<=now&&now<=at(t.due,'23:59')){const w=rel(t.due,today);
out.push(cand(`tk:${t.id}:${t.due}:${r||'due'}`,'deadlines',w==='today'?'Task due today':'Deadline approaching',`“${t.title}” is due ${w}.${w==='tomorrow'?' Make sure you have enough time to finish it.':''}`,{type:'task',id:t.id},fire))}}
if(np.tasks.overdue&&t.due<today){const fire=at(ymd(addD(pd(t.due),1)),np.tasks.overdueTime);
if(fire<=now&&(now-pd(t.due))/864e5<=8)out.push(cand(`tk:${t.id}:${t.due}:overdue`,'deadlines','Task overdue',`“${t.title}” was due ${dShort(t.due)}.`,{type:'task',id:t.id},fire))}}
return out}

// Diary: once per day, at the chosen time, on the chosen weekdays, and only if nothing is written yet today.
export function diaryCandidates(ctx,now,np){
const d=np.diary;if(!d.on||!d.days.includes(now.getDay()))return [];
const ds=ymd(now),fire=at(ds,d.time);if(fire>now||ctx.diaryOn(ds).length)return [];
return [cand(`diary:${ds}`,'diary','Your daily diary is waiting','Take a few minutes to capture today’s experiences. Your future self will appreciate it.',{type:'diary',date:ds},fire)]}

export const computeDue=(ctx,now,np)=>[...eventCandidates(ctx,now,np),...taskCandidates(ctx,now,np),...diaryCandidates(ctx,now,np)].sort((a,b)=>a.scheduledFor<b.scheduledFor?-1:1);
