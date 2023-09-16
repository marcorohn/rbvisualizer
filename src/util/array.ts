import { safelyExtendPrototype } from './extend-prototype';

declare global {
  interface Array<T> {
    /**
     * Returns the first element of an array without removing it
     */
    // peek(): T;

    /**
     * Returns the first element if at least one is present or undefined
     */
    first(): T;

    /**
     * Returns the last element of an array
     */
    last(): T;

    /**
     * Returns a random element from an array
     */
    sample(): T;

    /**
     * Removes duplicate entries from an array
     */
    distinct(): Array<T>;

    /**
     * Returns true if this array has entries from the other array, false otherwise
     */
    intersects(otherArray: Iterable<T>): boolean;

    /**
     * Extracts all elements matching a given decider function and removes them from this array.
     */
    extract(deciderFn: (item: T) => boolean): Array<T>;

    /**
     * Divides this array in two resulting arrays based on a decider function.
     */
    divide(deciderFn: (item: T) => boolean): { matched: Array<T>; unmatched: Array<T> };

    /**
     * Returns all items from this array which are not contained in otherArray.
     */
    difference(otherArray: Array<T>): Array<T>;

    /**
     * returns true if the array is empty.
     */
    empty(): boolean;

    /**
     * Returns the array but without nullish elements
     */
    nonNull(): T[];

    /**
     * Returns the element with highest value according to the decider function
     * @param deciderFn
     */
    max(deciderFn: (item: T) => unknown): T;

    /**
     * Returns the element with lowest value according to the decider function
     * @param deciderFn
     */
    min(deciderFn: (item: T) => unknown): T;

    compareTo(otherArray: T[], deciderFn: (elem: T) => unknown): boolean;

    groupBy(deciderFn: (item: T) => unknown): Array<Array<T>>;

    // removes all elements from the array
    clear();
  }
}

export type DeepArray<T> = Array<T | DeepArray<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function filterByType<T>(array: any[] | readonly any[], type: (new (...args) => T) | any): T[] {
  if (!array) {
    return [];
  }

  const result: T[] = [];
  for (const item of array) {
    if (item instanceof type) {
      result.push(item);
    }
  }
  return result;
}

export function distinct<T>(array: T[]): T[] {
  const result: T[] = [];

  for (const item of array) {
    if (!result.includes(item)) {
      result.push(item);
    }
  }

  return result;
}

export function flatten<T>(input: DeepArray<T>): T[] {
  const stack = [...input];
  const res = [];
  while (stack.length) {
    // pop value from stack
    const next = stack.pop();
    if (Array.isArray(next)) {
      // push back array items, won't modify the original input
      stack.push(...next);
    } else {
      res.push(next);
    }
  }
  // reverse to restore input order
  return res.reverse();
}

/*safelyExtendPrototype(Array, 'peek', function (): unknown {
  if (this.length === 0) {
    throw new Error('Cannot peek an empty array');
  }
  return this[0];
});*/

safelyExtendPrototype(Array, 'first', function (): unknown {
  if (this.length === 0) {
    return undefined;
  }
  return this[0];
});

safelyExtendPrototype(Array, 'last', function (): unknown {
  if (this.length === 0) {
    return undefined;
  }
  return this[this.length - 1];
});

safelyExtendPrototype(Array, 'sample', function (): unknown {
  if (this.length === 0) {
    throw new Error('Cannot take a sample from an empty array');
  }
  // quick performance win over Math.floor for non-negative values:
  // eslint-disable-next-line no-bitwise
  return this[~~(Math.random() * this.length)];
});

safelyExtendPrototype(Array, 'distinct', function (): unknown[] {
  return this.filter((it, i, arr) => arr.indexOf(it) === i);
});

safelyExtendPrototype(Array, 'intersects', function (otherArray: unknown[]): boolean {
  for (const value of otherArray) {
    if (this.includes(value)) {
      return true;
    }
  }
  return false;
});

safelyExtendPrototype(Array, 'extract', function (decider: (item: unknown) => boolean): unknown[] {
  const matched = [];

  for (const key in this) {
    if (this.hasOwnProperty(key)) {
      const item = this[key];
      if (decider(item)) {
        matched.push(this.splice(key, 1)[0]);
      }
    }
  }

  return matched;
});

safelyExtendPrototype(Array, 'difference', function (otherArray: Array<unknown>): unknown[] {
  return this.filter((item) => otherArray.indexOf(item) === -1);
});

safelyExtendPrototype(Array, 'divide', function (decider: (item: unknown) => boolean): {
  matched: unknown[];
  unmatched: unknown[];
} {
  const matched = [];
  const unmatched = [];

  for (const key in this) {
    if (this.hasOwnProperty(key)) {
      const item = this[key];
      if (decider(item)) {
        matched.push(item);
      } else {
        unmatched.push(item);
      }
    }
  }

  return { matched, unmatched };
});

safelyExtendPrototype(Array, 'empty', function (): boolean {
  return this.length === 0;
});

safelyExtendPrototype(Array, 'nonNull', function (): boolean {
  return this.filter((el) => !!el);
});

safelyExtendPrototype(Array, 'max', function (fn: (item: unknown) => unknown): unknown {
  let max = undefined;
  for (let i = 0; i < this.length; i++) {
    const item = fn(this[i]);
    if (!max || item > fn(max)) {
      max = this[i];
    }
  }
  return max;
});

safelyExtendPrototype(Array, 'min', function (fn: (item: unknown) => unknown): unknown {
  let min = undefined;
  for (let i = 0; i < this.length; i++) {
    const item = fn(this[i]);
    if (!min || item < fn(min)) {
      min = this[i];
    }
  }
  return min;
});

safelyExtendPrototype(Array, 'compareTo', function (otherArray: unknown[], fn: (item: unknown) => unknown): unknown {
  if (this.length !== otherArray.length) {
    return false;
  }

  for (let i = 0; i < this.length; i++) {
    const item1 = fn(this[i]);
    const item2 = fn(otherArray[i]);
    if (item1 !== item2) {
      return false;
    }
  }
  return true;
});

safelyExtendPrototype(Array, 'groupBy', function (deciderFn: (item: unknown) => unknown): Array<Array<unknown>> {
  const ret = new Map<unknown, Array<unknown>>();
  this.forEach((el) => {
    const result = deciderFn(el);
    if (!ret.has(result)) {
      ret.set(result, []);
    }
    ret.get(result).push(el);
  });
  return [...ret.values()];
});

safelyExtendPrototype(Array, 'clear', function (): void {
  this.length = 0;
});

export function alternateArrays<T>(arr1: T[], arr2: T[]): T[] {
  const result: T[] = [];
  const len = Math.max(arr1.length, arr2.length);

  for (let i = 0; i < len; i++) {
    if (i < arr1.length) {
      result.push(arr1[i]);
    }
    if (i < arr2.length) {
      result.push(arr2[i]);
    }
  }

  return result;
}
