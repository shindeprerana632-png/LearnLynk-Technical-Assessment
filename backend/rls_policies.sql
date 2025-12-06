-- Enable Row Level Security for leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- SELECT POLICY
-- Admins can see all leads in their tenant.
-- Counselors can see:
-- 1. Leads they own
-- 2. Leads assigned to a team they belong to
-- --------------------------------------------
CREATE POLICY "select_leads_policy"
ON leads
FOR SELECT
USING (

  -- Admin access
  (
    auth.jwt()->>'role' = 'admin'
    AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
  )

  OR

  -- Counselor: owns the lead
  (
    auth.jwt()->>'role' = 'counselor'
    AND owner_id = auth.uid()
  )

  OR

  -- Counselor: belongs to a team that has the lead
  EXISTS (
    SELECT 1
    FROM user_teams ut
    JOIN teams t ON t.id = ut.team_id
    WHERE ut.user_id = auth.uid()
      AND t.id = leads.team_id     -- using team_id column
      AND t.tenant_id = (auth.jwt()->>'tenant_id')::uuid
  )
);

-- --------------------------------------------
-- INSERT POLICY
-- Admins and counselors can insert leads,
-- but only for their own tenant.
-- --------------------------------------------
CREATE POLICY "insert_leads_policy"
ON leads
FOR INSERT
WITH CHECK (
  auth.jwt()->>'role' IN ('admin', 'counselor')
  AND tenant_id = (auth.jwt()->>'tenant_id')::uuid
);
