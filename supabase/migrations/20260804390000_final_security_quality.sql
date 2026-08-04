-- PetShop: fechamento da auditoria de seguranca e desempenho.
begin;

revoke all on table public.liability_terms from anon;
revoke all on table public.term_acceptances from anon;
revoke all on table public.pet_checkins from anon;
revoke all on table public.pet_incidents from anon;

alter default privileges for role postgres in schema public
  revoke select, insert, update, delete, truncate, references, trigger on tables from anon;
alter default privileges for role postgres in schema public
  revoke usage, select, update on sequences from anon;
alter default privileges for role postgres in schema public
  revoke execute on functions from anon;

create index if not exists cash_movements_company_idx
  on public.cash_movements(company_id);

commit;
