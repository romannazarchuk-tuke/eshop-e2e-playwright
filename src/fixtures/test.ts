import { expect as baseExpect, test as base } from '@playwright/test';
import type { HeaderComponent } from '../components/HeaderComponent';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { SearchResultsPage } from '../pages/SearchResultsPage';

interface PageFixtures {
  homePage: HomePage;
  searchResultsPage: SearchResultsPage;
  cartPage: CartPage;
}

export const test = base.extend<PageFixtures>({
  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },
  searchResultsPage: async ({ page }, use) => {
    await use(new SearchResultsPage(page));
  },
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

/** Returns the assertion result attached to errors thrown by built-in Playwright matchers. */
function matcherResultOf(error: unknown): { actual?: unknown } | undefined {
  if (error instanceof Error && 'matcherResult' in error) {
    return error.matcherResult as { actual?: unknown };
  }
  return undefined;
}

export const expect = baseExpect.extend({
  /**
   * Web-first: delegates to `toHaveText`, so it retries until the timeout like built-in matchers.
   * Tests assert a quantity and stay independent of how the header renders it.
   */
  async toHaveCartQuantity(
    header: HeaderComponent,
    expected: number,
    options?: { timeout?: number },
  ) {
    const assertionName = 'toHaveCartQuantity';
    const expectedText = header.cartQuantityText(expected);

    let matched: boolean;
    let actual: unknown;
    try {
      if (this.isNot) {
        await baseExpect(header.cartQuantity).not.toHaveText(expectedText, options);
      } else {
        await baseExpect(header.cartQuantity).toHaveText(expectedText, options);
      }
      matched = !this.isNot;
    } catch (error) {
      const matcherResult = matcherResultOf(error);
      if (!matcherResult) {
        throw error;
      }
      actual = matcherResult.actual;
      matched = this.isNot;
    }

    const message = () =>
      `${this.utils.matcherHint(assertionName, undefined, undefined, { isNot: this.isNot })}\n\n` +
      `Locator: ${header.cartQuantity.toString()}\n` +
      `Expected quantity: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(expected)}\n` +
      (actual === undefined ? '' : `Received text: ${this.utils.printReceived(actual)}`);

    return { pass: matched, message, name: assertionName, expected, actual };
  },
});
