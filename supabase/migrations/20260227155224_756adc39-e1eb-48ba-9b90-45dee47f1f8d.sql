
ALTER TABLE complaints ADD COLUMN module text DEFAULT 'reading_room';
ALTER TABLE complaints ADD COLUMN hostel_id uuid DEFAULT NULL;
