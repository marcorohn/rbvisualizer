export interface TreeExport {
  elements: number[];
}

export function isTreeExport(obj: unknown): obj is TreeExport {
  const elements = obj['elements'];
  if (!elements) {
    return false;
  }
  if (!Array.isArray(elements)) {
    return false;
  }

  if (elements.length > 0) {
    return typeof elements[0] === 'number';
  }
  return true;
}
