import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    const url = new URL(req.url);
    const exportType = url.searchParams.get("type") || "campaigns";
    const format = url.searchParams.get("format") || "json";

    let data = null;
    let error = null;

    switch (exportType) {
      case "campaigns":
        ({ data, error } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false }));
        break;
      case "stores":
        ({ data, error } = await supabase
          .from("stores")
          .select("*")
          .order("created_at", { ascending: false }));
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Invalid export type" }),
          {
            status: 400,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
    }

    if (error) {
      throw error;
    }

    if (format === "csv") {
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${exportType}_${new Date().toISOString()}.csv"`,
        },
      });
    }

    return new Response(
      JSON.stringify({ data, exportedAt: new Date().toISOString() }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
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

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return "";
  
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(","),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return "";
        if (typeof value === "string" && value.includes(",")) {
          return `"${value}"`;
        }
        return value;
      }).join(",")
    )
  ];
  
  return csv.join("\n");
}