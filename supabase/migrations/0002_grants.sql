
grant usage on schema public to anon, authenticated;

grant select, insert, update on patients to anon, authenticated;
grant select, insert, update on queue_tickets to anon, authenticated;
grant select, insert, update on encounters to anon, authenticated;
grant insert on audit_log to anon, authenticated; 


alter table patients enable row level security;
alter table queue_tickets enable row level security;
alter table encounters enable row level security;
alter table audit_log enable row level security;


create policy "dev_allow_all_patients" on patients for all using (true) with check (true);
create policy "dev_allow_all_queue_tickets" on queue_tickets for all using (true) with check (true);
create policy "dev_allow_all_encounters" on encounters for all using (true) with check (true);
create policy "dev_allow_all_audit_log_insert" on audit_log for insert with check (true);