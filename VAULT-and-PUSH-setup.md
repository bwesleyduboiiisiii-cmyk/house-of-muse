# @ALL push — setup (one-time, ~5 min)

Your app already sends the push request automatically. It just needs this small
Supabase function deployed once so the request has somewhere to land.

## What you need
- Your **OneSignal REST API Key** (OneSignal dashboard → Settings → Keys & IDs → "REST API Key").
  This is the secret one — NOT the App ID. Never put it in the app; it lives only in Supabase.

## Deploy (in a terminal, from any folder)
```bash
# 1. Log in and link your project (only needed once)
supabase login
supabase link --project-ref abtmfykiwfrvliuplnij

# 2. Create the function folder, then drop the index.ts (from this download) into it:
#    supabase/functions/notify-all/index.ts

# 3. Store your OneSignal REST API key as a secret
supabase secrets set ONESIGNAL_REST_API_KEY=your_rest_api_key_here

# 4. Deploy — the --no-verify-jwt flag lets the app call it with the public anon key
supabase functions deploy notify-all --no-verify-jwt
```

That's it. Post anything with **@ALL** in The Buzz and every subscribed phone gets a push.

## Notes
- If you see a "segment not found" error in the function logs, open `index.ts` and change
  `["Subscribed Users"]` to `["Total Subscriptions"]` (newer OneSignal renamed it), then redeploy.
- Right now **anyone** who types @ALL triggers the push. If you'd rather only you / managers can
  blast everyone's phone, say the word and I'll gate it to Owner/Manager in the app.
- Phones only receive pushes if that person allowed notifications when they opened the app.
