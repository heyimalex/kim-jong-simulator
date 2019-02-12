import { Color, findClosestColor } from "./Color";

// These are constant at this point, but do I still want to leave in the
// ability for them to change??
export const GRID_WIDTH = 180;
export const GRID_HEIGHT = 220;

// Grid represents a two dimensional array, where each byte in the array
// represents a "soldier" sprite in the output, and the value of each byte
// corresponds to the Color of that sprite. It's sort of like ImageData, but
// one byte per pixel and clamped to the number of colors.
//
// At this point the dimensions have been locked.
export class Grid {
  height: number;
  width: number;
  data: Uint8ClampedArray;

  constructor(width: number, height: number, source?: Grid) {
    this.height = height;
    this.width = width;
    this.data = new Uint8ClampedArray(height * width);
    if (!source) {
      this.data.fill(Color.Red); // Default color.
    } else {
      if (source.height === height && source.width === width) {
        this.data.set(source.data);
      } else {
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            this.data[y * width + x] = source.readPixel(x, y) || Color.Red;
          }
        }
      }
    }
  }

  set(src: Grid): void {
    this.data.set(src.data);
  }

  readPixel(x: number, y: number): Color | undefined {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.data[y * this.width + x];
    } else {
      return undefined;
    }
  }
}

export function quantizeImageDataToGrid(imgd: ImageData, grid: Grid) {
  // NOTE: In the future this should probably use dithering, but honestly I
  // don't care enough right now. Mostly we're drawing already qantized
  // pictures, so dithering won't matter much at all.
  if (imgd.width !== grid.width || imgd.height !== grid.height) {
    throw new Error(
      "could not quantize image data: ImageData and Grid had different dimensions."
    );
  }
  const imageData = imgd.data;
  const gridData = grid.data;
  let j = 0;
  for (let i = 0; i < gridData.length; i++) {
    // Extract rgb triple from the image data.
    const r = imageData[j];
    const g = imageData[j + 1];
    const b = imageData[j + 2];

    // Check that no alpha is set on any pixel in development mode. Our
    // quantization function doesn't take this into account, so I consider it
    // an error if the passed image data has any transparent or
    // semi-transparent pixels.
    if (process.env.NODE_ENV === "development") {
      const a = imageData[j + 3];
      if (a !== 255) {
        throw new Error(`pixel ${i} in image data had non-opaque alpha`);
      }
    }

    // Quantize the color and set it in the grid.
    gridData[i] = findClosestColor([r, g, b]);

    // Increment the image data offset.
    j += 4;
  }
}
