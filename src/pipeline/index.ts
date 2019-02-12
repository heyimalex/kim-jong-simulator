import { fitText, quantizeTextCanvas } from "./fitText";
import { Grid, quantizeImageDataToGrid } from "./Grid";
import { KJS } from "./KJSimulator";
import { loadTextures, KJSTextures } from "./textures";
import { imgPromise } from "./utils";

export const GRID_WIDTH = 180;
export const GRID_HEIGHT = 220;

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

  function render(text: string, target: HTMLCanvasElement) {
    if (textCanvasCtx === null) {
      throw new Error("textCanvas.getContext returned null");
    }
    if (preRenderCanvasCtx === null) {
      throw new Error("preRenderCanvas.getContext returned null");
    }

    const targetCtx = target.getContext("2d");
    if (targetCtx === null) {
      throw new Error("targetCanvas.getContext returned null");
    }

    console.log("render called with", text, target);

    // RENDER TEXT
    const lines = text
      .toUpperCase()
      .split(/[\r\n]+/)
      .map(l => l.trim())
      .filter(l => l !== "");
    textCanvasCtx.clearRect(0, 0, GRID_WIDTH, GRID_HEIGHT);
    if (lines.length !== 0) {
      fitText(textCanvasCtx, 7, 110 + 10, 180 - 14, 110 - 20, lines);
      quantizeTextCanvas(
        textCanvasCtx,
        0,
        0,
        GRID_WIDTH,
        GRID_HEIGHT,
        [255, 255, 255],
        1
      );
    }

    // RENDER TO PRE-RENDER-CANVAS
    preRenderCanvasCtx.drawImage(deps.baseImg, 0, 0);
    preRenderCanvasCtx.drawImage(textCanvas, 0, 0);

    // COPY TO GRID
    quantizeImageDataToGrid(
      preRenderCanvasCtx.getImageData(0, 0, GRID_WIDTH, GRID_HEIGHT),
      preRenderGrid
    );

    // UPDATE KJS WITH NEW GRID
    kjs.updateScene(preRenderGrid);
    kjs.renderScene();

    // DRAW THE OUTPUT IMAGE
    targetCtx.drawImage(kjs.renderer.domElement, 0, 0);
  }
  return render;
}
