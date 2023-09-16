export function deepEquals(obj1, obj2, depth = 1): boolean {
  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (obj1 === null && obj2 === null) {
    return true;
  }

  if (obj1 === undefined && obj2 === undefined) {
    return true;
  }

  if (typeof obj1 === 'string' || typeof obj1 === 'boolean' || typeof obj1 === 'number') {
    return obj1 === obj2;
  }

  if (!obj1 || !obj2) {
    return false;
  }

  if (Object.entries(obj1).length !== Object.entries(obj2).length) {
    return false;
  }

  // if objs are arrays
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      return false;
    }
    const isEntryEqual = obj1.every((o, idx) => {
      return deepEquals(o, obj2[idx], depth - 1);
    });
    if (!isEntryEqual) {
      return false;
    }
  }

  if (depth > 0) {
    for (const [key, value] of Object.entries(obj1)) {
      const isEntryEqual = deepEquals(obj1[key], obj2[key], depth - 1);
      if (!isEntryEqual) {
        return false;
      }
    }
  }
  return true;
}
