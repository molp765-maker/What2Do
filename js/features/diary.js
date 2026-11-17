// Diary: dashboard, archive, calendar, reader and the autosaving editor.
// Privacy: entries stay in IndexedDB on this device. Nothing here makes a network request or logs entry text.
import {ic} from '../core/icons.js';
import {TODAY, addD, dShort, dateLong, esc, mon, pd, t12, today, uid, ymd} from '../core/utils.js';
import {MOODS, groupByMonth, hl, moodOf, preview, searchEntries, sortEntries, wordCount} from '../core/diary.js';
import {emit} from '../core/bus.js';
import {S, diaryOn} from '../storage/store.js';
import {errCard} from '../ui/components.js';

const D={mode:'home',id:'',q:'',order:'new',year:'',limit:40,focus:false,sel:TODAY,cal:new Date(today.getFullYear(),today.getMonth(),1)};
let DR=null; // the draft being edited; saved by id so repeated saves can never create duplicates
const long=ds=>pd(ds).toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
const wc=d=>{const w=wordCount(d.content);return `${w} ${w===1?'word':'words'} · ${d.content.length} characters`};
const grow=b=>{b.style.height='auto';b.style.height=b.scrollHeight+'px'};
const mood=e=>{const m=moodOf(e.mood);return m?`<span class="dy-mo" title="${m[2]}">${m[1]}</span>`:''};

/* ---------- views ---------- */
const row=e=>{const d=pd(e.date);return `<button class="dy-row" data-dyopen="${e.id}"><span class="dy-day"><b>${d.getDate()}</b><i>${d.toLocaleDateString('en-NZ',{weekday:'short'})}</i></span><span class="dy-rb"><span class="dy-t">${hl(e.title||'Untitled',D.q)}</span><span class="dy-p">${hl(preview(e.content,D.q),D.q)}</span></span>${mood(e)}</button>`};
function listHTML(){
if(!S.diary.length)return `<div class="dy-empty"><h2>Nothing written yet</h2><p>Your entries will gather here, month by month. Even a few lines about today is a good start.</p><button class="btn pri" data-dytoday>Write today’s entry</button></div>`;
let items=searchEntries(S.diary,D.q);if(D.year)items=items.filter(e=>e.date.startsWith(D.year));items=sortEntries(items,D.order);
if(!items.length)return `<p class="empty dy-none">No entries match “${esc(D.q)}”${D.year?' in '+D.year:''}.</p>`;
const shown=items.slice(0,D.limit);
return `<p class="dy-count" role="status">${items.length} ${items.length===1?'entry':'entries'}${D.q?' found':''}</p>`+groupByMonth(shown).map(g=>`<h2 class="sh">${g.label}<span>${g.items.length}</span></h2><div class="card list">${g.items.map(row).join('')}</div>`).join('')+(items.length>shown.length?`<button class="btn dy-more" data-dymore>Show more (${items.length-shown.length} left)</button>`:'');
}
function calHTML(){const f=D.cal,s=mon(f),has=new Set(S.diary.map(e=>e.date));
let g=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(x=>`<i>${x}</i>`).join('');
for(let i=0;i<42;i++){const d=addD(s,i),k=ymd(d);g+=`<button class="dy-d ${d.getMonth()!==f.getMonth()?'out':''} ${k===TODAY?'today':''}" data-dysel="${k}" aria-pressed="${k===D.sel}" aria-label="${dShort(k)}${has.has(k)?', has an entry':''}"><span>${d.getDate()}</span>${has.has(k)?'<b class="dd"></b>':''}</button>`}
const es=diaryOn(D.sel);
return `<div class="card dy-cal"><div class="dy-mh"><button class="btn" data-dycal="-1" aria-label="Previous month">${ic('l')}</button><b>${f.toLocaleDateString('en-NZ',{month:'long',year:'numeric'})}</b><button class="btn" data-dycal="1" aria-label="Next month">${ic('r')}</button></div><div class="dy-g">${g}</div></div><h2 class="sh">${dShort(D.sel)}</h2><div class="card list">${es.map(row).join('')||'<p class="empty">No entry for this day.</p>'}</div><button class="btn" data-dynew="${D.sel}" style="margin-top:8px">${es.length?'Add another entry':'Write entry for this day'}</button>`}
function homeV(){const n=S.diary.length,has=diaryOn(TODAY).length,years=[...new Set(S.diary.map(e=>e.date.slice(0,4)))].sort().reverse();
return `<div class="page wide dy-home"><div class="bar"><div><h1>Your diary</h1><p class="sub">${dateLong} · ${n} ${n===1?'entry':'entries'}</p></div><div class="tools"><button class="btn pri" data-dytoday>${has?'Continue today’s entry':'Write today’s entry'}</button></div></div>${S.err?errCard():''}<div class="dy-cols"><section><div class="dy-find"><input class="in" id="dq" type="search" placeholder="Search titles, words, dates or months" aria-label="Search diary" value="${esc(D.q)}"><div class="seg" role="group" aria-label="Order">${[['new','Newest'],['old','Oldest']].map(([k,l])=>`<button data-dyord="${k}" aria-pressed="${D.order===k}">${l}</button>`).join('')}</div>${years.length>1?`<select class="in" id="dyr" aria-label="Year"><option value="">All years</option>${years.map(y=>`<option ${y===D.year?'selected':''}>${y}</option>`).join('')}</select>`:''}</div><div id="dyres">${listHTML()}</div></section><aside class="dy-side">${calHTML()}</aside></div></div>`}
function readV(e){const m=moodOf(e.mood);
return `<div class="page dy-read"><div class="dy-bar"><button class="btn" data-dyhome>All entries</button><div class="tools"><button class="btn" data-dyedit="${e.id}">Edit</button><button class="btn dng" data-dyrm="${e.id}">Delete</button></div></div><p class="dy-meta">${long(e.date)}${m?' · '+m[1]+' '+m[2]:''}</p><h1 class="dy-h">${esc(e.title||'Untitled')}</h1><div class="dy-text">${esc(e.content)}</div></div>`}
function editV(){const d=DR;
setTimeout(()=>{const b=document.getElementById('db');if(!b)return;grow(b);if(D.focus){D.focus=false;(d.title||d.content?b:document.getElementById('dt')).focus()}},0);
return `<div class="page dy-ed"><div class="dy-bar"><span id="dst" class="dy-st" role="status" aria-live="polite">${d.persisted?'Saved':'Not saved yet'}</span><div class="tools">${d.persisted?'<button class="btn dng" data-dydel>Delete</button>':''}<button class="btn" data-dycancel>Cancel</button><button class="btn pri" data-dydone>Done</button></div></div>
<div class="dy-date"><span id="dl">${long(d.date)}</span><input type="date" id="dd" value="${d.date}" aria-label="Entry date" required></div>
<input class="dy-title" id="dt" placeholder="Title this day" maxlength="120" aria-label="Title" value="${esc(d.title)}">
<div class="dy-mood" role="group" aria-label="Mood">${MOODS.map(([k,e,l])=>`<button data-dymood="${k}" aria-pressed="${d.mood===k}">${e} ${l}</button>`).join('')}</div>
<textarea class="dy-body" id="db" placeholder="What happened today? How did it feel?" aria-label="Entry">${esc(d.content)}</textarea><div class="dy-foot" id="dwc">${wc(d)}</div></div>`}
export function diaryView(){
if(D.mode==='edit'&&DR)return editV();
if(D.mode==='read'){const e=S.diary.find(x=>x.id===D.id);if(e)return readV(e)}
D.mode='home';return homeV()}

