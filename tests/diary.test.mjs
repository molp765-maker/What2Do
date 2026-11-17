import test, {afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {searchEntries, sortEntries, groupByMonth, preview, hl, wordCount} from '../js/core/diary.js';
import {S, diaryOn, diaryDays} from '../js/storage/store.js';

const E = (id, date, title, content, createdAt = date + 'T09:00:00Z') => ({id, date, title, content, mood: '', createdAt, updatedAt: createdAt});
const list = [
  E('a', '2026-11-17', 'Lab day', 'Finished the circuits report'),
  E('b', '2026-10-03', 'Weekend', 'Hiked with friends near the coast'),
  E('c', '2025-11-20', 'Last year', 'Started the semester'),
];
afterEach(() => { S.diary = []; });

test('search matches title, text, ISO date, month and year', () => {
  assert.deepEqual(searchEntries(list, 'circuits').map(e => e.id), ['a']);
  assert.deepEqual(searchEntries(list, 'weekend').map(e => e.id), ['b']);
  assert.deepEqual(searchEntries(list, '2026-10').map(e => e.id), ['b']);
  assert.deepEqual(searchEntries(list, 'november 2025').map(e => e.id), ['c']);
  assert.deepEqual(searchEntries(list, 'november').map(e => e.id), ['a', 'c']);
  assert.deepEqual(searchEntries(list, 'nothing here'), []);
  assert.equal(searchEntries(list, '  ').length, 3);
});
test('sorting is chronological either way, with same-day ties by creation time', () => {
  assert.deepEqual(sortEntries(list, 'new').map(e => e.id), ['a', 'b', 'c']);
  assert.deepEqual(sortEntries(list, 'old').map(e => e.id), ['c', 'b', 'a']);
  const two = [E('x', '2026-01-01', '', '', '2026-01-01T10:00:00Z'), E('y', '2026-01-01', '', '', '2026-01-01T08:00:00Z')];
  assert.deepEqual(sortEntries(two, 'old').map(e => e.id), ['y', 'x']);
});
test('grouping by month keeps order and labels', () => {
  const g = groupByMonth(sortEntries(list, 'new'));
  assert.deepEqual(g.map(x => x.key), ['2026-11', '2026-10', '2025-11']);
  assert.equal(g[0].label, 'November 2026');
});
test('preview trims, collapses whitespace and centres on a match', () => {
  assert.equal(preview('a  b\n\nc'), 'a b c');
  const long = 'word '.repeat(80) + 'needle ' + 'word '.repeat(80);
  assert.ok(preview(long, 'needle').includes('needle'));
  assert.ok(preview(long, '').length <= 152);
});
test('highlight escapes markup and wraps matches', () => {
  assert.equal(hl('<b>Hi</b> hi', 'hi'), '&lt;b&gt;<mark>Hi</mark>&lt;/b&gt; <mark>hi</mark>');
  assert.equal(hl('a & b', ''), 'a &amp; b');
  assert.equal(hl('x.y', '.'), 'x<mark>.</mark>y');
});
test('word count', () => { assert.equal(wordCount('  one two\nthree '), 3); assert.equal(wordCount(''), 0); });
test('store queries: entries on a day and days with entries', () => {
  S.diary = list.concat(E('d', '2026-11-17', 'Evening', 'later', '2026-11-17T20:00:00Z'));
  assert.deepEqual(diaryOn('2026-11-17').map(e => e.id), ['a', 'd']);
  assert.equal(diaryDays().size, 3);
  assert.deepEqual(diaryOn('2026-11-18'), []);
});
