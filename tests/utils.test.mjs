import test from 'node:test';
import assert from 'node:assert/strict';
import { ymd, pd, addD, mon, t12, esc } from '../js/core/utils.js';

test('ymd and pd round-trip a date', () => assert.equal(ymd(pd('2026-11-17')), '2026-11-17'));
test('addD crosses a month boundary', () => assert.equal(ymd(addD(pd('2026-11-30'), 1)), '2026-12-01'));
test('mon returns the Monday of the week', () => assert.equal(ymd(mon(pd('2026-11-18'))), '2026-11-16'));
test('t12 formats 24-hour times', () => {
  assert.equal(t12('09:30'), '9:30am');
  assert.equal(t12('13:00'), '1pm');
  assert.equal(t12('00:00'), '12am');
});
test('esc neutralises markup', () => assert.equal(esc('<b>"x"</b>'), '&lt;b&gt;&quot;x&quot;&lt;/b&gt;'));

import {t12 as t12safe} from '../js/core/utils.js';
test('t12 never passes markup through and survives bad input',()=>{
  assert.equal(t12safe('13:05'),'1:05pm');assert.equal(t12safe('09:00'),'9am');
  assert.equal(t12safe('10:<img src=x onerror=alert(1)>'),'');assert.equal(t12safe(7),'');assert.equal(t12safe(undefined),'')});
