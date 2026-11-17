// Reminder fields shared by the event and task dialogs.
import {opts} from '../ui/components.js';
import {getNP} from './prefs.js';
import {MAX_REMIND_MIN, REMIND_PRESETS} from './rules.js';

export function remindField(val){
const v=val==null?'':String(val),preset=REMIND_PRESETS.some(([k])=>k===v&&k!=='custom'),sel=preset?v:'custom',n=+v,unit=n>0&&n%1440===0?'1440':n>0&&n%60===0?'60':'1';
return `<label class="f"><span>Reminder</span><select name="remind">${opts(REMIND_PRESETS,sel)}</select></label><div class="two rc" ${sel==='custom'?'':'hidden'}><label class="f"><span>Remind me this long before</span><input type="number" name="rc" min="1" step="1" value="${preset?'':n/unit}"></label><label class="f"><span>Unit</span><select name="ru">${opts([['1','minutes'],['60','hours'],['1440','days']],unit)}</select></label></div>`}
export function readRemind(f){
if(f.remind!=='custom')return {v:f.remind};
const k=+f.rc;if(!(k>0))return {err:'Enter how long before the event to remind you.'};
const m=Math.round(k*+f.ru);if(m>MAX_REMIND_MIN)return {err:'Reminders can be set up to 7 days before an event.'};return {v:String(m)}}

export function taskRemindField(t){
const r=t.remind||'';
return `<label class="f"><span>Reminder</span><select name="remind">${opts([['',getNP().tasks.dueDay?'Default: the morning it’s due':'Default: none'],['eve','The evening before (6:00pm)'],['at','At a date and time I choose…'],['off','No reminder for this task']],r)}</select></label><label class="f rt" ${r==='at'?'':'hidden'}><span>Remind me on</span><input type="datetime-local" name="remindAt" value="${t.remindAt||''}"></label>`}
export function readTaskRemind(f){
if(f.remind==='at'&&!f.remindAt)return {err:'Choose a date and time for the reminder.'};
return {remind:f.remind,remindAt:f.remind==='at'?f.remindAt:''}}

// Show the extra input only when its option is chosen.
export function wireRemind(value,selector){
const d=document.getElementById('dlg'),s=d.querySelector('[name=remind]'),x=d.querySelector(selector);
if(s&&x)s.onchange=()=>{x.hidden=s.value!==value}}
