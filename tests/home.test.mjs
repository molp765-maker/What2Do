import test from 'node:test';
import assert from 'node:assert/strict';
import {dnData, lr} from '../js/features/home.js';

const t=(due,done=false)=>({id:Math.random().toString(),title:'x',due,done});
test('lr rounds to exactly 100',()=>{assert.equal(lr([1,1,1],3).reduce((a,b)=>a+b,0),100);assert.deepEqual(lr([0,0,0],0),[0,0,0])});
test('donut buckets come from real task data',()=>{
  const D=dnData([t('2026-01-01'),t('2026-01-05'),t('2026-02-01'),t('',false),t('2026-01-01',true)],'2026-01-05');
  const by=Object.fromEntries(D.seg.map(g=>[g.id,g]));
  assert.equal(D.tot,5);assert.equal(by.a.n,2);assert.equal(by.c.n,1);assert.equal(by.p.n,2);
  assert.equal(D.seg.reduce((s,g)=>s+g.p,0),100);
  assert.ok(Math.abs(D.seg.reduce((s,g)=>s+g.f,0)-1)<1e-9);
});
test('empty task list gives zeros',()=>{const D=dnData([],'2026-01-05');assert.equal(D.tot,0);assert.ok(D.seg.every(g=>g.p===0&&g.f===0))});

import {homeBody} from '../js/features/home.js';
test('default layout keeps the current Home sections in order',()=>{const h=homeBody(['overview','nextup','todo']);
  assert.ok(h.indexOf('h-donut-card')<h.indexOf('h-tile')&&h.indexOf('h-tile')<h.indexOf('h-need'))});
test('order follows the layout',()=>{const h=homeBody(['todo','overview']);assert.ok(h.indexOf('h-need')<h.indexOf('h-donut-card'));assert.doesNotMatch(h,/h-tile/)});
test('empty layout shows a Customize button',()=>{const h=homeBody([]);assert.match(h,/data-dash-edit/);assert.match(h,/Customize/)});
