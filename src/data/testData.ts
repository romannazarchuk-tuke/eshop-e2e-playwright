import { z } from 'zod';
import rawTestData from './products.json';

const caseId = z.string().regex(/^[a-z0-9-]+$/, 'id must be kebab-case');

const addToCartCaseSchema = z.strictObject({
  id: caseId,
  searchTerm: z.string().min(1),
  expected: z.strictObject({
    productName: z.string().min(1),
    unitPrice: z.number().positive(),
  }),
});

const negativeSearchCaseSchema = z.strictObject({
  id: caseId,
  searchTerm: z.string().min(1),
  expected: z.strictObject({
    messageType: z.enum(['noResults', 'warning']),
    message: z.string().min(1),
  }),
});

// Ids are used in test titles, so duplicates would make reports ambiguous.
function casesSchema<T extends z.ZodType<{ id: string }>>(caseSchema: T) {
  return z
    .array(caseSchema)
    .min(1)
    .refine((cases) => new Set(cases.map((c) => c.id)).size === cases.length, {
      message: 'ids must be unique',
    });
}

const testDataSchema = z.strictObject({
  addToCart: casesSchema(addToCartCaseSchema),
  negativeSearch: casesSchema(negativeSearchCaseSchema),
});

export type AddToCartCase = z.infer<typeof addToCartCaseSchema>;
export type NegativeSearchCase = z.infer<typeof negativeSearchCaseSchema>;

const parsed = testDataSchema.safeParse(rawTestData);
if (!parsed.success) {
  throw new Error(`Invalid test data in src/data/products.json:\n${z.prettifyError(parsed.error)}`);
}

export const addToCartCases: readonly AddToCartCase[] = parsed.data.addToCart;
export const negativeSearchCases: readonly NegativeSearchCase[] = parsed.data.negativeSearch;
