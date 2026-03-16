import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface Expert {
  id: number;
  overview: string;
}

interface MatchResult {
  expert_id: number;
  match_score: number;
  reason1: string;
  reason2: string;
}

async function calculateMatchScore(
  apiKey: string,
  clientOverview: string,
  expert: Expert
): Promise<MatchResult> {
  const prompt = `You are a fitness matchmaking expert. Analyze the compatibility between a client and a fitness expert.

Client Profile:
${clientOverview}

Expert Profile:
${expert.overview}

Rate their compatibility on a scale of 0-100 and provide exactly two brief reasons (one sentence each) why they would be a good match.

Return your response in this exact JSON format:
{
  "match_score": <number between 0-100>,
  "reason1": "<first reason>",
  "reason2": "<second reason>"
}`;

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
          content: "You are a fitness matchmaking expert. Respond only with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed: ${response.status}`);
  }

  const completion = await response.json();
  const content = completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from OpenAI");
  }

  const result = JSON.parse(content);

  return {
    expert_id: expert.id,
    match_score: result.match_score,
    reason1: result.reason1,
    reason2: result.reason2,
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { clientOverview, experts, stream: useStream } = await req.json() as {
      clientOverview: string;
      experts: Expert[];
      stream?: boolean;
    };

    if (!useStream) {
      const results: MatchResult[] = [];
      for (const expert of experts) {
        try {
          const match = await calculateMatchScore(apiKey, clientOverview, expert);
          results.push(match);
        } catch (err) {
          console.error(`Failed to match expert ${expert.id}:`, err);
          results.push({
            expert_id: expert.id,
            match_score: 0,
            reason1: "Error calculating match score",
            reason2: "",
          });
        }
      }
      results.sort((a, b) => b.match_score - a.match_score);
      return new Response(
        JSON.stringify({ matches: results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const BATCH_SIZE = 3;
    const encoder = new TextEncoder();

    const body = new ReadableStream({
      async start(controller) {
        const allMatches: MatchResult[] = [];
        let completedCount = 0;
        const totalCount = experts.length;

        try {
          for (let i = 0; i < experts.length; i += BATCH_SIZE) {
            const batch = experts.slice(i, i + BATCH_SIZE);

            const batchResults = await Promise.all(
              batch.map(async (expert) => {
                try {
                  return await calculateMatchScore(apiKey, clientOverview, expert);
                } catch (err) {
                  console.error(`Failed to match expert ${expert.id}:`, err);
                  return {
                    expert_id: expert.id,
                    match_score: 0,
                    reason1: "Error calculating match score",
                    reason2: "",
                  };
                }
              })
            );

            for (const match of batchResults) {
              allMatches.push(match);
              completedCount++;
              const event = `data: ${JSON.stringify({ type: "match", match, completed: completedCount, total: totalCount })}\n\n`;
              controller.enqueue(encoder.encode(event));
            }
          }

          allMatches.sort((a, b) => b.match_score - a.match_score);
          const doneEvent = `data: ${JSON.stringify({ type: "complete", matches: allMatches })}\n\n`;
          controller.enqueue(encoder.encode(doneEvent));
        } catch (err) {
          const errEvent = `data: ${JSON.stringify({ type: "error", error: String(err) })}\n\n`;
          controller.enqueue(encoder.encode(errEvent));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (err) {
    console.error("match-experts error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
