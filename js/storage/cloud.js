import {CLOUD_CONFIG} from '../core/cloud-config.js';
import {emit} from '../core/bus.js';
import {esc} from '../core/utils.js';
import {DB} from './db.js';

const SESSION_KEY='w2d.auth',DATA_STORES=['events','tasks','diary'];
let session=readSession(),lastError='';

function readSession(){try{return JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch{return null}}
function saveSession(value){
  try{if(value)localStorage.setItem(SESSION_KEY,JSON.stringify(value));else localStorage.removeItem(SESSION_KEY)}
  catch(error){if(value)throw new Error('Could not save your sign-in on this device: '+error.message)}
  session=value;
}
function configured(){return !!(CLOUD_CONFIG.url&&CLOUD_CONFIG.anonKey)}
function base(){return CLOUD_CONFIG.url.replace(/\/+$/,'')}
function authHeaders(token){return {'apikey':CLOUD_CONFIG.anonKey,'Authorization':'Bearer '+(token||CLOUD_CONFIG.anonKey),'Content-Type':'application/json'}}
async function request(path,{method='GET',body,token,prefer}={}){
  const headers=authHeaders(token);
  if(prefer)headers.Prefer=prefer;
  const response=await fetch(base()+path,{method,headers,body:body===undefined?undefined:JSON.stringify(body)});
  const text=await response.text();
  let data=null;
  if(text){try{data=JSON.parse(text)}catch{data=text}}
  if(!response.ok)throw new Error(data?.msg||data?.message||data?.error_description||data?.hint||`Cloud request failed (${response.status})`);
  return data;
}
async function freshToken(){
  if(!session)return '';
  if(session.expires_at&&session.expires_at>Date.now()/1000+60)return session.access_token;
  if(!session.refresh_token)return session.access_token;
  const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});
  saveSession({...next,expires_at:Date.now()/1000+(next.expires_in||3600)});
  return session.access_token;
}
function userId(){return session?.user?.id||''}
function query(collection,recordId){
  const p=new URLSearchParams({owner_id:'eq.'+userId(),collection:'eq.'+collection,record_id:'eq.'+recordId});
  return '/rest/v1/account_data?'+p.toString();
}
async function sendMutation(item){
  const token=await freshToken();
  if(item.action==='delete'){
    await request(query(item.collection,item.recordId),{method:'DELETE',token});
  }else{
    await request('/rest/v1/account_data?on_conflict=owner_id,collection,record_id',{method:'POST',token,prefer:'resolution=merge-duplicates,return=minimal',body:{
      owner_id:item.ownerId,collection:item.collection,record_id:item.recordId,payload:item.payload
    }});
  }
  await DB.removePending(item.key);
}
async function flushPending(){
  const pending=(await DB.pending()).filter(x=>x.ownerId===userId());
  for(const item of pending)await sendMutation(item);
}
async function replaceLocal(rows){
  for(const name of DATA_STORES)await DB.clear(name);
  for(const row of rows)if(DATA_STORES.includes(row.collection))await DB.put(row.collection,row.payload);
}
async function localMatches(rows){
  const normalize=value=>Array.isArray(value)?value.map(normalize):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,normalize(value[key])])):value;
  for(const collection of DATA_STORES){
    const local=await DB.all(collection),remote=rows.filter(x=>x.collection===collection).map(x=>x.payload);
    if(local.length!==remote.length)return false;
    const byId=new Map(remote.map(x=>[x.id,JSON.stringify(normalize(x))]));
    if(local.some(x=>byId.get(x.id)!==JSON.stringify(normalize(x))))return false;
  }
  return true;
}
async function download(){
  const p=new URLSearchParams({select:'collection,record_id,payload',owner_id:'eq.'+userId()});
  return request('/rest/v1/account_data?'+p.toString(),{token:await freshToken()});
}
async function importLocalIfChosen(){
  const local=(await Promise.all(DATA_STORES.map(async collection=>(await DB.all(collection)).map(payload=>({collection,payload}))))).flat();
  if(!local.length)return false;
  if(!confirm('This account has no cloud data yet. Import the events, tasks, and diary currently saved on this device into this account? Choose Cancel to keep this account empty.'))return false;
  for(const {collection,payload} of local){
    await DB.putPending({key:userId()+':'+collection+':'+payload.id,ownerId:userId(),collection,recordId:payload.id,payload,action:'put'});
  }
  await flushPending();
  return true;
}
function changed(){emit('cloud:changed')}

