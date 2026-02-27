ALTER TABLE cabins 
  ADD COLUMN advance_applicable_durations jsonb NOT NULL DEFAULT '["daily","weekly","monthly"]';