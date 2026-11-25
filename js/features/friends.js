import {emit} from '../core/bus.js';
import {esc, dShort} from '../core/utils.js';
import {Prefs} from '../storage/prefs.js';
import {S} from '../storage/store.js';
import {Cloud} from '../storage/cloud.js';
import {recordsOn} from './friend-data.js';

const colors=['#8a2d7a','#2a8f84','#4a68d0','#c98024','#be4e62','#587d31'];
const collections=[['events','Events'],['tasks','Tasks'],['diary','Diary entries']];
let loading=null,checkedAt=0;

export const Friends={
  friends:[],incoming:[],outgoing:[],inviteCode:'',calendars:{},visible:new Set(),error:'',notice:'',
  color(id){return colors[Math.max(0,this.friends.findIndex(f=>f.id===id))%colors.length]},
  reset(){
    this.friends=[];this.incoming=[];this.outgoing=[];this.inviteCode='';this.calendars={};this.visible=new Set();this.error='';this.notice='';
    loading=null;checkedAt=0;
  },
  async refresh(force=false){
    if(!Cloud.signedIn){this.reset();return}
    if(loading)return loading;
    if(!force&&Date.now()-checkedAt<20000)return;
    checkedAt=Date.now();
    loading=(async()=>{
      try{
        const data=await Cloud.friendDashboard();
        const next=(data.friends||[]).map(f=>({...f,records:[]}));
        const visibleRaw=Prefs.get('friends.visible',null);
        const visibleIds=visibleRaw===null?next.map(f=>f.id):visibleRaw.split(',').filter(Boolean);
        this.friends=next;this.incoming=data.incoming||[];this.outgoing=data.outgoing||[];this.inviteCode=data.invite_code||'';
        this.visible=new Set(visibleIds.filter(id=>next.some(f=>f.id===id)));
        const schedules=await Promise.all(next.map(async friend=>({id:friend.id,records:await Cloud.friendSchedule(friend.id)})));
        this.calendars=Object.fromEntries(schedules.map(x=>[x.id,x.records||[]]));
        this.friends=this.friends.map(friend=>({...friend,records:this.calendars[friend.id]||[]}));
        this.error='';
      }catch(error){this.error=error.message}
      finally{loading=null;emit('friends:changed')}
    })();
    return loading;
  },
  async consumeInvite(){
    const params=new URLSearchParams(location.search),code=params.get('friend');
    if(!code||!Cloud.signedIn)return;
    history.replaceState(null,'',location.pathname+location.hash);
    try{
      await Cloud.requestFriendByCode(code);
      this.notice='Friend request sent. They need to accept before schedules can be shared.';
      this.error='';
      await this.refresh(true);
    }catch(error){this.error=error.message;emit('friends:changed')}
  },
  day(date){
    return this.friends.filter(f=>this.visible.has(f.id)).map(f=>({friend:f,...recordsOn(f,date)}));
  },
  calendarControls(){
    const message=this.error?`<p class="friend-message friend-error" role="alert">${esc(this.error)}</p>`:this.notice?`<p class="friend-message" role="status">${esc(this.notice)}</p>`:'';
    if(!this.friends.length)return message;
    return `${message}<fieldset class="shared-calendars"><legend>Shared calendars</legend>${this.friends.map(f=>`<label><input type="checkbox" data-shared-calendar="${esc(f.id)}" ${this.visible.has(f.id)?'checked':''}><i style="--friend-color:${this.color(f.id)}"></i>${esc(f.email)}</label>`).join('')}</fieldset>`;
  },
  settingsHTML(){
    const code=this.inviteCode,link=code?`${location.origin}${location.pathname}?friend=${encodeURIComponent(code)}`:'';
    const requestList=(items,kind)=>items.map(item=>`<div class="friend-request"><span>${esc(item.email)}</span>${kind==='incoming'?`<button class="btn pri" data-friend-request="${esc(item.id)}" data-accept="true">Accept</button><button class="btn" data-friend-request="${esc(item.id)}" data-accept="false">Decline</button>`:'<small>Waiting for approval</small>'}</div>`).join('');
    const requests=(this.incoming.length||this.outgoing.length)?`<div class="friends-requests">${this.incoming.length?`<h3>Requests for you</h3>${requestList(this.incoming,'incoming')}`:''}${this.outgoing.length?`<h3>Sent requests</h3>${requestList(this.outgoing,'outgoing')}`:''}</div>`:'';
    const friends=this.friends.map(friend=>{
      const selected=new Set((friend.shared_items||[]).map(x=>x.collection+':'+x.record_id));
      const items=collections.map(([collection,label])=>{
        const records=S[collection]||[];
        if(!records.length)return '';
        return `<div class="friend-share-group"><h4>${label}</h4>${records.map(record=>{
          const date=record.date||record.due||'',title=record.title||'Untitled';
          return `<label><input type="checkbox" data-share-friend="${esc(friend.id)}" data-share-collection="${collection}" data-share-record="${esc(record.id)}" ${selected.has(collection+':'+record.id)?'checked':''}><span>${date?esc(dShort(date))+' · ':''}${esc(title)}</span></label>`;
        }).join('')}</div>`;
      }).join('');
      return `<section class="friend-card"><header><div><b>${esc(friend.email)}</b><span>Choose what this friend can see. Unselected items stay private.</span></div><button class="btn dng" data-remove-friend="${esc(friend.id)}">Remove</button></header><details><summary>Share selected items</summary><p class="friend-privacy">Events are shared without notes or reminders. Diary entries share their date and title, not entry text.</p>${items||'<p class="friend-empty">Create an event or task to share it here.</p>'}</details></section>`;
    }).join('');
    return `<section class="card w friend-panel"><h2>Friends &amp; sharing</h2>
      <p class="friend-intro">Connect with a friend, approve requests, then choose exactly which of your items they can see. Both people choose what they share.</p>
      ${this.error?`<p class="friend-message friend-error" role="alert">${esc(this.error)}</p>`:''}${this.notice?`<p class="friend-message" role="status">${esc(this.notice)}</p>`:''}
      <div class="friend-add">
        <form id="friend-email-form"><label>Email<input class="in" type="email" name="email" autocomplete="off" required></label><button class="btn pri">Send request</button></form>
        <form id="friend-code-form"><label>Invite code<input class="in" name="code" autocomplete="off" required></label><button class="btn">Connect by code</button></form>
      </div>
      <div class="friend-invite"><div><b>Your invite code</b><span>${esc(code||'Loading…')}</span></div>${code?`<button class="btn" data-copy-friend-link="${esc(link)}">Copy invite link</button>`:''}</div>
      ${requests}${friends?`<div class="friend-list"><h3>Your friends</h3>${friends}</div>`:'<p class="friend-empty">No friends yet. Add someone by email or share your invite link.</p>'}
    </section>`;
  }
};

