import * as colorspace from "./colorspace";

// This is our "palette" for drawing the soldier sprites.
export enum Color {
  Invalid,
  Red,
  Green,
  Blue,
  Cyan,
  Yellow,
  Magenta,
  Black,
  White
}

interface ColorDefinition {
  color: Color;
  displayName: string;
  hex: string;
  rgb: colorspace.RGB;
  lab: colorspace.LAB;
}

// TODO: Calculate all of this at build time, and put it into a map.
const definitions: ColorDefinition[] = ([
  [Color.Red, [255, 0, 0]],
  [Color.Green, [0, 255, 0]],
  [Color.Blue, [0, 0, 255]],
  [Color.Cyan, [0, 255, 255]],
  [Color.Magenta, [255, 0, 255]],
  [Color.Yellow, [255, 255, 0]],
  [Color.Black, [0, 0, 0]],
  [Color.White, [255, 255, 255]]
] as [Color, [number, number, number]][]).map(([color, rgb]) => {
  const name = Color[color];
  return {
    color,
    rgb,
    hex: rgb2hex(rgb),
    lab: colorspace.rgb2lab(rgb),
    displayName: name === undefined ? "invalid" : name.toLowerCase()
  };
});

// Converts an rgb triple into a hex color value:
//   rgb2hex([255,0,0]) = '#FF0000'
function rgb2hex(rgb: [number, number, number]): string {
  return "#" + num2hex(rgb[0]) + num2hex(rgb[1]) + num2hex(rgb[2]);
}

function num2hex(n: number): string {
  let hex = Number(n).toString(16);
  return hex.length < 2 ? "0" + hex : hex;
}

// Returns the closest Color (in lab space) to the passed rgb triple.
export function findClosestColor(rgb: [number, number, number]): Color {
  // Check whether the passed color is actually in the palette. This prevents
  // us from needing to do expensive lab conversions, and _most_ data at this
  // point is already quantized.
  if (
    (rgb[0] === 0 || rgb[0] === 255) &&
    (rgb[1] === 0 || rgb[1] === 255) &&
    (rgb[2] === 0 || rgb[2] === 255)
  ) {
    // TODO: Use something faster than a linear search.
    return definitions.find(def => {
      for (let i = 0; i < 3; i++) {
        if (def.rgb[i] !== rgb[i]) {
          return false;
        }
      }
      return true;
    })!.color;
  }

  // Convert to lab space.
  const lab = colorspace.rgb2lab(rgb);

  // Find the shortest distance and return the best match.
  let bestQuantError = 1;
  let bestColor = Color.Invalid;
  definitions.forEach(def => {
    const err = colorspace.deltaE(lab, def.lab);
    if (err < bestQuantError) {
      bestQuantError = err;
      bestColor = def.color;
    }
  });
  return bestColor;
}
