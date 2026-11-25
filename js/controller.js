// Global event delegation: routes DOM events to feature actions
import {addD, pd, today, uid, ymd} from './core/utils.js';

import {Prefs} from './storage/prefs.js';
import {S} from './storage/store.js';
import {C, evDlg} from './features/calendar.js';
import {Sch} from './features/schedule.js';
import {tkDlg} from './features/tasks.js';
import {Router, render} from './router.js';

export function bindEvents(){
document.addEventListener('click',async e=>{const t=e.target,b=t.closest('[data-chk],[data-tk],[data-ev],[data-day],[data-cal],[data-cv],[data-newev],[data-newtk],[data-sch]');
if(!b){const c=t.closest('.cell,.col');if(c&&!t.closest('button')){let s='';if(c.classList.contains('col'))s=String(6+Math.floor((e.clientY-c.getBoundingClientRect().top)/48)).padStart(2,'0')+':00';evDlg(null,c.dataset.date,s)}return}
const d=b.dataset;
if(d.sch){Sch.tab=d.sch;if(d.sch!=='tasks')C.view=d.sch;render()}
else if(d.chk){const x=S.tasks.find(z=>z.id===d.chk);const row=b.closest('.tkl');if(x&&!x.done&&row&&row.closest('#hl')){row.classList.add('pop');await new Promise(r=>setTimeout(r,380))}try{await S.save('tasks',{...x,done:!x.done})}catch(er){S.err=er.message}render()}
else if(d.tk)tkDlg(d.tk);else if(d.ev)evDlg(d.ev);else if(d.newev!==undefined)evDlg(null,ymd(C.d));else if(d.newtk!==undefined)tkDlg();
else if(d.day){C.d=pd(d.day);C.view='day';if(Router.cur==='schedule')Sch.tab='day';render()}else if(d.cv){C.view=d.cv;C.cv=d.cv;render()}
else if(d.cal!==undefined){const n=+d.cal,v=C.d;C.d=!n?new Date(today):C.view==='month'?new Date(v.getFullYear(),v.getMonth()+n,1):addD(v,n*(C.view==='week'?7:1));render()}});
document.addEventListener('keydown',async e=>{if(e.target.id==='qa'&&e.key==='Enter'&&e.target.value.trim()){try{await S.save('tasks',{id:uid(),title:e.target.value.trim(),due:'',pri:2,cat:'personal',done:false})}catch(er){S.err=er.message}render()}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-go]');if(b&&b.dataset.go)location.hash=b.dataset.go});
document.addEventListener('input',e=>{if(e.target.id==='name')Prefs.set('name',e.target.value.trim())});
}
