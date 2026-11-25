# Customizable Home dashboard — design

## Why
Users open the app to Home. Each person cares about different parts of What2Do, so Home should show
the features *they* want to see first, in the order they want.

## Goals
- Home is built from widgets, one per main feature.
- Each user can turn widgets on/off and reorder them.
- The same editor is available in two places: an **Edit** button on Home, and a **Dashboard** card in Settings.
- Layout is remembered on this device.

## Non-goals (for now)
- Syncing the layout between devices (approach B — planned as a later add-on).
- Free drag-and-resize grid (approach C).
- Per-widget options (e.g. "show 3 events") — can come later.

## Approaches considered
- **A. Show/hide + reorder, saved on device (localStorage via `Prefs`).** ← chosen. Smallest build, no database change.
- B. Same, saved to the account. Needs a `supabase/schema.sql` change and re-running it in Supabase. Deferred.
- C. Free drag/resize grid. Most flexible, fiddly on phones, much bigger. Rejected.

The layout is stored as one value so moving it to the account later (B) only changes where it's saved.

## Widgets
| id | Title | Content | Default |
|---|---|---|---|
| `overview` | Task overview | current donut + legend + date | on |
| `nextup` | Next up | current 3 event tiles | on |
| `todo` | Tasks to do | current priority tabs + list + New task | on |
| `today` | Today's schedule | today's events and due tasks, in time order | off |
| `plans` | Upcoming plans | next 7 days from Plans (first ~5 rows) | off |
| `diary` | Diary | today's entry title/mood, or "Write today" button | off |
| `friends` | Friends | what friends shared for today, or "Add friend" button | off |

The default (first-time) layout matches today's Home exactly: overview, nextup, todo.

## Behaviour
- Saved as `Prefs` key `dashboard` = comma-separated list of the visible widget ids, in order
  (e.g. `overview,nextup,todo`). Unknown ids are ignored; a missing key means the default.
- **Editor** (shared by Home and Settings): a list of every widget with an on/off switch and
  up/down buttons, plus **Reset to default**. Changes apply immediately.
- On Home, an **Edit** button by the greeting opens the editor in a dialog; on Settings it's an inline card.
- If every widget is turned off, Home shows a short message with a **Customize** button.
- Layout: one column on phones; on wider screens the first two widgets in the default layout keep the
  current side-by-side look, and other widgets go full width under them (builder's call on exact grid).
- Clicking items inside widgets behaves as it does today (open event/task, go to diary, etc.).

## Left to the builder
- Exact markup/CSS for the new widgets, keeping the existing theme (Poppins, cream cards, plum accents).
- Keyboard and screen-reader labels for the up/down and switch controls.
- Tests for the saved-layout parsing (defaults, unknown ids, empty list).
