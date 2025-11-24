import { supabase } from '../supabase';

export interface EmailNotificationData {
  recipientEmail: string;
  notificationType: 'chat_message' | 'intro_call_scheduled' | 'admin_notification';
  subject: string;
  body: string;
  metadata?: Record<string, any>;
}

export async function queueEmailNotification(data: EmailNotificationData) {
  const { data: notification, error } = await supabase
    .from('email_notifications')
    .insert({
      recipient_email: data.recipientEmail,
      notification_type: data.notificationType,
      subject: data.subject,
      body: data.body,
      metadata: data.metadata || {},
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('Error queuing email notification:', error);
    throw error;
  }

  return notification;
}

export async function createAdminChatNotification(
  profileId: string,
  expertId: number,
  email: string,
  expertName: string
) {
  return queueEmailNotification({
    recipientEmail: 'aleksander.traks@gmail.com',
    notificationType: 'admin_notification',
    subject: `New chat message from ${email}`,
    body: `A new chat message has been received:

From: ${email}
Expert: ${expertName}
Client Profile ID: ${profileId}
Expert ID: ${expertId}

Time: ${new Date().toISOString()}`,
    metadata: {
      profileId,
      expertId,
      clientEmail: email,
      expertName,
    },
  });
}

export async function createAdminIntroCallNotification(introCallData: {
  email: string;
  expertName: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  introCallId: string;
  clientProfileId: string;
  expertId: number;
}) {
  return queueEmailNotification({
    recipientEmail: 'aleksander.traks@gmail.com',
    notificationType: 'admin_notification',
    subject: `New intro call scheduled by ${introCallData.email}`,
    body: `A new intro call has been scheduled:

From: ${introCallData.email}
Expert: ${introCallData.expertName}
Preferred Date: ${introCallData.preferredDate || 'Not specified'}
Preferred Time: ${introCallData.preferredTime || 'Not specified'}
Notes: ${introCallData.notes || 'None'}

Scheduled: ${new Date().toISOString()}

Client Profile ID: ${introCallData.clientProfileId}
Expert ID: ${introCallData.expertId}
Intro Call ID: ${introCallData.introCallId}`,
    metadata: {
      introCallId: introCallData.introCallId,
      clientProfileId: introCallData.clientProfileId,
      expertId: introCallData.expertId,
      clientEmail: introCallData.email,
      expertName: introCallData.expertName,
      preferredDate: introCallData.preferredDate,
      preferredTime: introCallData.preferredTime,
    },
  });
}
