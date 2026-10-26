# E-shop E2E tests (Playwright + TypeScript)

End-to-end UI tests for the [nopCommerce demo web shop](https://demowebshop.tricentis.com),
built as a small but scalable test automation framework: Page Object Model with a shared header
component, custom fixtures, data-driven tests backed by a validated JSON file, and a GitHub Actions
pipeline that publishes the Playwright HTML report to GitHub Pages.

[![E2E tests](https://github.com/romannazarchuk-tuke/eshop-e2e-playwright/actions/workflows/e2e.yml/badge.svg)](https://github.com/romannazarchuk-tuke/eshop-e2e-playwright/actions/workflows/e2e.yml)

Latest test report: https://romannazarchuk-tuke.github.io/eshop-e2e-playwright/

## Tech stack

| Tool                                   | Purpose                                            |
| -------------------------------------- | -------------------------------------------------- |
| Node.js 24 LTS                         | Runtime                                            |
| @playwright/test                       | Test runner, browser automation, HTML report       |
| TypeScript (strict)                    | Type safety for page objects, fixtures and data    |
| zod                                    | Runtime validation of the JSON test data           |
| ESLint (typescript-eslint, playwright) | Static checks, including Playwright best practices |
| Prettier                               | Formatting                                         |
| GitHub Actions + GitHub Pages          | CI pipeline and hosted report                      |

## Project structure

```
.
├── .github/workflows/e2e.yml       # CI: checks, tests, report artifacts, Pages deployment
├── src/
│   ├── components/
│   │   └── HeaderComponent.ts      # Header search and cart link, shared by every page
│   ├── data/
│   │   ├── products.json           # Test cases (search terms and expected results)
│   │   └── testData.ts             # zod schemas + typed, validated access to products.json
│   ├── fixtures/
│   │   └── test.ts                 # test.extend: injects page objects into tests
│   ├── pages/
│   │   ├── BasePage.ts             # Common navigation (goto + expectLoaded) and header
│   │   ├── HomePage.ts
│   │   ├── SearchResultsPage.ts    # Product tiles, AJAX add to cart, search messages
│   │   └── CartPage.ts             # Line items as locators and as typed data
│   └── utils/
│       └── price.ts                # Parses prices rendered without a currency symbol
├── tests/
│   ├── cart/add-to-cart.spec.ts    # Positive flow: search, add to cart, verify cart
│   └── search/search-negative.spec.ts  # Negative flow: search feedback, cart stays empty
├── playwright.config.ts            # Projects, baseURL, CI-only retries/workers, reporters
├── eslint.config.mjs
└── tsconfig.json                   # Strict mode, `@src/*` path alias
```

## Getting started

Prerequisites: Node.js >= 24 and npm.

```bash
npm ci
npx playwright install chromium firefox
```

On a fresh Linux machine use `npx playwright install --with-deps chromium firefox` to also
install system dependencies.

| Task                      | Command                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Run all tests (headless)  | `npm test`                                                                                           |
| Run headed                | `npm run test:headed`                                                                                |
| Run in UI mode            | `npm run test:ui`                                                                                    |
| Run by tag                | `npm run test:smoke` or `npx playwright test --grep "@negative"` (quotes are required in PowerShell) |
| Run a single browser      | `npx playwright test --project=firefox`                                                              |
| Open the last HTML report | `npm run report`                                                                                     |
| Lint / typecheck / format | `npm run lint`, `npm run typecheck`, `npm run format:check`                                          |

Run against another environment by setting `BASE_URL` (defaults to the public demo shop):

```bash
# bash
BASE_URL=https://demowebshop.tricentis.com npm test
```

```powershell
# PowerShell
$env:BASE_URL = "https://demowebshop.tricentis.com"; npm test
```

## Test scenarios

### Positive: search, add to cart, verify cart (`@smoke @cart`)

For every `addToCart` case:

1. Open the home page and search for the term through the header.
2. On the results page, read the price of the expected product tile and add it to the cart.
   The add-to-cart AJAX response must report success, the success notification must appear,
   and the header counter must show `(1)`.
3. Open the cart through the header.
4. Assert that the cart contains exactly one line item with the expected name, quantity `1`
   and the expected unit price, that this price equals the price shown on the search results
   tile, and that the header counter still shows `(1)`.

Comparing the cart price with both the tile and the test data catches two different defects:
a price changed between catalog and cart, and a catalog price that no longer matches expectations.

### Negative: search without results (`@negative @search`)

For every `negativeSearch` case:

1. Open the home page and search for the term through the header.
2. Assert that the expected message is shown with its exact text and that no product tiles are
   rendered. Two kinds of feedback are covered: an unknown term ("No products were found that
   matched your criteria.") and a term shorter than 3 characters (minimum-length warning).
3. Assert that the header counter shows `(0)`, open the cart and assert that the empty-cart
   message is visible, i.e. a failed search has no side effects on the cart.

## Test data

`src/data/products.json` holds all cases:

```json
{
  "addToCart": [
    {
      "id": "laptop",
      "searchTerm": "laptop",
      "expected": { "productName": "14.1-inch Laptop", "unitPrice": 1590 }
    }
  ],
  "negativeSearch": [
    {
      "id": "unknown-term",
      "searchTerm": "qwxzyplmk",
      "expected": {
        "messageType": "noResults",
        "message": "No products were found that matched your criteria."
      }
    }
  ]
}
```

- Tests never import the JSON directly. They use `addToCartCases` / `negativeSearchCases` from
  `src/data/testData.ts`, which are typed from the zod schemas.
- The file is validated when it is loaded: strict objects (unknown keys are rejected),
  kebab-case and unique `id`s (they appear in test titles), non-empty strings, positive prices,
  `messageType` limited to `noResults` | `warning`.
- Validation is fail-fast: an invalid file throws before any browser starts, with a readable
  list of problems, instead of producing confusing UI failures later.

To add a case, append an object to the relevant array. The test loops over the array, so a new
test appears in the run under the new `id` with no change to test code. Products used for
`addToCart` must be addable directly from the search results (products with required
attributes redirect to the product page).

## CI/CD

`.github/workflows/e2e.yml` runs on pushes and pull requests to `main` and on manual dispatch.

Job `test` (ubuntu-latest, 20 minute timeout):

1. `npm ci`, then `lint`, `typecheck` and `format:check`.
2. Installs Chromium and Firefox with system dependencies and runs `npm test`
   (GitHub sets `CI=true`, which enables retries, 2 workers and the GitHub annotations reporter).
3. Uploads the HTML report as artifact `playwright-report` (always, 14 days) and
   `test-results` with traces, screenshots and videos (only on failure).

Job `deploy-report` publishes the HTML report to GitHub Pages for pushes to `main`. It also runs
when tests fail, because that is when the report is most useful, and is skipped when the run was
cancelled or no report was produced (for example, lint failed before the tests ran).

Where to find the report:

- Latest `main` run: https://romannazarchuk-tuke.github.io/eshop-e2e-playwright/
- Any run (including pull requests): the `playwright-report` artifact on the run's summary page.
  Download it, unzip it and run `npx playwright show-report <unzipped-folder>`.

## Approach

- **Page Object Model.** Page objects in `src/pages` expose locators as `readonly` properties and
  intent-level methods (`searchFor`, `addToCart`, `getLineItems`). They contain no assertions
  except load-state checks (`expectLoaded`), so tests decide what is being verified.
- **Shared header component.** Search and the cart link exist on every page. `HeaderComponent`
  is composed into `BasePage`, so every page has `page.header` and a header change is fixed in
  one file.
- **Fixtures.** `src/fixtures/test.ts` extends Playwright's `test` with page objects. Tests
  declare what they need (`async ({ homePage, cartPage }) => ...`) and never construct page
  objects themselves.
- **Data-driven tests.** One test definition per scenario, one generated test per data case.
- **Locator strategy.** Interactive elements are located by role (`getByRole`), with
  `exact: true` for product names. CSS is used only where the markup offers no accessible
  alternative:
  - to scope locators to a container: `.search-box`, `.header-links`, `.product-item`,
    `table.cart`;
  - for elements without an accessible role or name: search messages (`strong.result`,
    `strong.warning`), the notification bar, prices, the cart quantity input and the cart
    product name.

  The most notable case is the header search input: it has no label or placeholder, so it is
  reached as the only textbox inside `.search-box`. No XPath, no index-based selectors, no fixed
  waits.

- **Test isolation.** Every test runs in a fresh browser context. The guest cart is
  cookie-based, so each test starts with an empty cart and tests can run in parallel and in any
  order.

## Decisions and reasoning

- **Demo shop.** demowebshop.tricentis.com is stable, has a realistic search and cart flow and
  no bot protection that would block GitHub-hosted runners.
- **Playwright HTML report instead of Allure.** It is built in, needs no extra dependency or
  Java runtime, includes steps, traces, screenshots and videos, and is a static site that can be
  hosted on GitHub Pages directly.
- **zod for test data.** TypeScript types alone do not check a JSON file at runtime. zod gives
  both the runtime check and the static types from one schema.
- **Chromium and Firefox.** Two different engines catch engine-specific issues while keeping CI
  time low. WebKit can be added as one more project.
- **Retries and workers only on CI.** Locally there are no retries, so instability is visible
  immediately. On CI, 2 retries absorb slow responses of the shared public server and traces
  are recorded on the first retry; workers are fixed at 2 to match the runner's CPUs and to
  avoid overloading the demo server.
- **Typed search feedback lookup.** `SearchResultsPage.searchFeedback(type)` maps a
  `SearchFeedbackType` to its locator through a `Record`, so the negative test has no if/else
  chain and future tests reuse the same lookup. The page object defines its own union type
  instead of importing from the data layer; adding a `messageType` to the schema without
  supporting it in the page object is a compile error at the call site.
- **`toEqual` on cart line items.** The cart is server-rendered, so after the row is visible a
  single read is stable. One `toEqual` checks that there is exactly one line item and its name,
  numeric price and quantity, and shows a complete diff on failure. Visibility of the row and
  the header counter are still checked with retrying web-first assertions.

## Challenges

- **AJAX add to cart.** Adding from search results does not change the URL, the success
  notification hides itself after a few seconds, and the endpoint answers HTTP 200 even when it
  refuses the request. `addToCart` waits for the response, checks `success` in the JSON body and
  waits for the notification right after the click.
- **Navigating before the cart is updated.** Opening the cart immediately after the click can
  race with the AJAX request. The test asserts that the header counter shows `(1)` before
  navigating.
- **Inputs without labels.** The header search input has no label or placeholder (the "Search
  store" text is a value cleared by JavaScript), so it is located through its container.
- **Partial name matches.** Names such as "Fiction" and "Fiction EX" match each other partially,
  so product tiles and cart rows are filtered by links with `exact: true`.
- **Prices without currency.** Prices are rendered as `1590.00`. `parsePrice` converts them to
  numbers so they can be compared with test data and with each other.
- **Duplicate controls.** There are two "Search" buttons on the results page and two "Shopping
  cart" links (header and footer), so header locators are scoped to their containers.

## How it scales

- **New page:** add a class in `src/pages` that extends `BasePage` (sets `path`, implements
  `expectLoaded`) and register it in `src/fixtures/test.ts`. It gets the header automatically.
- **New shared component:** add a class in `src/components` and compose it into `BasePage` or
  into the pages that contain it.
- **New test case:** add an entry to `src/data/products.json`.
- **New scenario type:** add a schema and an exported array in `src/data/testData.ts`, then a
  spec in `tests/<feature>/`.
- **New browser:** add a project to `playwright.config.ts`.
- **New environment:** set `BASE_URL`; no test contains a hardcoded URL.
