export function generateRandomColor(alpha: number): string {
  const red = Math.floor(Math.random() * 256);
  const green = Math.floor(Math.random() * 256);
  const blue = Math.floor(Math.random() * 256);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function deterministicRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

export function generateSeededColor(seed: number, alpha): string {
  const r = Math.floor(deterministicRandom(seed) * 256);
  const g = Math.floor(deterministicRandom(seed + 1) * 256);
  const b = Math.floor(deterministicRandom(seed + 2) * 256);

  return `rgba(${r},${g},${b},${alpha})`;
}
