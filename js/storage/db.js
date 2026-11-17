// IndexedDB access layer (replace this module to add cloud sync)

export const DB={name:'what2do',stores:['events','tasks','diary','notifications'],db:null,
open(){return this.p??=new Promise((res,rej)=>{if(!window.indexedDB)return rej(new Error('IndexedDB unavailable'));
const r=indexedDB.open(this.name,2);
r.onupgradeneeded=()=>{const d=r.result;this.stores.forEach(s=>{if(!d.objectStoreNames.contains(s)){const o=d.createObjectStore(s,{keyPath:'id'});o.createIndex('date','date')}})};
r.onsuccess=()=>{this.db=r.result;res(this)};r.onerror=()=>rej(r.error)})},
tx(s,m,f){return this.open().then(()=>new Promise((res,rej)=>{const t=this.db.transaction(s,m),r=f(t.objectStore(s));t.oncomplete=()=>res(r.result);t.onerror=()=>rej(t.error)}))},
all(s){return this.tx(s,'readonly',o=>o.getAll())},put(s,v){return this.tx(s,'readwrite',o=>o.put(v))},del(s,id){return this.tx(s,'readwrite',o=>o.delete(id))},
count(s){return this.open().then(()=>new Promise((res,rej)=>{const q=this.db.transaction(s).objectStore(s).count();q.onsuccess=()=>res(q.result);q.onerror=()=>rej(q.error)}))}};
