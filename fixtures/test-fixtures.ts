import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { DebtModal } from '../pages/DebtModal';
import { DebtDetailPage } from '../pages/DebtDetailPage';
import { ContactModal } from '../pages/ContactModal';
import { ContactsListPage } from '../pages/ContactsListPage';
import { ContactDetailPage } from '../pages/ContactDetailPage';
import { ApiClient } from '../api/ApiClient';

const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL ?? '';
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD ?? '';

interface Fixtures {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  debtModal: DebtModal;
  debtDetailPage: DebtDetailPage;
  contactModal: ContactModal;
  contactsListPage: ContactsListPage;
  contactDetailPage: ContactDetailPage;
  apiClient: ApiClient;
  /** Deja al usuario logueado en el dashboard antes de que el test empiece. */
  authenticatedPage: void;
}

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  debtModal: async ({ page }, use) => {
    await use(new DebtModal(page));
  },
  debtDetailPage: async ({ page }, use) => {
    await use(new DebtDetailPage(page));
  },
  contactModal: async ({ page }, use) => {
    await use(new ContactModal(page));
  },
  contactsListPage: async ({ page }, use) => {
    await use(new ContactsListPage(page));
  },
  contactDetailPage: async ({ page }, use) => {
    await use(new ContactDetailPage(page));
  },

  apiClient: async ({}, use) => {
    const client = await ApiClient.login(TEST_USER_EMAIL, TEST_USER_PASSWORD);
    await use(client);
    await client.dispose();
  },

  authenticatedPage: [
    async ({ loginPage }, use) => {
      await loginPage.goto();
      await loginPage.login(TEST_USER_EMAIL, TEST_USER_PASSWORD);
      await loginPage.skipOnboardingIfPresent();
      await use();
    },
    { auto: false, timeout: 60000 },
  ],
});

export { expect } from '@playwright/test';
