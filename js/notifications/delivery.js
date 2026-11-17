// Delivery: shows a notification on the available channels and records how it went.
//  in-app  : always (the bell and the notification center), plus a small toast while the app is visible.
//  browser : a system notification, only if the user allowed it and it is switched on. Sent while the page is hidden
//            (or always, if the user chose that). It is created by this page, so the page or installed app must be running.
//  push    : NOT implemented. Reminders cannot arrive while the app is closed; that needs a server and Web Push.
import {S} from '../storage/store.js';
import {emit} from '../core/bus.js';
import {getNP, setNP} from './prefs.js';

export const supported=()=>typeof Notification!=='undefined';
export const permission=()=>supported()?Notification.permission:'unsupported';
export async function requestPermission(){if(!supported())return 'unsupported';const p=await Notification.requestPermission();if(p==='granted')setNP({browser:true});return p}

async function showSystem(n){
const o={body:n.message,tag:n.id,icon:'assets/icons/icon.svg',data:{id:n.id,url:`./index.html?open=${n.id}`}};
const reg=navigator.serviceWorker&&await navigator.serviceWorker.getRegistration();
if(reg&&reg.showNotification){
try{await reg.showNotification(n.title,n.category==='diary'?{...o,actions:[{action:'open',title:'Write entry'}]}:o)}
catch{await reg.showNotification(n.title,o)}
}else{const x=new Notification(n.title,o);x.onclick=()=>{window.focus();emit('notify:click',n.id);x.close()}}}

export async function deliver(n,{force=false}={}){
const np=getNP(),channels=['in-app'];let browserError='';
if(supported()&&Notification.permission==='granted'&&np.browser&&(force||document.hidden||np.browserWhenOpen)){
try{await showSystem(n);channels.push('browser')}catch(e){browserError=e.message}}
n.delivery={status:'delivered',channels,at:new Date().toISOString(),...(browserError?{browserError}:{})};
await S.save('notifications',n);
if(np.inApp&&!document.hidden)emit('notify:toast',n)}
