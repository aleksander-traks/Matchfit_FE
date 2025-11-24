/*
  # Create Notification Triggers

  1. Trigger Functions
    - Function to create admin notification when chat message is sent
    - Function to create admin notification when intro call is scheduled
  
  2. Triggers
    - Trigger on messages table insert (client messages only)
    - Trigger on intro_calls table insert
  
  3. Admin Email
    - All notifications go to aleksander.traks@gmail.com
    - Notifications created automatically in email_notifications table
*/

-- Function to create admin notification for chat messages
CREATE OR REPLACE FUNCTION notify_admin_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  client_email text;
  expert_name text;
  expert_spec text;
BEGIN
  -- Only notify for client messages
  IF NEW.sender = 'client' THEN
    -- Get client email from profile
    SELECT email INTO client_email
    FROM client_profiles
    WHERE id = NEW.client_profile_id;
    
    -- Get expert details
    SELECT name, specialization INTO expert_name, expert_spec
    FROM experts
    WHERE id = NEW.expert_id;
    
    -- Create notification for admin
    INSERT INTO email_notifications (
      recipient_email,
      notification_type,
      subject,
      body,
      metadata
    ) VALUES (
      'aleksander.traks@gmail.com',
      'admin_notification',
      'New Chat Message from ' || COALESCE(client_email, 'Anonymous User'),
      'A new chat message has been received:

From: ' || COALESCE(client_email, 'Anonymous User') || '
Expert: ' || COALESCE(expert_name, 'Unknown') || ' (' || COALESCE(expert_spec, 'Unknown specialization') || ')
Message: ' || NEW.content || '

Time: ' || to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI:SS') || '

Client Profile ID: ' || NEW.client_profile_id || '
Expert ID: ' || NEW.expert_id,
      jsonb_build_object(
        'message_id', NEW.id,
        'client_profile_id', NEW.client_profile_id,
        'expert_id', NEW.expert_id,
        'client_email', client_email,
        'expert_name', expert_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin notification for intro calls
CREATE OR REPLACE FUNCTION notify_admin_intro_call()
RETURNS TRIGGER AS $$
DECLARE
  expert_name text;
  expert_spec text;
BEGIN
  -- Get expert details
  SELECT name, specialization INTO expert_name, expert_spec
  FROM experts
  WHERE id = NEW.expert_id;
  
  -- Create notification for admin
  INSERT INTO email_notifications (
    recipient_email,
    notification_type,
    subject,
    body,
    metadata
  ) VALUES (
    'aleksander.traks@gmail.com',
    'admin_notification',
    'New Intro Call Scheduled by ' || NEW.email,
    'A new intro call has been scheduled:

From: ' || NEW.email || '
Expert: ' || COALESCE(expert_name, 'Unknown') || ' (' || COALESCE(expert_spec, 'Unknown specialization') || ')
Preferred Date: ' || COALESCE(to_char(NEW.preferred_date, 'YYYY-MM-DD'), 'Not specified') || '
Preferred Time: ' || COALESCE(NEW.preferred_time, 'Not specified') || '
Notes: ' || COALESCE(NEW.notes, 'None') || '

Scheduled: ' || to_char(NEW.created_at, 'YYYY-MM-DD HH24:MI:SS') || '

Client Profile ID: ' || COALESCE(NEW.client_profile_id::text, 'N/A') || '
Expert ID: ' || NEW.expert_id || '
Intro Call ID: ' || NEW.id,
    jsonb_build_object(
      'intro_call_id', NEW.id,
      'client_profile_id', NEW.client_profile_id,
      'expert_id', NEW.expert_id,
      'client_email', NEW.email,
      'expert_name', expert_name,
      'preferred_date', NEW.preferred_date,
      'preferred_time', NEW.preferred_time
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for chat messages
DROP TRIGGER IF EXISTS trigger_notify_admin_chat_message ON messages;
CREATE TRIGGER trigger_notify_admin_chat_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_chat_message();

-- Create trigger for intro calls
DROP TRIGGER IF EXISTS trigger_notify_admin_intro_call ON intro_calls;
CREATE TRIGGER trigger_notify_admin_intro_call
  AFTER INSERT ON intro_calls
  FOR EACH ROW
  EXECUTE FUNCTION notify_admin_intro_call();
