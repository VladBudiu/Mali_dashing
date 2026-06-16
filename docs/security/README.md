# Security Layout

Security rules are governed by `DEV_RULES.md`.

## Confidential Storage

All confidential local notes belong in:

```text
.confidential/credentials.md
```

The `.confidential/` folder is gitignored and must remain untracked. It is the only local project file intended for credential references, private repository notes, private endpoint notes, service dashboards, and access instructions.

## Never Commit

- API keys
- Supabase service-role keys
- private tokens
- passwords
- endpoint secrets
- webhook signing secrets
- private repository credentials
- production connection strings
- Azure Document Intelligence keys
- OpenAI API keys
- BNR/ECB API credentials

## Public-Side Safety

Do not expose backend-capable keys or privileged endpoints in public/client code. A value may be public only when all of these are true:

- the provider explicitly documents it as browser-safe
- it is restricted by domain, environment, and least privilege
- it cannot perform privileged backend actions
- it cannot access private user, revenue, asset, or compliance data

If any point is unclear, halt implementation and ask for approval.

## Supabase-Specific Rules

- RLS must be enabled on all tables in the `public` schema
- Service role key is server-side only — never in client bundles
- Storage buckets are private; use signed URLs with short expiry
- AI assistant routes use only the anon key + RLS context — never service role
