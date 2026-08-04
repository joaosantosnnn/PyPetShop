-- PetGestor: endurecimento de permissões, vínculos multiempresa e índices.
begin;

-- Remove privilégios automáticos de projetos antigos e concede somente o necessário.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

grant select, update on public.companies to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update on public.customers to authenticated;
grant select, insert, update on public.pets to authenticated;
grant select, insert, update on public.services to authenticated;
grant select, insert, update on public.appointments to authenticated;
grant select, insert on public.appointment_status_history to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- Impede referências cruzadas entre empresas mesmo que um UUID seja conhecido.
alter table public.profiles add constraint profiles_id_company_unique unique (id, company_id);
alter table public.customers add constraint customers_id_company_unique unique (id, company_id);
alter table public.pets add constraint pets_id_company_unique unique (id, company_id);
alter table public.services add constraint services_id_company_unique unique (id, company_id);

alter table public.pets drop constraint pets_customer_id_fkey;
alter table public.pets add constraint pets_customer_company_fkey
  foreign key (customer_id, company_id)
  references public.customers(id, company_id)
  on delete restrict;

alter table public.appointments drop constraint appointments_customer_id_fkey;
alter table public.appointments drop constraint appointments_pet_id_fkey;
alter table public.appointments drop constraint appointments_service_id_fkey;
alter table public.appointments drop constraint appointments_employee_id_fkey;

alter table public.appointments add constraint appointments_customer_company_fkey
  foreign key (customer_id, company_id)
  references public.customers(id, company_id)
  on delete restrict;
alter table public.appointments add constraint appointments_pet_company_fkey
  foreign key (pet_id, company_id)
  references public.pets(id, company_id)
  on delete restrict;
alter table public.appointments add constraint appointments_service_company_fkey
  foreign key (service_id, company_id)
  references public.services(id, company_id)
  on delete restrict;
alter table public.appointments add constraint appointments_employee_company_fkey
  foreign key (employee_id, company_id)
  references public.profiles(id, company_id)
  on delete restrict;

create index appointments_created_by_idx on public.appointments(created_by);
create index appointment_status_history_changed_by_idx on public.appointment_status_history(changed_by);

commit;
