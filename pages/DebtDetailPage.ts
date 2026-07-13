import { type Locator, type Page } from '@playwright/test';

export class DebtDetailPage {
  readonly page: Page;
  readonly openAbonoButton: Locator;
  readonly abonoInput: Locator;
  readonly abonoPresetAllButton: Locator;
  readonly abonoSubmitButton: Locator;
  readonly celebrationHeading: Locator;
  readonly celebrationCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.openAbonoButton = page.getByTestId('debt-detail-open-abono-button');
    this.abonoInput = page.getByTestId('debt-detail-abono-input');
    this.abonoPresetAllButton = page.getByTestId('debt-detail-abono-preset-all');
    this.abonoSubmitButton = page.getByTestId('debt-detail-abono-submit-button');
    this.celebrationHeading = page.getByRole('heading', { name: '¡Le pagaron completico!' });
    this.celebrationCloseButton = page.getByTestId('celebration-screen-close-button');
  }

  /** Abono parcial: monto específico ingresado a mano. */
  async addPartialPayment(amount: number) {
    await this.openAbonoButton.click();
    // El input probablemente espera el número sin formato
    await this.abonoInput.fill(String(amount));
    await this.abonoSubmitButton.click();
  }

  /** Pago completo: usa el preset "todo" y cierra la pantalla de celebración,
   * que siempre aparece cuando el saldo queda en $0. */
  async payInFull() {
    await this.openAbonoButton.click();
    await this.abonoPresetAllButton.click();
    await this.abonoSubmitButton.click();
    await this.celebrationCloseButton.click();
  }
}
