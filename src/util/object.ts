import { safelyExtendPrototype } from './extend-prototype';

declare global {
  interface Object {
    map<V, V2>(object: Record<string, V>, mapper: (value: V, key: string) => V2): Record<string, V2>;
  }
}

safelyExtendPrototype(
  Object,
  'map',
  <V, V2>(object: { [key: string]: V }, mapper: (value: V, key: string) => V2): Record<string, V2> => {
    return Object.fromEntries(Object.entries(object).map(([k, v]) => [k, mapper(v, k)])) as Record<string, V2>;
  }
);
