# Cohort migration runbook

The cohort migration changes the PocketBase schema and existing records. Never
run its write phase against production without completing every checkpoint here.

## 1. Read-only inventory

```powershell
npm run pb:cohorts:snapshot
npm run pb:cohorts:preflight
```

The snapshot contains collection schemas, indexes and API rules only. It must not
contain records, authentication tokens or passwords. Review and commit the
snapshot before changing the schema.

## 2. Recoverable backup (mandatory)

Create a full PocketBase backup from the PocketBase/PocketHost administration
interface. Download it outside this repository and verify that it can be listed
and restored in an isolated instance. Recording a schema snapshot is not a data
backup.

Record:

- backup filename and creation time;
- PocketBase version;
- preflight counts;
- schema snapshot checksum;
- person who verified restoration.

## 3. Isolated rehearsal (mandatory)

Restore the production backup into a separate PocketBase test instance. Point
`NEXT_PUBLIC_POCKETBASE_URL`, `POCKETBASE_ADMIN_EMAIL`, and
`POCKETBASE_ADMIN_PASSWORD` to that instance and execute the migration twice.
The first run must pass all post-migration checks; the second must report no
changes. Run the authorization matrix before proceeding.

## 4. Production approval checkpoint

The production write phase requires explicit user approval after presenting:

- the read-only dry-run report;
- successful isolated restore and rehearsal evidence;
- before/after expected record counts;
- the rollback owner and tested backup location.

Do not infer approval from a request to implement application code. Approval must
specifically authorize the production PocketBase migration.

## 5. Rollback

If post-migration integrity or privacy checks fail, stop application traffic that
can write affected collections and restore the verified full backup. Do not
attempt rollback by bulk-deleting migrated records.

## 6. Final authorization phase

Run this phase only after the data report confirms zero orphan sprints and
inquiries and after the permission matrix passes against the restored test
backup.

1. Preview final rules, required relations, indexes and private-note movement:
   `npm run pb:cohorts:finalize`
2. Apply only with the same explicit approval environment variable used by the
   migration: `npm run pb:cohorts:finalize -- --apply`
3. Repeat the apply command. The report must contain `changed: false`.
4. Run `npm run pb:cohorts:test-permissions` against the isolated target.

The final phase refuses to continue while any sprint or inquiry has no cohort.
It copies legacy private review notes before removing the exposed field and
then applies cohort-aware rules as PocketBase's final authorization boundary.
