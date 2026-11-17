// Notification settings: the HTML for the Settings page and the handlers behind it.
import {card} from '../ui/components.js';
import {emit} from '../core/bus.js';
import {uid} from '../core/utils.js';
import {opts} from '../ui/components.js';
import {getNP, setNP} from './prefs.js';
import {deliver, permission, requestPermission} from './delivery.js';
import {REMIND_PRESETS} from './rules.js';
import {tick} from './scheduler.js';

const DAYS=[[1,'Mon'],[2,'Tue'],[3,'Wed'],[4,'Thu'],[5,'Fri'],[6,'Sat'],[0,'Sun']];
const sw=(path,on,label,sub)=>`<div class="row"><div><b>${label}</b><span>${sub}</span></div><label class="sw"><input type="checkbox" data-np="${path}" ${on?'checked':''} aria-label="${label}"><i></i></label></div>`;
const time=(path,v,label,sub)=>`<div class="row"><div><b>${label}</b><span>${sub}</span></div><input class="in" type="time" data-np="${path}" value="${v}" aria-label="${label}"></div>`;
const PERM={granted:['var(--ok)','On. System notifications are allowed.'],denied:['#e5484d','Blocked in your browser. Re-allow it from the site settings (the icon beside the address), then reload.'],default:['var(--warm)','Not enabled yet.'],unsupported:['var(--mute)','Not supported in this browser. You’ll still get in-app notifications.']};

export function notifySettingsHTML(){
const np=getNP(),p=permission(),[c,msg]=PERM[p]||PERM.unsupported;
return card('Notifications','w','',`
${sw('on',np.on,'Notifications','Master switch for every reminder below.')}
${sw('inApp',np.inApp,'In-app alerts','Show a small alert when a reminder arrives while the app is open. Reminders always appear in the bell.')}
<div class="row"><div><b>Browser notifications</b><span><span class="st" style="--c:${c}">${msg}</span></span></div>${p==='default'?'<button class="btn pri" data-nperm2>Enable</button>':''}${p==='granted'?`<label class="sw"><input type="checkbox" data-np="browser" ${np.browser?'checked':''} aria-label="Show browser notifications"><i></i></label>`:''}</div>
${p==='granted'?sw('browserWhenOpen',np.browserWhenOpen,'Also when the app is open','Normally system notifications are used only when this tab is in the background.'):''}
<div class="row"><div><b>Try it</b><span>Sends a test through every channel that’s on.</span></div><button class="btn" data-ntest>Send test</button></div>
<div class="how"><div><span class="st" style="--c:var(--ok)">In-app</span> Works while the app is open.</div><div><span class="st" style="--c:${p==='granted'&&np.browser?'var(--ok)':'var(--mute)'}">Browser</span> Sent by this page, so the tab or installed app must be running. Browsers may delay timers in background tabs.</div><div><span class="st" style="--c:var(--mute)">Background push</span> Not available. Nothing can reach you while the app is closed; that needs a push server, which this app doesn’t have.</div></div>`)
+card('Diary reminder','w','',`
${sw('diary.on',np.diary.on,'Remind me to write','A gentle nudge. It’s skipped if you’ve already written today.')}
${time('diary.time',np.diary.time,'Time','When the reminder should arrive.')}
<div class="row"><div><b>Days</b><span>Which days to be reminded.</span></div><div class="days" role="group" aria-label="Reminder days">${DAYS.map(([d,l])=>`<button data-npday="${d}" aria-pressed="${np.diary.days.includes(d)}">${l}</button>`).join('')}</div></div>`)
+card('Calendar and tasks','w','',`
${sw('events.on',np.events.on,'Event reminders','Reminders you set on events.')}
<div class="row"><div><b>Default for new events</b><span>Pre-selected when you create an event.</span></div><select class="in" data-np="events.defaultRemind" aria-label="Default event reminder">${opts(REMIND_PRESETS.filter(([k])=>k!=='custom'),np.events.defaultRemind)}</select></div>
${sw('tasks.dueDay',np.tasks.dueDay,'Task due-date reminders','Remind me on the day a task is due.')}
${time('tasks.dueTime',np.tasks.dueTime,'Due-day time','When due-day reminders arrive.')}
${sw('tasks.overdue',np.tasks.overdue,'Overdue alerts','One alert the morning after a task is overdue.')}
${time('tasks.overdueTime',np.tasks.overdueTime,'Overdue time','When overdue alerts arrive.')}`)}

export function bindNotifySettings(){
document.addEventListener('change',async e=>{const t=e.target,path=t.dataset&&t.dataset.np;if(!path)return;
const val=t.type==='checkbox'?t.checked:t.value;
if(t.type==='time'&&!val)return;
const patch={};path.split('.').reduce((o,k,i,a)=>(o[k]=i===a.length-1?val:{},o[k]),patch);setNP(patch);
if(path==='diary.on'&&val&&permission()==='default')emit('notify:info','Allow browser notifications below to get this reminder when the app is in the background.');
await tick();emit('render')});
document.addEventListener('click',async e=>{const b=e.target.closest('[data-npday],[data-nperm2],[data-ntest]');if(!b)return;
if(b.dataset.npday){const d=+b.dataset.npday,s=new Set(getNP().diary.days);s.has(d)?s.delete(d):s.add(d);setNP({diary:{days:[...s].sort()}});await tick();emit('render')}
else if(b.dataset.nperm2!==undefined){await requestPermission();emit('render')}
else if(b.dataset.ntest!==undefined){const now=new Date().toISOString();
await deliver({id:uid(),key:'test:'+now,category:'system',title:'Test notification',message:'Notifications are working.',related:{type:'none'},scheduledFor:now,createdAt:now,read:false,delivery:{status:'pending',channels:[]}},{force:true});emit('notify:changed')}})}
