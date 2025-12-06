-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-------------------------------------------------------
-- LEADS TABLE
-------------------------------------------------------
CREATE TABLE public.leads (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    owner_id    UUID,
    stage       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX leads_tenant_idx ON public.leads (tenant_id);
CREATE INDEX leads_owner_idx  ON public.leads (owner_id);
CREATE INDEX leads_stage_idx  ON public.leads (stage);


-------------------------------------------------------
-- APPLICATIONS TABLE
-------------------------------------------------------
CREATE TABLE public.applications (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id   UUID NOT NULL,
    lead_id     UUID NOT NULL,
    status      TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT applications_lead_fk
      FOREIGN KEY (lead_id)
      REFERENCES public.leads(id)
      ON DELETE CASCADE
);

-- Indexes
CREATE INDEX applications_tenant_idx ON public.applications (tenant_id);
CREATE INDEX applications_lead_idx   ON public.applications (lead_id);


-------------------------------------------------------
-- TASKS TABLE
-------------------------------------------------------
CREATE TABLE public.tasks (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL,
    application_id  UUID NOT NULL,
    type            TEXT NOT NULL,
    status          TEXT DEFAULT 'pending',
    due_at          TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT tasks_application_fk
      FOREIGN KEY (application_id)
      REFERENCES public.applications(id)
      ON DELETE CASCADE,

    -- allowed types
    CONSTRAINT task_type_check
      CHECK (type IN ('call', 'email', 'review')),

    -- due_at >= created_at
    CONSTRAINT due_after_creation
      CHECK (due_at >= created_at)
);

-- Indexes
CREATE INDEX tasks_tenant_idx ON public.tasks (tenant_id);
CREATE INDEX tasks_due_idx    ON public.tasks (due_at);
CREATE INDEX tasks_status_idx ON public.tasks (status);
