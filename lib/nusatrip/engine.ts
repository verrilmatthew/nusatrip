import { type Trip,type TripInput,type TripDay,type ItineraryItem,type Place,type BudgetItem,type TransportLeg,inputSchema,uid,defaultInput } from './model';
import { getDestination,getPlace,destinations } from './catalog';
export const people=(t:TripInput)=>t.adults+t.children;
export const cap=(t:TripInput)=>t.budget*(t.budgetBasis==='person'?people(t):1);
export const minute=(s:string)=>Number(s.split(':')[0])*60+Number(s.split(':')[1]);
export const clock=(n:number)=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
export const addDate=(s:string,n:number)=>new Date(Date.parse(s+'T12:00:00Z')+n*86400000).toISOString().slice(0,10);
export const dateLabel=(s:string)=>new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s+'T12:00:00Z'));
export const nightsFor=(i:TripInput)=>i.nights??i.cities.map((_,n)=>Math.floor((i.days-1)/i.cities.length)+(n<(i.days-1)%i.cities.length?1:0));
export const offset=(tz:string)=>tz==='Asia/Jakarta'?7:tz==='Asia/Jayapura'?9:8;
export const toUTC=(date:string,time:string,tz:string)=>new Date(Date.parse(`${date}T${time}:00Z`)-offset(tz)*3600000).toISOString();
const originTimezone=(origin:string)=>['Bali','Makassar','Lombok'].includes(origin)?'Asia/Makassar':origin==='Jayapura'?'Asia/Jayapura':'Asia/Jakarta';
function baseItem(city:string,title:string,kind:ItineraryItem['kind'],duration:number):ItineraryItem{return {id:uid(),city,title,kind,duration,start:0,end:0,transfer:0,area:getDestination(city).area,cost:0,basis:'person',indoor:true,locked:false,fixed:false,status:'planned',note:'',reservation:false,source:'Contoh',comments:[]}}
export function itemFromPlace(p:Place):ItineraryItem{return {...baseItem(p.city,p.name,'activity',p.duration),placeId:p.id,area:p.area,cost:p.cost,indoor:p.indoor,lat:p.lat,lng:p.lng,reservation:p.reservation,opening:p.opening,note:'Harga contoh · jam buka dan akses belum diverifikasi. Konfirmasi tempat sebelum berangkat.'}}
export const protectedItem=(item:ItineraryItem)=>item.locked||item.fixed||item.status==='done';
function route(from:string,to:string,i:TripInput,date:string,dep:string,fromTZ:string,toTZ:string):TransportLeg{
 const java=['semarang','surabaya','banyuwangi','Jakarta','Surabaya','Semarang','Yogyakarta'];
 let mode='Pesawat',duration=120,cost=850000;
 if(from.toLowerCase()===to.toLowerCase()){mode='Mobil';duration=90;cost=150000}
 else if(java.includes(from)&&java.includes(to)){mode=i.modes.includes('Kereta')?'Kereta':i.modes.includes('Mobil')?'Mobil':'Pesawat';duration=mode==='Pesawat'?90:300;cost=mode==='Pesawat'?850000:350000}
 else if((from==='Bali'&&to==='lombok')||(from==='lombok'&&to==='Bali')){mode=i.modes.includes('Pesawat')?'Pesawat':i.sea&&i.modes.includes('Kapal')?'Kapal':'Pesawat';duration=mode==='Pesawat'?45:240;cost=mode==='Pesawat'?600000:350000}
 else if((from==='Bali'&&to==='banyuwangi')||(from==='banyuwangi'&&to==='Bali')){mode=i.sea&&i.modes.includes('Kapal')?'Kapal':'Pesawat';duration=mode==='Kapal'?240:180;cost=mode==='Kapal'?200000:1100000}
 return {id:uid(),from,to,mode,date,departure:dep,arrival:clock(minute(dep)+duration+(offset(toTZ)-offset(fromTZ))*60),fromTimezone:fromTZ,toTimezone:toTZ,duration,cost,reference:'',confirmed:false};
}
function localTransfer(a:ItineraryItem|undefined,b:ItineraryItem,i:TripInput){
 if(b.kind!=='activity')return 0;
 if(!a||a.kind==='hotel'||a.kind==='transfer')return 30;
 if(a.area===b.area)return i.modes.includes('Mobil')?20:15;
 return 60;
}
export function scheduleDay(day:TripDay,i:TripInput):TripDay{
 if(day.locked)return day;
 let cursor=minute(i.start),prev:ItineraryItem|undefined;
 return {...day,items:day.items.map(item=>{
  if(item.status==='skipped')return {...item,transfer:0};
  const transfer=localTransfer(prev,item,i);
  let start=cursor+transfer;
  if(item.kind==='meal')start=Math.max(start,12*60);
  if(item.opening)start=Math.max(start,item.opening[0]);
  if(protectedItem(item))start=item.start;
  const result={...item,transfer,start,end:start+item.duration};
  cursor=result.end;prev=result;return result;
 })};
}
export function budgetItems(trip:Trip):BudgetItem[]{
 const i=trip.input,n=people(i);const items:BudgetItem[]=[];
 const add=(id:string,name:string,category:string,unit:number,quantity:number,basis:string,city?:string,status:BudgetItem['status']='Contoh')=>items.push({id,name,category,unit,quantity,basis,total:unit*quantity,status,source:status==='Input pengguna'?'Dicatat pengguna':'Simulasi NusaTrip; bukan penawaran',city});
 trip.stays.forEach(s=>add(s.id,s.name||`Menginap · ${getDestination(s.city).name}`,'Akomodasi',s.rate,s.rooms*s.nights,`${s.rooms} kamar × ${s.nights} malam`,s.city,s.confirmed?'Input pengguna':'Contoh'));
 trip.legs.forEach((l,j)=>{if(i.includeTransport||(j>0&&j<trip.legs.length-1))add(l.id,`${displayCity(l.from)} → ${displayCity(l.to)}`,j>0&&j<trip.legs.length-1?'Antarkota':'Pergi & pulang',l.cost,l.mode==='Mobil'?Math.ceil(n/4):n,l.mode==='Mobil'?'per kendaraan (4 orang)':'per orang',undefined,l.confirmed?'Input pengguna':'Contoh')});
 trip.days.forEach(day=>{add(`local-${day.id}`,`Transport lokal · ${dateLabel(day.date)}`,'Transport lokal',i.localRate,Math.ceil(n/(i.modes.includes('Mobil')?4:2)),i.modes.includes('Mobil')?'per mobil per hari (4 orang)':'per motor per hari (2 orang)',day.city);add(`food-${day.id}`,`Makan harian · ${dateLabel(day.date)}`,'Makan & minum',i.foodRate,n,'per orang per hari',day.city);
  day.items.filter(x=>x.kind==='activity'&&x.status!=='skipped').forEach(x=>add(x.id,x.title,'Aktivitas',x.cost,x.basis==='person'?n:1,x.basis==='person'?'per orang':'per grup',day.city,x.source));
 });
 for(const x of trip.extraBudget??[])add(x.id,x.name,x.category,x.unit,x.quantity*(x.basis==='person'?n:1),`${x.quantity} × ${x.basis==='person'?'per orang':'per grup'}`,undefined,'Input pengguna');
 const sub=items.reduce((s,b)=>s+b.total,0);add('reserve','Dana cadangan','Cadangan',Math.round(sub*i.reserve/100),1,`${i.reserve}% rencana; bukan transaksi`);return items;
}
export function totals(t:Trip){const items=budgetItems(t),total=items.reduce((s,x)=>s+x.total,0),reserve=items.find(x=>x.id==='reserve')!.total,actual=t.expenses.reduce((s,x)=>s+(x.kind==='refund'?-x.amount:x.amount),0);return {items,total,reserve,perPerson:Math.round(total/people(t.input)),perDay:Math.round(total/t.input.days),remaining:cap(t.input)-total,actual,actualRemaining:cap(t.input)-actual,min:Math.round((total-reserve)*.85)+reserve,max:Math.round((total-reserve)*1.2)+reserve}}
export function conflicts(t:Trip):string[]{
 const out:string[]=[],i=t.input;
 if(t.stays.reduce((s,x)=>s+x.nights,0)!==i.days-1)out.push('Jumlah malam harus sama dengan durasi perjalanan dikurangi satu.');
 if(t.stays.length-1>i.maxHotels)out.push(`Rute memerlukan ${t.stays.length-1} perpindahan hotel; batasmu ${i.maxHotels}. Kurangi kota atau naikkan batas.`);
 if(!i.modes.includes('Mobil')&&!i.modes.includes('Motor'))out.push('Aktivitas katalog membutuhkan transport lokal. Izinkan Mobil atau Motor, atau buat rute manual yang sesuai.');
 if(i.avoid.some(c=>i.cities.includes(c)))out.push('Rute memuat destinasi yang ingin dihindari. Hapus destinasi tersebut.');
 for(const l of t.legs){if(!i.modes.includes(l.mode))out.push(`Rute ${displayCity(l.from)}–${displayCity(l.to)} membutuhkan ${l.mode}. Izinkan moda ini atau pilih destinasi lain.`);if(l.mode==='Kapal'&&!i.sea)out.push('Rute memerlukan penyeberangan laut; ubah rute atau izinkan penyeberangan.');if(l.departure.includes('-'))out.push('Asumsi tiba membutuhkan keberangkatan hari sebelumnya. Pilih waktu tiba yang lebih siang.');if(l.arrival>='24:00')out.push('Transport tiba pada hari berikutnya; ubah jam berangkat.');}
 for(const d of t.days){let end=-1;for(const x of d.items.filter(x=>x.status!=='skipped')){
   if(x.start-x.transfer<end)out.push(`Hari ${t.days.indexOf(d)+1}: ${x.title} tumpang tindih dengan aktivitas atau waktu transfer sebelumnya.`);
   if(x.end>24*60||x.start<0)out.push(`Hari ${t.days.indexOf(d)+1}: jadwal melewati batas tanggal.`);
   if(x.kind==='activity'&&x.end>minute(i.end))out.push(`Hari ${t.days.indexOf(d)+1}: ${x.title} melewati jam selesai pilihanmu.`);
   if(x.opening&&(x.start<x.opening[0]||x.end>x.opening[1]))out.push(`${x.title} di luar jam operasional yang dicatat.`);
   const place=getPlace(x.placeId);if(place?.sea&&!i.sea)out.push(`${x.title} membutuhkan laut; pilih alternatif darat.`);
   end=Math.max(end,x.end);
  }const transfer=d.items.reduce((s,x)=>s+x.transfer+(x.kind==='transfer'?x.duration:0),0);if(transfer>i.maxTransfer)out.push(`Hari ${t.days.indexOf(d)+1}: transfer ${transfer} menit melebihi batas ${i.maxTransfer} menit.`);
 }
 const remaining=totals(t).remaining;if(remaining<0)out.push(`${i.hardCap?'Batas wajib':'Target budget'} terlampaui Rp${(-remaining).toLocaleString('id-ID')}. Kurangi biaya atau sesuaikan budget secara eksplisit.`);
 return [...new Set(out)];
}
export function displayCity(s:string){return destinations.find(x=>x.id===s)?.name??s}
export function generateTrip(raw:TripInput):Trip{
 const i=inputSchema.parse(raw);i.cities.forEach(getDestination);
 const n=people(i),nights=nightsFor(i);let position=0;
 const stays=i.cities.map((city,j)=>{const s={id:uid(),city,area:getDestination(city).area,name:'',rooms:i.rooms,capacity:2,nights:nights[j],rate:i.roomRate,checkin:addDate(i.date,position),checkout:addDate(i.date,position+nights[j]),reference:'',confirmed:false};position+=nights[j];return s});
 const legs:TransportLeg[]=[];const first=getDestination(i.cities[0]);const last=getDestination(i.cities.at(-1)!);
 const inbound=route(i.origin,first.id,i,i.date,'09:00',originTimezone(i.origin),first.timezone);inbound.arrival=i.arrival;inbound.departure=clock(minute(i.arrival)-inbound.duration-(offset(inbound.toTimezone)-offset(inbound.fromTimezone))*60);legs.push(inbound);
 let split=0;for(let c=1;c<i.cities.length;c++){split+=nights[c-1];legs.push(route(i.cities[c-1],i.cities[c],i,addDate(i.date,split),'09:00',getDestination(i.cities[c-1]).timezone,getDestination(i.cities[c]).timezone))}
 legs.push(route(last.id,i.origin,i,addDate(i.date,i.days-1),i.departure,last.timezone,originTimezone(i.origin)));
 const used=new Set<string>();const days:TripDay[]=[];
 for(let d=0;d<i.days;d++){
  let c=0,cum=nights[0];while(d>=cum&&c<i.cities.length-1){c++;cum+=nights[c]}
  const city=i.cities[c],dest=getDestination(city),date=addDate(i.date,d),inter=legs.find((l,j)=>j>0&&j<legs.length-1&&l.date===date);
  const items:ItineraryItem[]=[];let cursor=minute(i.start);
  const add=(title:string,kind:ItineraryItem['kind'],duration:number,fixedStart?:number)=>{const item=baseItem(city,title,kind,duration);if((kind==='meal'||kind==='rest')&&items.length)item.area=items.at(-1)!.area;if(fixedStart!==undefined){item.fixed=true;item.start=fixedStart;item.end=fixedStart+duration;cursor=item.end}items.push(item);return item};
  if(d===0){add('Tiba, keluar terminal & ambil bagasi','transfer',60,minute(i.arrival));add('Transfer menuju area menginap','transfer',60,minute(i.arrival)+60);add('Check-in & segarkan diri','hotel',45,Math.max(14*60,minute(i.arrival)+120));}
  if(inter){add('Check-out & perjalanan ke terminal','transfer',60,8*60);add(`${inter.mode} ke ${dest.name} · jadwal asumsi`,'transfer',inter.duration,9*60);add('Transfer hotel & check-in','hotel',75,9*60+inter.duration);}
  const cutoff=d===i.days-1?minute(i.departure)-i.buffer-60:minute(i.end);
  if(d===i.days-1){const checkout=Math.min(10*60,cutoff-30);if(checkout>=minute(i.start))add('Check-out & titip barang','hotel',30,checkout);else {items.length=0;add('Check-out pagi & persiapan berangkat','hotel',30,cutoff-30);}}
  const limit=d===0||inter?1:d===i.days-1?1:i.pace==='Santai'?2:i.pace==='Seimbang'?3:4;
  const candidates=dest.places.filter(p=>!used.has(p.id)&&(!p.sea||i.sea)&&(!i.accessibility||p.walking<=1)&&(i.walking!=='Rendah'||p.walking<=1)&&(i.outdoor!=='Indoor'||p.indoor)).sort((a,b)=>Number(b.area===dest.area)-Number(a.area===dest.area)||Number(b.indoor&&i.rain==='Rendah')-Number(a.indoor&&i.rain==='Rendah')||Number(b.category==='Kuliner'&&i.priority==='Kuliner')-Number(a.category==='Kuliner'&&i.priority==='Kuliner')||Number((!b.indoor&&(i.outdoor==='Outdoor'||i.vibes.includes('Pantai & snorkeling'))))-Number((!a.indoor&&(i.outdoor==='Outdoor'||i.vibes.includes('Pantai & snorkeling')))));
  let count=0;const targetArea=candidates[0]?.area;
  for(const p of candidates.filter(p=>p.area===targetArea)){
   const mealBuffer=count===0?105:0;
   if(count>=limit||cursor+30+p.duration+mealBuffer>cutoff)continue;
   const item=itemFromPlace(p);if(i.diet&&p.category==='Kuliner')item.note+=` Preferensi makanan: ${i.diet}. Konfirmasi menu; kesesuaian belum diverifikasi.`;items.push(item);cursor+=30+p.duration;used.add(p.id);count++;
   if(count===1){add('Makan & kuliner sekitar','meal',60);cursor=Math.max(cursor,12*60)+60;add('Jeda tanpa agenda','rest',45);cursor+=45;}
  }
  if(!items.some(x=>x.kind==='meal')&&cursor+60<=cutoff){add('Makan & istirahat','meal',60);cursor=Math.max(cursor,12*60)+60}
  if(d===i.days-1){add('Transfer ke terminal keberangkatan','transfer',60,cutoff);add('Check-in transport & buffer keberangkatan','transfer',i.buffer,minute(i.departure)-i.buffer)}
  else if(!items.some(x=>x.kind==='rest')&&cursor+45<=cutoff)add('Waktu bebas di area menginap','rest',45);
  const day={id:uid(),date,city,theme:d===0?'Tiba, tarik napas, mulai pelan':inter?`Cerita berikutnya: ${dest.name}`:d===i.days-1?'Satu jeda sebelum pulang':count?'Kenali sudut dan rasa lokal':'Hari bebas, ikuti ritmemu',locked:false,items};days.push(scheduleDay(day,i));
 }
 const participants=Array.from({length:n},(_,j)=>({id:`p${j+1}`,name:j===0?'Kamu':`Teman ${j}`,role:(j===0?'Owner':'Editor') as 'Owner'|'Editor'}));
 const tasks:[string,string,number][]=[['Konfirmasi transport pergi & pulang','Booking',1],['Pesan akomodasi untuk seluruh malam','Booking',1],['Cek jam buka & reservasi aktivitas','Sebelum berangkat',1],['Periksa prakiraan mendekati keberangkatan','Sebelum berangkat',1],['Kartu identitas & tiket','Hari keberangkatan',1],['Pakaian ganti','Packing',i.laundry?Math.ceil(i.days/2):i.days],['Perlengkapan mandi','Packing',1],['Pengisi daya & power bank','Packing',1],['Payung atau jas hujan','Packing',1],['Sepatu yang nyaman','Packing',1],...(i.vibes.includes('Pantai & snorkeling')?[['Pakaian renang & pelindung matahari','Packing',1] as [string,string,number]]:[]),...(i.sea?[['Cek kondisi maritim dan konfirmasi operator','Sebelum berangkat',1] as [string,string,number]]:[])];
 return {id:uid(),input:i,days,legs,stays,expenses:[],participants,checklist:tasks.map(([name,group,quantity])=>({id:uid(),name,group,quantity,done:false,deadline:addDate(i.date,-1),assignee:'p1'})),documents:[],votes:{},settlements:[],revisions:[],generation:0,created:new Date().toISOString(),updated:new Date().toISOString()};
}
export type Adjustment='relax'|'save'|'indoor'|'transfer'|'regenerate'|'no-sea'|'food';
export function adjustTrip(trip:Trip,action:Adjustment,dayIndex?:number):Trip{
 const t=structuredClone(trip);t.generation++;
 if(action==='no-sea'){if(t.legs.some(l=>l.mode==='Kapal'))throw new Error('Rute utama memakai kapal. Ubah moda di Transport & Stay sebelum menyesuaikan aktivitas.');t.input.sea=false;}
 t.days=t.days.map((day,index)=>{
  if((dayIndex!==undefined&&index!==dayIndex)||day.locked)return day;
  const d={...day,items:[...day.items]};const editable=d.items.filter(x=>x.kind==='activity'&&!protectedItem(x));
  if(action==='relax'&&editable.length){const remove=editable.at(-1)!;d.items=d.items.filter(x=>x.id!==remove.id)}
  else if(action==='transfer'){const flexible=d.items.filter(x=>x.kind==='activity'&&!protectedItem(x)).sort((a,b)=>a.area.localeCompare(b.area));let k=0;d.items=d.items.map(x=>x.kind==='activity'&&!protectedItem(x)?flexible[k++]:x)}
  else if(action==='food'){
   const p=getDestination(day.city).places.find(p=>p.category==='Kuliner'&&!d.items.some(x=>x.placeId===p.id));if(p)d.items.splice(Math.max(0,d.items.findIndex(x=>x.kind==='rest')),0,itemFromPlace(p));
  }else if(action!=='relax'){
   d.items=d.items.map(x=>{
    if(x.kind!=='activity'||protectedItem(x))return x;
    const needs=action==='regenerate'||action==='save'||action==='indoor'&&!x.indoor||action==='no-sea'&&getPlace(x.placeId)?.sea;
    if(!needs)return x;
    const options=getDestination(day.city).places.filter(p=>p.id!==x.placeId&&!d.items.some(y=>y.placeId===p.id)&&(!p.sea||t.input.sea)&&(t.input.walking!=='Rendah'||p.walking<=1)&&(!t.input.accessibility||p.walking<=1)&&(t.input.outdoor!=='Indoor'||p.indoor)&&((action!=='indoor'&&action!=='no-sea')||p.indoor)&&(action!=='save'||p.cost<x.cost));
    options.sort((a,b)=>action==='save'?a.cost-b.cost:Number(b.area===x.area)-Number(a.area===x.area));const p=options[(action==='regenerate'?t.generation:0)%Math.max(options.length,1)];
    if(!p)return x;return {...itemFromPlace(p),id:x.id,comments:x.comments};
   });
  }
  return scheduleDay(d,t.input);
 });return t;
}
export function previewDiff(before:Trip,after:Trip){const old=before.days.flatMap(x=>x.items),next=after.days.flatMap(x=>x.items);const changed=old.filter(x=>{const y=next.find(y=>y.id===x.id);return !y||x.title!==y.title||x.duration!==y.duration||x.start!==y.start}).length+next.filter(x=>!old.some(y=>y.id===x.id)).length;return {cost:totals(after).total-totals(before).total,transfer:next.reduce((s,x)=>s+x.transfer,0)-old.reduce((s,x)=>s+x.transfer,0),changed,conflicts:conflicts(after)}}
export function demoTrips(){return [generateTrip({...defaultInput}),generateTrip({...defaultInput,name:'Dua kota, banyak cerita',cities:['semarang','surabaya'],vibes:['Kuliner','City exploration'],modes:['Pesawat','Kereta','Mobil'],budget:14000000,maxTransfer:480,pace:'Seimbang'}),generateTrip({...defaultInput,name:'Rasa & cerita Makassar',cities:['makassar'],vibes:['Kuliner','Budaya & sejarah'],budget:13000000,pace:'Seimbang'})]}
export function compatibility(d:string[],input:TripInput){let trip:Trip;try{trip=generateTrip({...input,cities:d,nights:undefined,maxHotels:Math.max(input.maxHotels,d.length-1)})}catch{return {score:0,components:{budget:0,vibe:0,pace:0,rain:0},trip:null,issues:['Preferensi belum lengkap']}}
 const data=d.map(getDestination),budget=Math.min(100,Math.round(cap(input)/totals(trip).total*100)),vibe=Math.round(input.vibes.filter(v=>data.some(x=>x.vibes.includes(v))).length/input.vibes.length*100),pace=input.days>=d.length*3?100:60,rain=input.rain==='Tinggi'?85:Math.round(100-data.reduce((s,x)=>s+x.outdoor,0)/data.length*(input.rain==='Rendah'?1:.5));return {score:Math.round(budget*.35+vibe*.3+pace*.2+rain*.15),components:{budget,vibe,pace,rain},trip,issues:conflicts(trip)};}
