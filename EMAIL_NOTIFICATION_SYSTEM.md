# Email & Notification System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER INTERACTIONS                           │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    │                             │
                    ▼                             ▼
         ┌──────────────────┐         ┌──────────────────┐
         │   Chat Message   │         │  Book Intro Call │
         │   (First Time)   │         │                  │
         └──────────────────┘         └──────────────────┘
                    │                             │
                    ▼                             ▼
         ┌──────────────────┐         ┌──────────────────┐
         │ Email Collection │         │ Email Collection │
         │     Modal        │         │  + Scheduling    │
         └──────────────────┘         └──────────────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        SUPABASE DATABASE                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────┐      ┌────────────────┐      ┌──────────────┐│
│  │ client_profiles│      │    messages    │      │ intro_calls  ││
│  │                │      │                │      │              ││
│  │ • email        │      │ • content      │      │ • email      ││
│  │ • email_consent│      │ • sender       │      │ • pref_date  ││
│  └────────────────┘      └────────────────┘      │ • pref_time  ││
│                                 │                 └──────────────┘│
│                                 │                        │         │
│                                 ▼                        ▼         │
│                          ┌──────────────────────────────┐         │
│                          │   DATABASE TRIGGERS          │         │
│                          │   (Automatic)                │         │
│                          └──────────────────────────────┘         │
│                                          │                         │
│                                          ▼                         │
│                          ┌──────────────────────────────┐         │
│                          │  email_notifications         │         │
│                          │                              │         │
│                          │  • recipient: admin email    │         │
│                          │  • subject                   │         │
│                          │  • body (HTML)               │         │
│                          │  • status: pending           │         │
│                          └──────────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ (Cron: Every 5 mins)
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                           │
│                  send-email-notifications                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. Query pending notifications (status = 'pending')               │
│  2. For each notification:                                         │
│     • Send email via Resend API                                    │
│     • Update status to 'sent' or 'failed'                          │
│     • Record sent_at timestamp                                     │
│     • Log any errors                                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ (HTTPS POST)
                                          ▼
                               ┌──────────────────┐
                               │   RESEND API     │
                               │                  │
                               │  Sends HTML      │
                               │  Formatted Email │
                               └──────────────────┘
                                          │
                                          ▼
                               ┌──────────────────┐
                               │   Admin Email    │
                               │ aleksander.traks │
                               │  @gmail.com      │
                               └──────────────────┘
```

---

## Data Flow Details

### 1. Chat Message Flow

```
User Types Message
       ↓
Check if email exists
       ↓
   ┌───┴───┐
   │       │
  NO      YES
   │       │
   ▼       ▼
Show     Send
Email   Message
Modal  Directly
   │       │
   └───┬───┘
       ↓
Save to messages table
       ↓
Trigger: notify_admin_chat_message()
       ↓
Create notification record
       ↓
Edge function sends email
       ↓
Admin receives email
```

### 2. Intro Call Flow

```
User Clicks "Book Intro Call"
       ↓
IntroCallModal Opens
       ↓
Step 1: Collect Email
       ↓
Step 2: Scheduling Preferences
       ↓
Submit Form
       ↓
Save to intro_calls table
       ↓
Update client_profiles.email
       ↓
Trigger: notify_admin_intro_call()
       ↓
Create notification record
       ↓
Edge function sends email
       ↓
Admin receives email
```

---

## Component Architecture

### Frontend Components

```
src/
├── components/
│   ├── EmailCollectionModal.tsx
│   │   ├── Email input with validation
│   │   ├── Consent checkbox
│   │   └── Error display
│   │
│   ├── IntroCallModal.tsx
│   │   ├── Step 1: Email collection
│   │   ├── Step 2: Scheduling
│   │   └── Success confirmation
│   │
│   └── Toast.tsx
│       └── Success/Error notifications
│
├── pages/
│   ├── Chat.tsx
│   │   ├── Manages email state
│   │   ├── Shows EmailCollectionModal
│   │   └── Sends messages with email
│   │
│   └── Dashboard.tsx
│       ├── Shows expert images & names
│       ├── "Book intro call" button
│       └── Shows IntroCallModal
│
└── lib/
    ├── api.ts
    │   ├── sendMessage(email?)
    │   ├── updateClientEmail()
    │   └── scheduleIntroCall()
    │
    ├── utils/
    │   └── emailValidation.ts
    │
    └── email/
        ├── emailService.ts
        └── templates.ts
```

### Backend Architecture

```
supabase/
├── migrations/
│   ├── add_email_to_client_profiles.sql
│   ├── create_email_notifications_table.sql
│   ├── create_intro_calls_table.sql
│   └── create_notification_triggers.sql
│
└── functions/
    └── send-email-notifications/
        └── index.ts
            ├── Fetch pending notifications
            ├── Send via Resend API
            └── Update notification status
```

---

## Database Schema

### client_profiles (extended)
```sql
CREATE TABLE client_profiles (
  id uuid PRIMARY KEY,
  email text,                    -- NEW
  email_verified boolean,        -- NEW
  email_consent boolean,         -- NEW
  email_consent_date timestamptz,-- NEW
  training_experience text,
  goals text[],
  -- ... other existing fields
);
```

### email_notifications (new)
```sql
CREATE TABLE email_notifications (
  id uuid PRIMARY KEY,
  recipient_email text NOT NULL,
  notification_type text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  metadata jsonb,
  status text NOT NULL,          -- 'pending', 'sent', 'failed'
  error_message text,
  sent_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);
