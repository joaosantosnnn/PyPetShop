import {supabase} from '../lib/supabase';
import type {PetWeightRecord} from '../types';

export async function loadPetWeightHistory(companyId:string,petId:string){
 const {data,error}=await supabase.from('pet_weight_history').select('*').eq('company_id',companyId).eq('pet_id',petId).order('recorded_at',{ascending:false});
 if(error)throw new Error(error.message); return (data??[]).map(x=>({...x,weight:Number(x.weight)})) as PetWeightRecord[];
}
