-- eSebeLink — vendor location for the map shown when booking
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS latitude NUMERIC(9,6);
ALTER TABLE vendors ADD COLUMN IF NOT EXISTS longitude NUMERIC(9,6);
