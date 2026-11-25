// Navigation and category/priority definitions

export const NAV=[['home','Home','home'],['calendar','Calendar','calendar'],['schedule','Schedule','sch'],['diary','Diary','diary'],['plans','Future plans','plans']];
export const CATS={personal:['Personal','#8a2a78'],study:['Study','#2a8f84'],work:['Work','#4a68d0'],health:['Health','#b8741a'],home:['Home','#7b6a86']};
export const PRI={1:['High','#e5484d'],2:['Medium','#c98024'],3:['Low','#9b8aa5']};
export const col=x=>(CATS[x.cat]||CATS.personal)[1];
