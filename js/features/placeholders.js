// Honest placeholder pages for sections not built yet (Phase 3 and 5)

import {card, soon} from '../ui/components.js';

export function stubView(t,d,p){return `<div class="page"><h1>${t}</h1><p class="sub">${d}</p><div class="grid">${card('Status','w',p,soon(0,'Not built yet','This section is planned for '+p+'. Nothing here is a placeholder control.'))}</div></div>`}
export const diaryView=()=>stubView('Diary','A private place to write each day and look back on past entries. This view already has its own warmer look.','Phase 3')
export const assistantView=()=>stubView('Assistant','Planning help by text or voice. It needs a secure backend, so it comes last.','Phase 5')