/* ---------- draft and autosave ---------- */
const setStatus=(t,err)=>{const el=document.getElementById('dst');if(el){el.textContent=t;el.dataset.s=err?'err':''}};
const empty=d=>!d.title.trim()&&!d.content.trim();
function startDraft(rec,date){DR={id:rec?rec.id:uid(),title:rec?rec.title:'',content:rec?rec.content:'',date:rec?rec.date:date,mood:rec?rec.mood||'':'',createdAt:rec?rec.createdAt:'',persisted:!!rec,orig:rec?{...rec}:null,timer:0,dirty:false,touched:false,gone:false,chain:Promise.resolve()};D.mode='edit';D.focus=true}
function touch(){DR.touched=DR.dirty=true;setStatus('Unsaved changes');clearTimeout(DR.timer);const d=DR;d.timer=setTimeout(()=>save(d),800)}
function save(d){clearTimeout(d.timer);d.timer=0;if(!d.dirty)return d.chain;
if(empty(d)&&!d.persisted){d.dirty=false;return d.chain}
d.dirty=false;const now=new Date().toISOString();d.createdAt=d.createdAt||now;
const rec={id:d.id,title:d.title,content:d.content,date:d.date,mood:d.mood,createdAt:d.createdAt,updatedAt:now};
setStatus('Saving…');
d.chain=d.chain.then(async()=>{if(d.gone)return;try{await S.save('diary',rec);d.persisted=true;if(DR===d&&!d.dirty)setStatus('Saved at '+t12(new Date().toTimeString().slice(0,5)))}catch{d.dirty=true;if(DR===d)setStatus('Couldn’t save. Your text is still here; it will retry when you type.',true)}});
return d.chain}
async function settle(){if(DR){const d=DR;await save(d);if(DR===d)DR=null}}
async function discard(x){x.gone=true;clearTimeout(x.timer);await x.chain;if(x.touched){if(x.orig)await S.save('diary',x.orig);else if(x.persisted)await S.remove('diary',x.id)}DR=null;D.mode=x.orig?'read':'home';D.id=x.id}
async function removeEntry(id){const e=S.diary.find(x=>x.id===id)||DR;
if(!confirm(`Delete “${(e&&e.title)||'this entry'}” permanently? This can’t be undone.`))return;
if(DR&&DR.id===id){DR.gone=true;clearTimeout(DR.timer);await DR.chain;DR=null}
await S.remove('diary',id);D.mode='home';D.id=''}
const show=()=>location.hash!=='#diary'?(location.hash='diary'):emit('render');
const monthOf=k=>{const x=pd(k);return new Date(x.getFullYear(),x.getMonth(),1)};

