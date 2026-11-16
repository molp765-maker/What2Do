// Navigation and category/priority definitions

export const NAV=[['home','Home','home'],['calendar','Calendar','calendar'],['tasks','Tasks','tasks'],['diary','Diary','diary'],['assistant','Assistant','ai'],['settings','Settings','settings']];
export const CATS={personal:['Personal','#a63d8f'],study:['Study','#2a8f84'],work:['Work','#4a68d0'],health:['Health','#c98024'],home:['Home','#8a7a9a']};
export const PRI={1:['High','#e5484d'],2:['Medium','#c98024'],3:['Low','#9b8aa5']};
export const col=x=>(CATS[x.cat]||CATS.personal)[1];
