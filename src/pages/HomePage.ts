import { expect, type Locator, type Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class HomePage extends BasePage {
  protected readonly path = '/';

  readonly welcomeHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.welcomeHeading = page.getByRole('heading', { name: 'Welcome to our store' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.welcomeHeading).toBeVisible();
    await expect(this.header.searchInput).toBeVisible();
  }
}
