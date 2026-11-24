# Database migrations and CI/CD

This project stores user accounts and notes in Supabase. The database schema is managed
as **migration files** in `supabase/migrations/`, and GitHub Actions tests, type-checks and
deploys changes automatically.

**Never change the database by hand in the Supabase dashboard.** Never edit
`src/notes/database.types.ts` by hand. Both are produced by the pipeline from migration files.

> **Important:** we currently have one Supabase project, and it is **production**.
> Merging into `notes-integration` changes the live database. Review migrations carefully.

---

## 1. The big picture

```text
You: write a migration (SQL) + update the app code
        |  push branch, open a pull request into notes-integration
        v
GitHub runs three workflows in parallel (each only when its files changed):
   1. Generate database types   -> rebuilds the schema, regenerates database.types.ts,
                                   commits it to your branch
   2. Supabase migrations       -> "validate": applies all migrations to a temporary DB
   3. Extension CI              -> type-checks and builds the extension
        |  you pull the bot's commit, re-run checks, all green, merge
        v
GitHub (push to notes-integration):
   Supabase migrations -> validate again + check types are up to date
                       -> "deploy": applies the new migration to the real Supabase project
```

What the pipeline does **not** do: it cannot read TypeScript and invent SQL. A developer must
write the migration. The pipeline tests it, regenerates the database types, and applies it.

---

## 2. Where things live

| What | Where |
|---|---|
| Migration files | `supabase/migrations/<timestamp>_<name>.sql` |
| Supabase CLI config | `supabase/config.toml` |
| Generated database types (do not edit) | `src/notes/database.types.ts` |
| Notes model (hand-written) | `SavedNote` in `src/scripts/types.ts` |
| Mapping between model and database rows | `toNoteRow` / `toSavedNote` in `src/notes/notesService.ts` |
| Runtime validation of messages | `isSavedNote` in `src/notes/types.ts` |
| Workflows | `.github/workflows/` (three files, see section 3) |

**What is generated vs hand-written**

- `database.types.ts` describes **database rows** (snake_case columns). It is generated.
- `SavedNote`, the mapping functions and the validation describe **the app's model**
  (camelCase). Developers write and update these.

---

## 3. The three workflows

| Workflow file | Starts when | What it does |
|---|---|---|
| `generate-db-types.yml` | A pull request changes `supabase/migrations/**` (branches in this repo only, not forks) | Starts a temporary Supabase, applies all migrations, runs `supabase gen types --schema public`, writes `src/notes/database.types.ts`, checks the file looks valid, and **commits it to the pull request branch** as "chore: regenerate database types" |
| `supabase-migrations.yml` | A pull request or a push to `notes-integration` changes `supabase/migrations/**`, `src/notes/database.types.ts`, or the workflow file | **validate:** applies all migrations to a temporary database. On pushes only, also checks the committed types match the migrated schema. **deploy** (pushes to `notes-integration` only, after validate passes): runs `supabase link` and `supabase db push --remote --yes` |
| `extension-ci.yml` | Every pull request, and pushes to `notes-integration` | `npm ci`, TypeScript type-check, `npm run build`, then checks that content and automation scripts have no ES `import` lines and that `dist/` is complete |

Things that are normal and not errors:

- On a **pull request**, the `deploy` job shows as **skipped**. It only runs after a merge.
- A pull request that changes **only app code** (no migration) starts **only Extension CI**.
  The other two workflows do not run, because their path filters do not match.
- The type-check step in Extension CI is currently **non-blocking** (`continue-on-error: true`)
  while older type errors are fixed. Errors are still printed in the step's log. Do not
  add new type errors.

---

## 4. Changing the schema: step by step

Example: adding a `language` field to notes.

### 4.1 Create a branch from the deploy branch

```powershell
git checkout notes-integration
git pull
git checkout -b add-language-column
```

Always `git pull` first, so your migration's timestamp is later than everything already merged.

### 4.2 Create the migration file

```powershell
npx.cmd supabase migration new add_language_to_notes
```

This creates `supabase/migrations/<current timestamp>_add_language_to_notes.sql`. The
timestamp sets the order. Migrations run oldest to newest.

