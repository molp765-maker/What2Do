# What2Do
Personal planner. Get in touch with past, present and future.

## Diary (Phase 3)

- `js/features/diary.js`: dashboard, archive, mini calendar, reader and the autosaving editor. `js/core/diary.js`: pure search, grouping and preview helpers (unit tested).
- Entries live in the existing `diary` IndexedDB store: `{id, title, content, date, mood, createdAt, updatedAt}`. `date` is a local `YYYY-MM-DD`, the same format events and tasks use.
- Autosave runs 800 ms after you stop typing and writes by `id`, so repeated saves update one record. Cancel restores the entry as it was when the editor opened (or removes a brand-new one).
- The calendar shows a hollow amber ring on days with an entry, and the day view has a Write or Open diary button.
- Privacy: entries never leave the device, nothing is logged, and no AI or network code reads them.
