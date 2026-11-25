// Schedule: day and week timelines plus the task list
import {ic} from '../core/icons.js';
import {addD, mon} from '../core/utils.js';
import {Friends} from './friends.js';
import {C, tlV} from './calendar.js';
import {taskBody, taskCounts} from './tasks.js';
import {errCard} from '../ui/components.js';
import {S} from '../storage/store.js';

export const Sch={tab:'day'};
export function scheduleView(){const t=Sch.tab,v=C.d,r=a=>a.toLocaleDateString('en-NZ',{day:'numeric',month:'short'});
const sub=t==='tasks'?taskCounts():t==='day'?v.toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long'}):r(mon(v))+' to '+r(addD(mon(v),6));
const seg=`<div class="seg sch-seg" role="group" aria-label="Schedule view">${[['day','Day'],['week','Week'],['tasks','Tasks']].map(([k,l])=>`<button data-sch="${k}" aria-pressed="${k===t}">${l}</button>`).join('')}</div>`;
const body=t==='tasks'?taskBody():`${S.err?errCard():''}${Friends.calendarControls()}<div class="sch-nav"><button class="btn" data-cal="-1" aria-label="Previous ${t}">${ic('l')}</button><button class="btn" data-cal="0">Today</button><button class="btn" data-cal="1" aria-label="Next ${t}">${ic('r')}</button></div>${tlV(t==='day'?[v]:Array.from({length:7},(_,i)=>addD(mon(v),i)))}`;
return `<div class="page wide sch-page"><h1>Schedule</h1><p class="sub">${sub}</p>${seg}${body}</div>`}