### 4.3 Write the SQL

```sql
alter table public.notes add column if not exists language text;
```

Follow the rules in section 5.

### 4.4 Update the app code (same pull request)

- `SavedNote` in `src/scripts/types.ts`: add the field.
- `toNoteRow` and `toSavedNote` in `src/notes/notesService.ts`: map the field.
- `isSavedNote` in `src/notes/types.ts`: validate the field, if it is validated there.
- `src/notes/notesApi.ts`: only if message shapes change.
- The code that creates the note, for example `src/scripts/transcript/display.ts`.

**Do not edit `src/notes/database.types.ts`.** The pipeline regenerates it. Your editor may
show errors about the new column until you pull the bot's commit (step 4.7) or run
`db:types` locally (section 6).

### 4.5 Test locally (recommended, needs Docker Desktop)

```powershell
npx.cmd supabase start
npx.cmd supabase db reset
npm.cmd run db:types
npx.cmd supabase stop
```

- `db reset` rebuilds the local database from all migrations. It must finish without errors.
- `db:types` regenerates `src/notes/database.types.ts` locally. If you commit it, the bot
  will find nothing to change.
- Then check your code against the new types: `npm.cmd run typecheck`.

### 4.6 Commit, push and open a pull request

```powershell
git add supabase src
git commit -m "Add language to notes"
git push -u origin add-language-column
```

Open a pull request with **base `notes-integration`** and **compare = your branch**.
Three checks start: **Generate database types**, **Supabase migrations / validate**,
**Extension CI / build**.

### 4.7 After the "Generate database types" bot commit

If you did not commit regenerated types yourself, the bot pushes a commit named
"chore: regenerate database types" to your branch. Then:

```powershell
git pull
git commit --allow-empty -m "Re-run checks"
git push
```

Why: commits pushed by the bot use GitHub's built-in token, which **does not start other
workflows**. The empty commit makes Extension CI and Supabase migrations run again on the
final version of the branch. Always `git pull` before pushing again, or your push is
rejected because the bot's commit is ahead of yours.

### 4.8 Merge only when everything is green

Wait until all checks are green **on the latest commit**. Then merge.

**Before you click merge, check the "Files changed" tab.** For a schema change it should
contain your migration file, `src/notes/database.types.ts`, and your app code. Nothing else.

### 4.9 Watch the deploy

After the merge, open **Actions → Supabase migrations**, the newest run (event `push`,
branch `notes-integration`):

| Job or step | Expected |
|---|---|
| validate: apply migrations | Green |
| validate: Generate database types and Check committed types | "Database types are up to date" |
| deploy: Link to the Supabase project | Green |
| deploy: Apply pending migrations | Shows the migration applied, no error |

### 4.10 Verify

```powershell
git checkout notes-integration
git pull
npx.cmd supabase migration list --remote
```

Every migration must appear under both **Local** and **Remote**. Also check the change in
the Supabase **Table Editor**, and do a quick manual test of saving and loading a note in
the extension.

### If your pull request has no schema change

If you only change app code, none of this applies. Open a pull request as usual.
Only Extension CI runs.

---

## 5. Rules

**Migrations**

- **Never edit a migration that has been merged.** Supabase records it as applied and will
  not run it again. Add a new migration instead.
- **Never delete a merged migration file.** The remote history would no longer match the repo.
- **One purpose per migration**, with a short descriptive name.
- **Use `if exists` / `if not exists`** where possible so the SQL is safe to repeat.
- **New columns must be nullable or have a default.** `not null` without a default fails on
  a table that already has rows.
- **Keep Row Level Security on.** Every table with user data needs RLS enabled and policies
  that check `auth.uid() = user_id`.
- **Pull before creating a migration.** A migration with an older timestamp than one already
  applied on the remote makes `db push` fail. If another migration was merged while your
  pull request was open, rename your file to a newer timestamp before merging.

**Generated types**

- **Never edit `src/notes/database.types.ts` by hand.** The next run overwrites it, and the
  type check after the merge fails if the committed file does not match the schema.
- **Do not format it** (for example with Prettier). It must stay byte-for-byte what the
  CLI produces. The CLI's "generated TypeScript is unformatted" message is expected.