export function bindFriends(){
  document.addEventListener('submit',async event=>{
    const form=event.target.closest('#friend-email-form,#friend-code-form');
    if(!form)return;
    event.preventDefault();
    const codeForm=form.id==='friend-code-form';
    const value=form.elements[codeForm?'code':'email'].value.trim();
    try{
      if(codeForm)await Cloud.requestFriendByCode(value);else await Cloud.requestFriendByEmail(value);
      form.reset();Friends.notice='Request sent. The other person must accept before schedules can be shared.';Friends.error='';
      await Friends.refresh(true);
    }catch(error){Friends.error=error.message;Friends.notice='';emit('friends:changed')}
  });
  document.addEventListener('change',async event=>{
    const calendar=event.target.closest('[data-shared-calendar]');
    if(calendar){
      const id=calendar.dataset.sharedCalendar;
      if(calendar.checked)Friends.visible.add(id);else Friends.visible.delete(id);
      Prefs.set('friends.visible',[...Friends.visible].join(','));
      emit('render');return;
    }
    const share=event.target.closest('[data-share-friend]');
    if(!share)return;
    share.disabled=true;
    try{
      await Cloud.setSharedItem(share.dataset.shareFriend,share.dataset.shareCollection,share.dataset.shareRecord,share.checked);
      Friends.notice='Sharing preference saved.';Friends.error='';
      await Friends.refresh(true);
    }catch(error){share.checked=!share.checked;Friends.error=error.message;emit('friends:changed')}
    finally{share.disabled=false}
  });
  document.addEventListener('click',async event=>{
    const response=event.target.closest('[data-friend-request]');
    if(response){
      response.disabled=true;
      try{
        await Cloud.respondFriendRequest(response.dataset.friendRequest,response.dataset.accept==='true');
        Friends.notice=response.dataset.accept==='true'?'Friend request accepted.':'Friend request declined.';
        Friends.error='';await Friends.refresh(true);
      }catch(error){Friends.error=error.message;emit('friends:changed')}
      return;
    }
    const remove=event.target.closest('[data-remove-friend]');
    if(remove){
      const friend=Friends.friends.find(f=>f.id===remove.dataset.removeFriend);
      if(!confirm(`Remove ${friend?.email||'this friend'}? They will lose access to items you shared.`))return;
      remove.disabled=true;
      try{
        await Cloud.removeFriend(remove.dataset.removeFriend);
        Friends.notice='Friend removed. Their access to your shared items has ended.';
        Friends.error='';await Friends.refresh(true);
      }catch(error){Friends.error=error.message;emit('friends:changed')}
      return;
    }
    const copy=event.target.closest('[data-copy-friend-link]');
    if(copy){
      try{await navigator.clipboard.writeText(copy.dataset.copyFriendLink);Friends.notice='Invite link copied.';Friends.error=''}
      catch(error){Friends.error='Could not copy the invite link: '+error.message}
      emit('friends:changed');
    }
  });
}

export function friendsView(){return `<div class="page"><h1>Friends</h1><p class="sub">Share only what you choose.</p>${Friends.settingsHTML()}</div>`}
