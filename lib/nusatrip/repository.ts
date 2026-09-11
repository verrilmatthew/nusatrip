import {z} from 'zod';
import {inputSchema,type Trip} from './model';
import {expenseSchema} from './expenses';
const number=z.number().finite();const text=z.string();
const item=z.object({id:text,city:text,title:text,kind:z.enum(['activity','meal','rest','transfer','hotel']),duration:number,start:number,end:number,transfer:number,area:text,cost:number.int().nonnegative(),basis:z.enum(['person','group']),indoor:z.boolean(),locked:z.boolean(),fixed:z.boolean(),status:z.enum(['planned','done','skipped']),note:text,reservation:z.boolean(),source:z.enum(['Live','Estimasi','Contoh','Input pengguna']),comments:z.array(z.object({id:text,text,author:text}))}).passthrough();
const schema=z.object({id:text,input:inputSchema,days:z.array(z.object({id:text,date:text,city:text,theme:text,locked:z.boolean(),items:z.array(item)})),legs:z.array(z.object({id:text,from:text,to:text,mode:text,date:text,departure:text,arrival:text,fromTimezone:text,toTimezone:text,duration:number,cost:number.int().nonnegative(),reference:text,confirmed:z.boolean()})),stays:z.array(z.object({id:text,city:text,area:text,name:text,rooms:number.int().positive(),capacity:number.int().positive(),nights:number.int().nonnegative(),rate:number.int().nonnegative(),checkin:text,checkout:text,reference:text,confirmed:z.boolean()})),expenses:z.array(expenseSchema),extraBudget:z.array(z.object({id:text,name:text,category:text,unit:number.int().nonnegative(),quantity:number.int().positive(),basis:z.enum(['person','group'])})).optional(),participants:z.array(z.object({id:text,name:text,role:z.enum(['Owner','Editor','Viewer'])})),checklist:z.array(z.object({id:text,name:text,group:text,quantity:number,done:z.boolean(),deadline:text,assignee:text})),documents:z.array(z.object({id:text,title:text,reference:text,note:text})),votes:z.record(z.array(text)),settlements:z.array(z.object({id:text,from:text,to:text,amount:number.int().positive()})),revisions:z.array(z.object({id:text,at:text,description:text})),created:text,updated:text,generation:number});
export interface TripRepository{load():Trip[]|null;save(trips:Trip[]):void;clear():void}
export const STORAGE_KEY='nusatrip-v1';
export function validateTrips(data:unknown):Trip[]{return z.array(schema).max(100).parse(data) as Trip[]}
export class LocalTripRepository implements TripRepository{
 constructor(private storage:Pick<Storage,'getItem'|'setItem'|'removeItem'>){}
 load(){const raw=this.storage.getItem(STORAGE_KEY);if(!raw)return null;try{const parsed=JSON.parse(raw);if(parsed.version!==1)throw new Error();return validateTrips(parsed.trips)}catch{throw new Error('Data tersimpan tidak dapat dibaca. Data asli tetap dipertahankan. Unduh cadangan sebelum reset.')}}
 save(trips:Trip[]){try{this.storage.setItem(STORAGE_KEY,JSON.stringify({version:1,trips}))}catch{throw new Error('Penyimpanan perangkat penuh atau diblokir. Perubahan masih ada di layar. Unduh cadangan lalu coba simpan lagi.')}}
 clear(){this.storage.removeItem(STORAGE_KEY)}
}
