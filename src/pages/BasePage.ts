import type { Page } from '@playwright/test';
import { HeaderComponent } from '../components/HeaderComponent';

export abstract class BasePage {
  readonly header: HeaderComponent;

  /** Path relative to `baseURL`. */
  protected abstract readonly path: string;

  constructor(protected readonly page: Page) {
    this.header = new HeaderComponent(page);
  }

  async goto(): Promise<void> {
    await this.page.goto(this.path);
    await this.expectLoaded();
  }

  abstract expectLoaded(): Promise<void>;
}
