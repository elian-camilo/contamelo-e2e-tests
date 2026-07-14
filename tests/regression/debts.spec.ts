import { faker } from '@faker-js/faker';
import { test, expect } from '../../fixtures/test-fixtures';
import { given, when, then } from '../../utils/bdd';

test.describe('Deudas', () => {
  test('un usuario puede registrar una deuda a un contacto existente @regression', async ({
    page,
    authenticatedPage,
    apiClient,
    dashboardPage,
    debtModal,
    contactsListPage,
    contactDetailPage,
  }) => {
    const contact = await given('existe un contacto previo', () =>
      apiClient.createContact({
        name: faker.person.fullName(),
        phone: `+57 3${faker.string.numeric(9)}`,
        trustLevel: 'amigo_cercano',
        gender: 'f',
      })
    );

    const description = faker.lorem.words(3);
    const amount = faker.number.int({ min: 10_000, max: 200_000 });
    const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await when('el usuario abre el contacto y registra una nueva deuda', async () => {
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
    });

    await then('ve la confirmación de deuda registrada', async () => {
      await expect(page.getByText('Deuda registrada')).toBeVisible();
    });

    await then('la deuda aparece en el dashboard', async () => {
      await dashboardPage.goto();
      await expect(page.getByText(description)).toBeVisible();
    });

    await given('se limpia la deuda y el contacto', async () => {
      // Listar todas las deudas del usuario por API
      const debts = await apiClient.listDebts();
      // Filtrar deudas del contacto creado (por contact_id)
      const contactDebts = debts.filter(d => d.contact_id === contact.id);
      // Eliminar todas las deudas del contacto
      for (const debt of contactDebts) {
        await apiClient.deleteDebt(debt.id);
      }
      // Luego eliminar el contacto (después de eliminar sus deudas)
      await apiClient.deleteContact(contact.id);
    });
  });
});
