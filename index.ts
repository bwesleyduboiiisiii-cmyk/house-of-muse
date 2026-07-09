// Supabase Edge Function: notify-owner
// Sends a push ONLY to devices tagged role = Owner or Manager.
// The app tags each device automatically (linkPush) with the signed-in user's role,
// and calls this whenever a member submits something that needs review.

const ONESIGNAL_APP_ID = "da44b2ad-257a-4baf-a202-82f933238f91";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST only" }), {
      status: 405, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const REST_KEY = Deno.env.get("ONESIGNAL_REST_API_KEY");
  if (!REST_KEY) {
    return new Response(JSON.stringify({ error: "ONESIGNAL_REST_API_KEY secret not set" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  let payload: { title?: string; message?: string; url?: string } = {};
  try { payload = await req.json(); } catch (_) { /* ignore */ }

  const title = (payload.title || "House of MUSE").slice(0, 120);
  const message = (payload.message || "Something needs your review").slice(0, 500);
  const url = payload.url || "";

  const body: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    // Only reach devices whose role tag is Owner or Manager
    filters: [
      { field: "tag", key: "role", relation: "=", value: "Owner" },
      { operator: "OR" },
      { field: "tag", key: "role", relation: "=", value: "Manager" },
    ],
    headings: { en: title },
    contents: { en: message },
  };
  if (url) body.url = url;

  try {
    const res = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": "Basic " + REST_KEY,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    // OneSignal returns 200 with "errors: All included players are not subscribed"
    // when no owner device is registered yet — that's fine, not a failure.
    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : res.status,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 502, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
