import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface EmailNotification {
  id: string;
  recipient_email: string;
  notification_type: string;
  subject: string;
  body: string;
  metadata: Record<string, any>;
  status: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: notifications, error: fetchError } = await supabase
      .from("email_notifications")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      throw fetchError;
    }

    if (!notifications || notifications.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending notifications",
          processed: 0
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const results = [];

    for (const notification of notifications as EmailNotification[]) {
      try {
        if (resendApiKey) {
          const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "MatchFit <notifications@matchfit.app>",
              to: [notification.recipient_email],
              subject: notification.subject,
              html: notification.body,
            }),
          });

          if (!emailResponse.ok) {
            const errorData = await emailResponse.text();
            throw new Error(`Resend API error: ${errorData}`);
          }
        } else {
          console.log("RESEND_API_KEY not set - email would be sent to:", notification.recipient_email);
          console.log("Subject:", notification.subject);
        }

        const { error: updateError } = await supabase
          .from("email_notifications")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
          })
          .eq("id", notification.id);

        if (updateError) {
          console.error("Error updating notification status:", updateError);
        }

        results.push({
          id: notification.id,
          status: "sent",
          recipient: notification.recipient_email,
        });
      } catch (error: any) {
        console.error(`Error sending notification ${notification.id}:`, error);

        const { error: updateError } = await supabase
          .from("email_notifications")
          .update({
            status: "failed",
            error_message: error.message || "Unknown error",
          })
          .eq("id", notification.id);

        if (updateError) {
          console.error("Error updating notification status:", updateError);
        }

        results.push({
          id: notification.id,
          status: "failed",
          recipient: notification.recipient_email,
          error: error.message,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.length} notifications`,
        processed: results.length,
        results,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-notifications:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "An error occurred",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
