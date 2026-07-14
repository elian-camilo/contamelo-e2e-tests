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

Los tests están organizados en 3 tiers, cada uno con su propio set de proyectos Playwright (ver
"Proyectos Disponibles" más abajo). Elegí el proyecto según qué querés validar.

### Tier smoke (login + dashboard, Chromium)
```bash
npx playwright test --project=smoke-chromium
```

### Tier regression — todo (4 navegadores/dispositivos)
```bash
npx playwright test --project=regression-chromium --project=regression-firefox --project=regression-iphone --project=regression-android
```

### Tier regression — solo desktop (chromium + firefox)
```bash
npx playwright test --project=regression-chromium --project=regression-firefox
```

### Tier regression — solo mobile (iPhone + Android)
```bash
npx playwright test --project=regression-iphone --project=regression-android
```

### Tier readonly (solo login, seguro contra producción real)
```bash
npx playwright test --project=readonly-chromium
```

### Solo tests de un archivo
```bash
npx playwright test tests/regression/debts.spec.ts
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

Los tests están divididos en 3 tiers (uno por ambiente), cada uno en su propio directorio:

```
tests/smoke/            # Tier smoke — develop. Login + dashboard, nada más.
  └── auth.spec.ts
tests/regression/       # Tier regression — staging. Suite completa de escritura.
  ├── contacts.spec.ts  # Crear/listar contactos
  ├── debts.spec.ts     # Crear deudas
  └── payments.spec.ts  # Abono parcial / pago completo
tests/readonly/         # Tier readonly — main/prod. Solo login, cero escrituras.
  └── auth.spec.ts      # Duplicado deliberado de tests/smoke/auth.spec.ts (ver
                         # comentario ponytail: en el archivo) — mantiene el tier
                         # que corre contra prod real aislado de cualquier cambio
                         # futuro en el tier smoke.
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

Cada tier mapea a uno o más proyectos Playwright (`testDir` propio, definido en
`playwright.config.ts`):

| Proyecto | Tier | Dispositivo |
|----------|------|-------------|
| `smoke-chromium` | smoke | Desktop Chrome |
| `regression-chromium` | regression | Desktop Chrome |
| `regression-firefox` | regression | Desktop Firefox |
| `regression-iphone` | regression | iPhone 12 |
| `regression-android` | regression | Pixel 5 |
| `readonly-chromium` | readonly | Desktop Chrome |

**Nota**: Contámelo es principalmente una PWA mobile, por lo que los tests del tier `regression` en
`regression-iphone` y `regression-android` son críticos para validar la experiencia móvil — es el
único tier con matriz de 4 dispositivos, justamente porque staging es donde se valida la suite
completa antes de promover a producción.

## Vercel Deployment Protection (correr contra dev/staging localmente)

Los dominios `dev.contamelo.com.co` y `staging.contamelo.com.co` están detrás de **Vercel
Authentication** (Preview Deployment Protection) — sin el bypass, Playwright aterriza en la pantalla
de login de Vercel en vez de la app. Para correr tests contra `ENVIRONMENT=DEV` o `STAGING` en local,
agregá al `.env`:

```bash
VERCEL_PROTECTION_BYPASS=<secret del bypass de automatización, configurado en Vercel>
```

No hace falta para `LOCAL` (no pasa por Vercel) ni para `PROD` (el dominio de producción no tiene
este muro). El secret se manda como query param + cookie en la primera navegación al login — nunca
como header global, porque eso rompería el preflight CORS contra la API en Railway (detalle completo
en `contamelo-app/docs/CICD_ARQUITECTURA.md`).

## CI/CD

En CI (GitHub Actions), el workflow `e2e.yml` se dispara vía `repository_dispatch` desde
`contamelo-app` (evento `run-e2e-tests`) con el `environment` y el `tier` ya resueltos, o
manualmente vía `workflow_dispatch` para debug. Corre con:
- `ENVIRONMENT` y `TIER` recibidos en el payload (o elegidos a mano en el disparo manual)
- 1 worker (sin paralelismo, para evitar rate limit en API)
- 2 reintentos por test fallido
- Solo los proyectos del tier correspondiente (ver tabla arriba)
- Reporte HTML subido como artefacto + email de resumen por Resend al terminar (pass o fail)
