import test from 'node:test';
import assert from 'node:assert/strict';
import {CLOUD_CONFIG} from '../js/core/cloud-config.js';
import {DB} from '../js/storage/db.js';
import {Cloud} from '../js/storage/cloud.js';

test('signing in loads the signed-in account data from the cloud', async () => {
  const oldConfig={...CLOUD_CONFIG},oldFetch=globalThis.fetch,oldStorage=globalThis.localStorage;
  const oldDB={pending:DB.pending,all:DB.all,clear:DB.clear,put:DB.put,removePending:DB.removePending};
  const local={events:[],tasks:[],diary:[]},calls=[];
  const user={id:'mark-user',email:'mark@example.test'};
  const remote=[{collection:'tasks',record_id:'task-1',payload:{id:'task-1',title:'Test cross-device sync'}}];
  CLOUD_CONFIG.url='https://test.supabase.co';CLOUD_CONFIG.anonKey='test-anon-key';
  globalThis.localStorage={values:new Map(),getItem(k){return this.values.get(k)||null},setItem(k,v){this.values.set(k,v)},removeItem(k){this.values.delete(k)}};
  DB.pending=async()=>[];
  DB.all=async name=>local[name]||[];
  DB.clear=async name=>{local[name]=[]};
  DB.put=async(name,value)=>{local[name].push(value)};
  DB.removePending=async()=>{};
  globalThis.fetch=async(url,options={})=>{
    calls.push({url:String(url),options});
    if(String(url).includes('/auth/v1/token?grant_type=password'))return {ok:true,status:200,text:async()=>JSON.stringify({access_token:'access-token',refresh_token:'refresh-token',expires_in:3600,user})};
    if(String(url).includes('/auth/v1/logout'))return {ok:true,status:204,text:async()=>''};
    if(String(url).includes('/rest/v1/account_data?'))return {ok:true,status:200,text:async()=>JSON.stringify(remote)};
    throw new Error('Unexpected request: '+url);
  };
  try{
    await Cloud.signIn(user.email,'password123');
    assert.equal(Cloud.signedIn,true);
    assert.equal(Cloud.email,user.email);
    assert.deepEqual(local.tasks,remote.map(x=>x.payload));
    const dataRequest=calls.find(x=>x.url.includes('/rest/v1/account_data?'));
    assert.match(dataRequest.url,/owner_id=eq\.mark-user/);
    assert.equal(dataRequest.options.headers.Authorization,'Bearer access-token');
  }finally{
    try{if(Cloud.signedIn)await Cloud.signOut()}catch{}
    Object.assign(CLOUD_CONFIG,oldConfig);
    DB.pending=oldDB.pending;DB.all=oldDB.all;DB.clear=oldDB.clear;DB.put=oldDB.put;DB.removePending=oldDB.removePending;
    if(oldFetch===undefined)delete globalThis.fetch;else globalThis.fetch=oldFetch;
    if(oldStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=oldStorage;
  }
});
