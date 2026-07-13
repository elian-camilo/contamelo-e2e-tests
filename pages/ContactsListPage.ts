import { type Locator, type Page } from '@playwright/test';

export class ContactsListPage {
  readonly page: Page;
  readonly addContactButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addContactButton = page.getByTestId('contact-list-add-button');
  }

  async goto() {
    await this.page.getByTestId('bottom-nav-contacts-link').click();
  }

  async refresh() {
    // page.reload() pierde la sesión en mobile (iPhone).
    // Usamos page.goto() con la URL actual para recargar sin perder autenticación
    await this.page.goto(this.page.url());
  }

  async openAddContactForm() {
    await this.addContactButton.click();
  }

  /** Resuelto por texto porque la lista no expone data-testid por contacto;
   * es aceptable acá porque los nombres de test son únicos (Faker) por corrida. */
  contactListItem(contactName: string): Locator {
    return this.page.getByText(contactName, { exact: false }).first();
  }

  async openContact(contactName: string) {
    const contact = this.contactListItem(contactName);
    // En mobile (iPhone), tarda más en renderizar la lista
    await contact.waitFor({ state: 'visible', timeout: 15000 });
    await contact.click();
  }
}
