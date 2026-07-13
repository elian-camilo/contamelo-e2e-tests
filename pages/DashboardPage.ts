import { type Locator, type Page } from '@playwright/test';
import type { DebtDirection } from './DebtModal';

export class DashboardPage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async goto() {
    await this.page.getByTestId('bottom-nav-home-link').click();
  }

  /** Identificación inequívoca: usa el UUID real devuelto por la API al crear la deuda,
   * porque un contacto puede tener varias deudas activas y el nombre no alcanza. */
  debtRow(debtId: string): Locator {
    return this.page.locator(`#debt-row-${debtId}`);
  }

  async openDebt(debtId: string) {
    await this.debtRow(debtId).getByTestId('debt-card').click();
  }

  async getDebtAmount(debtId: string): Promise<string> {
    const rawText = await this.debtRow(debtId).locator('p.font-extrabold').last().innerText();
    return rawText.replace(/\s/g, '');
  }

  /** Expone el locator del color semántico (selva = they_owe, coral = i_owe); el test decide la aserción. */
  debtColorLocator(debtId: string, direction: DebtDirection): Locator {
    const expectedClass = direction === 'they_owe' ? 'text-selva-osc' : 'text-coral-osc';
    return this.debtRow(debtId).locator(`.${expectedClass}`).first();
  }
}
