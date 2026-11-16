// Lightweight preferences in localStorage

export const Prefs={get(k,d){try{return localStorage.getItem('w2d.'+k)??d}catch{return d}},set(k,v){try{localStorage.setItem('w2d.'+k,v)}catch{}}};