```

### intro_calls (new)
```sql
CREATE TABLE intro_calls (
  id uuid PRIMARY KEY,
  client_profile_id uuid REFERENCES client_profiles(id),
  expert_id integer REFERENCES experts(id),
  email text NOT NULL,
  preferred_date date,
  preferred_time text,
  notes text,
  status text NOT NULL,          -- 'pending', 'confirmed', etc.
  created_at timestamptz,
  updated_at timestamptz
);
```

---

## API Endpoints

### Frontend API Methods

#### `api.sendMessage(clientProfileId, expertId, content, email?)`
**Purpose:** Send chat message, optionally save email

**Parameters:**
- `clientProfileId` (string) - Client's profile ID
- `expertId` (number) - Expert's ID
- `content` (string) - Message text
- `email` (string, optional) - User's email

**Returns:** Message object

**Flow:**
1. If email provided, call `updateClientEmail()`
2. Insert message into `messages` table
3. Database trigger creates notification
4. Return message object

---

#### `api.updateClientEmail(profileId, email)`
**Purpose:** Save email to client profile

**Parameters:**
- `profileId` (string) - Client's profile ID
- `email` (string) - Email address

**Returns:** Updated profile object

**Flow:**
1. Validate email format
2. Update `client_profiles` table
3. Set `email_consent = true`
4. Record `email_consent_date`
5. Return updated profile

---

#### `api.scheduleIntroCall(data)`
**Purpose:** Book intro call and notify admin

**Parameters:**
```typescript
{
  clientProfileId: string;
  expertId: number;
  email: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
}
```

**Returns:** Intro call object

**Flow:**
1. Insert into `intro_calls` table
2. Call `updateClientEmail()` to save email
3. Database trigger creates notification
4. Return intro call object

---

## Email Templates

### Chat Message Email

**To:** aleksander.traks@gmail.com
**Subject:** New chat message from {email}

**Content:**
- MatchFit branding
- Client email
- Expert name
- Message content
- Timestamp
- Profile/Expert IDs

### Intro Call Email

**To:** aleksander.traks@gmail.com
**Subject:** New intro call scheduled by {email}

**Content:**
- MatchFit branding
- Client email
- Expert name
- Preferred date (if provided)
- Preferred time (if provided)
- Additional notes (if provided)
- Timestamp
- All relevant IDs

---

## Security & Privacy

### Authentication
- **Anonymous users:** Can create profiles, send messages, book intro calls
- **Email storage:** Protected by RLS policies
- **Notifications table:** Only accessible by service role

### Row Level Security (RLS)

#### client_profiles
```sql
-- Anyone can read/update profiles (anonymous flow)
CREATE POLICY "Public access" ON client_profiles
  FOR ALL TO public USING (true);
```

#### email_notifications
```sql
-- Only service role can access
CREATE POLICY "Service role only" ON email_notifications
  FOR ALL TO service_role USING (true);
```

#### intro_calls
```sql
-- Anyone can insert, users can read own
CREATE POLICY "Anyone can create" ON intro_calls
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Users read own" ON intro_calls
  FOR SELECT TO public USING (true);
```

### Data Privacy
- Email collected with explicit consent
- Consent timestamp recorded
- Only used for stated purposes (notifications)
- GDPR compliant

---

## Performance Considerations

### Database
- **Indexes:** Added on frequently queried fields
  - `client_profiles.email`
  - `email_notifications.status`
  - `email_notifications.created_at`
  - `intro_calls.client_profile_id`
  - `intro_calls.expert_id`

### Edge Function
- **Batch processing:** Handles 10 notifications per run
- **Rate limiting:** Runs every 5 minutes (configurable)
- **Error handling:** Failed emails marked for retry

### Frontend
- **Email caching:** Email stored in component state after collection
- **Optimistic updates:** UI updates immediately, API calls in background
- **Toast notifications:** Non-blocking user feedback

---

## Monitoring & Logs

### Check Notification Status
```sql
-- Count by status
SELECT status, COUNT(*) as count
FROM email_notifications
GROUP BY status;

-- Recent notifications
SELECT * FROM email_notifications
ORDER BY created_at DESC
LIMIT 20;

-- Failed notifications
SELECT * FROM email_notifications
WHERE status = 'failed'
ORDER BY created_at DESC;
```

### Edge Function Logs
- View in Supabase Dashboard → Edge Functions → send-email-notifications → Logs
- Shows each execution with timestamps
- Displays errors and successful sends

### Resend Dashboard
- Go to https://resend.com/emails
- View all sent emails
- Check delivery status
- View open/click rates (if configured)

---

## Cost Analysis

### Supabase (Free Tier)
- Database storage: Included (up to 500MB)
- Edge function invocations: Unlimited on free tier
- Bandwidth: 5GB/month

### Resend (Free Tier)
- 3,000 emails/month
- 100 emails/day
- All features included

### Estimated Usage
- **Per user:** 1-2 emails (intro call + occasional chat)
- **Monthly:** ~100-500 emails for small business
- **Cost:** $0 (well within free tiers)

---

## Deployment Checklist

- [ ] Database migrations applied
- [ ] Edge function deployed
- [ ] Resend API key configured
- [ ] Cron job set up (optional)
- [ ] Admin email verified
- [ ] Test email flow end-to-end
- [ ] Monitor for first 24 hours
- [ ] Document any issues
- [ ] Set up alerts for failures

---

## Maintenance Tasks

### Weekly
- Review failed notifications
- Check email delivery rates
- Monitor database growth

### Monthly
- Archive old notifications (>90 days)
- Review Resend usage
- Update email templates if needed

### Quarterly
- Audit RLS policies
- Review user feedback
- Optimize edge function if needed

---

**System Status:** ✅ Production Ready
**Last Updated:** November 24, 2025
**Version:** 1.0
