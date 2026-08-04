alter table public.portal_pix_payments add column receipt_number bigint generated always as identity,add column receipt_issued_at timestamptz;
create unique index portal_pix_receipt_number_uidx on public.portal_pix_payments(receipt_number);
create function private.set_pix_receipt_issued_at()returns trigger language plpgsql security invoker set search_path=''as $$begin if new.status='confirmado'and old.status is distinct from'confirmado'then new.receipt_issued_at:=now();end if;return new;end$$;
create trigger portal_pix_receipt_timestamp before update of status on public.portal_pix_payments for each row execute function private.set_pix_receipt_issued_at();
update public.portal_pix_payments set receipt_issued_at=coalesce(reviewed_at,created_at)where status='confirmado'and receipt_issued_at is null;
revoke all on function private.set_pix_receipt_issued_at()from public,anon,authenticated;
