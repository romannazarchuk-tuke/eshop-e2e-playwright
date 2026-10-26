/** Converts a price as rendered by the shop (e.g. "1590.00") into a number. */
export function parsePrice(text: string): number {
  const normalized = text.replace(/[^\d.]/g, '');
  const price = Number(normalized);
  if (normalized === '' || Number.isNaN(price)) {
    throw new Error(`Cannot parse price from text: "${text}"`);
  }
  return price;
}
