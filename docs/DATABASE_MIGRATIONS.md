# Database migrations and CI/CD

This project stores user accounts and notes in Supabase. The database schema is managed
as **migration files** in `supabase/migrations/`, and GitHub Actions tests and deploys
them automatically. **Never change the database by hand in the Supabase dashboard.**

## How it works

```text
You change the schema → add a migration file → open a pull request
   → GitHub tests it on a temporary database       (validate job)
   → merge into notes-integration
   → GitHub applies it to the real Supabase project (deploy job)
```

- Workflow file: `.github/workflows/supabase-migrations.yml`
- Migrations: `supabase/migrations/<timestamp>_<name>.sql`
- Deploy branch: `notes-integration` (change to `main` in the workflow when we switch)
- The pipeline cannot read TypeScript. **A developer must write the SQL** for every
  schema change.

## Changing the schema (checklist)

Example: adding a `language` field to notes.

1. **Create a branch** from the deploy branch:
   ```powershell
   git checkout notes-integration
   git pull
   git checkout -b add-language-column
   ```
2. **Update the app code** in the same pull request:
   - `SavedNote` in `src/scripts/types.ts`
   - `src/notes/database.types.ts`
   - the mapping in `src/notes/notesService.ts`
   - the runtime validation in `src/notes/types.ts`, if the field is validated there
3. **Create a migration file:**
   ```powershell
   npx.cmd supabase migration new add_language_to_notes
   ```
4. **Write the SQL** in the new file:
   ```sql
   alter table public.notes add column if not exists language text;
   ```
5. **Test locally** (Docker Desktop must be running):
   ```powershell
   npx.cmd supabase start
   npx.cmd supabase db reset
   npx.cmd supabase stop
   ```
   `db reset` rebuilds the local database from all migrations, so it must finish
   without errors.
6. **Commit and push**, then open a pull request with base `notes-integration`.
7. **Wait for "Supabase migrations / validate" to pass.** Do not merge if it is red.
8. **Merge.** The deploy job runs on the push and applies the new migration.
9. **Check** the Supabase Table Editor to confirm the change.

On Windows PowerShell we use `npx.cmd` instead of `npx` because script execution may be
blocked.

## Rules

- **Never edit a migration that has been merged.** Supabase records it as applied and
  will not run it again. Add a new migration instead.
- **One purpose per migration**, with a short descriptive name.
- **Use `if exists` / `if not exists`** where possible so the SQL is safe to repeat.
- **New columns must be nullable or have a default.** `not null` without a default fails
  on a table that already has rows.
- **Keep Row Level Security on.** Every table with user data needs RLS enabled and
  policies that check `auth.uid() = user_id`.
- **Be careful with `drop` and `rename`.** Dropping a column permanently deletes its data,
  and old versions of the extension that still use it will start failing. Release code
  that stops using the column first, then drop it in a later migration. Reviewers should
  look closely at any pull request containing `drop` or `rename`.
- **Deploy the migration before releasing code that needs it.** The database change and
  the extension release do not happen at the same moment.
- **Do not put secrets in the repo.** Never commit `.env`, `dist.pem`, database
  passwords, access tokens, or any Supabase service-role key.

## What each part of the workflow does

| Job | Runs on | What it does |
|---|---|---|
| `validate` | Pull requests and pushes that touch `supabase/migrations/` or the workflow file | Starts a temporary Supabase in Docker and applies **all** migrations from an empty database. Fails on any SQL error. |
| `deploy` | Pushes to `notes-integration`, after `validate` passes | Runs `supabase link` and `supabase db push --remote --yes`, which applies only migrations not yet recorded in the project's history table. |

On a pull request, `deploy` shows as **skipped**. That is expected. It runs after the merge.

The Supabase CLI version is pinned in the workflow (`3.2.0`) so runs are repeatable. If
you upgrade it, update both `setup-cli` steps in the workflow and test locally first.

## GitHub secrets used by the deploy job

Set under **Settings → Secrets and variables → Actions**. Values are never shown again
after saving.

| Secret | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Scoped token limited to this project (read access to Project Settings, API Keys, API Key Secrets). Used by `supabase link`. **Expires**, so renew it before then. |
| `SUPABASE_DB_PASSWORD` | Database password, used by `supabase db push` |
| `SUPABASE_PROJECT_ID` | The project reference ID |



## Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Failed to resolve latest Supabase CLI release: rate limit exceeded` | The workflow used `version: latest`. Keep the version pinned. Re-run the job if it is a one-off. |
| `Confirmation required ... Re-run with --yes` | `db push` needs `--yes` in CI. It is already set in the workflow. |
| `failed to connect to postgres ... 127.0.0.1:54322` | The CLI is targeting the local database. Add `--remote`, or start the local stack with `supabase start`. |
| `docker: command not found` | Docker Desktop is not running, or the terminal started before Docker was installed. Start Docker Desktop and restart the terminal or VS Code. |
| `relation "notes" already exists` in deploy | A migration was applied by hand and is not in the history. Fix with `npx.cmd supabase migration repair --status applied <version> --remote`. |
| `password authentication failed` in deploy | `SUPABASE_DB_PASSWORD` is wrong or has stray whitespace. Re-save the secret. |
| Permission error on `supabase link` with `missing_permissions` | The access token lacks a permission, or has expired. Create a new scoped token and update the secret. |
| Deploy did not run after merge | Check that the run shows event `push` on `notes-integration`, and that the merge changed `supabase/migrations/` or the workflow file. |

## Useful commands

```powershell
npx.cmd supabase migration list --remote        # applied vs local migrations on the real project
npx.cmd supabase db push --remote --dry-run     # show what a deploy would do, change nothing
npx.cmd supabase start / db reset / stop        # local test database (needs Docker Desktop)
```

Always check the `Target:` line these commands print before running anything that changes
data. Without `--remote`, they act on the local test database.

## Later improvements

- Deploy from `main` instead of `notes-integration`.
- Add a separate staging Supabase project and deploy there first.
- Add a GitHub Environment named `production` with required reviewers, then uncomment
  `environment: production` in the workflow.
- Turn on branch protection so the `validate` check must pass before merging.
