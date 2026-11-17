import test from 'node:test';
import assert from 'node:assert/strict';
import {computeDue, eventCandidates, taskCandidates, diaryCandidates, lead} from '../js/notifications/rules.js';
import {DEFAULTS} from '../js/notifications/prefs.js';

const np = (over = {}) => ({...DEFAULTS, ...over, diary: {...DEFAULTS.diary, ...(over.diary || {})}, events: {...DEFAULTS.events, ...(over.events || {})}, tasks: {...DEFAULTS.tasks, ...(over.tasks || {})}});
const at = (s) => { const [d, t] = s.split(' '); const [y, m, dd] = d.split('-'); const [h, mi] = t.split(':'); return new Date(+y, m - 1, +dd, +h, +mi); };
const ctx = ({events = [], tasks = [], diary = []} = {}) => ({
  eventsOn: ds => events.filter(e => e.date === ds).map(e => ({...e})),
  tasks,
  diaryOn: ds => diary.filter(d => d.date === ds),
});
const ev = (o = {}) => ({id: 'e1', title: 'Software Engineering Lecture', date: '2026-11-17', start: '10:00', end: '11:00', remind: '15', ...o});
const task = (o = {}) => ({id: 't1', title: 'Database Assignment', due: '2026-11-20', done: false, ...o});

test('event: reminder fires 15 minutes before, with the right wording', () => {
  const [c] = eventCandidates(ctx({events: [ev()]}), at('2026-11-17 09:50'), np());
  assert.equal(c.title, 'Upcoming event: Software Engineering Lecture');
  assert.equal(c.message, 'Your event starts in 10 minutes.');
  assert.equal(c.category, 'calendar');
  assert.deepEqual(c.related, {type: 'event', id: 'e1', date: '2026-11-17'});
});
test('event: nothing before the reminder time, nothing once the event is well under way', () => {
  assert.equal(eventCandidates(ctx({events: [ev()]}), at('2026-11-17 09:44'), np()).length, 0);
  assert.equal(eventCandidates(ctx({events: [ev()]}), at('2026-11-17 10:15'), np()).length, 0);
  assert.equal(eventCandidates(ctx({events: [ev()]}), at('2026-11-17 14:00'), np()).length, 0);
});
test('event: opening the app a few minutes late still gets a truthful message', () => {
  const [c] = eventCandidates(ctx({events: [ev()]}), at('2026-11-17 10:05'), np());
  assert.equal(c.message, 'Your event started 5 minutes ago.');
});
test('event: "at the time" reminders and no-reminder events', () => {
  assert.equal(eventCandidates(ctx({events: [ev({remind: '0'})]}), at('2026-11-17 10:00'), np())[0].message, 'Your event is starting now.');
  assert.equal(eventCandidates(ctx({events: [ev({remind: ''})]}), at('2026-11-17 10:00'), np()).length, 0);
  assert.equal(eventCandidates(ctx({events: [ev({remind: undefined})]}), at('2026-11-17 10:00'), np()).length, 0);
});
test('event: the key is stable between ticks, and changes when the event is rescheduled', () => {
  const a = eventCandidates(ctx({events: [ev()]}), at('2026-11-17 09:50'), np())[0].key;
  const b = eventCandidates(ctx({events: [ev()]}), at('2026-11-17 09:51'), np())[0].key;
  const c = eventCandidates(ctx({events: [ev({start: '11:00'})]}), at('2026-11-17 10:50'), np())[0].key;
  assert.equal(a, b);
  assert.notEqual(a, c);
});
test('event: a day-before reminder fires the previous day; all-day events use 8:00', () => {
  assert.equal(eventCandidates(ctx({events: [ev({remind: '1440'})]}), at('2026-11-16 10:30'), np()).length, 1);
  assert.equal(eventCandidates(ctx({events: [ev({remind: '1440'})]}), at('2026-11-16 09:30'), np()).length, 0);
  const allDay = ev({start: '', end: '', remind: '0'});
  assert.match(eventCandidates(ctx({events: [allDay]}), at('2026-11-17 08:30'), np())[0].message, /all-day event is today/);
});
test('event: custom lead times and the global switch', () => {
  assert.equal(eventCandidates(ctx({events: [ev({remind: '300'})]}), at('2026-11-17 05:00'), np()).length, 1);
  assert.equal(eventCandidates(ctx({events: [ev()]}), at('2026-11-17 09:50'), np({events: {on: false}})).length, 0);
});

