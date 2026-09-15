// Deploy from the Supabase dashboard (Edge Functions) or via the Supabase
// CLI (`supabase functions deploy delete-account`) — not applied automatically
// by anything in this repo. Requires the function's SUPABASE_SERVICE_ROLE_KEY
// secret to be set in the Supabase project (Edge Functions > Secrets); that
// key never lives in this repo or the app bundle (see CLAUDE.md).
//
// The app calls this via supabase.functions.invoke("delete-account") while
// signed in. It deletes the caller's own row from user_backups/profiles and
// then their auth.users row (which cascades to any other user_id-scoped
// data) — a user can only ever delete themselves, never another account.

import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Resolve the caller's own user id from their session token — never
  // trust a user id passed in the request body.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await callerClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Invalid session" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // Both tables FK to auth.users with `on delete cascade`, so deleting the
  // auth user below already removes these rows — kept explicit here anyway
  // in case that FK is ever changed to `set null`/removed.
  await adminClient.from("user_backups").delete().eq("user_id", user.id);
  await adminClient.from("profiles").delete().eq("user_id", user.id);

  const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return new Response(JSON.stringify({ error: deleteError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
