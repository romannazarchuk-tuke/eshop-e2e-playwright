import type { Locator, Page } from '@playwright/test';

export class HeaderComponent {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly cartLink: Locator;
  readonly cartQuantity: Locator;

  constructor(private readonly page: Page) {
    // The search input has no label or placeholder, so it is scoped through its container.
    const searchBox = page.locator('.search-box');
    this.searchInput = searchBox.getByRole('textbox');
    this.searchButton = searchBox.getByRole('button', { name: 'Search' });

    // The footer contains a second "Shopping cart" link.
    const headerLinks = page.locator('.header-links');
    this.cartLink = headerLinks.getByRole('link', { name: /^Shopping cart/ });
    this.cartQuantity = this.cartLink.locator('.cart-qty');
  }

  async searchFor(term: string): Promise<void> {
    await this.searchInput.fill(term);
    await this.searchButton.click();
    await this.page.waitForURL(/\/search\?q=/);
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
    await this.page.waitForURL(/\/cart/);
  }
}