test('task: default reminder is the morning it is due, once the time has passed', () => {
  assert.equal(taskCandidates(ctx({tasks: [task()]}), at('2026-11-20 08:59'), np()).length, 0);
  const [c] = taskCandidates(ctx({tasks: [task()]}), at('2026-11-20 09:00'), np());
  assert.equal(c.title, 'Task due today');
  assert.equal(c.category, 'deadlines');
  assert.match(c.message, /Database Assignment/);
});
test('task: evening-before reminder mentions tomorrow', () => {
  const t = task({remind: 'eve'});
  assert.equal(taskCandidates(ctx({tasks: [t]}), at('2026-11-19 17:59'), np()).length, 0);
  const [c] = taskCandidates(ctx({tasks: [t]}), at('2026-11-19 18:00'), np());
  assert.equal(c.title, 'Deadline approaching');
  assert.match(c.message, /due tomorrow\. Make sure you have enough time/);
});
test('task: never for completed tasks or tasks with reminders off', () => {
  assert.equal(taskCandidates(ctx({tasks: [task({done: true})]}), at('2026-11-20 10:00'), np()).length, 0);
  assert.equal(taskCandidates(ctx({tasks: [task({remind: 'off'})]}), at('2026-11-20 10:00'), np()).length, 0);
  assert.equal(taskCandidates(ctx({tasks: [task({remind: 'off', due: '2026-11-10'})]}), at('2026-11-12 10:00'), np()).length, 0);
});
test('task: custom date and time', () => {
  const t = task({remind: 'at', remindAt: '2026-11-18T14:30'});
  assert.equal(taskCandidates(ctx({tasks: [t]}), at('2026-11-18 14:29'), np()).length, 0);
  assert.equal(taskCandidates(ctx({tasks: [t]}), at('2026-11-18 14:30'), np())[0].category, 'tasks');
});
test('task: overdue notice comes once, the morning after, and not for very old tasks', () => {
  const t = task({due: '2026-11-16'});
  assert.equal(taskCandidates(ctx({tasks: [t]}), at('2026-11-17 08:59'), np()).length, 0);
  const [c] = taskCandidates(ctx({tasks: [t]}), at('2026-11-17 09:00'), np());
  assert.equal(c.title, 'Task overdue');
  assert.equal(taskCandidates(ctx({tasks: [task({due: '2026-10-01'})]}), at('2026-11-17 10:00'), np()).length, 0);
  assert.equal(taskCandidates(ctx({tasks: [t]}), at('2026-11-17 10:00'), np({tasks: {overdue: false}})).length, 0);
});
test('task: no due date means no default reminder', () => {
  assert.equal(taskCandidates(ctx({tasks: [task({due: ''})]}), at('2026-11-20 10:00'), np()).length, 0);
});

test('diary: off by default; on, it fires at the chosen time on chosen days only', () => {
  assert.equal(diaryCandidates(ctx(), at('2026-11-17 21:00'), np()).length, 0);
  const on = np({diary: {on: true, time: '20:00'}});
  assert.equal(diaryCandidates(ctx(), at('2026-11-17 19:59'), on).length, 0);
  const [c] = diaryCandidates(ctx(), at('2026-11-17 20:00'), on);
  assert.equal(c.title, 'Your daily diary is waiting');
  assert.equal(c.key, 'diary:2026-11-17');
  const tueOff = np({diary: {on: true, time: '20:00', days: [0, 1, 3, 4, 5, 6]}}); // 17 Nov 2026 is a Tuesday
  assert.equal(diaryCandidates(ctx(), at('2026-11-17 21:00'), tueOff).length, 0);
});
test('diary: skipped when today already has an entry', () => {
  const on = np({diary: {on: true, time: '20:00'}});
  assert.equal(diaryCandidates(ctx({diary: [{date: '2026-11-17'}]}), at('2026-11-17 21:00'), on).length, 0);
  assert.equal(diaryCandidates(ctx({diary: [{date: '2026-11-16'}]}), at('2026-11-17 21:00'), on).length, 1);
});
test('computeDue combines everything in time order', () => {
  const all = computeDue(ctx({events: [ev()], tasks: [task({due: '2026-11-17'})]}), at('2026-11-17 09:50'), np());
  assert.deepEqual(all.map(c => c.category), ['deadlines', 'calendar']);
});
test('lead formats durations', () => {
  assert.equal(lead(60e3), '1 minute');
  assert.equal(lead(15 * 60e3), '15 minutes');
  assert.equal(lead(90 * 60e3), '1 hour 30 minutes');
  assert.equal(lead(26 * 3600e3), '1 day 2 hours');
});
