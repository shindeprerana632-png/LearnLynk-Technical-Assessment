// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js";

// Allowed task types (input uses task_type)
const VALID_TASK_TYPES = ["call", "email", "review"];

serve(async (req: Request) => {
  // Only POST is allowed
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Only POST allowed" }), {
      status: 405,
      headers: { "Allow": "POST", "Content-Type": "application/json" },
    });
  }

  try {
    // parse JSON body
    const body = await req.json().catch(() => null);
    if (!body) {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { application_id, task_type, due_at } = body;

    // required fields
    if (!application_id || !task_type || !due_at) {
      return new Response(JSON.stringify({ error: "Missing required fields: application_id, task_type, due_at" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // validate task_type
    if (!VALID_TASK_TYPES.includes(task_type)) {
      return new Response(JSON.stringify({ error: "Invalid task_type. Allowed: call, email, review" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // validate due_at: valid ISO and future
    const dueDate = new Date(due_at);
    const now = new Date();
    if (isNaN(dueDate.getTime()) || dueDate <= now) {
      return new Response(JSON.stringify({ error: "due_at must be a valid future timestamp" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // create supabase client with service role key (must be set in env)
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env");
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Insert row into tasks. NOTE: DB column name used here is `type` (adjust if your schema uses different name)
    const { data, error } = await supabase
      .from("tasks")
      .insert([
        {
          application_id,
          type: task_type,   // write to 'type' column in tasks table
          due_at: dueDate.toISOString()
        }
      ])
      .select("id")
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return new Response(JSON.stringify({ error: "Failed to create task" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, task_id: data.id }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("Unhandled error in create-task:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
