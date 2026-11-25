import test from 'node:test';
import assert from 'node:assert/strict';
import {WIDGETS, DEFAULT_LAYOUT, parseLayout, moveWidget, toggleWidget, editorHTML} from '../js/features/dashboard.js';

test('missing layout gives the default',()=>{assert.deepEqual(parseLayout(null),['overview','nextup','todo']);assert.deepEqual(DEFAULT_LAYOUT,['overview','nextup','todo'])});
test('empty string means nothing visible',()=>assert.deepEqual(parseLayout(''),[]));
test('unknown ids, duplicates and spaces are cleaned',()=>assert.deepEqual(parseLayout(' diary,bogus,todo,diary '),['diary','todo']));
test('move up/down and no-op at the ends',()=>{const a=['overview','nextup','todo'];
  assert.deepEqual(moveWidget(a,'todo',-1),['overview','todo','nextup']);
  assert.deepEqual(moveWidget(a,'overview',-1),a);assert.deepEqual(moveWidget(a,'todo',1),a);
  assert.deepEqual(a,['overview','nextup','todo'])});
test('toggle on appends, off removes',()=>{assert.deepEqual(toggleWidget(['todo'],'diary',true),['todo','diary']);assert.deepEqual(toggleWidget(['todo','diary'],'todo',false),['diary']);assert.deepEqual(toggleWidget(['todo'],'todo',true),['todo'])});
test('editor lists every widget once with switches',()=>{const h=editorHTML(['todo']);
  assert.equal(WIDGETS.length,7);for(const [id] of WIDGETS)assert.equal(h.split(`data-dash-toggle="${id}"`).length,2);
  assert.match(h,/data-dash-toggle="todo" checked/);assert.match(h,/data-dash-reset/)});

import {S} from '../js/storage/store.js';
import {Friends} from '../js/features/friends.js';
import {todayWidget, diaryWidget, friendsWidget, plansWidget} from '../js/features/widgets.js';

test('today widget lists events and due tasks for the day',()=>{
  S.events=[{id:'e1',title:'Gym <b>',date:'2026-03-02',start:'07:00'}];S.tasks=[{id:'t1',title:'Pay rent',due:'2026-03-02',done:false},{id:'t2',title:'Old',due:'2026-03-01',done:false}];
  const h=todayWidget('2026-03-02');assert.match(h,/data-ev="e1"/);assert.match(h,/Gym &lt;b&gt;/);assert.match(h,/data-tk="t1"/);assert.doesNotMatch(h,/data-tk="t2"/)});
test('diary widget offers to write when there is no entry',()=>{S.diary=[];assert.match(diaryWidget('2026-03-02'),/data-dytoday/)});
test('diary widget opens today\'s entry when there is one',()=>{S.diary=[{id:'d1',date:'2026-03-02',title:'Nice day',mood:'great'}];const h=diaryWidget('2026-03-02');assert.match(h,/data-dyopen="d1"/);assert.match(h,/Nice day/)});
test('friends widget with no friends shows Add friend',()=>{Friends.friends=[];const h=friendsWidget('2026-03-02');assert.match(h,/data-go="friends"/);assert.match(h,/Add friend/)});
test('plans widget shows at most 5 upcoming items',()=>{S.events=[];S.tasks=Array.from({length:8},(_,i)=>({id:'p'+i,title:'T'+i,due:'2026-03-0'+(3+i%5),done:false}));
  assert.equal(plansWidget('2026-03-02').split('class="plan-row"').length-1,5)});
test('friends widget escapes a friend\'s event time and survives a bad one',()=>{
  Friends.friends=[{id:'f1',email:'a@b.c',records:[{collection:'events',payload:{id:'x',title:'Hi',date:'2026-03-02',start:'10:<img src=x onerror=alert(1)>'}},{collection:'events',payload:{id:'y',title:'Bad',date:'2026-03-02',start:7}}]}];
  Friends.visible=new Set(['f1']);
  const h=friendsWidget('2026-03-02');assert.doesNotMatch(h,/<img/);assert.match(h,/Bad/)});
test('valid event times still show in widgets',()=>{S.events=[{id:'e9',title:'Lunch',date:'2026-03-02',start:'12:30'}];S.tasks=[];
  assert.doesNotMatch(todayWidget('2026-03-02'),/All day/)});
