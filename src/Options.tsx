import React from "react";

interface State {
  // MOST IMPORTANT OPTIONS
  // - fontFamily, bold, italic, lineHeight
  // - MAYBE quantization point because of lines touching, but really solved by line height?
  // - and is line height REALLY necessary?
  // - all other settings can be "advanced", probably won't be used much
  // - they can all look ugly, as long as the main 3 look good

  // Text positioning
  dx: number;
  dy: number;
  dWidth: number;
  dHeight: number;

  // Text options
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  lineHeight: number;
  textAlign: "left" | "center" | "right";
  vAlign: "top" | "center" | "bottom";
  adaptiveFontSize: boolean;
  maxFontSize: number;
  forceUpperCase: boolean;
  forceTrimSpace: boolean;
  quantizationPoint: number;
  // text baseline
}

const labels = new Map<keyof State, string>();