- The file starts with a blank line. That is normal.
- Columns that allow NULL appear as `string | null` in `Row`. Handle that in `toSavedNote`
  (for example `row.field ?? ""`), or make the column `not null` in a migration.
- Use the generated `Insert` type for what you write and `Row` for what you read.

**Dropping and renaming columns**

- Dropping a column **permanently deletes its data**, and old versions of the extension that
  still use it will fail.
- Release code that stops using the column first, wait until old extension versions are gone,
  and only then drop it in a later migration.
- Renaming counts as a drop plus an add for old clients. Reviewers should look closely at any
  pull request containing `drop` or `rename`.
- To **remove a column**, add a **new** migration (for example
  `alter table public.notes drop column if exists test_column;`). Do not edit the migration
  that added it.

**Order of release**

- **Deploy the migration before releasing extension code that needs it.** The database change
  and the Chrome Web Store release do not happen at the same moment.

**Secrets**

- Never commit `.env`, `dist.pem`, database passwords, access tokens, or any Supabase
  service-role key. The extension only ever uses the public anon key.

---

## 6. Local commands (Windows PowerShell)

On Windows PowerShell we use `npx.cmd` and `npm.cmd` because script execution may be blocked.
Docker Desktop must be running for anything that starts the local database.

```powershell
npx.cmd supabase start                          # start a local test Supabase (Docker)
npx.cmd supabase db reset                       # rebuild the local DB from all migrations
npm.cmd run db:types                            # reset + regenerate src/notes/database.types.ts
npx.cmd supabase stop                           # stop the local Supabase (frees memory)

npm.cmd run typecheck                           # TypeScript check
npm.cmd run build                               # build the extension into dist/

npx.cmd supabase migration list --remote        # applied vs local migrations on the real project
npx.cmd supabase db push --remote --dry-run     # show what a deploy would do, change nothing
```

`db:types` runs `supabase db reset`, then `supabase gen types --schema public` into
`src/notes/database.types.ts`. Run `npx.cmd supabase start` first.

**Always check the `Target:` line that the CLI prints.** In CLI 3.x, commands act on the
**local** database by default. Add `--remote` only when you intend to act on the real project.
Do not run `db push --remote` (without `--dry-run`) yourself. The pipeline does the
deployment.

The local database keys the CLI prints are shared defaults for the throwaway local copy. They
are not production credentials.

---

## 7. What a healthy pull request looks like

For a schema change:

| Check | Result |
|---|---|
| Generate database types | Green. Pushes "chore: regenerate database types" the first time, then "already up to date" |
| Supabase migrations / validate | Green. `deploy` is skipped on a pull request |
| Extension CI / build | Green (type errors are listed but non-blocking for now) |

For an app-code-only change: only **Extension CI / build** runs, and it should be green.

---

## 8. GitHub setup and secrets

Secrets are set under **Settings → Secrets and variables → Actions**. Values are never shown
again after saving.

| Secret | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Scoped token limited to this project (read access to Project Settings, API Keys, API Key Secrets). Used by `supabase link`. **Expires**, so renew it before then. |
| `SUPABASE_DB_PASSWORD` | Database password, used by `supabase db push` |
| `SUPABASE_PROJECT_ID` | The project reference ID |

Other settings:

- **Settings → Actions → General → Workflow permissions** must allow **Read and write
  permissions**, so the types workflow can push its commit. The workflow also declares
  `permissions: contents: write`.
- The types workflow uses the built-in token, not a personal access token. That is why the
  empty "Re-run checks" commit is needed (section 4.7).

Maintenance:

- Access token owner: _fill in_
- Access token expiry date: _fill in_ (deploys fail after this date until it is renewed)
- Database password stored in: _fill in_

---

## 9. Versions

The Supabase CLI is **pinned to 3.2.0** so runs are repeatable. The version appears in:

- `.github/workflows/supabase-migrations.yml` (two `setup-cli` steps)
- `.github/workflows/generate-db-types.yml` (one `setup-cli` step)
- your local CLI (`npx.cmd supabase --version`)

