import { expect, type Locator, type Page } from '@playwright/test';
import { parsePrice } from '../utils/price';
import { BasePage } from './BasePage';

export interface CartLineItem {
  name: string;
  unitPrice: number;
  quantity: number;
}

export class CartPage extends BasePage {
  protected readonly path = '/cart';

  readonly heading: Locator;
  readonly lineItemRows: Locator;
  readonly emptyCartMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.heading = page.getByRole('heading', { name: 'Shopping cart', level: 1 });
    // Only product rows contain a product link; this skips the table header row.
    this.lineItemRows = page
      .locator('table.cart')
      .getByRole('row')
      .filter({ has: page.locator('a.product-name') });
    this.emptyCartMessage = page.getByText('Your Shopping Cart is empty!');
  }

  lineItem(productName: string): Locator {
    return this.lineItemRows.filter({
      has: this.page.getByRole('link', { name: productName, exact: true }),
    });
  }

  async getLineItems(): Promise<CartLineItem[]> {
    const rows = await this.lineItemRows.all();
    return Promise.all(
      rows.map(async (row) => ({
        name: (await row.locator('a.product-name').innerText()).trim(),
        unitPrice: parsePrice(await row.locator('.product-unit-price').innerText()),
        quantity: Number(await row.locator('.qty-input').inputValue()),
      })),
    );
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/cart/);
    await expect(this.heading).toBeVisible();
  }
}
