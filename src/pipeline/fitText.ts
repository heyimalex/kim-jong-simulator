import * as colorspace from "./colorspace";

const defaultFontAtSize = (size: number) => `bold ${size}px sans-serif`;

function makeFontFunc(fontFamily: string): (size: number) => string {
  return (size: number) => `${size}px ${fontFamily}`;
}

interface Options {
  textAlign: "left" | "right" | "center";
  vAlign: "top" | "bottom" | "center";
  font: string | ((size: number) => string);
  maxFontSize: number;
  lineHeight: number;
  adaptiveSize: boolean;
}

const defaultOptions: Options = {
  textAlign: "center",
  vAlign: "center",
  font: defaultFontAtSize,
  lineHeight: 0.8,
  adaptiveSize: true,
  maxFontSize: 300
};

export function fitText(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  lines: string[],
  opts?: Partial<Options>
) {
  if (lines.length === 0) {
    return; // nothing to do
  }

  const options: Options = (opts = {
    ...defaultOptions,
    ...opts
  });

  // Make sure that fontAtSize is a function that takes in a size and returns
  // a font string.
  const fontAtSize =
    typeof options.font === "string"
      ? makeFontFunc(options.font)
      : options.font;

  // Calculate the maximum possible font size for each line to fit within the
  // given width.
  const maxLineSizes = lines.map(line =>
    fitTextToCanvas(ctx, line, dWidth, fontAtSize, options.maxFontSize)
  );

  let lineSizes: number[] = [];
  if (options.adaptiveSize) {
    lineSizes = adaptiveFontSizes(maxLineSizes, dHeight, options.lineHeight);
  } else {
    // If adaptive line sizing is disabled, the size is just set to the
    // _smallest_ max line size, ie the maximum size of the widest line.
    const minLineSize = maxLineSizes.reduce((smallest, next) => {
      return Math.min(smallest, next);
    }, options.maxFontSize);

    // Additionally, we need to make sure that the minimum size would fit
    // vertically. We'll calculate that here, and then the final size will be
    // whichever was smaller.
    const evenlyDividedSize = Math.floor(
      dHeight / (lines.length * options.lineHeight)
    );
    const finalLineSize = Math.min(evenlyDividedSize, minLineSize);

    // The adaptiveFontSizes function returns an array of "final sizes", so we
    // construct a similar thing here.
    for (let i = 0; i < lines.length; i++) {
      lineSizes[i] = finalLineSize;
    }
  }

  const { textAlign, vAlign } = options;
  ctx.textAlign = options.textAlign;

  // Calculate x position depending on textAlign.
  let x = dx;
  if (textAlign === "center") {
    x += Math.floor(dWidth / 2);
  } else if (textAlign === "right") {
    x += dWidth;
  }

  // Calculate initial y position depending on vAlign.
  let y = dy;
  if (vAlign !== "top") {
    const textHeight = lineSizes.reduce((total, size) => {
      return total + size * options.lineHeight;
    }, 0);
    if (vAlign === "center") {
      y += Math.floor((dHeight - textHeight) / 2);
    } else if (vAlign === "bottom") {
      y += dHeight - textHeight;
    }
  }

  // Draw the text.
  ctx.fillStyle = "black";
  for (let i = 0; i < lines.length; i++) {
    const linesize = lineSizes[i];
    ctx.font = fontAtSize(linesize);
    y += linesize * options.lineHeight;
    ctx.fillText(lines[i], x, y);
  }
}

// Finds and returns the maximum font size that the passed text can be
// rendered at in order to fit within targetWidth.
function fitTextToCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  targetWidth: number,
  fontAtSize: (size: number) => string,
  maxFontSize: number
): number {
  // Optimization: empty line.
  if (text === "") {
    return maxFontSize;
  }

  // Optimization: maxFontSize fits already.
  ctx.font = fontAtSize(maxFontSize);
  if (ctx.measureText(text).width <= targetWidth) {
    return maxFontSize;
  }

  // Binary search.
  let max = maxFontSize + 1;
  let min = 1;
  for (;;) {
    if (max - min <= 1) {
      return min;
    }
    const size = Math.floor(min + (max - min) / 2);
    ctx.font = fontAtSize(size);
    const actualWidth = ctx.measureText(text).width;
    if (actualWidth === targetWidth) {
      return size;
    } else if (actualWidth > targetWidth) {
      max = size;
    } else {
      min = size;
    }
  }
}

