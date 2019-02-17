import * as THREE from "three";
import { Color } from "./Color";

const textureLoader = new THREE.TextureLoader();

function noop() {}

function loadTexture(url: string): Promise<THREE.Texture> {
  return new Promise((resolve, reject) => {
    textureLoader.load(url, resolve, noop, reject);
  });
}

const textureNames = [
  "background2",
  "overlay2",
  "soldier-red",
  "soldier-green",
  "soldier-blue",
  "soldier-cyan",
  "soldier-magenta",
  "soldier-yellow",
  "soldier-black",
  "soldier-white"
];

export interface KJSTextures {
  background: THREE.Texture;
  overlay: THREE.Texture;
  materialMap: Map<Color, THREE.SpriteMaterial>;
}

function newSpriteMaterial(t: THREE.Texture): THREE.SpriteMaterial {
  return new THREE.SpriteMaterial({
    map: t,
    color: 0xffffff,
    //transparent: true,
    fog: false,
    lights: false,
    depthTest: false,
    depthWrite: false
  });
}

export function loadTextures(): Promise<KJSTextures> {
  return Promise.all(
    textureNames.map(name => {
      const url = `${process.env.PUBLIC_URL}/textures/${name}.png`;
      return loadTexture(url);
    })
  ).then(textures => {
    return {
      background: textures[0],
      overlay: textures[1],
      materialMap: new Map<Color, THREE.SpriteMaterial>([
        [Color.Red, newSpriteMaterial(textures[2])],
        [Color.Green, newSpriteMaterial(textures[3])],
        [Color.Blue, newSpriteMaterial(textures[4])],
        [Color.Cyan, newSpriteMaterial(textures[5])],
        [Color.Magenta, newSpriteMaterial(textures[6])],
        [Color.Yellow, newSpriteMaterial(textures[7])],
        [Color.Black, newSpriteMaterial(textures[8])],
        [Color.White, newSpriteMaterial(textures[9])]
      ])
    };
  });
}
