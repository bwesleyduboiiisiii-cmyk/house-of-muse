// Supabase Edge Function: notify-all
// Broadcasts a push notification to every subscribed device via OneSignal.
// The House of MUSE app calls this automatically whenever someone posts "@ALL" in The Buzz.
//
// Deploy steps are in VAULT-and-PUSH-setup.md (same folder).

const ONESIGNAL_APP_ID = "da44b2ad-257a-4baf-a202-82f933238f91";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle the browser's CORS preflight
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
  const message = (payload.message || "New announcement").slice(0, 500);
  const url = payload.url || "";

  const body: Record<string, unknown> = {
    app_id: ONESIGNAL_APP_ID,
    // "Subscribed Users" works on most apps; newer OneSignal dashboards call it
    // "Total Subscriptions". If you get a "segment not found" error, swap the name.
    included_segments: ["Subscribed Users"],
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
