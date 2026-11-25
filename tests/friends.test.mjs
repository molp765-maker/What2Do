import test from 'node:test';
import assert from 'node:assert/strict';
import {recordsOn} from '../js/features/friend-data.js';

test('shared calendar includes only selected items on their matching dates',()=>{
  const friend={id:'friend-1',email:'friend@example.test',records:[
    {collection:'events',payload:{id:'weekly',title:'Study',date:'2026-11-17',start:'10:00',repeatDays:[2,3],repeatUntil:'2026-12-01'}},
    {collection:'events',payload:{id:'once',title:'Lunch',date:'2026-11-18'}},
    {collection:'tasks',payload:{id:'task',title:'Read',due:'2026-11-18'}},
    {collection:'diary',payload:{id:'diary',title:'Entry',date:'2026-11-18'}}
  ]};

  assert.deepEqual(recordsOn(friend,'2026-11-17').events.map(e=>[e.id,e.date]),[['weekly','2026-11-17']]);
  const next=recordsOn(friend,'2026-11-18');
  assert.deepEqual(next.events.map(e=>[e.id,e.date]),[['weekly','2026-11-18'],['once','2026-11-18']]);
  assert.deepEqual(next.tasks.map(t=>t.id),['task']);
  assert.deepEqual(next.diary.map(d=>d.id),['diary']);
  assert.deepEqual(recordsOn(friend,'2026-12-02').events,[]);
});
