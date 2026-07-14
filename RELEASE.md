# Release Notes

## [0.2.0] - 2026-07-14

### Test Tiers & CI Reporting

#### Features
- Suite restructured into 3 environment-specific tiers: `smoke` (`tests/smoke/`, develop, login+dashboard, Chromium-only), `regression` (`tests/regression/`, staging, full write-heavy suite, 4-browser matrix — the former single smoke suite moved here unchanged), `readonly` (`tests/readonly/`, main/prod, login-only, zero writes ever)
- `playwright.config.ts` projects rebuilt per tier: `smoke-chromium`, `regression-{chromium,firefox,iphone,android}`, `readonly-chromium`
- `e2e.yml` now accepts a `tier` field (via `repository_dispatch` payload or `workflow_dispatch` input) and maps it to the right `--project` flags
- Rich per-test email reporting via Resend: `scripts/build-email-html.js` renders a summary table (name/project/status/duration/error snippet) from Playwright's `json` reporter output, sent on every run (pass or fail) with a link to the full Actions run/artifact — never the full report as an attachment
- Removed `tests/example.spec.ts` (leftover npm-init boilerplate)

#### Infrastructure
- `contamelo-app` gained an Alembic migration gate (`migrations` job in `pr-checks.yml`): auto-applies on develop/staging, detect-only on main — closes the "is the DB schema in sync with what's about to deploy" gap upstream of this repo's E2E runs (see `contamelo-app/docs/CICD_ARQUITECTURA.md`)
- `trigger-e2e.yml` in `contamelo-app` now also resolves `develop` (previously only staging/main dispatched E2E at all)

#### Fixes
- Fixed Vercel Deployment Protection bypass being sent as a global browser-context header, which broke CORS preflight against the Railway API (different origin, header not in `Access-Control-Allow-Headers`). Now sent as a query param + cookie scoped to the frontend domain only, set on first navigation to login.

#### Validated
- Full pipeline validated end-to-end against real production conditions: a deliberately broken `readonly` test on `main` triggered a real failure, the Resend email arrived with the rich summary, the report artifact was downloaded, and `npx playwright show-report` surfaced the actual trace — confirming the whole diagnostic loop works, not just in isolation.

---

## [0.1.0] - 2026-07-13

### Initial Release

#### Features
- Complete E2E smoke test suite for Contámelo app
- BDD-style test scenarios with given/when/then helpers
- Page Object Model (POM) architecture for maintainable test code
- API-based test data management (seed and cleanup)
- Desktop and mobile device emulation (iPhone 12, Pixel 5)
- TypeScript strict mode for type safety

#### Test Coverage
- **Authentication**: Login flow validation
- **Contacts**: Create contact, verify in list, cleanup
- **Debts**: Create debt on existing contact, dashboard verification, cleanup with referential integrity
- **Payments**: Partial payment (abono) and full payment (pago completo) scenarios with soft delete cleanup

#### Infrastructure
- Playwright 1.61.1 with TypeScript support
- Faker.js for realistic test data generation
- Environment-based configuration (baseURL, API endpoints)
- Mobile-optimized timeouts (45-60s) for emulation
- Dotenv integration for local development

#### Fixes & Improvements
- Proper cleanup flow: delete debts before contacts (referential integrity)
- Contact filtering by name for reliable teardown
- Debt filtering by contact_id instead of created_at (parallelizable)
- Mobile session preservation using page.goto() instead of page.reload()
- DebtPublic interface matches actual API response structure with all required fields

#### Known Limitations
- Mobile tests run slower due to device emulation
- Rate limiting on DEV API (5 logins/minute) — configure delays accordingly
- Token refresh 401 on iPhone under investigation (backend behavior)

#### Next Steps
- Expand test coverage for edge cases and error scenarios
- Implement CI/CD pipeline for automated test runs
- Add visual regression testing
- Performance baseline and load testing

---

**Setup**: See [README.md](README.md) for installation and running tests.
