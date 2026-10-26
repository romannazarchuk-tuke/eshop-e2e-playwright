import type { Locator } from '@playwright/test';
import { negativeSearchCases, type NegativeSearchCase } from '@src/data/testData';
import { expect, test } from '@src/fixtures/test';
import type { SearchResultsPage } from '@src/pages/SearchResultsPage';

type MessageType = NegativeSearchCase['expected']['messageType'];

const messageLocators: Record<MessageType, (page: SearchResultsPage) => Locator> = {
  noResults: (page) => page.noResultsMessage,
  warning: (page) => page.warningMessage,
};

test.describe('Negative search', () => {
  for (const { id, searchTerm, expected } of negativeSearchCases) {
    test(`shows search feedback and keeps the cart empty: ${id} @negative @search`, async ({
      homePage,
      searchResultsPage,
      cartPage,
    }) => {
      await test.step('Open home page', async () => {
        await homePage.goto();
      });

      await test.step('Search for term', async () => {
        await homePage.header.searchFor(searchTerm);
        await searchResultsPage.expectLoaded();
      });

      await test.step('Verify search feedback', async () => {
        const message = messageLocators[expected.messageType](searchResultsPage);
        await expect(message).toHaveText(expected.message);
        await expect(searchResultsPage.productTiles).toHaveCount(0);
      });

      await test.step('Verify cart is empty', async () => {
        await expect(searchResultsPage.header.cartQuantity).toHaveText('(0)');
        await searchResultsPage.header.openCart();
        await cartPage.expectLoaded();
        await expect(cartPage.emptyCartMessage).toBeVisible();
      });
    });
  }
});
