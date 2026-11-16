// Tiny publish/subscribe bus so UI code never imports the router

const h={};
export const on=(e,f)=>(h[e]??=[]).push(f);
export const emit=(e,d)=>(h[e]||[]).forEach(f=>f(d));
