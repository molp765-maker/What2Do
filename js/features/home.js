// Home dashboard
import {TODAY, dateLong, esc, greet} from '../core/utils.js';

import {Prefs} from '../storage/prefs.js';
import {S, diaryOn, evNext, evOn} from '../storage/store.js';
import {card, errCard, evLine, soon, tkLine} from '../ui/components.js';

export function homeView(){const n=Prefs.get('name',''),te=evOn(TODAY),tt=S.tasks.filter(t=>!t.done&&t.due&&t.due<=TODAY),td=S.tasks.filter(t=>t.due===TODAY),dn=td.filter(t=>t.done).length,up=evNext(TODAY),dy=diaryOn(TODAY),pct=td.length?Math.round(dn/td.length*100):0;
return `<div class="page"><h1>${greet()}${n?', '+n:''}</h1><p class="sub">${dateLong}</p>${S.err?errCard():''}<div class="grid">
${card('Today’s schedule','',te.length?String(te.length):'',te.length?te.map(e=>evLine(e)).join(''):soon(0,'Nothing scheduled','Add an event from the calendar.'))}
${card('Today’s tasks','',td.length?dn+'/'+td.length+' done':'',(td.length?`<div class="prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>`:'')+(tt.length?tt.map(tkLine).join(''):soon(0,'No tasks due','Tasks due today or overdue appear here.')))}
${card('Upcoming','t','',up.length?up.map(e=>evLine(e,1)).join(''):soon(0,'Nothing coming up','Future events appear here.'))}
${card('Today’s diary','t','',(dy.length?soon(0,'You’ve written today',esc(dy[dy.length-1].title||'Untitled')):soon(0,'Nothing written yet','A few lines is enough.'))+`<button class="btn ${dy.length?'':'pri'}" data-dytoday style="margin-top:12px;align-self:flex-start">${dy.length?'Continue entry':'Write today’s entry'}</button>`)}
${card('Diary reminder','t','Phase 4',soon(0,'Reminders are off','Set a daily reminder time once notifications are built.'))}</div></div>`}
