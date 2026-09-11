# Provider & extension guide

## Current adapters

| Capability | Current behavior | Configuration |
|---|---|---|
| Weather | Open-Meteo public forecast, explicit request, 8s timeout, Zod validation, up to 16 days | No key for permitted non-commercial usage; evaluate commercial plan before commercialization |
| Places | Deterministic local editorial catalog | Edit `catalog.ts`; add verified provenance before describing places as verified |
| Routing | Returns unavailable, no inferred road routes | Supply verified minutes/geometry through RoutingProvider |
| AI planner | Rules only; returns a preview | No AI key is used or sent from the browser |
| TripRepository | LocalStorage with validation and explicit failures | One origin/browser; no server sync |
| FileStorageProvider | Explicit unsupported adapter | No file uploads or signed URLs are simulated |
| Map | Standard OSM tiles online and approximate markers | Respect attribution, caching policy and usage limits |

Open-Meteo errors preserve the trip. If a successful snapshot is retained in session storage, an error displays stale-data messaging with its original time. Data outside horizon returns `unavailable` with no daily values. User-selected demo rain scenario is visually separate from forecast values.

## Connecting a real backend

This code does not pretend a database exists. Before adding Supabase:

1. Implement authenticated User/UserPreferences and TripRepository against Postgres through supported HTTP APIs.
2. Give each Trip an `owner_id` and revision number. Enforce RLS on trips and related participants, days, items, budgets, expenses, shares, checklist, documents, votes, comments and revisions.
3. Read access must use authenticated ownership/membership or an explicit server-validated share token. Write access must check Owner/Editor on the server. A client role label is never authorization.
4. Use transactions or compare-and-swap revision guards. Ensure stable IDs and idempotency for expenses and offline mutations. Until this is implemented, retain offline read-only.
5. Store attachments in a private bucket; generate short-lived signed URLs after checking trip access. Do not include booking references or attachments in public snapshots.
6. Add migrations and run two-account authorization tests before exposing multiuser features. No production SQL/migration is currently applied.

## Connecting a real AI adapter

Use an authenticated server endpoint with server-only secrets. Validate requests and output with Zod, timeout and rate limit per user, bound tokens and cost, and never give model output authority over money or time calculations. Send only the minimum trip constraints/catalog IDs, not personal documents, private notes, or booking references. Treat retrieved content as data. Apply the deterministic feasibility validator before presenting a preview, and preserve protected items. Do not label AI connected until a real request succeeds.

## Official references checked during implementation

- [Next.js App Router installation](https://nextjs.org/docs/app/getting-started/installation)
- [Tailwind CSS with PostCSS](https://tailwindcss.com/docs/installation/using-postcss)
- [Zod basic validation](https://zod.dev/basics)
- [Open-Meteo forecast documentation](https://open-meteo.com/en/docs)
- [OpenStreetMap tile usage policy](https://operations.osmfoundation.org/policies/tiles/)

The project preserves the supplied compatible dependency lockfile: Next.js 16.2.6, React 19.2.6, Tailwind 4.2.1, Zod 3.25.x, and the Sites Vinext adapter. It does not assume those are the latest upstream releases.
