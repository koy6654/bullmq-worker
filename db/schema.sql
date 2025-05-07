CREATE TABLE bullmq_worker_history (
    id UUID NOT NULL,
    job_id UUID NOT NULL,
    job_name TEXT NOT NULL,
    queue_name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status = ANY (ARRAY['init'::text, 'skipped'::text, 'completed'::text, 'failed'::text])),
    create_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
