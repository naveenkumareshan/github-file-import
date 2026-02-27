ALTER TABLE cabins 
  ADD COLUMN allowed_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]',
  ADD COLUMN slots_applicable_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]';