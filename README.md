# What2Do
Personal planner. Get in touch with past, present and future.

## Diary (Phase 3)

- `js/features/diary.js`: dashboard, archive, mini calendar, reader and the autosaving editor. `js/core/diary.js`: pure search, grouping and preview helpers (unit tested).
- Entries live in the existing `diary` IndexedDB store: `{id, title, content, date, mood, createdAt, updatedAt}`. `date` is a local `YYYY-MM-DD`, the same format events and tasks use.
- Autosave runs 800 ms after you stop typing and writes by `id`, so repeated saves update one record. Cancel restores the entry as it was when the editor opened (or removes a brand-new one).
- The calendar shows a hollow amber ring on days with an entry, and the day view has a Write or Open diary button.
- Privacy: entries never leave the device, nothing is logged, and no AI or network code reads them.
## Notifications (Phase 4)

    js/notifications/
      prefs.js          settings (localStorage), merged over defaults
      rules.js          pure: which reminders are due right now (unit tested)
      scheduler.js      every 30 s and on data changes: create one record per reminder, deliver, tidy up
      delivery.js       in-app and browser channels, permission handling
      center.js         bell badge, popover, toasts
      forms.js          reminder fields for the event and task dialogs
      settings-view.js  the Notifications section of Settings
    js/links.js         where clicking a notification goes

- Records live in a new `notifications` IndexedDB store (database version 2; existing stores and data are untouched). Each has `id, key, category, title, message, related, scheduledFor, createdAt, read, delivery`.
- Reminders are derived from your current events, tasks and diary each time the scheduler runs, so editing, rescheduling or deleting an item changes what will fire. `key` makes sure each reminder fires once.
- Event `remind` stays a string of minutes before the start (`''` none, `'0'` at the time). Tasks gain optional `remind` (`''` default, `'eve'`, `'at'`, `'off'`) and `remindAt`.
- **What works:** in-app notifications while the app is open; browser notifications while the page or installed app is running.
- **What does not:** nothing can reach you while the app is closed. That needs Web Push (a server, VAPID keys, a stored push subscription). It is not built.
- Browser notifications need HTTPS or `localhost`.
