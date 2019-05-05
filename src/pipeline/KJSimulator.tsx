import * as THREE from "three";

import { loadTextures, KJSTextures } from "./textures";
import { Grid } from "./Grid";
import { Color } from "./Color";
import { PRNG } from "./utils";

// CONFIG ----------------------------

const sceneWidth = 1080;
const sceneHeight = 1080;
const cameraPosition: Coordinate = { x: 0, y: 18.4, z: 100 };
const lookAtPosition: Coordinate = { x: 0, y: 0, z: -40 };

const rearRows = 110;
const rearColumns = 124;
const frontRows = 110;
const frontColumns = 180;
const rowSpacing = 0.75;
const columnSpacing = 0.3;

const rearColumnOffset = Math.floor((frontColumns - rearColumns) / 2);

const frontOffsetX = (frontColumns / 2) * columnSpacing * -1 + 0.2;
const frontOffsetY = (frontRows / 2) * rowSpacing * -1 - 2;

const rearOffsetX = frontOffsetX + rearColumnOffset * columnSpacing;
const rearOffsetY = frontOffsetY - rearRows * rowSpacing;

const soldierScale = 1;
const baseJitter = 0.3;

// -------------------------------------

interface Coordinate {
  x: number;
  y: number;
  z: number;
}

export const GRID_WIDTH = 180;
export const GRID_HEIGHT = 220;

export class KJS {
  private grid: Grid;
  renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private soldiers: Array<THREE.Sprite | undefined>;
  renderScene: () => void;
  private textures: KJSTextures;

  constructor(textures: KJSTextures) {
    const renderer = new THREE.WebGLRenderer({
      alpha: true
    });
    renderer.setSize(sceneWidth, sceneHeight);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      35, // Field of view
      sceneWidth / sceneHeight, // Aspect ratio
      0.1, // Near
      10000 // Far
    );
    camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
    camera.lookAt(
      new THREE.Vector3(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z)
    );

    scene.background = textures.background;

    // Following stuff is scene setup just to render the overlay. There has to
    // be an easier faster way to do this.
    const width = sceneWidth;
    const height = sceneHeight;
    const overlayCamera = new THREE.OrthographicCamera(
      -width / 2,
      width / 2,
      height / 2,
      -height / 2,
      0,
      30
    );
    const overlayScene = new THREE.Scene();
    const overlayMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({
        map: textures.overlay,
        color: 0xffffff,
        transparent: true
      })
    );
    overlayScene.add(overlayMesh);

    renderer.autoClear = false;

    this.textures = textures;
    this.grid = new Grid(GRID_WIDTH, GRID_HEIGHT);
    this.renderer = renderer;
    this.scene = scene;
    this.renderScene = () => {
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(overlayScene, overlayCamera);
      renderer.clearDepth();
    };

    // Setup the scene.
    const { grid } = this;
    const { materialMap } = textures;

    this.soldiers = new Array(grid.data.length).fill(undefined);

    const rng = new PRNG(1);

    // Jitter is applied to the soldier sprite's scale so that they don't look
    // so uniform. Uses a prng so that its the same across reloads.
    function randomJitter(): number {
      return baseJitter / 2 - rng.nextFloat() * baseJitter;
    }

    function getFrontColor(x: number, y: number): Color | undefined {
      return grid.readPixel(x, y + rearRows);
    }

    function getRearColor(x: number, y: number): Color | undefined {
      return grid.readPixel(x + rearColumnOffset, y);
    }

    // Rear soldiers
    for (let row = 0; row < rearRows; row++) {
      for (let column = 0; column < rearColumns; column++) {
        const color = getRearColor(column, row);
        if (color === Color.Invalid || color === undefined) {
          continue;
        }
        const sprite = new THREE.Sprite(materialMap.get(color));
        sprite.scale.set(
          soldierScale,
          soldierScale + randomJitter(),
          soldierScale
        );
        sprite.position.set(
          rearOffsetX + column * columnSpacing,
          0,
          rearOffsetY + row * rowSpacing
        );
        sprite.matrixAutoUpdate = false;
        sprite.updateMatrix();
        scene.add(sprite);

        const x = column + rearColumnOffset;
        this.soldiers[row * GRID_WIDTH + column + rearColumnOffset] = sprite;
      }
    }

    // Front soldiers.
    for (let row = 0; row < frontRows; row++) {
      for (let column = 0; column < frontColumns; column++) {
        const color = getFrontColor(column, row);
        if (color === Color.Invalid || color === undefined) {
          continue;
        }
        const sprite = new THREE.Sprite(materialMap.get(color));
        const jitter = row === frontRows - 1 ? 0 : randomJitter();
        sprite.matrixAutoUpdate = false;
        sprite.scale.set(soldierScale, soldierScale + jitter, soldierScale);
        sprite.position.set(
          frontOffsetX + column * columnSpacing,
          0,
          frontOffsetY + row * rowSpacing
        );
        sprite.updateMatrix();
        scene.add(sprite);
        this.soldiers[(row + rearRows) * GRID_WIDTH + column] = sprite;
      }
    }
  }

  updateScene(nextGrid: Grid): boolean {
    const { grid, soldiers } = this;
    const { materialMap } = this.textures;
    if (process.env.NODE_ENV === "development") {
      if (nextGrid.width !== grid.width || nextGrid.height !== grid.height) {
        throw new Error(
          "could not update scene: grids have different dimensions."
        );
      }
    }

    // Walk the two grids, comparing values. If either value has changed,
    // update the corresponding sprite material. Could avoid a lot of
    // iterations here if we didn't go over the missing rear soldiers.
    let updates = 0;
    for (let i = 0; i < grid.data.length; i++) {
      if (grid.data[i] === nextGrid.data[i]) continue;
      const nextColor = nextGrid.data[i];
      grid.data[i] = nextColor;
      const sprite = soldiers[i];
      if (sprite !== undefined) {
        updates += 1;
        sprite.material = materialMap.get(nextColor || Color.Red)!;
      }
    }
    return updates > 0;
  }
}
