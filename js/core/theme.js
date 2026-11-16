// Applies the saved theme preference
import {Prefs} from '../storage/prefs.js';

export function theme(){const t=Prefs.get('theme','system');t==='system'?document.documentElement.removeAttribute('data-theme'):document.documentElement.setAttribute('data-theme',t)}
