import { expect, type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../utils/price';
import { BasePage } from './BasePage';

interface AddToCartResponse {
  success?: boolean;
  message?: string;
}

export type SearchFeedbackType = 'noResults' | 'warning';

export class SearchResultsPage extends BasePage {
  protected readonly path = '/search';

  readonly heading: Locator;
  readonly productTiles: Locator;
  readonly noResultsMessage: Locator;
  readonly warningMessage: Locator;
  readonly addedToCartNotification: Locator;
  private readonly feedbackMessages: Record<SearchFeedbackType, Locator>;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Search', level: 1, exact: true });
    this.productTiles = page.locator('.product-item');
    this.noResultsMessage = page.locator('strong.result');
    this.warningMessage = page.locator('strong.warning');
    this.addedToCartNotification = page.locator('#bar-notification.success');
    this.feedbackMessages = {
      noResults: this.noResultsMessage,
      warning: this.warningMessage,
    };
  }

  searchFeedback(type: SearchFeedbackType): Locator {
    return this.feedbackMessages[type];
  }

  /** Exact match: partial names collide (e.g. "Fiction" vs "Fiction EX"). */
  productTile(productName: string): Locator {
    return this.productTiles.filter({
      has: this.page.getByRole('link', { name: productName, exact: true }),
    });
  }

  async getTilePrice(productName: string): Promise<number> {
    const priceText = await this.productTile(productName).locator('.actual-price').innerText();
    return parsePrice(priceText);
  }

  /**
   * Adds the product via the AJAX "Add to cart" button and waits until the shop confirms it.
   * The shop answers HTTP 200 even when it refuses, so the JSON body is checked as well.
   */
  async addToCart(productName: string): Promise<void> {
    const responsePromise = this.page.waitForResponse(/\/addproducttocart\/catalog\//);
    await this.productTile(productName).getByRole('button', { name: 'Add to cart' }).click();
    const response = await responsePromise;

    if (!response.ok()) {
      throw new Error(`Adding "${productName}" to cart failed with HTTP ${response.status()}`);
    }
    const body = (await response.json()) as AddToCartResponse;
    if (body.success !== true) {
      throw new Error(
        `Adding "${productName}" to cart was rejected: ${body.message ?? 'no message returned'}`,
      );
    }

    // The notification bar hides itself after a few seconds, so wait for it right away.
    await this.addedToCartNotification.waitFor({ state: 'visible' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/search/);
    await expect(this.heading).toBeVisible();
  }
}
