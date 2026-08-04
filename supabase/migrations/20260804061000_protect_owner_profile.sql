begin;
create function private.protect_owner_profile() returns trigger language plpgsql set search_path='' as $$ begin if old.role='proprietario' and (new.role<>'proprietario' or not new.is_active or new.company_id is distinct from old.company_id) then raise exception 'O proprietário não pode ser desativado ou rebaixado'; end if; return new; end;$$;
revoke all on function private.protect_owner_profile() from public,anon,authenticated;
create trigger profiles_protect_owner before update on public.profiles for each row execute function private.protect_owner_profile();
commit;
