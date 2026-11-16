// Home dashboard
import {TODAY, dateLong, greet} from '../core/utils.js';

import {Prefs} from '../storage/prefs.js';
import {S, evNext, evOn} from '../storage/store.js';
import {card, errCard, evLine, soon, tkLine} from '../ui/components.js';

export function homeView(){const n=Prefs.get('name',''),te=evOn(TODAY),tt=S.tasks.filter(t=>!t.done&&t.due&&t.due<=TODAY),td=S.tasks.filter(t=>t.due===TODAY),dn=td.filter(t=>t.done).length,up=evNext(TODAY),pct=td.length?Math.round(dn/td.length*100):0;
return `<div class="page"><h1>${greet()}${n?', '+n:''}</h1><p class="sub">${dateLong}</p>${S.err?errCard():''}<div class="grid">
${card('Today’s schedule','',te.length?String(te.length):'',te.length?te.map(e=>evLine(e)).join(''):soon(0,'Nothing scheduled','Add an event from the calendar.'))}
${card('Today’s tasks','',td.length?dn+'/'+td.length+' done':'',(td.length?`<div class="prog" role="progressbar" aria-valuenow="${pct}" aria-valuemin="0" aria-valuemax="100"><i style="width:${pct}%"></i></div>`:'')+(tt.length?tt.map(tkLine).join(''):soon(0,'No tasks due','Tasks due today or overdue appear here.')))}
${card('Upcoming','t','',up.length?up.map(e=>evLine(e,1)).join(''):soon(0,'Nothing coming up','Future events appear here.'))}
${card('Quick diary entry','t','Phase 3',soon(0,'Diary opens in Phase 3','You’ll write and save entries on this device.'))}
${card('Diary reminder','t','Phase 4',soon(0,'Reminders are off','Set a daily reminder time once notifications are built.'))}</div></div>`}
