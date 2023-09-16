export function toNumberIfPossible(obj: unknown): string | number | null | undefined {
  if (typeof obj === 'number') {
    return obj;
  }
  if (typeof obj === 'string') {
    const asNr = Number.parseFloat(obj);
    if (asNr > Number.NEGATIVE_INFINITY) {
      return asNr;
    }
    return obj;
  }
  if (obj === null || obj === undefined) {
    return obj;
  }

  return obj + '';
}
