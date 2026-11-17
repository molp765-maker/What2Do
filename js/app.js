// Entry point
import {on} from './core/bus.js';
import {theme} from './core/theme.js';
import {S} from './storage/store.js';
import {Router, render} from './router.js';
import {bindEvents} from './controller.js';
import {bindDiary} from './features/diary.js';
import {bindCenter, openNotification, updateBadge} from './notifications/center.js';
import {bindNotifySettings} from './notifications/settings-view.js';
import {startScheduler} from './notifications/scheduler.js';
import {openRelated} from './links.js';

on('render',render);
on('open-related',openRelated);
theme();
bindEvents();
bindDiary();
bindCenter();
bindNotifySettings();
addEventListener('hashchange',()=>Router.go());
S.load().catch(e=>{S.err=e.message}).finally(()=>{Router.go();updateBadge();startScheduler();launch()});
// Opened from a system notification (cold start) or told to by the service worker (page already open)
function launch(){const id=new URLSearchParams(location.search).get('open');if(id){history.replaceState(null,'',location.pathname+location.hash);openNotification(id)}}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',e=>{if(e.data&&e.data.type==='notify-click'&&e.data.id)openNotification(e.data.id)});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
