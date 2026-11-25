// Route table: view name to render function
import {calView} from './features/calendar.js';
import {scheduleView} from './features/schedule.js';
import {plansView} from './features/plans.js';
import {homeView} from './features/home.js';
import {settingsView} from './features/settings.js';
import {assistantView} from './features/placeholders.js';
import {diaryView} from './features/diary.js';
import {friendsView} from './features/friends.js';

export const Views={home:homeView,calendar:calView,schedule:scheduleView,diary:diaryView,plans:plansView,friends:friendsView,assistant:assistantView,settings:settingsView};
