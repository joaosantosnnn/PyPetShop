create index if not exists portal_requests_customer_idx on public.customer_appointment_requests(customer_id);
create index if not exists portal_requests_pet_idx on public.customer_appointment_requests(pet_id);
create index if not exists portal_requests_service_idx on public.customer_appointment_requests(service_id);
drop policy if exists portal_requests_self_select on public.customer_appointment_requests;
drop policy if exists portal_requests_staff_select on public.customer_appointment_requests;
create policy portal_requests_select on public.customer_appointment_requests for select to authenticated
using(auth_user_id=(select auth.uid())or(select private.is_company_member(company_id)));
