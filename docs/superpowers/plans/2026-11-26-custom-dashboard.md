# Customizable Home Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Home into a list of widgets the user can show/hide and reorder, editable from Home (dialog) and Settings (card), saved on the device.

**Architecture:** A new `js/features/dashboard.js` owns the widget registry, the saved layout (pure helpers + `Prefs` key `dashboard`), the shared editor HTML and its click handlers. `home.js` keeps the existing three sections, split into per-widget render functions, and builds Home from the layout. Four new widgets live in `js/features/widgets.js`. No build step, no new dependencies, no database change.

**Tech Stack:** Vanilla ES modules, template-string HTML, `node --test` (run with `npm test`).

**Spec:** `docs/superpowers/specs/2026-11-26-custom-dashboard-design.md`

## Global Constraints
- Layout stored as `Prefs` key `dashboard`: comma-separated visible widget ids in order. Missing key → default `overview,nextup,todo`. Empty string → nothing visible (not the default).
- Widget ids and titles exactly: `overview` Task overview · `nextup` Next up · `todo` Tasks to do · `today` Today's schedule · `plans` Upcoming plans · `diary` Diary · `friends` Friends.
- Default Home must look exactly as it does today.
- Modules must import cleanly in Node (no `document`/`window` at module top level) — tests import them.
- Keep the existing theme (Poppins, cream cards, plum accents); add CSS to the end of `css/theme.css`.
- Escape all user text with `esc()`.

## Review Focus
- Saved value has unknown ids / duplicates / spaces (e.g. after a future widget is removed) → those are dropped, the rest render in order. (Task 1 test)
- User turns every widget off → Home shows the "Customize" message, not a blank page, and the choice survives reload (empty string ≠ missing). (Task 1 + Task 3 tests)
- Moving the first widget up or the last widget down → no change, no error. (Task 1 test)
- `todo` widget hidden → `updateHome()` and priority keyboard handlers must not throw (they already early-return on missing `.seg3`; keep it that way). (Task 3 manual check)
- Friends widget when friend sharing isn't set up / user has no friends → shows the "Add friend" button, never a raw error. (Task 2 test)

---

### Task 1: Layout model and editor (`dashboard.js`)

**Files:**
- Create: `js/features/dashboard.js`
- Test: `tests/dashboard.test.mjs`

**Interfaces:**
- Produces:
  - `WIDGETS: Array<[id: string, title: string]>` — the 7 widgets in the order above.
  - `DEFAULT_LAYOUT: string[]` = `['overview','nextup','todo']`
  - `parseLayout(raw: string|null): string[]` — `null`/`undefined` → copy of default; otherwise split on `,`, trim, keep known ids, drop duplicates.
  - `moveWidget(ids: string[], id: string, dir: -1|1): string[]` — returns a new array; no-op at the ends or if `id` not visible.
  - `toggleWidget(ids: string[], id: string, on: boolean): string[]` — on: appends if absent; off: removes.
  - `getLayout(): string[]` = `parseLayout(Prefs.get('dashboard', null))`; `setLayout(ids: string[]): void` = `Prefs.set('dashboard', ids.join(','))`.
  - `editorHTML(ids?: string[]): string` — `<div class="dash-editor">` containing visible widgets first (in order), then hidden ones; each row: title, a checkbox `data-dash-toggle="<id>"` (`checked` when visible), and for visible rows up/down buttons `data-dash-move="<id>" data-dir="-1|1"` with `aria-label="Move <title> up|down"` (`disabled` at the ends). Then a `Reset to default` button `data-dash-reset`.
  - `bindDashboard(): void` — document-level handlers: `change` on `[data-dash-toggle]`, `click` on `[data-dash-move]`, `[data-dash-reset]`, `[data-dash-edit]`. Every change calls `setLayout`, then replaces every `.dash-editor` element's `outerHTML` with fresh `editorHTML()`, then `emit('render')`. `[data-dash-edit]` fills `#dlg` with `<h3>Customize Home</h3>` + `editorHTML()` + a `Done` button (`data-dash-done`, closes the dialog) and calls `showModal()`.