Do not use `version: latest`, because it can hit GitHub's rate limit and can change output
unexpectedly. To upgrade, change all three workflow lines and your local CLI together, then
run `npm.cmd run db:types` and confirm `src/notes/database.types.ts` does not change.

---

## 10. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| **Generate database types** fails at "Check the generated file" | The CLI wrote something unexpected into the file. The log prints the first lines. The file must start (after a blank line) with `export type Json`. If the log shows an error message, fix the cause, usually a bad migration. |
| **Generate database types** fails with `403` or "Permission denied" on push | Workflow permissions are read-only. Set **Settings → Actions → General → Workflow permissions** to **Read and write**, then re-run the job. Needs repository admin rights. |
| **Generate database types** does not run | The pull request changes no file in `supabase/migrations/`, or it comes from a fork. |
| `git push` is rejected after the bot committed | Your branch is behind. Run `git pull`, then push again. |
| Checks look green but the newest commit was never checked | The bot's commit does not start other workflows. Push an empty commit: `git commit --allow-empty -m "Re-run checks"`, then `git push`. |
| **Supabase migrations / validate** does not run on a pull request | Its path filter did not match. It runs only when `supabase/migrations/**`, `src/notes/database.types.ts` or its own workflow file changes. |
| `deploy` shows "skipped" | Expected on pull requests. It runs after the merge. |
| "Check committed database types are up to date" fails after a merge | The committed `database.types.ts` does not match the migrated schema, usually from a hand edit or a merge that skipped the bot's commit. The log prints a diff. Fix with `npx.cmd supabase start`, `npm.cmd run db:types`, commit the result through a pull request. |
| `Confirmation required ... Re-run with --yes` | `db push` needs `--yes` in CI. It is already set in the workflow. |
| `failed to connect to postgres ... 127.0.0.1:54322` | The CLI is targeting the local database. Add `--remote`, or start the local stack with `supabase start`. |
| `docker: command not found` | Docker Desktop is not running, or the terminal was opened before Docker was installed. Start Docker Desktop and fully restart the terminal or VS Code. |
| `Failed to resolve latest Supabase CLI release: rate limit exceeded` | The workflow used `version: latest`. Keep the version pinned. Re-run the job if it is a one-off. |
| `relation "notes" already exists` in deploy | A migration was applied by hand and is not in the history. Fix with `npx.cmd supabase migration repair --status applied <version> --remote`. |
| `db push` complains about a migration older than the last applied one | Your migration's timestamp is older than one already on the remote. Rename your file to a newer timestamp (`git mv`), and keep the rest unchanged. Do not use `--include-all` without team approval. |
| `password authentication failed` in deploy | `SUPABASE_DB_PASSWORD` is wrong or has stray whitespace. Re-save the secret. |
| Permission error on `supabase link` with `missing_permissions` | The access token lacks a permission, or has expired. Create a new scoped token and update `SUPABASE_ACCESS_TOKEN`. |
| TypeScript errors in `notesService.ts` after the types change | The generated types and the mapping disagree, for example a nullable column. Fix the mapping or make the column `not null` in a new migration. Do not edit the generated file. |
| Extension CI fails: "Found an ES module import" | A shared runtime import caused Vite to emit a chunk for a content or automation script. Content scripts must stay standalone. Make the shared import type-only, or avoid sharing it. |
| `npm ci` fails: no `package-lock.json` or not in sync | Run `npm.cmd install` locally and commit the updated `package-lock.json`. |
| A build passes locally but fails in CI | CI runs Linux with case-sensitive file names. Check that import paths match the real file names exactly. |
| Deploy did not run after merge | Check that the run shows event `push` on `notes-integration`, and that the merge changed `supabase/migrations/**`, `src/notes/database.types.ts` or the workflow file. |

---

## 11. Do not

- Do not merge a pull request while a check is red (type-check is the only temporary exception).
- Do not merge "test" pull requests. A throwaway migration reaches the live database on merge.
- Do not edit or delete a merged migration, or hand-edit `database.types.ts`.
- Do not run `supabase db push --remote` or `migration repair --remote` against production
  unless the team agreed. They change the live project.
- Do not paste tokens, passwords or keys into issues, pull requests, chat or logs.

