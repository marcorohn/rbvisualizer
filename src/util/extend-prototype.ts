import { Constructable } from './lifecycle/constructable';

export function safelyExtendPrototype<T>(
  constructor: Constructable<T>,
  name: string,
  fn: (...args: unknown[]) => unknown
): void {
  if (typeof constructor.prototype[name] !== 'undefined') {
    throw new Error(constructor.name + ' already has a property named "' + name + '"');
  }
  Object.defineProperty(constructor.prototype, name, {
    value: fn,
    enumerable: false,
    writable: true,
  });
}
