import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const PYTHON_API_URL = Deno.env.get("PYTHON_API_URL") || "https://matchfit-be.onrender.com";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const startTime = Date.now();
    
    const response = await fetch(`${PYTHON_API_URL}/`, {
      method: "GET",
      headers: {
        "User-Agent": "Supabase-KeepAlive/1.0",
      },
    });

    const responseTime = Date.now() - startTime;
    const isHealthy = response.ok;

    const data = {
      status: isHealthy ? "healthy" : "unhealthy",
      python_api_url: PYTHON_API_URL,
      response_time_ms: responseTime,
      http_status: response.status,
      timestamp: new Date().toISOString(),
    };

    console.log("Keep-alive ping result:", data);

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    console.error("Keep-alive ping failed:", error);

    const errorData = {
      status: "error",
      python_api_url: PYTHON_API_URL,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});