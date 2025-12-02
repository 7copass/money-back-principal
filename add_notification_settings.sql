-- Add notification settings columns to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notification_delay_min INTEGER DEFAULT 30; -- seconds
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notification_delay_max INTEGER DEFAULT 60; -- seconds
ALTER TABLE companies ADD COLUMN IF NOT EXISTS notification_schedule_hour INTEGER DEFAULT 9; -- hour of day (0-23)
