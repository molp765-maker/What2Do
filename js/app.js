// Entry point
import {on} from './core/bus.js';
import {theme} from './core/theme.js';
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

on('render',render);
on('cloud:changed',()=>{const status=document.querySelector('[data-cloud-status]');if(status)status.textContent=Cloud.status});
on('cloud:auth-changed',()=>Router.go());
on('cloud:data',()=>{S.events=[];S.tasks=[];S.diary=[];S.load().then(()=>{updateBadge();render()}).catch(e=>{S.err=e.message;render()})});
on('open-related',openRelated);
theme();
bindEvents();
bindDiary();
bindCenter();
bindNotifySettings();
bindAuth();
addEventListener('hashchange',()=>Router.go());
Cloud.bind();
S.load().then(async()=>{await Cloud.restore();await S.load()}).catch(e=>{S.err=e.message}).finally(()=>{Router.go();updateBadge();startScheduler();launch()});
// Opened from a system notification (cold start) or told to by the service worker (page already open)
function launch(){const id=new URLSearchParams(location.search).get('open');if(id){history.replaceState(null,'',location.pathname+location.hash);openNotification(id)}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='notify-click'&&e.data.id)openNotification(e.data.id)});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
