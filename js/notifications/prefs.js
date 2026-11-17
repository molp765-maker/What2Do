// Notification preferences (localStorage). Defaults are merged under whatever the user has saved.
import {Prefs} from '../storage/prefs.js';

export const DEFAULTS={on:true,inApp:true,browser:false,browserWhenOpen:false,
  diary:{on:false,time:'20:00',days:[0,1,2,3,4,5,6]},
  events:{on:true,defaultRemind:''},
  tasks:{dueDay:true,dueTime:'09:00',overdue:true,overdueTime:'09:00'}};
const merge=(a,b)=>{const o={...a};for(const k in b)o[k]=b[k]&&typeof b[k]==='object'&&!Array.isArray(b[k])?merge(a[k]||{},b[k]):b[k];return o};
export const getNP=()=>{try{return merge(DEFAULTS,JSON.parse(Prefs.get('notify','{}')))}catch{return merge(DEFAULTS,{})}};
export const setNP=patch=>{const n=merge(getNP(),patch);Prefs.set('notify',JSON.stringify(n));return n};
