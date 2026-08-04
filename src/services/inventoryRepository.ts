import{ supabase }from'../lib/supabase';
import type{InventoryCount,InventoryCountItem,Product}from'../types';
const fail=(error:{message:string}|null)=>{if(error)throw new Error(error.message)};
export async function loadInventoryCounts(companyId:string){const{data,error}=await supabase.from('inventory_counts').select('*,items:inventory_count_items(*)').eq('company_id',companyId).order('created_at',{ascending:false});fail(error);return(data??[])as InventoryCount[]}
export async function createInventoryCount(name:string){const{data,error}=await supabase.rpc('create_inventory_count',{p_name:name});fail(error);return data as InventoryCount}
export async function finalizeInventoryCount(id:string,items:InventoryCountItem[]){const{data,error}=await supabase.rpc('finalize_inventory_count',{p_count_id:id,p_items:items.map(i=>({item_id:i.id,counted_quantity:i.counted_quantity}))});fail(error);return data as InventoryCount}
export async function recordStockLoss(input:{productId:string;quantity:number;reason:string;kind:string;batch?:string;expiration?:string}){const{data,error}=await supabase.rpc('record_stock_loss',{p_product_id:input.productId,p_quantity:input.quantity,p_reason:input.reason,p_kind:input.kind,p_batch_number:input.batch||null,p_expiration_date:input.expiration||null});fail(error);return data as Product}