/* ---------- events ---------- */
// Used by notification links: open today's (or another day's) entry in the editor.
export async function writeFor(date){await settle();const t=diaryOn(date);startDraft(t.length?t[t.length-1]:null,date);show()}

export function bindDiary(){
document.addEventListener('click',async e=>{
const b=e.target.closest('[data-dytoday],[data-dyopen],[data-dynew],[data-dysel],[data-dycal],[data-dymore],[data-dyedit],[data-dyrm],[data-dyhome],[data-dydone],[data-dycancel],[data-dydel],[data-dymood],[data-dydate],[data-dyord],[data-go="diary"]');if(!b)return;const d=b.dataset;
try{
if(d.go){if(location.hash==='#diary'&&D.mode!=='home'){await settle();D.mode='home';emit('render')}return}
if(d.dymood!==undefined){DR.mood=DR.mood===d.dymood?'':d.dymood;document.querySelectorAll('[data-dymood]').forEach(x=>x.setAttribute('aria-pressed',x.dataset.dymood===DR.mood));touch();return}
if(d.dymore!==undefined){D.limit+=40;document.getElementById('dyres').innerHTML=listHTML();return}
if(d.dysel){D.sel=d.dysel;if(pd(d.dysel).getMonth()!==D.cal.getMonth())D.cal=monthOf(d.dysel);emit('render');return}
if(d.dycal){D.cal=new Date(D.cal.getFullYear(),D.cal.getMonth()+ +d.dycal,1);emit('render');return}
if(d.dyord){D.order=d.dyord;emit('render');return}
if(d.dycancel!==undefined){if(DR.touched&&!confirm('Discard the changes from this session?'))return;await discard(DR);emit('render');return}
if(d.dydone!==undefined){const x=DR;await save(x);D.mode=x.persisted?'read':'home';D.id=x.id;DR=null;emit('render');return}
if(d.dydel!==undefined){await removeEntry(DR.id);emit('render');return}
if(d.dyrm){await removeEntry(d.dyrm);emit('render');return}
await settle();
if(d.dytoday!==undefined){const t=diaryOn(TODAY);startDraft(t.length?t[t.length-1]:null,TODAY)}
else if(d.dynew)startDraft(null,d.dynew);
else if(d.dyedit)startDraft(S.diary.find(x=>x.id===d.dyedit));
else if(d.dyopen){D.mode='read';D.id=d.dyopen}
else if(d.dyhome!==undefined)D.mode='home';
else if(d.dydate){const es=diaryOn(d.dydate);if(es.length===1){D.mode='read';D.id=es[0].id}else if(es.length){D.mode='home';D.sel=d.dydate;D.cal=monthOf(d.dydate)}else startDraft(null,d.dydate)}
show()}catch(err){S.err=err.message;emit('render')}});
document.addEventListener('input',e=>{const t=e.target;
if(t.id==='dq'){D.q=t.value;D.limit=40;document.getElementById('dyres').innerHTML=listHTML();return}
if(!DR||(t.id!=='dt'&&t.id!=='db'))return;
if(t.id==='dt')DR.title=t.value;else{DR.content=t.value;grow(t)}
touch();const w=document.getElementById('dwc');if(w)w.textContent=wc(DR)});
document.addEventListener('change',e=>{const t=e.target;
if(t.id==='dyr'){D.year=t.value;D.limit=40;document.getElementById('dyres').innerHTML=listHTML()}
else if(t.id==='dd'&&DR&&t.value){DR.date=t.value;const l=document.getElementById('dl');if(l)l.textContent=long(t.value);touch()}});
document.addEventListener('keydown',e=>{if(DR&&(e.metaKey||e.ctrlKey)&&e.key==='s'){e.preventDefault();DR.dirty=true;save(DR)}});
// Flush pending text if the tab is hidden or closed
addEventListener('pagehide',()=>{if(DR&&DR.dirty)save(DR)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden'&&DR&&DR.dirty)save(DR)});
}
