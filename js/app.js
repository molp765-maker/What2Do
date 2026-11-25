// Entry point
import {on} from './core/bus.js';
import {S} from './storage/store.js';
import {Cloud} from './storage/cloud.js';
import {Router, render} from './router.js';
import {bindAuth} from './features/auth.js';
import {bindEvents} from './controller.js';
import {bindDiary} from './features/diary.js';
import {bindCenter, openNotification, updateBadge} from './notifications/center.js';
import {bindNotifySettings} from './notifications/settings-view.js';
import {startScheduler} from './notifications/scheduler.js';
import {openRelated} from './links.js';
import {Friends, bindFriends} from './features/friends.js';
import {bindHome} from './features/home.js';
import {bindShell} from './ui/shell.js';

on('render',render);
on('friends:changed',render);
on('cloud:changed',()=>{const status=document.querySelector('[data-cloud-status]');if(status)status.textContent=Cloud.status;if(Cloud.signedIn&&(Router.cur==='friends'||Router.cur==='calendar'))Friends.refresh(true)});
on('cloud:auth-changed',()=>{if(!Cloud.signedIn)Friends.reset();Router.go();if(Cloud.signedIn)Friends.consumeInvite()});
on('cloud:data',()=>{S.events=[];S.tasks=[];S.diary=[];S.load().then(()=>{updateBadge();render()}).catch(e=>{S.err=e.message;render()})});
on('open-related',openRelated);
bindEvents();
bindHome();
bindShell();
bindDiary();
bindCenter();
bindNotifySettings();
bindFriends();
bindAuth();
addEventListener('hashchange',()=>Router.go());
Cloud.bind();
S.load().then(async()=>{await Cloud.restore();await S.load()}).catch(e=>{S.err=e.message}).finally(()=>{Router.go();if(Cloud.signedIn)Friends.consumeInvite();updateBadge();startScheduler();launch()});
// Opened from a system notification (cold start) or told to by the service worker (page already open)
function launch(){const id=new URLSearchParams(location.search).get('open');if(id){history.replaceState(null,'',location.pathname+location.hash);openNotification(id)}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='notify-click'&&e.data.id)openNotification(e.data.id)});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
