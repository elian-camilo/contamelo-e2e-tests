import { test, expect } from '../../fixtures/test-fixtures';
import { given, when, then } from '../../utils/bdd';

test.describe('Autenticación', () => {
  test('un usuario puede iniciar sesión con email y contraseña @smoke', async ({ page, loginPage }) => {
    await given('el usuario está en la pantalla de login', async () => {
      await loginPage.goto();
    });

    await when('ingresa credenciales válidas y confirma', async () => {
      await loginPage.login(process.env.TEST_USER_EMAIL ?? '', process.env.TEST_USER_PASSWORD ?? '');
      await loginPage.skipOnboardingIfPresent();
    });

    await then('llega al dashboard', async () => {
      await expect(page.getByText('¿Cómo va la platica?')).toBeVisible();
    });
  });
});
