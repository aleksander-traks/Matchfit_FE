import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ClientIntakeData {
  training_experience: string;
  goals: string[];
  sessions_per_week: string;
  chronic_diseases: string[];
  injuries: string[];
  weight_goal: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const clientData: ClientIntakeData = await req.json();

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Napisz zwięzły, profesjonalny opis (2-3 zdania) klienta fitness na podstawie jego danych:

Doświadczenie treningowe: ${clientData.training_experience}
Cele: ${clientData.goals.join(", ")}
Treningi w tygodniu: ${clientData.sessions_per_week}
Choroby przewlekłe: ${clientData.chronic_diseases.length > 0 ? clientData.chronic_diseases.join(", ") : "Brak"}
Kontuzje: ${clientData.injuries.length > 0 ? clientData.injuries.join(", ") : "Brak"}
Cel wagowy: ${clientData.weight_goal}

Napisz krótkie, profesjonalne podsumowanie po polsku oddające profil fitness klienta, jego cele i ważne kwestie zdrowotne.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Jesteś specjalistą fitness tworzącym opisy profili klientów. Bądź zwięzły, profesjonalny i skup się na kluczowych informacjach. Zawsze odpowiadaj po polsku.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      return new Response(
        JSON.stringify({ error: "OpenAI request failed", details: errBody }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const completion = await response.json();
    const overview = completion.choices[0]?.message?.content?.trim();

    if (!overview) {
      return new Response(
        JSON.stringify({ error: "No overview generated", code: "EMPTY_RESPONSE" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ overview }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("generate-overview error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
