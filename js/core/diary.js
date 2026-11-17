// Pure diary helpers: search, sorting, grouping, previews. No DOM and no storage.
import {esc, pd} from './utils.js';

export const MOODS=[['great','😄','Great'],['good','🙂','Good'],['okay','😐','Okay'],['low','😔','Low'],['hard','😣','Hard']];
export const moodOf=id=>MOODS.find(m=>m[0]===id);
export const wordCount=t=>(t.trim().match(/\S+/g)||[]).length;
const tokens=q=>q.toLowerCase().split(/\s+/).filter(Boolean);
const hay=e=>`${e.title} ${e.content} ${e.date} ${pd(e.date).toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`.toLowerCase();

// Every word typed must appear in the title, the text, the ISO date or the written-out date (so "november 2026" works).
export const searchEntries=(list,q)=>{const t=tokens(q||'');return t.length?list.filter(e=>{const h=hay(e);return t.every(x=>h.includes(x))}):list};
export const sortEntries=(list,dir)=>[...list].sort((a,b)=>{const c=a.date===b.date?((a.createdAt||'')<(b.createdAt||'')?-1:1):(a.date<b.date?-1:1);return dir==='old'?c:-c});
export const groupByMonth=list=>{const g=[],m=new Map();for(const e of list){const k=e.date.slice(0,7);if(!m.has(k)){const x={key:k,label:pd(e.date).toLocaleDateString('en-NZ',{month:'long',year:'numeric'}),items:[]};m.set(k,x);g.push(x)}m.get(k).items.push(e)}return g};
export const preview=(c,q,len=150)=>{const s=(c||'').replace(/\s+/g,' ').trim();if(s.length<=len)return s;const hits=tokens(q||'').map(x=>s.toLowerCase().indexOf(x)).filter(i=>i>=0);const at=hits.length?Math.min(...hits):0;const a=at>len/2?Math.max(0,at-Math.floor(len/3)):0;return (a?'…':'')+s.slice(a,a+len).trim()+(a+len<s.length?'…':'')};
// Escapes text and wraps search matches in <mark>.
export const hl=(text,q)=>{const t=tokens(q||'').map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));if(!t.length)return esc(text);return String(text).split(new RegExp('('+t.join('|')+')','gi')).map((p,i)=>i%2?`<mark>${esc(p)}</mark>`:esc(p)).join('')};
