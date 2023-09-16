export function hash(obj: unknown): number {
  if (typeof obj === 'undefined') {
    return hash('undefined');
  }
  if (typeof obj !== 'string') {
    return hash(JSON.stringify(obj));
  }
  let hashCode = 0;

  if (obj.length === 0) {
    return hashCode;
  }
  for (let i = 0; i < obj.length; i++) {
    let chr = obj.charCodeAt(i);
    hashCode = (hashCode << 5) - hashCode + chr;
    hashCode |= 0; // Convert to 32bit integer
  }
  return hashCode;
}
