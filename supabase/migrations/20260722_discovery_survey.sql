-- Discovery Survey responses table
CREATE TABLE IF NOT EXISTS discovery_survey (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  domain TEXT,
  role TEXT,
  other_domain TEXT,
  has_sensor_data TEXT,
  frequency TEXT,
  duration TEXT,
  data_flow TEXT,
  provenance TEXT,
  pain_point TEXT,
  solution TEXT,
  standard_wish TEXT,
  interest TEXT,
  contact TEXT
);

-- Allow anonymous inserts via the REST API (research instrument — no auth needed)
ALTER TABLE discovery_survey ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_anon_insert" ON discovery_survey FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "allow_service_select" ON discovery_survey FOR SELECT TO service_role USING (true);
