// Extra Home widgets: today's schedule, upcoming plans, diary and friends
import {TODAY, addD, dShort, esc, pd, t12, ymd} from '../core/utils.js';
import {col} from '../core/config.js';
import {moodOf} from '../core/diary.js';
import {S, diaryOn, evNext, evOn} from '../storage/store.js';
import {Friends} from './friends.js';

// Times can come from friends' data: only accept HH:MM text, always escaped
const tm=s=>typeof s==='string'&&/^\d{1,2}:\d{2}$/.test(s)?esc(t12(s)):'All day';
const box=(id,title,body)=>`<section class="card dash-w" data-widget="${id}" aria-label="${title}"><h2>${title}</h2>${body}</section>`;
const empty=(b,s='')=>`<div class="h-empty"><b>${b}</b>${s?`<span>${s}</span>`:''}</div>`;
// Rows with no action (friends' items) are plain divs, not buttons
const line=(attr,c,title,meta)=>{const tag=attr?'button':'div';return `<${tag} class="plan-row" ${attr} style="--cc:${c}"><i class="bar2"></i><span><b>${esc(title)}</b><small>${meta}</small></span></${tag}>`};

export function todayWidget(day=TODAY){
const ev=evOn(day).map(e=>line(`data-ev="${esc(e.id)}"`,col(e),e.title,tm(e.start)));
const tk=S.tasks.filter(t=>!t.done&&t.due===day).map(t=>line(`data-tk="${esc(t.id)}"`,col(t),t.title,'Task due'));
return box('today','Today’s schedule',ev.length||tk.length?`<div class="plan-list">${ev.join('')}${tk.join('')}</div>`:empty('Nothing scheduled today'))}

// Same rules as the Plans page (next 7 days), first 5 items
export function plansWidget(day=TODAY){const lim=ymd(addD(pd(day),7)),items=[];
for(const e of evNext(day,60))if(e.date<=lim)items.push({k:e.date,a:`data-ev="${esc(e.id)}"`,c:col(e),t:e.title,m:(tm(e.start))+' · event'});
for(const t of S.tasks)if(!t.done&&t.due&&t.due>day&&t.due<=lim)items.push({k:t.due,a:`data-tk="${esc(t.id)}"`,c:col(t),t:t.title,m:'task due'});
items.sort((a,b)=>a.k<b.k?-1:a.k>b.k?1:0);
const rows=items.slice(0,5).map(x=>line(x.a,x.c,x.t,dShort(x.k)+' · '+x.m)).join('');
return box('plans','Upcoming plans',(rows?`<div class="plan-list">${rows}</div>`:empty('No plans this week'))+`<div class="dash-more"><button class="btn" data-go="plans">See all</button></div>`)}

export function diaryWidget(day=TODAY){const es=diaryOn(day),e=es[es.length-1];
if(!e)return box('diary','Diary',empty('Nothing written today','A few lines is a good start.')+`<div class="dash-more"><button class="btn pri" data-dytoday>Write today’s entry</button></div>`);
const m=moodOf(e.mood);
return box('diary','Diary',`<button class="dash-dy" data-dyopen="${esc(e.id)}">${m?`<span class="dy-mo" title="${m[2]}">${m[1]}</span>`:''}<b>${esc(e.title||'Untitled')}</b><small>Today’s entry</small></button>`)}

export function friendsWidget(day=TODAY){
if(!Friends.friends.length)return box('friends','Friends',`<div class="friend-cta"><span>See what friends share with you</span><button class="btn" data-go="friends">Add friend</button></div>`);
const rows=Friends.day(day).flatMap(({friend,events,tasks})=>[
...events.map(e=>line('',Friends.color(friend.id),e.title,`${tm(e.start)} · ${esc(friend.email)}`)),
...tasks.map(t=>line('',Friends.color(friend.id),t.title,`Task due · ${esc(friend.email)}`))]).join('');
return box('friends','Friends',rows?`<div class="plan-list">${rows}</div>`:empty('Nothing shared for today'))}
