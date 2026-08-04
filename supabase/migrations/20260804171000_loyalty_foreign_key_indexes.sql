begin;
create index service_packages_service_company_idx on public.service_packages(service_id,company_id);
create index service_packages_creator_company_idx on public.service_packages(created_by,company_id);
create index customer_packages_pet_company_fk_idx on public.customer_packages(pet_id,company_id);
create index package_usages_appointment_company_idx on public.package_usages(appointment_id,company_id);
commit;
