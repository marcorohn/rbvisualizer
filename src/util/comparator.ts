export function comparingNumber<T>(fn: (e: T) => number): (e1: T, e2: T) => number {
  return (e1, e2) => fn(e1) - fn(e2);
}

export function comparingString<T>(fn: (e: T) => string): (e1: T, e2: T) => number {
  return (e1, e2) => fn(e1).localeCompare(fn(e2));
}
