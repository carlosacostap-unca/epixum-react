## 1. Migration safety and schema tooling

- [x] 1.1 Add a versioned PocketBase schema snapshot command that exports collection fields, indexes and API rules without record contents or credentials.
- [x] 1.2 Add a preflight command that validates required collections, reports record counts and broken relations, and supports a read-only dry run.
- [x] 1.3 Add automated tests for snapshot redaction, preflight failure conditions and idempotent migration helpers.
- [x] 1.4 Document the required full PocketBase backup and explicit production approval checkpoint before any schema mutation.

## 2. Additive PocketBase schema

- [x] 2.1 Create the `courses` collection with fields, status values and administrator-only mutation rules.
- [x] 2.2 Create the `cohorts` collection with course relation, dates, lifecycle status and administrator/assigned-teacher rules.
- [x] 2.3 Create the `enrollments` collection with user/cohort relations, contextual role, status and unique `(cohort, user)` index.
- [x] 2.4 Add initially optional `cohort` relations to `sprints` and `inquiries` and verify relation targets.
- [x] 2.5 Add the private review-note storage and partial unique reservation index selected by the design.
- [x] 2.6 Run schema creation twice against an isolated PocketBase test instance and verify that the second run produces no changes.

## 3. Existing data migration

- [x] 3.1 Implement creation or reuse of the `React` course and deterministic `Cohorte inicial` metadata.
- [x] 3.2 Backfill active enrollments for existing students and teachers while leaving administrators globally authorized.
- [x] 3.3 Associate every existing sprint with the initial cohort without changing its identifier.
- [x] 3.4 Associate every existing inquiry with the cohort derived from its class or assignment, falling back safely to the initial cohort for context-free inquiries.
- [x] 3.5 Add post-migration checks for unchanged record counts, zero orphan sprints/inquiries, valid relation chains and no duplicate enrollments.
- [x] 3.6 Verify dry run, first run, interrupted/resumed run and repeated run against a restored test backup before scheduling production execution.

## 4. Authorization and final PocketBase rules

- [x] 4.1 Implement a server-side cohort context resolver returning user, cohort, enrollment and effective permissions.
- [x] 4.2 Add reusable ownership and relation checks so server actions derive cohort membership from persisted records instead of form input.
- [x] 4.3 Replace educational collection rules with cohort-aware member, teacher, administrator and owner predicates.
- [x] 4.4 Harden `reviews` so students can only reserve or release themselves and cannot read or mutate private notes, status, teacher, schedule or location.
- [x] 4.5 Make `sprints.cohort` and `inquiries.cohort` required only after backfill verification and apply final indexes.
- [x] 4.6 Build and pass an integration-test permission matrix covering every global role, cohort role, enrollment status, ownership and cross-cohort attempt.

## 5. Types, data access and caching

- [x] 5.1 Add TypeScript models for Course, Cohort, Enrollment and private review notes and extend Sprint and Inquiry with cohort relations.
- [x] 5.2 Add cohort-aware data functions for accessible cohorts, active cohort, course/cohort administration and participant administration.
- [x] 5.3 Require `cohortId` in sprint, student, review and inquiry list queries and derive it for detail queries.
- [x] 5.4 Update create/update/delete server actions to resolve cohort authorization before calling PocketBase.
- [x] 5.5 Segment caches and revalidation tags by cohort and add tests proving that identical queries in different cohorts cannot share results.
- [x] 5.6 Run TypeScript and lint checks for the updated data and action layers.

## 6. Cohort routing and selection

- [x] 6.1 Add canonical cohort routes for sprints, reviews, students and inquiries under `/cohorts/[cohortId]`.
- [x] 6.2 Add compatibility redirects from legacy list routes to the remembered or first accessible cohort.
- [x] 6.3 Add an `active_cohort` preference cookie that is validated on every use and never treated as authorization.
- [x] 6.4 Add the header cohort selector with single-cohort auto-selection, multi-cohort switching and no-cohort state.
- [x] 6.5 Ensure switching cohort preserves the equivalent destination when valid and clears rendered state from the previous cohort.
- [x] 6.6 Add navigation tests for one cohort, multiple cohorts, inactive enrollment, archived cohort, stale cookie and multiple browser tabs.

## 7. Course, cohort and participant administration UI

- [x] 7.1 Add administrator screens and server actions to create, edit and archive reusable course definitions.
- [x] 7.2 Add cohort list, creation, editing, activation, archival and read-only archived views for authorized users.
- [x] 7.3 Add cohort participant management for adding, reactivating and deactivating student enrollments.
- [x] 7.4 Add administrator-only management of teacher enrollments and enforce global/cohort role compatibility in the form and server action.
- [x] 7.5 Keep `/admin/users` focused on global identity and roles and adapt the student directory to the selected cohort.
- [x] 7.6 Verify course/cohort lifecycle and participant-management flows manually for administrator, assigned teacher, unrelated teacher and student.

## 8. Scope existing academic capabilities

- [x] 8.1 Update sprint, class, assignment and link views and forms to enforce and preserve the active cohort context.
- [x] 8.2 Update delivery creation, editing, listing and search to require membership in the assignment cohort while retaining historical records for inactive students.
- [x] 8.3 Update review lists, batch slot creation, booking, cancellation, detail and evaluation to enforce the sprint cohort and atomic booking constraint.
- [x] 8.4 Move private review notes to protected storage and verify students receive neither the field nor its value from PocketBase responses.
- [x] 8.5 Update inquiry creation, listing, search, detail, responses and moderation to require and filter by cohort, including response-content search.
- [x] 8.6 Add regression tests for every modified capability plus negative tests using direct identifiers from another cohort.

## 9. End-to-end verification and rollout

- [x] 9.1 Seed an isolated test environment with two cohorts, overlapping users and distinct sprints, deliveries, reviews and inquiries.
- [x] 9.2 Add end-to-end tests for cohort switching and the complete student, teacher and administrator journeys across both cohorts.
- [x] 9.3 Run lint, strict TypeScript checking, production build, OpenSpec validation and all integration/end-to-end suites.
- [x] 9.4 Execute the migration dry run against production metadata, review its report and obtain explicit approval before the write phase.
- [x] 9.5 Take and verify a recoverable production backup, execute the idempotent migration, and record before/after counts and rule hashes.
- [x] 9.6 Monitor authorization failures, cross-cohort leakage checks, reservation conflicts and record counts before creating the second live cohort.
