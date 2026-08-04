import { supabase } from '../lib/supabase';
import type { LiabilityTerm, TermAcceptance, PetCheckin, PetIncident } from '../types';

export async function loadCareData(companyId:string) {
  const [terms,acceptances,checkins,incidents] = await Promise.all([
    supabase.from('liability_terms').select('*').eq('company_id',companyId).order('created_at',{ascending:false}),
    supabase.from('term_acceptances').select('*').eq('company_id',companyId).order('accepted_at',{ascending:false}),
    supabase.from('pet_checkins').select('*').eq('company_id',companyId).order('checked_in_at',{ascending:false}),
    supabase.from('pet_incidents').select('*').eq('company_id',companyId).order('occurred_at',{ascending:false}),
  ]);
  const error=[terms,acceptances,checkins,incidents].find(r=>r.error)?.error; if(error) throw new Error(error.message);
  return {terms:(terms.data??[]) as LiabilityTerm[],acceptances:(acceptances.data??[]) as TermAcceptance[],checkins:(checkins.data??[]) as PetCheckin[],incidents:(incidents.data??[]) as PetIncident[]};
}
export async function createTerm(input:Omit<LiabilityTerm,'id'|'company_id'|'created_by'|'created_at'>){const {data,error}=await supabase.from('liability_terms').insert(input).select().single();if(error)throw new Error(error.message);return data as LiabilityTerm;}
export async function acceptTerm(input:{termId:string;customerId:string;petId?:string;appointmentId?:string;acceptedByName:string}){const {data,error}=await supabase.rpc('accept_liability_term',{p_term_id:input.termId,p_customer_id:input.customerId,p_pet_id:input.petId||null,p_appointment_id:input.appointmentId||null,p_accepted_by_name:input.acceptedByName});if(error)throw new Error(error.message);return data as TermAcceptance;}
export async function createCheckin(input:Omit<PetCheckin,'id'|'company_id'|'created_by'|'created_at'|'updated_at'>){const {data,error}=await supabase.from('pet_checkins').insert(input).select().single();if(error)throw new Error(error.message);return data as PetCheckin;}
export async function createIncident(input:Omit<PetIncident,'id'|'company_id'|'created_by'|'created_at'>){const {data,error}=await supabase.from('pet_incidents').insert(input).select().single();if(error)throw new Error(error.message);return data as PetIncident;}
