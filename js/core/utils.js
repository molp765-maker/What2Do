// Date helpers, formatting and escaping

export const today=new Date();
export const greet=()=>{const h=today.getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening'};
export const dateLong=today.toLocaleDateString('en-NZ',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
export const ymd=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
export const pd=s=>{const[a,b,c]=s.split('-');return new Date(+a,b-1,+c)};
export const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x};export const mon=d=>addD(d,-((d.getDay()+6)%7));
export const TODAY=ymd(today),uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const hm=s=>{const[a,b]=s.split(':');return +a+b/60};
export const t12=s=>{const[a,b]=s.split(':'),h=+a;return `${(h+11)%12+1}${b==='00'?'':':'+b}${h>=12?'pm':'am'}`};
export const dShort=ds=>pd(ds).toLocaleDateString('en-NZ',{weekday:'short',day:'numeric',month:'short'});
