/*
  # Create Email Notifications Table

  1. New Table: email_notifications
    - `id` (uuid, primary key)
    - `recipient_email` (text, NOT NULL) - Email to send to
    - `notification_type` (text, NOT NULL) - 'chat_message', 'intro_call_scheduled'
    - `subject` (text, NOT NULL)
    - `body` (text, NOT NULL)
    - `metadata` (jsonb) - Additional data (profile_id, expert_id, etc.)
    - `status` (text, NOT NULL) - 'pending', 'sent', 'failed'
    - `error_message` (text, nullable)
    - `sent_at` (timestamptz, nullable)
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS
    - Only service role can access this table
    - Clients cannot read/write directly
  
  3. Indexes
    - Index on status for efficient querying of pending notifications
    - Index on created_at for cleanup and reporting
    - Index on notification_type for analytics
*/

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email text NOT NULL,
  notification_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  error_message text,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'sent', 'failed')),
  CONSTRAINT valid_notification_type CHECK (notification_type IN ('chat_message', 'intro_call_scheduled', 'admin_notification'))
);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- No policies for regular users - only service role can access
CREATE POLICY "Service role can manage email notifications"
  ON email_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_status ON email_notifications(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(notification_type);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_email_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS email_notifications_updated_at ON email_notifications;
CREATE TRIGGER email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_email_notifications_updated_at();
