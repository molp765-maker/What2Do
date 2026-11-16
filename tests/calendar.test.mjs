import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {S, evNext, evOn} from '../js/storage/store.js';

afterEach(() => { S.events = []; });

test('weekly events occur only on selected weekdays within the inclusive range', () => {
  S.events = [{id:'weekly',date:'2026-11-17',repeatDays:[1,2],repeatUntil:'2026-11-24'}];

  assert.deepEqual(evOn('2026-11-16'), []);
  assert.equal(evOn('2026-11-17')[0].id, 'weekly');
  assert.deepEqual(evOn('2026-11-18'), []);
  assert.equal(evOn('2026-11-23')[0].date, '2026-11-23');
  assert.equal(evOn('2026-11-24').length, 1);
  assert.deepEqual(evOn('2026-11-25'), []);
});

test('one-time events keep their original date', () => {
  S.events = [{id:'once',date:'2026-11-17'}];

  assert.equal(evOn('2026-11-17')[0].id, 'once');
  assert.deepEqual(evOn('2026-11-18'), []);
});

test('upcoming events include the next occurrences in date order', () => {
  S.events = [
    {id:'weekly',date:'2026-11-17',repeatDays:[1,2],repeatUntil:'2026-11-24'},
    {id:'once',date:'2026-11-20'}
  ];

  assert.deepEqual(evNext('2026-11-17', 4).map(e => [e.id,e.date]), [
    ['once','2026-11-20'],
    ['weekly','2026-11-23'],
    ['weekly','2026-11-24']
  ]);
});
