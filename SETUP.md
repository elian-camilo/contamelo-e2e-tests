# Configuración de E2E Tests — Contámelo

## Pre-requisitos

### 1. Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto:

```bash
ENVIRONMENT=LOCAL
TEST_USER_EMAIL=tu_email@example.com
TEST_USER_PASSWORD=tu_password
```

**Valores recomendados**:
- `ENVIRONMENT`: LOCAL (desarrollo local), DEV, STAGING, o PROD
- `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`: Credenciales de un usuario de prueba válido en el ambiente

Las URLs se configuran automáticamente en `utils/environment.ts`:
- LOCAL: http://localhost:5173 (app local) + http://localhost:8000/api/v1/ (API local)
- DEV: https://dev.contamelo.com.co + API correspondiente
- STAGING: https://staging.contamelo.com.co + API correspondiente
- PROD: https://app.contamelo.com.co + API correspondiente

### 2. Aplicación Corriendo
Para LOCAL: asegúrate de que la app esté corriendo en `http://localhost:5173`
```bash
cd ../contamelo-app  # o donde esté la app
npm run dev
```

Para DEV/STAGING/PROD: los ambientes están online, no requiere setup local.

## Ejecutar Tests

### Todos los tests smoke (todos los proyectos)
```bash
npm test
```

### Solo desktop (chromium + firefox)
```bash
npx playwright test tests/smoke/ --project=smoke-chromium --project=smoke-firefox
```

### Solo mobile (iPhone + Android)
```bash
npx playwright test tests/smoke/ --project=smoke-iphone --project=smoke-android
```

### Solo un navegador/dispositivo
```bash
npx playwright test tests/smoke/ --project=smoke-chromium
npx playwright test tests/smoke/ --project=smoke-iphone
npx playwright test tests/smoke/ --project=smoke-android
```

### Solo tests de un archivo
```bash
npx playwright test tests/smoke/auth.spec.ts
```

### Tests específicos (por nombre)
```bash
npx playwright test -g "puede iniciar sesión"
```

### Modo watch (rerun on file changes)
```bash
npx playwright test --watch
```

### Modo UI (visual test runner)
```bash
npx playwright test --ui
```

### Modo headed (abre navegador visible)
```bash
npx playwright test --headed
```

## Troubleshooting

### "All tests failing"

1. **Verifica que la app esté corriendo** (si usas LOCAL):
   ```bash
   curl http://localhost:5173
   ```

2. **Verifica credenciales en .env**:
   - Email y password deben ser válidos en el API
   - TEST_USER_EMAIL no puede ser undefined

3. **Verifica testids en la app**:
   - Los tests buscan elementos con `data-testid` (e.g., `login-email-input`)
   - Si la app cambió, actualiza los testids en los POMs (pages/*.ts)

4. **Revisa los logs**:
   ```bash
   npx playwright test --debug
   ```

## Estructura

```
tests/smoke/           # Tests humo (flujos críticos)
  ├── auth.spec.ts     # Login
  ├── contacts.spec.ts # Crear/listar contactos
  ├── debts.spec.ts    # Crear deudas
  └── payments.spec.ts # Abono parcial / pago completo
pages/                 # Page Object Models (POMs)
  ├── LoginPage.ts
  ├── DashboardPage.ts
  ├── ContactsListPage.ts
  ├── ContactDetailPage.ts
  ├── DebtDetailPage.ts
  ├── DebtModal.ts
  └── ContactModal.ts
api/                   # Cliente API para seed/cleanup
  └── ApiClient.ts
fixtures/              # Fixtures Playwright con fixtures personalizados
  └── test-fixtures.ts
utils/                 # Utilidades
  ├── bdd.ts           # Helpers given/when/then
  ├── environment.ts   # Configuración por ambiente
  └── date-format.ts   # Formateo de fechas
```

## BDD Pattern

Los tests usan patrón Gherkin con helpers `given/when/then`:

```typescript
await given('existe un contacto previo', () =>
  apiClient.createContact({...})
);

await when('el usuario hace X', async () => {
  await page.goto('/path');
  await page.click('[data-testid="button"]');
});

await then('ve el resultado esperado', async () => {
  await expect(page.getByText('Success')).toBeVisible();
});
```

## Proyectos Disponibles

Los tests están configurados para ejecutarse en 4 proyectos diferentes:

| Proyecto | Dispositivo | Viewport |
|----------|------------|----------|
| `smoke-chromium` | Desktop Chrome | 1280x720 |
| `smoke-firefox` | Desktop Firefox | 1280x720 |
| `smoke-iphone` | iPhone 12 | 390x844 |
| `smoke-android` | Pixel 5 | 393x851 |

**Nota**: Contámelo es principalmente una PWA mobile, por lo que los tests en `smoke-iphone` y `smoke-android` son críticos para validar la experiencia móvil.

## CI/CD

En CI (GitHub Actions, etc.), los tests corren con:
- `ENVIRONMENT=DEV` (o el ambiente de staging)
- 1 worker (sin paralelismo, para evitar rate limit en API)
- 2 reintentos por test fallido
- Todos los proyectos (desktop + mobile)