- [ ] **Step 1: Write failing tests** in `tests/dashboard.test.mjs`:

```js
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
```

- [ ] **Step 2: Run** `npm test` — Expected: dashboard tests FAIL (module not found).
- [ ] **Step 3: Implement `js/features/dashboard.js`** per the Interfaces block. Imports: `emit` from `../core/bus.js`, `esc` from `../core/utils.js`, `Prefs` from `../storage/prefs.js`.
- [ ] **Step 4: Run** `npm test` — Expected: all pass.
- [ ] **Step 5: Commit** `git add js/features/dashboard.js tests/dashboard.test.mjs && git commit -m "feat: dashboard layout model and editor"`

---

### Task 2: New widgets (`widgets.js`)

**Files:**
- Create: `js/features/widgets.js`
- Test: `tests/dashboard.test.mjs` (append)

**Interfaces:**
- Consumes: `S`, `evOn`, `evNext`, `diaryOn` (store.js); `Friends` (friends.js); `moodOf` (core/diary.js); `esc, dShort, t12, TODAY, today, addD, ymd` (utils.js); `col` (config.js).
- Produces (each returns a full `<section class="card dash-w" aria-label="<title>"><h2><title></h2>…</section>`):
  - `todayWidget(day = TODAY): string` — `evOn(day)` events as buttons `data-ev="<id>"` (time via `t12` or "All day") then open tasks with `due===day` as buttons `data-tk="<id>"`. Empty: `<div class="h-empty"><b>Nothing scheduled today</b></div>`.
  - `plansWidget(day = TODAY): string` — same item rules as `plansView` (events next 7 days via `evNext`, open tasks due after `day`), sorted by date, first 5, rows reuse `.plan-row` markup; footer button `data-go="plans"` "See all". Empty: "No plans this week".
  - `diaryWidget(day = TODAY): string` — latest `diaryOn(day)` entry: mood emoji + title as a button `data-dyopen="<id>"`; none → button `data-dytoday` "Write today's entry".
  - `friendsWidget(day = TODAY): string` — no friends (`Friends.friends.length===0`) → text "See what friends share with you" + button `data-go="friends"` "Add friend". Otherwise one row per item in `Friends.day(day)` (events + tasks, friend email in small text); nothing shared today → "Nothing shared for today".

- [ ] **Step 1: Append failing tests**:

```js
import {S} from '../js/storage/store.js';
import {Friends} from '../js/features/friends.js';
import {todayWidget, diaryWidget, friendsWidget} from '../js/features/widgets.js';

test('today widget lists events and due tasks for the day',()=>{
  S.events=[{id:'e1',title:'Gym <b>',date:'2026-03-02',start:'07:00'}];S.tasks=[{id:'t1',title:'Pay rent',due:'2026-03-02',done:false},{id:'t2',title:'Old',due:'2026-03-01',done:false}];
  const h=todayWidget('2026-03-02');assert.match(h,/data-ev="e1"/);assert.match(h,/Gym &lt;b&gt;/);assert.match(h,/data-tk="t1"/);assert.doesNotMatch(h,/data-tk="t2"/)});
test('diary widget offers to write when there is no entry',()=>{S.diary=[];assert.match(diaryWidget('2026-03-02'),/data-dytoday/)});
test('friends widget with no friends shows Add friend',()=>{Friends.friends=[];const h=friendsWidget('2026-03-02');assert.match(h,/data-go="friends"/);assert.match(h,/Add friend/)});
```

- [ ] **Step 2: Run** `npm test` — Expected: new tests FAIL (module not found).
- [ ] **Step 3: Implement `js/features/widgets.js`** per Interfaces. If importing `friends.js` in Node pulls in browser-only code, fix by keeping the import at module scope only (no top-level DOM access) — check `friends.js` has none.
- [ ] **Step 4: Run** `npm test` — Expected: all pass. Also confirm `[data-dytoday]` / `[data-dyopen]` clicks work from Home (diary.js binds them at document level and navigates via `show()`); if they only work on the diary page, note it and route via `writeFor`.
- [ ] **Step 5: Commit** `git add js/features/widgets.js tests/dashboard.test.mjs && git commit -m "feat: today, plans, diary and friends widgets"`

