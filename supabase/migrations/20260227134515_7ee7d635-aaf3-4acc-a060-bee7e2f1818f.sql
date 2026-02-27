
-- Add position columns to hostel_beds for visual floor plan
ALTER TABLE public.hostel_beds 
  ADD COLUMN IF NOT EXISTS position_x numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS position_y numeric NOT NULL DEFAULT 0;

-- Add layout columns to hostel_rooms for visual layout
ALTER TABLE public.hostel_rooms
  ADD COLUMN IF NOT EXISTS room_width integer NOT NULL DEFAULT 800,
  ADD COLUMN IF NOT EXISTS room_height integer NOT NULL DEFAULT 600,
  ADD COLUMN IF NOT EXISTS layout_image text,
  ADD COLUMN IF NOT EXISTS layout_image_opacity integer NOT NULL DEFAULT 30;
