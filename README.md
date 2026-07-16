# contamelo-e2e-tests

> Repo de portfolio SDET — muestra el diseño de una suite de pruebas E2E de producción real:
> testing escalado por riesgo según ambiente (no la misma suite en todos lados), orquestación
> vía CI nativo de GitHub sin polling, y un ciclo de reporte que va del fallo al trace real sin
> pasos manuales. El código y las decisiones de diseño son reales, tal como corren hoy contra
> [Contámelo](https://contamelo.com.co).

Suite E2E de [Contámelo](https://github.com/elian-camilo/contamelo-app) — Playwright + TypeScript,
Page Object Model. Repo separado a propósito: corre contra ambientes reales desplegados (dev,
staging, prod), no contra el código en `contamelo-app`, así que su ciclo de vida y sus secrets
(credenciales de usuario de prueba, API keys de Resend) no tienen por qué vivir en el mismo repo.

## Cómo se conecta con `contamelo-app`

No hay un cron ni un polling — el disparo es un puente entre repos vía la API de GitHub:

1. `contamelo-app` despliega a `develop`/`staging`/`main`. Vercel y Railway despliegan en paralelo,
   sin coordinarse entre sí, y cada uno emite su propio evento `deployment_status`.
2. `trigger-e2e.yml` (en `contamelo-app`) reacciona a ese evento, resuelve la rama real del commit
   (vía `branches-where-head`, no confía en el campo `environment` que manda cada plataforma — no es
   útil) y espera a que **ambas** plataformas reporten éxito para el mismo commit antes de actuar.
3. Cuando las dos están listas, dispara un `repository_dispatch` (evento `run-e2e-tests`) hacia este
   repo, con el payload `{"environment": "dev"|"staging"|"prod", "tier": "smoke"|"regression"|"readonly"}`.
4. `e2e.yml` (acá) recibe el evento, corre el tier correspondiente, y manda un email de resultado.

Detalle completo del diseño (por qué esperar a ambas plataformas, por qué resolver la rama vía Git y
no vía el payload de cada proveedor) en `contamelo-app/docs/CICD_ARQUITECTURA.md`.

## Los 3 tiers

Cada ambiente corre un subconjunto distinto de la suite, proporcional a qué tan seguro es escribir
ahí:

| Tier | Ambiente | Directorio | Proyectos Playwright | Qué corre |
|---|---|---|---|---|
| `smoke` | `develop` | `tests/smoke/` | `smoke-chromium` | Login + llegar al dashboard. Solo Chromium. |
| `regression` | `staging` | `tests/regression/` | `regression-{chromium,firefox,iphone,android}` | Suite completa de escritura: login, contactos, deudas, pagos. 4 navegadores/dispositivos. |
| `readonly` | `main` / prod | `tests/readonly/` | `readonly-chromium` | Solo login — **nunca escribe nada en producción**. |

`smoke` y `readonly` corren el mismo flujo (login), pero son specs independientes deliberadamente
duplicadas (ver el comentario `ponytail:` en `tests/readonly/auth.spec.ts`): compartir un archivo
entre tiers arriesgaría que un cambio futuro en el spec de `smoke` cuele una escritura en el tier que
corre contra producción real.

## Correr tests localmente

Guía rápida — para configuración detallada, troubleshooting y todos los comandos (modo UI, headed,
por nombre de test, etc.) ver [SETUP.md](SETUP.md).

```bash
# 1. Crear .env con credenciales de test (ver SETUP.md para el detalle completo)
cp .env.example .env

# 2. Instalar dependencias y browsers
npm install
npx playwright install

# 3. Correr un tier específico
npx playwright test --project=smoke-chromium
npx playwright test --project=regression-chromium --project=regression-firefox
npx playwright test --project=readonly-chromium
```

Para correr contra `dev`/`staging` (no `LOCAL` ni `PROD`) localmente hace falta además
`VERCEL_PROTECTION_BYPASS` — esos dominios están detrás de Vercel Deployment Protection. Detalle en
SETUP.md.

## Arquitectura

- **Fixtures** (`fixtures/test-fixtures.ts`): extienden el `test` base de Playwright con `loginPage`,
  `apiClient` y páginas ya instanciadas — cada spec pide solo los fixtures que necesita (por eso el
  tier `readonly` puede garantizarse "cero escrituras": sus specs nunca importan `apiClient` ni
  ningún fixture de escritura).
- **Page Object Model** (`pages/`): una clase por pantalla (`LoginPage`, `DashboardPage`,
  `ContactsListPage`, `DebtDetailPage`, etc.) encapsulando selectores y acciones — los specs no tocan
  `data-testid` directamente.
- **ApiClient** (`api/ApiClient.ts`): cliente HTTP contra la API real de Contámelo, usado en
  `regression` para *seed* de datos de prueba y limpieza (cleanup) posterior al test — nunca en
  `smoke`/`readonly`.
- **Reporte por email**: `scripts/build-email-html.js` arma un resumen HTML por test (nombre,
  proyecto, status, duración, snippet de error) a partir del reporter `json` de Playwright, y
  `e2e.yml` lo manda vía Resend al terminar cada corrida — pass o fail, con `continue-on-error` para
  que un fallo de Resend no enmascare el resultado real de los tests.
