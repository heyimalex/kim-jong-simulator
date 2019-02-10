import * as THREE from "three";
import * as React from "react";

import { loadTextures, KJSTextures } from "./textures";
import Grid from "./Grid";
import Color from "./Color";

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

const frontOffsetX = (frontColumns / 2) * columnSpacing * -1;
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

interface KJSimProps {
  grid: Grid;
  textures: KJSTextures;
}

export default class KJSimTextureLoader extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      textures: null
    };
  }
  componentDidMount() {
    loadTextures().then(textures => {
      this.setState({ textures });
    });
  }
  render() {
    if (this.state.textures === null) {
      return "loading textures...";
    }
    return <KJSim grid={this.props.grid} textures={this.state.textures} />;
  }
}

interface SoldierSprite {
  sprite: THREE.Sprite;
  x: number;
  y: number;
}

class KJSim extends React.PureComponent<KJSimProps> {
  soldiers: Array<SoldierSprite> = [];
  scene: THREE.Scene;
  lastGrid: Grid;
  renderScene: () => void;

  constructor(props: KJSimProps) {
    super(props);

    const renderer = new THREE.WebGLRenderer({
      alpha: true
    });
    renderer.setSize(sceneWidth, sceneHeight);
    renderer.setClearColor(0xdddddd, 1);
    document.getElementById("threeroot")!.appendChild(renderer.domElement);

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

    scene.background = props.textures.background;
    //scene.fog = new THREE.FogExp2(0xffffff, 0.001);

    // Following stuff is scene setup just to render the overlay.
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
        map: props.textures.overlay,
        color: 0xffffff,
        transparent: true
      })
    );
    overlayScene.add(overlayMesh);
    renderer.autoClear = false;

    this.lastGrid = props.grid.clone();
    this.scene = scene;
    this.renderScene = () => {
      renderer.render(scene, camera);
      renderer.clearDepth();
      renderer.render(overlayScene, overlayCamera);
    };
  }

  componentDidMount() {
    this.initialRender();
  }

  componentDidUpdate() {
    // lmao this is lazy
    requestAnimationFrame(() => {
      this.updateRender();
    });
  }

  initialRender() {
    const { grid } = this.props;
    const { materialMap, guardMaterial, flagMaterial } = this.props.textures;
    const { scene } = this;

    this.soldiers = [];

    const rng = new PRNG(1);

    // Jitter is applied to the soldier sprite's scale so that they don't look
    // so uniform. Uses a prng so that its the same across reloads.
    function randomJitter(): number {
      return baseJitter / 2 - rng.nextFloat() * baseJitter;
    }

    function getFrontColor(x: number, y: number): Color | undefined {
      return grid.read(x, y + rearRows);
    }

    function getRearColor(x: number, y: number): Color | undefined {
      return grid.read(x + rearColumnOffset, y);
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
        scene.add(sprite);
        this.soldiers.push({
          sprite,
          x: column + rearColumnOffset,
          y: row
        });
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
        sprite.scale.set(soldierScale, soldierScale + jitter, soldierScale);
        sprite.position.set(
          frontOffsetX + column * columnSpacing,
          0,
          frontOffsetY + row * rowSpacing
        );
        scene.add(sprite);
        this.soldiers.push({
          sprite,
          x: column,
          y: row + rearRows
        });
      }
    }

    const guardScale = 1;
    const guardDistance = 1.5;
    const secondGuardDistance = guardDistance + 0.8;
    function renderGuard(x: number, y: number) {
      const sprite = new THREE.Sprite(guardMaterial);
      sprite.scale.set(guardScale, guardScale, guardScale);
      sprite.position.set(x, 0, y);
      scene.add(sprite);
    }

    // Render rear guards.
    const rearMaxX = rearOffsetX + rearColumns * columnSpacing;
    const rearGuardOffsetX: Array<number> = [
      rearOffsetX - secondGuardDistance,
      rearOffsetX - guardDistance,
      rearMaxX + guardDistance,
      rearMaxX + secondGuardDistance
    ];
    for (let row = 0; row < 105; row += 6) {
      // Skip the range around the steps leading to the building.
      if (row > 45 && row < 65) {
        continue;
      }
      const y = rearOffsetY + row * rowSpacing;
      rearGuardOffsetX.forEach(x => {
        renderGuard(x, y);
      });
    }

    // Render front guards.
    const frontMaxX = frontOffsetX + frontColumns * columnSpacing;
    const frontGuardOffsetX: Array<number> = [
      frontOffsetX - secondGuardDistance,
      frontOffsetX - guardDistance,
      frontMaxX + guardDistance,
      frontMaxX + secondGuardDistance
    ];
    for (let row = 0; row < 105; row += 3) {
      // Skip the range around the steps leading to the building.
      if (row > 25 && row < 33) {
        continue;
      }
      const y = frontOffsetY + row * rowSpacing;
      frontGuardOffsetX.forEach(x => {
        renderGuard(x, y);
      });
    }

    // Render flags.
    const flagScale = 4;
    const flagOffsetY = rearOffsetY - 3;
    for (let x = -6; x < rearColumns + 6; x += 6) {
      const sprite = new THREE.Sprite(flagMaterial);
      sprite.scale.set(flagScale, flagScale, flagScale);
      sprite.position.set(rearOffsetX + x * columnSpacing, 0, flagOffsetY);
      scene.add(sprite);
    }
    this.renderScene();
  }

  updateRender() {
    const { grid } = this.props;
    const { materialMap } = this.props.textures;
    const { soldiers, lastGrid } = this;

    for (let soldier of soldiers) {
      const { x, y } = soldier;
      const prevColor = lastGrid.read(x, y)!;
      const nextColor = grid.read(x, y)!;
      if (prevColor !== nextColor) {
        lastGrid.paint(x, y, nextColor);
        soldier.sprite.material = materialMap.get(nextColor)!;
      }
    }
    this.renderScene();
  }

  render() {
    return null;
  }
}

// Pseudo-random number generator, ripped from a gist somewhere.
class PRNG {
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
