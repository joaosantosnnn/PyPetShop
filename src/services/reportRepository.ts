import{ supabase }from'../lib/supabase';
export interface RankedReportItem{name:string;quantity:number;revenue:number}
export interface DailyRevenue{day:string;products:number;services:number}
export interface ManagementReport{start_date:string;end_date:string;product_revenue:number;service_revenue:number;total_revenue:number;cost_of_goods:number;gross_profit:number;loss_value:number;orders_count:number;average_ticket:number;inventory_value:number;estimated_turnover:number;top_products:RankedReportItem[];top_services:RankedReportItem[];daily_revenue:DailyRevenue[]}
export async function loadManagementReport(startDate:string,endDate:string){const{data,error}=await supabase.rpc('get_management_report',{p_start_date:startDate,p_end_date:endDate});if(error)throw new Error(error.message);return data as ManagementReport}
