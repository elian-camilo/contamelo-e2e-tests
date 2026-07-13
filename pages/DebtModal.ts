import { type Locator, type Page } from '@playwright/test';
import { ContactModal } from './ContactModal';
import { formatDueDateButtonLabel } from '../utils/date-format';

export type DebtDirection = 'they_owe' | 'i_owe';

export interface NewDebtData {
  direction: DebtDirection;
  amount: number;
  description: string;
  dueDate: Date;
}

export class DebtModal {
  readonly page: Page;
  readonly contactNameInput: Locator;
  readonly openContactPickerButton: Locator;
  readonly createContactButton: Locator;
  readonly amountInput: Locator;
  readonly descriptionInput: Locator;
  readonly dueDateTriggerButton: Locator;
  readonly saveButton: Locator;
  readonly contactModal: ContactModal;

  constructor(page: Page) {
    this.page = page;
    this.contactNameInput = page.getByTestId('debt-modal-contact-name-input');
    this.openContactPickerButton = page.getByTestId('debt-modal-open-contact-picker-button');
    this.createContactButton = page.getByTestId('debt-modal-create-contact-button');
    this.amountInput = page.getByTestId('debt-modal-amount-input');
    this.descriptionInput = page.getByTestId('debt-modal-description-input');
    this.dueDateTriggerButton = page.getByTestId('debt-modal-due-date-trigger-button');
    this.saveButton = page.getByTestId('debt-modal-save-button');
    this.contactModal = new ContactModal(page);
  }

  directionButton(direction: DebtDirection): Locator {
    return this.page.getByTestId(`debt-modal-direction-${direction}-button`);
  }

  async selectDirection(direction: DebtDirection) {
    // 'they_owe' (Me deben) está seleccionado por defecto, así que solo clickea si es diferente
    if (direction !== 'they_owe') {
      await this.directionButton(direction).click();
    }
  }

  async fillAmountAndDescription(amount: number, description: string) {
    await this.amountInput.fill(String(amount));
    await this.descriptionInput.fill(description);
  }

  async selectDueDate(date: Date) {
    await this.dueDateTriggerButton.click();
    const label = formatDueDateButtonLabel(date);
    await this.page.getByRole('button', { name: label }).click();
  }

  async save() {
    await this.saveButton.click();
  }

  /** Flujo completo asumiendo que el contacto ya fue elegido/creado previamente. */
  async createDebt(data: NewDebtData) {
    await this.selectDirection(data.direction);
    await this.fillAmountAndDescription(data.amount, data.description);
    await this.selectDueDate(data.dueDate);
    await this.save();
  }
}
