# Push setup — @ALL and owner review alerts

The app already sends both push requests. Each just needs its small Supabase
function deployed once. Same key, same steps as before.

## What you need
Your **OneSignal REST API Key** (OneSignal → Settings → Keys & IDs → "REST API Key").
Keep it only in Supabase — never in the app.

## Deploy (terminal, once)
```bash
supabase login
supabase link --project-ref abtmfykiwfrvliuplnij

# put the two folders under supabase/functions/ :
#   supabase/functions/notify-all/index.ts     (whole-squad @ALL push)
#   supabase/functions/notify-owner/index.ts   (owner/manager review alerts)

# store the key once (both functions read it)
supabase secrets set ONESIGNAL_REST_API_KEY=your_rest_api_key_here

# deploy both (--no-verify-jwt lets the app call them with the public anon key)
supabase functions deploy notify-all   --no-verify-jwt
supabase functions deploy notify-owner --no-verify-jwt
```

## How the owner alert works
- When anyone signs in, the app tags their device with their role (Owner / Manager / Member).
- When a member submits a quest, drill, mission, achievement, or a Muse Live report,
  the app calls `notify-owner`, which pushes **only** to devices tagged Owner or Manager.
- So members never get these alerts — just you and your managers.

## Notes
- You must have allowed notifications on your own device (and be signed in as Owner) to receive them.
- If you get a lot of submissions and the pings feel frequent, tell me and I can batch them
  (e.g. one summary alert every few minutes instead of one per submission).
- "Segment not found" on notify-all → open its index.ts and change `["Subscribed Users"]`
  to `["Total Subscriptions"]`, redeploy.
