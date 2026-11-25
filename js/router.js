// Hash router and the render loop
import {Cloud} from './storage/cloud.js';
import {authView} from './features/auth.js';
import {storageStatus} from './features/settings.js';
import {Friends} from './features/friends.js';
import {C} from './features/calendar.js';
import {Sch} from './features/schedule.js';
import {homeAfter} from './features/home.js';
import {renderNav, renderFab, renderOverlay} from './ui/shell.js';
import {Views} from './views.js';

export const Router={cur:'home',go(){let h=location.hash.slice(1);if(h==='tasks'){Sch.tab='tasks';h='schedule'}this.cur=Cloud.signedIn&&Views[h]&&h!=='auth'?h:Cloud.signedIn?'home':'auth';render()}};
export function render(){let v=Router.cur;if(!Cloud.signedIn)v='auth';else if(v==='auth')v='home';Router.cur=v;
const entering=Router.last!==v,m=document.getElementById('main');
if(entering){if(v==='calendar')C.view=C.cv||'month';else if(v==='schedule'&&Sch.tab!=='tasks')C.view=Sch.tab}
if(v==='schedule'&&Sch.tab!=='tasks')C.view=Sch.tab;
document.body.dataset.view=v;m.innerHTML=v==='auth'?authView():Views[v]();if(entering)m.scrollTop=0;Router.last=v;
if(v==='friends'||v==='calendar')Friends.refresh();
renderNav(v);renderFab(v);renderOverlay(v);
if(v==='home')homeAfter(entering);
if(v==='settings')storageStatus()}
