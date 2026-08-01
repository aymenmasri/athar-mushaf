begin;

-- The public API now uses `alive`. Preserve existing rows created by earlier
-- clients before enforcing the new vocabulary.
alter table public.dedications
  drop constraint if exists dedications_recipient_status_allowed;

update public.dedications
set recipient_status = 'alive'
where recipient_status = 'living';

alter table public.dedications
  add constraint dedications_recipient_status_allowed
  check (recipient_status in ('alive', 'deceased', 'unspecified'));

commit;
