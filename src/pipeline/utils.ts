// Pseudo-random number generator, ripped from a gist somewhere.
export class PRNG {
  seed: number;
  constructor(seed: number) {
    this.seed = seed % 2147483647;
    if (this.seed <= 0) this.seed += 2147483646;
  }

  nextFloat(): number {
    const next = (this.seed * 16807) % 2147483647;
    this.seed = next;
    return (next - 1) / 2147483646;
  }
}

// Returns a promise that resolves with the loaded HTMLImageElement, or
// rejects with the load error.
export function imgPromise(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve(img);
    };
    img.onerror = (err: any) => {
      reject(err);
    };
    img.src = src;
  });
}
