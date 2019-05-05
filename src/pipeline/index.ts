import { fitText, quantizeTextCanvas } from "./fitText";
import { Grid, quantizeImageDataToGrid } from "./Grid";
import { KJS } from "./KJSimulator";
import { loadTextures, KJSTextures } from "./textures";
import { imgPromise } from "./utils";

export const GRID_WIDTH = 180;
export const GRID_HEIGHT = 220;

// These are hard coded, but could just as easily be configurable.
const BASE_DX = 0;
const BASE_DY = 110;
const X_PADDING = 15;
const Y_PADDING = 15;
const DX = BASE_DX + X_PADDING;
const DY = BASE_DY + Y_PADDING;
const DWIDTH = GRID_WIDTH - X_PADDING * 2 - BASE_DX;
const DHEIGHT = GRID_HEIGHT - Y_PADDING * 2 - BASE_DY;

type Dependencies = {
  textures: KJSTextures;
  baseImg: HTMLImageElement;
};

export function loadDeps(): Promise<Dependencies> {
  return Promise.all([
    loadTextures(),
    imgPromise(`${process.env.PUBLIC_URL}/textures/backdrop.png`)
  ]).then(([textures, baseImg]) => ({ textures, baseImg }));
}

interface RenderArgs {
  text: string;
  target: HTMLCanvasElement;

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
}

type Stage = [string, (args: RenderArgs) => boolean | void];

export function createRenderer(deps: Dependencies) {
  const textCanvas = document.createElement("canvas");
  textCanvas.width = GRID_WIDTH;
  textCanvas.height = GRID_HEIGHT;
  const textCanvasCtx = textCanvas.getContext("2d");

  const preRenderCanvas = document.createElement("canvas");
  preRenderCanvas.width = GRID_WIDTH;
  preRenderCanvas.height = GRID_HEIGHT;
  const preRenderCanvasCtx = preRenderCanvas.getContext("2d");

  const preRenderGrid = new Grid(GRID_WIDTH, GRID_HEIGHT);

  const kjs = new KJS(deps.textures);

  const stages: Stage[] = [
    [
      "renderText",
      (args: RenderArgs) => {
        if (textCanvasCtx === null) {
          throw new Error("textCanvas.getContext returned null");
        }
        // RENDER TEXT

        let text = args.text;
        if (args.forceUpperCase) {
          text = text.toUpperCase();
        }
        let lines = text.split(/[\r\n]+/);
        if (args.forceTrimSpace) {
          lines = lines.map(l => l.trim()).filter(l => l !== "");
        }

        textCanvasCtx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
        if (lines.length !== 0) {
          const fontAtSize = (size: number) => {
            return [
              args.italic ? "italic" : "",
              args.bold ? "bold" : "",
              `${size}px`,
              args.fontFamily
            ]
              .filter(p => p !== "")
              .join(" ");
          };
          fitText(textCanvasCtx, DX, DY, DWIDTH, DHEIGHT, lines, {
            textAlign: args.textAlign,
            vAlign: args.vAlign,
            font: fontAtSize,
            lineHeight: args.lineHeight,
            adaptiveSize: args.adaptiveFontSize,
            maxFontSize: args.maxFontSize
          });
          quantizeTextCanvas(
            textCanvasCtx,
            0,
            0,
            GRID_WIDTH,
            GRID_HEIGHT,
            [255, 255, 255],
            args.quantizationPoint
          );
        }
      }
    ],
    [
      "prerenderCanvas",
      () => {
        if (preRenderCanvasCtx === null) {
          throw new Error("preRenderCanvas.getContext returned null");
        }
        preRenderCanvasCtx.drawImage(deps.baseImg, 0, 0);
        preRenderCanvasCtx.drawImage(textCanvas, 0, 0);
      }
    ],
    [
      "quantize",
      () => {
        if (preRenderCanvasCtx === null) {
          throw new Error("preRenderCanvas.getContext returned null");
        }
        quantizeImageDataToGrid(
          preRenderCanvasCtx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT),
          preRenderGrid
        );
      }
    ],
    [
      "updateScene",
      () => {
        return kjs.updateScene(preRenderGrid);
      }
    ],
    [
      "renderScene",
      ({ target }: RenderArgs) => {
        kjs.renderScene();
      }
    ],
    [
      "draw",
      ({ target }) => {
        const targetCtx = target.getContext("2d");
        if (targetCtx === null) {
          throw new Error("targetCanvas.getContext returned null");
        }
        targetCtx.drawImage(kjs.renderer.domElement, 0, 0);
      }
    ]
  ];

  function render(args: RenderArgs) {
    console.log("render called with", args);

    let cancelled = false;
    let i = 0;
    let timeoutId: number = 0;

    const TIMEOUT = 0;
    function nextStage() {
      if (cancelled) return;
      const [name, stage] = stages[i];
      if (stage === undefined) return;

      const start = performance.now();
      const cont = stage(args);
      const end = performance.now();
      console.log(`stage ${i + 1} "${name}" completed in ${end - start}`);
      i += 1;
      if (i < stages.length) {
        if (cont === false) {
          console.log(`stopping render pipeline: ${name} returned false`);
          return;
        }
        timeoutId = window.setTimeout(nextStage, TIMEOUT);
      }
    }
    timeoutId = window.setTimeout(nextStage, TIMEOUT);
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }
  return render;
}
