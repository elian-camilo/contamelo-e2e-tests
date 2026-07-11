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

    await given('existe una deuda en ese contacto', async () => {
      const description = faker.lorem.words(3);
      const amount = 200_000;
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await contactsListPage.goto();
      await contactsListPage.openContact(contact.name);
      await contactDetailPage.openNewDebtForm();
      await debtModal.createDebt({
        direction: 'they_owe',
        amount,
        description,
        dueDate,
      });
    });

    const partialPayment = 80_000;

    await when(`el usuario hace un abono parcial de $${partialPayment}`, async () => {
      // Recargamos la página para estar seguro de tener el estado más fresco
      await contactsListPage.goto();
      await contactsListPage.openContact(contact.name);
      await debtDetailPage.addPartialPayment(partialPayment);
    });

    await then('ve un mensaje de confirmación del abono', async () => {
      // Validamos que hay algún feedback visual del pago
      // Buscamos cualquier elemento visible con "Abono registrado" o similar
      await expect(page.getByText(/abono|pago/i)).toBeVisible({ timeout: 5000 });
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

    await given('existe una deuda en ese contacto', async () => {
      const description = faker.lorem.words(3);
      const amount = 150_000;
      const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await contactsListPage.goto();
      await contactsListPage.openContact(contact.name);
      await contactDetailPage.openNewDebtForm();
      await debtModal.createDebt({
        direction: 'they_owe',
        amount,
        description,
        dueDate,
      });
    });

    await when('el usuario paga la deuda completamente', async () => {
      await contactsListPage.goto();
      await contactsListPage.openContact(contact.name);
      await debtDetailPage.payInFull();
    });

    await then('ve la pantalla de celebración', async () => {
      await expect(page.getByRole('heading', { name: '¡Le pagaron completico!' })).toBeVisible();
    });
  });
});
