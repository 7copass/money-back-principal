-- Add schedule_hour column to notification_templates table (only if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'notification_templates' 
        AND column_name = 'schedule_hour'
    ) THEN
        ALTER TABLE notification_templates 
        ADD COLUMN schedule_hour INTEGER DEFAULT 9;
    END IF;
END $$;

-- Update existing templates to have a default of 9 AM (if NULL)
UPDATE notification_templates SET schedule_hour = 9 WHERE schedule_hour IS NULL;

-- Add comment
COMMENT ON COLUMN notification_templates.schedule_hour IS 'Hour of the day (0-23) to send this specific notification template';
