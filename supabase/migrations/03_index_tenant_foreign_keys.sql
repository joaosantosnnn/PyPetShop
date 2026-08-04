-- PetGestor: índices que acompanham as chaves estrangeiras multiempresa.
begin;

create index appointments_customer_company_idx
  on public.appointments(customer_id, company_id);
create index appointments_pet_company_idx
  on public.appointments(pet_id, company_id);
create index appointments_service_company_idx
  on public.appointments(service_id, company_id);
create index appointments_employee_company_idx
  on public.appointments(employee_id, company_id);
create index pets_customer_company_idx
  on public.pets(customer_id, company_id);

commit;
