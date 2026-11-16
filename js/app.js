// Entry point
import {on} from './core/bus.js';
import {theme} from './core/theme.js';
import {S} from './storage/store.js';
import {Router, render} from './router.js';
import {bindEvents} from './controller.js';

on('render',render);
theme();
bindEvents();
addEventListener('hashchange',()=>Router.go());
S.load().catch(e=>{S.err=e.message}).finally(()=>Router.go());
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
