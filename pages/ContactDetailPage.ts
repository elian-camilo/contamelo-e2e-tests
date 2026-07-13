import { type Locator, type Page } from '@playwright/test';

export class ContactDetailPage {
  readonly page: Page;
  readonly newDebtButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newDebtButton = page.getByTestId('contact-detail-new-debt-button');
  }

  async openNewDebtForm() {
    await this.newDebtButton.click();
  }

  /** Abre una deuda existente buscando por descripción dentro de los debt-row. */
  async openDebt(debtDescription: string) {
    // Busca la fila de deuda que contenga la descripción
    const debtRow = this.page.getByTestId('debt-row')
      .filter({ hasText: debtDescription })
      .first();
    await debtRow.click();
  }
}
