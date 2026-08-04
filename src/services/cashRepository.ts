import { supabase } from '../lib/supabase';
import type { CashRegister } from '../types';
const fail=(error:{message:string}|null)=>{if(error)throw new Error(error.message)};
const normalize=(row:any):CashRegister=>({...row,user_name:row.profiles?.full_name||'Operador'});
export async function loadOpenCash(companyId:string){const{data,error}=await supabase.from('cash_registers').select('*,profiles(full_name)').eq('company_id',companyId).eq('status','aberto').maybeSingle();fail(error);return data?normalize(data):null;}
export async function openCash(initialCash:number){const{data,error}=await supabase.rpc('open_cash_register',{p_initial_cash:initialCash});fail(error);return normalize(data);}
export async function moveCash(type:'sangria'|'suprimento',amount:number,description:string){const{error}=await supabase.rpc('register_cash_movement',{p_type:type,p_amount:amount,p_description:description});fail(error);}
export async function closeCash(actualCash:number){const{data,error}=await supabase.rpc('close_cash_register',{p_actual_cash:actualCash});fail(error);return normalize(data);}
export interface CashMovementHistory{id:string;movement_type:'sangria'|'suprimento';amount:number;description:string;created_at:string}
export interface CashHistoryRecord extends CashRegister{movements:CashMovementHistory[]}
export async function loadCashHistory(companyId:string){const[registers,movements]=await Promise.all([
  supabase.from('cash_registers').select('*,profiles(full_name)').eq('company_id',companyId).order('opened_at',{ascending:false}).limit(100),
  supabase.from('cash_movements').select('id,cash_register_id,movement_type,amount,description,created_at').eq('company_id',companyId).order('created_at',{ascending:true}),
]);fail(registers.error);fail(movements.error);return(registers.data??[]).map(row=>({...normalize(row),movements:(movements.data??[]).filter(item=>item.cash_register_id===row.id).map(item=>({...item,amount:Number(item.amount)}))}))as CashHistoryRecord[]}