// Algorithm that tries to fill the vertical area of the box better by using
// different font sizes for each line. The array returned is a list of font
// sizes that you should use to render.
//
// You pass in the maximum font sizes for each line and the vertical height
// you want to fill. The algorithm is roughly:
// - Find the line with the "smallest" max size (the widest line).
// - If all of the lines were rendered at this size, would it fit within the
//   height?
// - If it wouldn't, then set every lines size to the maximum size that
//   _would_ fit within the vertical height and return.
// - If all lines would fit within the vertical height at this line's maximum
//   size, then the size of this line has been determined! Subtract the height
//   of this line from the remaining height, and then recursively run this
//   algorithm on the remaining lines until there are none left.
function adaptiveFontSizes(
  sizes: number[],
  dHeight: number,
  lineHeight: number
): number[] {
  // Its easier if the lines are sorted, so put them into an object with their
  // respective index so we can construct the results at the end.
  const lines: Array<{
    index: number;
    maxSize: number;
    finalSize: null | number;
  }> = sizes.map((maxSize, index) => ({
    index,
    maxSize,
    finalSize: null
  }));

  // Sort the lines in ascending maxSize order.
  lines.sort((a, b) => a.maxSize - b.maxSize);

  let remainingLines = lines.length;
  let remainingHeight = dHeight;
  while (remainingLines > 0) {
    // Because they're in sorted order, we know that lines[lines.length -
    // remaining] is the smallest undetermined size.
    const start = lines.length - remainingLines;
    const lineMaxSize = lines[start].maxSize;

    // Calculate the maximum size that would fill the remaining space were it
    // divided equally between the remaining lines.
    const evenlyDividedSize = Math.floor(
      remainingHeight / (remainingLines * lineHeight)
    );

    // Special case: if evenlyDividedSize is smaller than this line's max
    // size, then _all_ following lines are going to be the same, so we should
    // just set all following lines to the evenly divided size.
    if (evenlyDividedSize < lineMaxSize) {
      for (let i = start; i < lines.length; i++) {
        lines[i].finalSize = evenlyDividedSize;
      }
      break;
    }

    // Multiple lines may have the same size, so for every line at the current
    // size, set their final size to be equal to their max size.
    let updated = 0;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i];
      if (line.maxSize !== lineMaxSize) {
        break;
      }
      line.finalSize = lineMaxSize;
      updated += 1;
    }

    remainingLines -= updated;
    remainingHeight -= updated * lineMaxSize * lineHeight;
  }

  // Assemble the results from the finalized max sizes.
  const results: number[] = [];
  lines.forEach(line => {
    results[line.index] = line.finalSize as number;
  });
  return results;
}

// This takes the canvas that was passed in to fitText and quantizes the
// colors so that all pixels with alpha values below the quantization point
// are set to transparent and all pixels with alpha above the quantization
// point are set to be fully opaque and with the passed color.
//
// This works under the assumption that fitText was called on a cleared,
// transparent canvas, as we only use the alpha value vs calculating luminosity
// for each pixel.
//
// quantizationPoint needs to be between 1 and 255 inclusive.
export function quantizeTextCanvas(
  ctx: CanvasRenderingContext2D,
  dx: number,
  dy: number,
  dWidth: number,
  dHeight: number,
  color: [number, number, number],
  quantizationPoint: number
) {
  if (process.env.NODE_ENV === "development") {
    if (quantizationPoint < 1 || quantizationPoint > 255) {
      throw new Error(`invalid quantization point: ${quantizationPoint}`);
    }
    for (let i = 0; i < 3; i++) {
      if (color[i] < 0 || color[i] > 255) {
        throw new Error(`invalid color value in rgb triple: ${color[i]}`);
      }
    }
  }

  const imageData = ctx.getImageData(dx, dy, dWidth, dHeight);
  const { data } = imageData;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = color[0];
    data[i + 1] = color[1];
    data[i + 2] = color[2];
    const alpha = data[i + 3];
    if (alpha < quantizationPoint) {
      data[i + 3] = 0;
    } else {
      data[i + 3] = 255;
    }
  }
  ctx.putImageData(imageData, dx, dy);
}
