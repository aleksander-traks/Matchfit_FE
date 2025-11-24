export interface ChatMessageTemplateData {
  clientEmail: string;
  expertName: string;
  messageContent: string;
  timestamp: string;
  profileId: string;
  expertId: number;
}

export interface IntroCallTemplateData {
  clientEmail: string;
  expertName: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  timestamp: string;
  profileId: string;
  expertId: number;
  introCallId: string;
}

export function chatMessageTemplate(data: ChatMessageTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Chat Message</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">MatchFit</h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px;">New Chat Message</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">New message received</h2>
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                A client has sent a message to one of your trainers.
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>From:</strong> ${data.clientEmail}</p>
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>Expert:</strong> ${data.expertName}</p>
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>Time:</strong> ${data.timestamp}</p>
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Message:</p>
                  <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">${data.messageContent}</p>
                </div>
              </div>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;"><strong>Client Profile ID:</strong> ${data.profileId}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;"><strong>Expert ID:</strong> ${data.expertId}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated notification from MatchFit
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function introCallTemplate(data: IntroCallTemplateData): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Intro Call Scheduled</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <tr>
            <td style="background-color: #10b981; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">MatchFit</h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 14px;">New Intro Call Scheduled</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 20px; font-weight: 600;">New intro call request</h2>
              <p style="margin: 0 0 15px 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                A client has requested an intro call with one of your trainers.
              </p>

              <div style="background-color: #f9fafb; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>From:</strong> ${data.clientEmail}</p>
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>Expert:</strong> ${data.expertName}</p>
                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;"><strong>Scheduled:</strong> ${data.timestamp}</p>

                ${data.preferredDate ? `<p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Preferred Date:</strong> ${data.preferredDate}</p>` : ''}
                ${data.preferredTime ? `<p style="margin: 5px 0 0 0; color: #6b7280; font-size: 14px;"><strong>Preferred Time:</strong> ${data.preferredTime}</p>` : ''}

                ${data.notes ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
                  <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Notes:</p>
                  <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">${data.notes}</p>
                </div>
                ` : ''}
              </div>

              <div style="background-color: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;"><strong>Client Profile ID:</strong> ${data.profileId}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;"><strong>Expert ID:</strong> ${data.expertId}</p>
                <p style="margin: 5px 0 0 0; color: #6b7280; font-size: 12px;"><strong>Intro Call ID:</strong> ${data.introCallId}</p>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0; color: #6b7280; font-size: 12px;">
                This is an automated notification from MatchFit
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
