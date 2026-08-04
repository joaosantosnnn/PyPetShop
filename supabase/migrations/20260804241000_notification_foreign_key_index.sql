create index if not exists notifications_user_company_idx
  on public.notifications(user_id,company_id);
