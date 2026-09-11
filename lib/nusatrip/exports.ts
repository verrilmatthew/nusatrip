import type {Trip} from './model';
import {budgetItems,clock,toUTC,displayCity} from './engine';
import {getDestination} from './catalog';
export function download(content:string,name:string,type='text/plain'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);}
const csvCell=(v:unknown)=>{let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"'};
export const csv=(rows:unknown[][])=>'\uFEFF'+rows.map(r=>r.map(csvCell).join(',')).join('\r\n');
export const budgetCSV=(t:Trip)=>csv([['Nama','Kategori','Harga satuan (IDR)','Kuantitas','Basis','Total (IDR)','Status','Sumber'],...budgetItems(t).map(b=>[b.name,b.category,b.unit,b.quantity,b.basis,b.total,b.status,b.source])]);
export const expensesCSV=(t:Trip)=>csv([['Tanggal','Nama','Kategori','Jenis','Nominal IDR','Pembayar','Pembagian'],...t.expenses.map(e=>[e.date,e.name,e.category,e.kind,e.kind==='refund'?-e.amount:e.amount,t.participants.find(p=>p.id===e.payer)?.name,Object.entries(e.shares).map(([id,n])=>`${t.participants.find(p=>p.id===id)?.name}: ${n}`).join('; ')])]);
const esc=(s:string)=>s.replaceAll('\\','\\\\').replaceAll('\n','\\n').replaceAll(',','\\,').replaceAll(';','\\;').replaceAll('\r','');
const utc=(s:string)=>s.replaceAll('-','').replaceAll(':','').replace('.000','');
function fold(line:string){const rows:string[]=[];let row='',len=0;for(const char of line){const n=new TextEncoder().encode(char).length;if(len+n>73){rows.push(row);row=' '+char;len=n+1}else{row+=char;len+=n}}rows.push(row);return rows.join('\r\n')}
export function calendarICS(t:Trip){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//NusaTrip//Indonesia Planner//ID','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
 for(const d of t.days)for(const x of d.items.filter(x=>x.status!=='skipped'&&x.start>=0&&x.end<1440))lines.push('BEGIN:VEVENT',`UID:${t.id}-${x.id}@nusatrip.local`,`DTSTAMP:${utc(t.updated)}`,`DTSTART:${utc(toUTC(d.date,clock(x.start),getDestination(d.city).timezone))}`,`DTEND:${utc(toUTC(d.date,clock(x.end),getDestination(d.city).timezone))}`,`SUMMARY:${esc(x.title)}`,`LOCATION:${esc(displayCity(d.city)+' · '+x.area)}`,'DESCRIPTION:Rencana perjalanan. Waktu dan harga contoh; konfirmasi sebelum berangkat.','END:VEVENT');
 lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n');}
export function publicSnapshot(t:Trip){return {title:t.input.name,origin:t.input.origin,cities:t.input.cities.map(displayCity),days:t.days.map(d=>({date:d.date,city:displayCity(d.city),items:d.items.filter(x=>x.status!=='skipped').map(x=>({title:x.title,start:clock(x.start),end:clock(x.end),area:x.area,status:x.source}))})),notice:'Salinan itinerary tersanitasi. Tanpa dokumen, catatan pribadi, peserta, referensi booking, atau rincian utang. Bukan tautan kolaborasi.'}}