---

### Task 3: Build Home from the layout; Settings card; styles

**Files:**
- Modify: `js/features/home.js` (`homeView`, ~lines 36-40)
- Modify: `js/features/settings.js` (`settingsView`)
- Modify: `js/app.js` (call `bindDashboard()` next to `bindHome()`)
- Modify: `js/router.js` (also `Friends.refresh()` when `v==='home'` and layout includes `friends`)
- Modify: `css/theme.css` (append)
- Test: `tests/home.test.mjs` (append)

**Interfaces:**
- Consumes: `getLayout`, `editorHTML`, `bindDashboard` (Task 1); the four widget functions (Task 2).
- Produces: `homeBody(ids: string[]): string` exported from `home.js` — the widget area only (no greeting).

- [ ] **Step 1: Append failing tests** to `tests/home.test.mjs`:

```js
import {homeBody} from '../js/features/home.js';
test('default layout keeps the current Home sections in order',()=>{const h=homeBody(['overview','nextup','todo']);
  assert.ok(h.indexOf('h-donut-card')<h.indexOf('h-tile')&&h.indexOf('h-tile')<h.indexOf('h-need'))});
test('order follows the layout',()=>{const h=homeBody(['todo','overview']);assert.ok(h.indexOf('h-need')<h.indexOf('h-donut-card'));assert.doesNotMatch(h,/h-tile/)});
test('empty layout shows a Customize button',()=>{const h=homeBody([]);assert.match(h,/data-dash-edit/);assert.match(h,/Customize/)});
```

- [ ] **Step 2: Run** `npm test` — Expected: FAIL (`homeBody` not exported).
- [ ] **Step 3: Implement `homeBody`.** Split the current markup into `overviewW()` (the donut `<section>`), `nextupW()` (the three tiles) and `todoW()` (the `.h-need` block). When `overview` is immediately followed by `nextup`, wrap both in the existing `<div class="h-gr">` so the default looks unchanged; when either appears alone, wrap it in `<div class="h-gr h-gr-solo">`. Other ids map to the Task 2 functions. Empty → `<div class="card h-empty"><b>Your Home is empty</b><span>Choose what to show here.</span><button class="btn pri" data-dash-edit>Customize</button></div>`. `homeView` = greeting row (greeting + `<button class="btn" data-dash-edit aria-label="Customize Home">Edit</button>`) + `errCard` + `homeBody(getLayout())`.
- [ ] **Step 4: Settings.** Add `card('Dashboard','w','',`<p class="sub">Choose what Home shows first.</p>${editorHTML()}`)` after the Profile card.
- [ ] **Step 5: Wire up** `bindDashboard()` in `app.js`; in `router.js` call `Friends.refresh()` for `home` when `getLayout().includes('friends')`.
- [ ] **Step 6: CSS** (append to `css/theme.css`): `.h-hello` row as flex with space-between; `.h-gr-solo` single row (overview alone: one column; nextup alone: tiles in a row, `grid-template-rows:78px`); `.dash-w` cards spaced like `.h-need` (`margin-top:14px`); `.dash-editor` rows flex with title left, controls right, 44px min touch height; disabled arrow buttons dimmed. Phone (≤700px): `.h-gr-solo` single column.
- [ ] **Step 7: Run** `npm test` — Expected: all pass.
- [ ] **Step 8: Manual check** with `npm start`: default Home identical to before; Edit opens dialog, toggling/moving updates Home behind it live; Settings card does the same; turn all off → Customize message, reload keeps it; hide `todo` and press arrow keys / complete tasks elsewhere — no console errors; phone width has no horizontal scroll.
- [ ] **Step 9: Commit** `git add js/features/home.js js/features/settings.js js/app.js js/router.js css/theme.css tests/home.test.mjs && git commit -m "feat: customizable Home dashboard"`
