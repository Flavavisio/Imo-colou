-- Vigia Cloud: covering indexes for recorder foreign keys.
create index if not exists clip_jobs_reseller_idx on public.clip_jobs(reseller_id);
create index if not exists clip_jobs_camera_idx on public.clip_jobs(camera_id);
