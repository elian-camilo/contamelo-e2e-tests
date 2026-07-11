import { faker } from '@faker-js/faker';
import { test, expect } from '../../fixtures/test-fixtures';
import { given, when, then } from '../../utils/bdd';

test.describe('Contactos', () => {
  test('un usuario puede crear un contacto nuevo @smoke', async ({
    page,
    authenticatedPage,
    apiClient,
    contactModal,
    contactsListPage,
  }) => {
    const contactName = faker.person.fullName();
    const contactPhone = `+57 3${faker.string.numeric(9)}`;

    await given('el usuario está logueado y abre el formulario de nuevo contacto', async () => {
      await contactsListPage.goto();
      await contactsListPage.openAddContactForm();
    });

    await when('completa los datos del contacto y guarda', async () => {
      await contactModal.createContact({
        name: contactName,
        phone: contactPhone,
        trustLevel: 'familiar',
        gender: 'm',
      });
    });

    await then('ve la confirmación de contacto creado', async () => {
      await expect(page.getByText('Contacto creado')).toBeVisible();
    });

    await then('el contacto aparece en la lista', async () => {
      await expect(page.getByText(contactName)).toBeVisible();
    });

    await given('se limpia el contacto', async () => {
      // Listar contactos por API, buscar el que acabamos de crear y eliminarlo
      const contacts = await apiClient.listContacts();
      const createdContact = contacts.find(c => c.name === contactName);
      if (createdContact) {
        await apiClient.deleteContact(createdContact.id);
      }
    });
  });
});
