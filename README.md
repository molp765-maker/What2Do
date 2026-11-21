# What2Do
Personal planner. Get in touch with past, present and future.

## Diary (Phase 3)

- `js/features/diary.js`: dashboard, archive, mini calendar, reader and the autosaving editor. `js/core/diary.js`: pure search, grouping and preview helpers (unit tested).
- Entries live in the existing `diary` IndexedDB store: `{id, title, content, date, mood, createdAt, updatedAt}`. `date` is a local `YYYY-MM-DD`, the same format events and tasks use.
- Autosave runs 800 ms after you stop typing and writes by `id`, so repeated saves update one record. Cancel restores the entry as it was when the editor opened (or removes a brand-new one).
- The calendar shows a hollow amber ring on days with an entry, and the day view has a Write or Open diary button.
- Privacy: while signed out, entries stay on the device. When signed in to cloud sync, events, tasks, and diary entries are stored in the user's Supabase account. Notification settings and appearance preferences remain device-local; notification history is cleared when signing out.

## Cross-device accounts

After Supabase is configured, the app opens on a sign-in page. Returning users with a saved session go straight to the planner; signing out returns to sign-in. The app syncs events, tasks, and diary entries between devices with Supabase email/password accounts. Each person should create and use their own account; row-level security keeps account data private. Changes sync when saved and are refreshed on app launch, when the app returns to the foreground, and about every 30 seconds while it is open. An internet connection is required for cloud sync; pending edits are kept locally and retried.

To enable it:

1. Create a Supabase project.
2. Run [`supabase/schema.sql`](./supabase/schema.sql) in the project's SQL Editor.
3. Copy the project URL and **publishable/anon key** into [`js/core/cloud-config.js`](./js/core/cloud-config.js). Never put a `service_role` key in browser code.
4. Host the app over HTTPS, create an account from the sign-in page, and use that same account on each device. If email confirmation is enabled, confirm the signup message first.

The first sign-in to an account with no cloud data asks whether to import the current device's events, tasks, and diary. Existing cloud data replaces the current device's cached copy. Signing out clears that account's cached planner data from the device but leaves the cloud copy intact. Do not use real or sensitive data until the Supabase project and its access policies are configured.
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
