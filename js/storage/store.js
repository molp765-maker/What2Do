// In-memory state backed by the DB, plus query helpers
import {DB} from './db.js';
import {emit} from '../core/bus.js';
import {addD, pd, ymd} from '../core/utils.js';

export const S={events:[],tasks:[],diary:[],notifications:[],err:'',async load(){await DB.open();[this.events,this.tasks,this.diary,this.notifications]=await Promise.all([DB.all('events'),DB.all('tasks'),DB.all('diary'),DB.all('notifications')])},
async save(k,v){await DB.put(k,v);const a=S[k],i=a.findIndex(x=>x.id===v.id);i<0?a.push(v):a[i]=v;if(k!=='notifications')emit('data:changed')},
async remove(k,id){await DB.del(k,id);S[k]=S[k].filter(x=>x.id!==id);if(k!=='notifications')emit('data:changed')}};
const occursOn=(e,ds)=>ds>=e.date&&(e.repeatDays?.length?ds<=e.repeatUntil&&e.repeatDays.includes(pd(ds).getDay()):ds===e.date);
const byTime=(a,b)=>(a.start||'')<(b.start||'')?-1:1;
export const evOn=ds=>S.events.filter(e=>occursOn(e,ds)).map(e=>({...e,date:ds})).sort(byTime),
evNext=(ds,limit=5)=>{
const events=[];
for(const e of S.events){
if(!e.repeatDays?.length){if(e.date>ds)events.push(e);continue}
let date=e.date>ds?e.date:ymd(addD(pd(ds),1)),count=0;
while(date<=e.repeatUntil&&count<limit){
if(e.repeatDays.includes(pd(date).getDay())){events.push({...e,date});count++}
date=ymd(addD(pd(date),1))
}}
return events.sort((a,b)=>a.date===b.date?byTime(a,b):a.date<b.date?-1:1).slice(0,limit)
},tkOn=ds=>S.tasks.filter(t=>t.due===ds);
export const cmp=(a,b)=>(a.date+(a.start||''))<(b.date+(b.start||''))?-1:1,tcmp=(a,b)=>((a.pri||2)-(b.pri||2))||((a.due||'9')<(b.due||'9')?-1:1);
export const diaryOn=ds=>S.diary.filter(e=>e.date===ds).sort((a,b)=>(a.createdAt||'')<(b.createdAt||'')?-1:1);
export const diaryDays=()=>new Set(S.diary.map(e=>e.date));