export const Cloud={
  get configured(){return configured()},
  get signedIn(){return !!session?.access_token},
  get email(){return session?.user?.email||''},
  get status(){return lastError||(this.signedIn?'Events, tasks, and diary sync with this account.':'')},
  async signUp(email,password){
    if(!configured())throw new Error('Cloud sync is not configured yet.');
    const result=await request('/auth/v1/signup',{method:'POST',body:{email,password}});
    if(result.access_token){
      saveSession({...result,expires_at:Date.now()/1000+(result.expires_in||3600)});
      await DB.clear('notifications');
      try{await this.sync()}catch(error){saveSession(null);throw error}
    }
    return !!result.access_token;
  },
  async signIn(email,password){
    if(!configured())throw new Error('Cloud sync is not configured yet.');
    const result=await request('/auth/v1/token?grant_type=password',{method:'POST',body:{email,password}});
    saveSession({...result,expires_at:Date.now()/1000+(result.expires_in||3600)});
    await DB.clear('notifications');
    try{await this.sync()}catch(error){saveSession(null);throw error}
  },
  async signOut(){
    let logoutError='';
    if(session?.access_token&&configured())try{await request('/auth/v1/logout',{method:'POST',token:await freshToken()})}catch(error){logoutError=error.message}
    saveSession(null);
    for(const name of DATA_STORES)await DB.clear(name);
    await DB.clear('notifications');
    lastError=logoutError?'Signed out on this device, but cloud sign-out could not complete: '+logoutError:'';
    emit('cloud:data');
    emit('cloud:auth-changed');
  },
  async restore(){
    if(!configured()||!session?.access_token)return;
    try{await freshToken();await this.sync()}catch(error){lastError=error.message;changed()}
  },
  async saveRecord(collection,payload){
    if(!configured()||!session||!DATA_STORES.includes(collection))return;
    const item={key:userId()+':'+collection+':'+payload.id,ownerId:userId(),collection,recordId:payload.id,payload,action:'put'};
    await DB.putPending(item);
    try{await flushPending();lastError=''}catch(error){lastError='Saved on this device. Cloud sync is waiting: '+error.message}
    changed();
  },
  async deleteRecord(collection,recordId){
    if(!configured()||!session||!DATA_STORES.includes(collection))return;
    const item={key:userId()+':'+collection+':'+recordId,ownerId:userId(),collection,recordId,action:'delete'};
    await DB.putPending(item);
    try{await flushPending();lastError=''}catch(error){lastError='Deleted on this device. Cloud sync is waiting: '+error.message}
    changed();
  },
  async sync(){
    if(!configured()||!session)return;
    try{
      await flushPending();
      let rows=await download();
      if(!rows.length&&await importLocalIfChosen())rows=await download();
      if(!await localMatches(rows)){await replaceLocal(rows);emit('cloud:data')}
      lastError='';
    }catch(error){lastError=error.message;changed();throw error}
    changed();
  },
  async bind(){
    const refreshIfIdle=()=>{const active=document.activeElement,editing=active?.matches('input,textarea,[contenteditable="true"]')||document.querySelector('dialog[open]');if(!editing&&this.signedIn)this.sync().catch(()=>{})};
    document.addEventListener('submit',async event=>{
      const form=event.target.closest('#cloud-form');
      if(!form)return;
      event.preventDefault();
      const button=event.submitter,action=button?.value;
      const email=form.elements.email.value.trim(),password=form.elements.password.value;
      const signedIn=this.signedIn;
      try{
        if(action==='signup'){
          const signedIn=await this.signUp(email,password);
          form.elements.password.value='';
          lastError=signedIn?'Account created and signed in.':'Account created. Check your email to confirm it, then sign in.';
        }else if(action==='signin'){
          await this.signIn(email,password);
          form.elements.password.value='';
          lastError='';
        }
      }catch(error){lastError=error.message}
      if(signedIn!==this.signedIn)emit('cloud:auth-changed');else changed();
    });
    document.addEventListener('click',async event=>{
      if(!event.target.closest('[data-cloud-signout]'))return;
      if(!confirm('Sign out and remove this account’s cached events, tasks, and diary from this device? Your cloud copy stays in your account; unsynced changes will wait here until you sign in again.'))return;
      try{await this.signOut()}catch(error){lastError=error.message;changed()}
    });
    addEventListener('online',refreshIfIdle);
    addEventListener('focus',refreshIfIdle);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refreshIfIdle()});
    setInterval(()=>{if(document.visibilityState==='visible')refreshIfIdle()},30000);
  },
  view(){
    if(this.signedIn)return `<div class="row"><div><b>Signed in as ${esc(this.email)}</b><span data-cloud-status>${esc(this.status)}</span></div><button class="btn" type="button" data-cloud-signout>Sign out</button></div>`;
    return `<p class="sub">Sign in to sync your planner across devices.</p>`;
  }
};
