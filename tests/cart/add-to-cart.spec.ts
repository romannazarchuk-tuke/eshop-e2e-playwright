import { addToCartCases } from '@src/data/testData';
import { expect, test } from '@src/fixtures/test';

test.describe('Add to cart', () => {
  for (const { id, searchTerm, expected } of addToCartCases) {
    test(`adds a searched product to the cart: ${id} @smoke @cart`, async ({
      homePage,
      searchResultsPage,
      cartPage,
    }) => {
      await test.step('Open home page', async () => {
        await homePage.goto();
      });

      await test.step('Search for product', async () => {
        await homePage.header.searchFor(searchTerm);
        await searchResultsPage.expectLoaded();
        await expect(searchResultsPage.productTile(expected.productName)).toBeVisible();
      });

      const tilePrice = await test.step('Add product to cart from search results', async () => {
        const price = await searchResultsPage.getTilePrice(expected.productName);
        expect(price).toBe(expected.unitPrice);
        await searchResultsPage.addToCart(expected.productName);
        await expect(searchResultsPage.header.cartQuantity).toHaveText('(1)');
        return price;
      });

      await test.step('Open cart', async () => {
        await searchResultsPage.header.openCart();
        await cartPage.expectLoaded();
      });

      await test.step('Verify cart contents', async () => {
        await expect(cartPage.lineItem(expected.productName)).toBeVisible();
        await expect(cartPage.header.cartQuantity).toHaveText('(1)');

        // The cart is server-rendered, so once the row is visible a single read is stable.
        // Prices need numeric normalization, which a text assertion cannot do.
        const lineItems = await cartPage.getLineItems();
        expect(lineItems).toEqual([
          { name: expected.productName, unitPrice: tilePrice, quantity: 1 },
        ]);
      });
    });
  }
});
