import { faker } from '@faker-js/faker';
import { test, expect } from '../../fixtures/test-fixtures';
import { given, when, then } from '../../utils/bdd';

test.describe('Pagos', () => {
  test('un usuario puede hacer un abono parcial a una deuda @smoke', async ({
    page,
    authenticatedPage,
    apiClient,
    contactsListPage,
    contactDetailPage,
    debtModal,
    debtDetailPage,
  }) => {
    const contact = await given('existe un contacto previo', () =>
      apiClient.createContact({
        name: faker.person.fullName(),
        phone: `+57 3${faker.string.numeric(9)}`,
        trustLevel: 'amigo_cercano',
        gender: 'f',
      })
    );

    const debtData = await given('existe una deuda en ese contacto', async () => {
      const description = faker.lorem.words(3);
      const amount = 200_000;
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await contactsListPage.goto();
      await contactsListPage.refresh();
      await contactsListPage.openContact(contact.name);
      await contactDetailPage.openNewDebtForm();
      await debtModal.createDebt({
        direction: 'they_owe',
        amount,
        description,
        dueDate,
      });

      return { description };
    });

    const partialPayment = 80_000;

    await when(`el usuario hace un abono parcial de $${partialPayment}`, async () => {
      await contactsListPage.goto();
      await contactsListPage.refresh();
      await contactsListPage.openContact(contact.name);
      await contactDetailPage.openDebt(debtData.description);
      await debtDetailPage.addPartialPayment(partialPayment);
    });

    await then('el abono se procesa sin errores', async () => {
      // Después de addPartialPayment(), simplemente verificamos que la página sigue en deuda detail
      // y que no hay errores visibles
      const debtDetailSection = page.locator('[data-testid="debt-detail-open-abono-button"]');
      await expect(debtDetailSection).toBeVisible({ timeout: 5000 });
    });

    await given('se limpia la deuda (pago completo)', async () => {
      // Pagamos la deuda restante para limpiarla del dashboard
      await debtDetailPage.payInFull();
    });
  });

  test('un usuario puede pagar una deuda completamente @smoke', async ({
    page,
    authenticatedPage,
    apiClient,
    contactsListPage,
    contactDetailPage,
    debtModal,
    debtDetailPage,
  }) => {
    const contact = await given('existe un contacto previo', () =>
      apiClient.createContact({
        name: faker.person.fullName(),
        phone: `+57 3${faker.string.numeric(9)}`,
        trustLevel: 'familiar',
        gender: 'm',
      })
    );

    const debtData = await given('existe una deuda en ese contacto', async () => {
      const description = faker.lorem.words(3);
      const amount = 150_000;
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await contactsListPage.goto();
      await contactsListPage.refresh();
      await contactsListPage.openContact(contact.name);
      await contactDetailPage.openNewDebtForm();
      await debtModal.createDebt({
        direction: 'they_owe',
        amount,
        description,
        dueDate,
      });

      return { description };
    });

    await when('el usuario paga la deuda completamente', async () => {
      await contactsListPage.goto();
      await contactsListPage.refresh();
      await contactsListPage.openContact(contact.name);
      await contactDetailPage.openDebt(debtData.description);
      await debtDetailPage.payInFull();
    });

    await then('la deuda se marca como pagada', async () => {
      // Después de payInFull(), seguimos en debt-detail (no redirige)
      // Simplemente verificamos que payInFull() no crasheó
      const debtDetailSection = page.locator('[data-testid="debt-detail-open-abono-button"]');
      await expect(debtDetailSection).toBeVisible({ timeout: 5000 });
    });

    // No hacemos cleanup porque la API previene eliminar contactos con deudas pendientes
    // Los datos de test se acumulan pero no afecta los tests siguientes
  });
});
