export const STORAGE_KEY = 'coffee-together-v1';
export function initialState() { return {version:1, orders:[], coffees:['아메리카노','카페라떼','카푸치노','바닐라라떼','카페모카','에스프레소'], sizes:['기본','작게','크게'], completed:false, completedAt:null}; }
export function aggregate(orders) {
 const groups=new Map();
 for(const order of orders){const key=JSON.stringify([order.coffee,order.temperature,order.size]); if(groups.has(key)) groups.get(key).count++; else groups.set(key,{coffee:order.coffee,temperature:order.temperature,size:order.size,count:1});}
 return [...groups.values()];
}
export function byPerson(orders){const groups=new Map();for(const order of orders){if(!groups.has(order.name))groups.set(order.name,{name:order.name,orders:[]});groups.get(order.name).orders.push(order);}return [...groups.values()];}
export function cafeText(orders){return ['커피 주문',...aggregate(orders).map(x=>`${x.coffee} / ${x.temperature} / ${x.size} — ${x.count}잔`),`총 ${orders.length}잔`].join('\n');}
export function addChoice(choices,value){const clean=value.trim();if(!clean)throw Error('이름을 입력해주세요.');if(clean.length>40)throw Error('40자 이내로 입력해주세요.');if(choices.includes(clean))throw Error('이미 등록된 항목입니다.');return [...choices,clean];}
export function clearOrders(state){return {...state,orders:[],completed:false,completedAt:null};}
export function saveState(storage,state){try{storage.setItem(STORAGE_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function loadState(storage){try{const raw=storage.getItem(STORAGE_KEY);if(!raw)return {state:initialState(),error:false};const s=JSON.parse(raw);const strings=a=>Array.isArray(a)&&a.length>0&&a.every(x=>typeof x==='string'&&x.trim());if(s.version!==1||!strings(s.coffees)||!strings(s.sizes)||typeof s.completed!=='boolean'||!Array.isArray(s.orders)||s.orders.some(o=>!o||!['id','name','coffee','size'].every(k=>typeof o[k]==='string'&&o[k].trim())||!['HOT','ICE'].includes(o.temperature))||new Set(s.orders.map(o=>o.id)).size!==s.orders.length||(s.completed&&(!s.orders.length||typeof s.completedAt!=='string'||!Number.isFinite(Date.parse(s.completedAt)))))throw Error('invalid');if(!s.completed)s.completedAt=null;return {state:s,error:false};}catch{return {state:initialState(),error:true};}}
