// Route table: view name to render function
import {calView} from './features/calendar.js';
import {taskView} from './features/tasks.js';
import {homeView} from './features/home.js';
import {settingsView} from './features/settings.js';
import {assistantView, diaryView} from './features/placeholders.js';

export const Views={home:homeView,calendar:calView,tasks:taskView,diary:diaryView,assistant:assistantView,settings:settingsView};
