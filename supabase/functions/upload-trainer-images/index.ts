import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TRAINERS = [
  { name: "Michał Utrata", id: 4, filename: "Michal_utrata.jpeg" },
  { name: "Paweł Osuch", id: 3, filename: "Pawel_Osuch.jpeg" },
  { name: "Stanisław Sitowski", id: 8, filename: "Stanislaw_Sitowski.jpeg" },
];

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const results = [];

    const body = await req.json().catch(() => ({}));
    const images = body.images as Record<string, string> | undefined;

    for (const trainer of TRAINERS) {
      if (!images || !images[trainer.filename]) {
        results.push({ trainer: trainer.name, status: "no image data provided" });
        continue;
      }

      const base64Data = images[trainer.filename];
      const binaryStr = atob(base64Data);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const { error: uploadError } = await supabase.storage
        .from("trainer-images")
        .upload(trainer.filename, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) {
        results.push({ trainer: trainer.name, status: "upload failed", error: uploadError.message });
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("trainer-images")
        .getPublicUrl(trainer.filename);

      const { error: updateError } = await supabase
        .from("experts")
        .update({ image: urlData.publicUrl })
        .eq("id", trainer.id);

      if (updateError) {
        results.push({ trainer: trainer.name, status: "db update failed", error: updateError.message });
      } else {
        results.push({ trainer: trainer.name, status: "success", url: urlData.publicUrl });
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
