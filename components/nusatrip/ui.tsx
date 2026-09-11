'use client';
import {type ReactNode,useId} from 'react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Checkbox} from '@/components/ui/checkbox';
import {Button} from '@/components/ui/button';
import {Info,ArrowUpRight,MapPin} from 'lucide-react';
export {Button};
export function Field({label,children,hint}:{label:string;children:ReactNode;hint?:string}){return <div className="field"><span className="field-label">{label}</span>{children}{hint&&<small>{hint}</small>}</div>}
export function Pick({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:(string|{value:string;label:string})[]}){const id=useId();return <Field label={label}><Select value={value} onValueChange={onChange}><SelectTrigger id={id} aria-label={label} className="pick"><SelectValue/></SelectTrigger><SelectContent>{options.map(o=>{const v=typeof o==='string'?o:o.value;return <SelectItem key={v} value={v}>{typeof o==='string'?o:o.label}</SelectItem>})}</SelectContent></Select></Field>}
export function Input({label,hint,...props}:React.InputHTMLAttributes<HTMLInputElement>&{label:string;hint?:string}){const id=useId();return <div className="field"><label htmlFor={id}>{label}</label><input id={id} {...props}/>{hint&&<small>{hint}</small>}</div>}
export function Check({label,checked,onChange,disabled=false}:{label:string;checked:boolean;onChange:(v:boolean)=>void;disabled?:boolean}){const id=useId();return <div className="check"><Checkbox id={id} checked={checked} onCheckedChange={v=>onChange(v===true)} disabled={disabled}/><label htmlFor={id}>{label}</label></div>}
export function Notice({children,tone='info'}:{children:ReactNode;tone?:'info'|'warning'|'error'}){return <div className={`notice ${tone}`} role={tone==='error'?'alert':undefined}><Info size={18}/><div>{children}</div></div>}
export function Empty({title,description,action}:{title:string;description:string;action?:ReactNode}){return <div className="empty-state"><MapPin size={30}/><h3>{title}</h3><p>{description}</p>{action}</div>}
export function LinkOut({href,children}:{href:string;children:ReactNode}){return <a className="external-link" href={href} target="_blank" rel="noreferrer">{children}<ArrowUpRight size={15}/></a>}
export function navigateURL(title:string,city:string){return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(title+' '+city)}`}
