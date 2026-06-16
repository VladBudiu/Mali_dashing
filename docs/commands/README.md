# Command Registry

This file records the commands agents should use for this project.

## Precheck Commands

```bash
git fetch origin
git status --short --branch
git branch --show-current
git diff --check
rg -n "^(<<<<<<<|=======|>>>>>>>)" --glob "!node_modules/**" --glob "!.next/**" --glob "!.git/**"
```

## Validation Commands

```bash
npm run build
npm run test
npm run lint
npm audit --audit-level=moderate
```

## Test Commands

```bash
npm run test
```

Unit and integration tests use Vitest in non-watch mode.

## Build Commands

```bash
npm run build
npm run dev
```

## Supabase Commands

```bash
npx supabase --version
npx supabase db lint --local --schema public --fail-on error
npx supabase db lint --linked --schema public --fail-on error
npx supabase db reset --local
```

`supabase db lint` and `supabase db reset` require Docker Desktop for local Supabase.
`supabase db lint --linked` requires an authenticated linked Supabase development project.
Use a live database only with approved credentials stored outside tracked files.

## Git Commands

```bash
git switch -c feature/<task-name>
git add <intentional-files>
git commit -m "<imperative summary>"
git push -u origin feature/<task-name>
```

## Credential Checks

For tasks that require Supabase persistence:

```bash
node -e "console.log(Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL), Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY))"
```

Do not print secret values.

For confidential vault checks:

```bash
git check-ignore -v .confidential/credentials.md
git status --short --ignored
git diff --cached --name-only
```

If `.confidential/credentials.md` is not ignored, halt.
