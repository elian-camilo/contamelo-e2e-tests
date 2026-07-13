# Release Notes

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
