import { type Locator, type Page } from '@playwright/test';

export type TrustLevel = 'familiar' | 'amigo_cercano' | 'conocido' | 'formal';
export type Gender = 'm' | 'f';

export interface NewContactData {
  name: string;
  phone: string;
  trustLevel: TrustLevel;
  gender: Gender;
}

export class ContactModal {
  readonly page: Page;
  readonly nameInput: Locator;
  readonly phoneInput: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameInput = page.getByTestId('contact-modal-name-input');
    this.phoneInput = page.getByTestId('contact-modal-phone-input');
    this.saveButton = page.getByTestId('contact-modal-save-button');
  }

  trustLevelButton(level: TrustLevel): Locator {
    return this.page.getByTestId(`contact-modal-trust-level-${level}-button`);
  }

  genderButton(gender: Gender): Locator {
    return this.page.getByTestId(`contact-modal-gender-${gender}-button`);
  }

  async createContact(data: NewContactData) {
    await this.nameInput.fill(data.name);
    await this.phoneInput.fill(data.phone);
    await this.trustLevelButton(data.trustLevel).click();
    await this.genderButton(data.gender).click();
    await this.saveButton.click();
  }
}
