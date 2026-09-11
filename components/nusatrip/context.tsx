'use client';
import {createContext,useContext} from 'react';
import type {Trip,TripInput} from '@/lib/nusatrip/model';
export type View='explore'|'trips'|'overview'|'itinerary'|'map'|'budget'|'expenses'|'transport'|'weather'|'checklist'|'documents'|'collaboration'|'today'|'profile'|'compare'|'setup';
export interface TripContextValue{trip:Trip;trips:Trip[];view:View;online:boolean;name:string;navigate:(v:View)=>void;openTrip:(id:string,v?:View)=>void;create:(input?:TripInput)=>void;commit:(trip:Trip,description:string)=>boolean;propose:(trip:Trip,description:string)=>void;undo:()=>void;canUndo:boolean;removeTrip:(id:string)=>void;compare:string[];setCompare:(ids:string[])=>void;reset:()=>void;rename:(name:string)=>void;saveError:string;retrySave:()=>void}
export const TripContext=createContext<TripContextValue|null>(null);
export const useTrip=()=>{const c=useContext(TripContext);if(!c)throw new Error('Workspace perjalanan belum siap.');return c};
