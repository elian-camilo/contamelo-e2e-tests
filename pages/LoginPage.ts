import { type Locator, type Page } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByTestId('login-email-input');
    this.passwordInput = page.getByTestId('login-password-input');
    this.submitButton = page.getByTestId('login-submit-button');
  }

  async goto() {
    await this.page.goto('/login');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /** El onboarding siempre aparece en sesión limpia (se guarda en localStorage). */
  async skipOnboardingIfPresent() {
    const skipButton = this.page.getByTestId('onboarding-skip-button');
    try {
      await skipButton.click();
    } catch {
      // Si no aparece el onboarding, continúa
    }
  }
}
