import { supabase } from '../lib/supabase';
import type { CashRegister } from '../types';
const fail=(error:{message:string}|null)=>{if(error)throw new Error(error.message)};
const normalize=(row:any):CashRegister=>({...row,user_name:row.profiles?.full_name||'Operador'});
export async function loadOpenCash(companyId:string){const{data,error}=await supabase.from('cash_registers').select('*,profiles(full_name)').eq('company_id',companyId).eq('status','aberto').maybeSingle();fail(error);return data?normalize(data):null;}
export async function openCash(initialCash:number){const{data,error}=await supabase.rpc('open_cash_register',{p_initial_cash:initialCash});fail(error);return normalize(data);}
export async function moveCash(type:'sangria'|'suprimento',amount:number,description:string){const{error}=await supabase.rpc('register_cash_movement',{p_type:type,p_amount:amount,p_description:description});fail(error);}
export async function closeCash(actualCash:number){const{data,error}=await supabase.rpc('close_cash_register',{p_actual_cash:actualCash});fail(error);return normalize(data);}
