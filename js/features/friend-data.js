import {pd} from '../core/utils.js';

export function occursOn(event,date){
  if(date<event.date)return false;
  if(!event.repeatDays?.length)return date===event.date;
  return date<=event.repeatUntil&&event.repeatDays.includes(pd(date).getDay());
}

export function recordsOn(friend,date){
  const records=friend.records||[];
  return {
    events:records.filter(r=>r.collection==='events'&&occursOn(r.payload,date)).map(r=>({...r.payload,date,friendId:friend.id,friendEmail:friend.email})),
    tasks:records.filter(r=>r.collection==='tasks'&&r.payload.due===date).map(r=>({...r.payload,friendId:friend.id,friendEmail:friend.email})),
    diary:records.filter(r=>r.collection==='diary'&&r.payload.date===date).map(r=>({...r.payload,friendId:friend.id,friendEmail:friend.email}))
  };
}
