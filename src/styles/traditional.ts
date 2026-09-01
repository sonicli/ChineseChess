import type { Piece, Side } from "../engine/types";
import { GLYPH } from "../engine/types";
import * as THREE from "three";
import type { PieceBuild, PieceStyle } from "./types";

const SIZE = 512;
const bodyGeo = (() => {
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.42, 0),
    new THREE.Vector2(0.4, 0.038),
    new THREE.Vector2(0.385, 0.13),
    new THREE.Vector2(0.37, 0.148),
    new THREE.Vector2(0.355, 0.155),
    new THREE.Vector2(0, 0.155),
  ];
  return new THREE.LatheGeometry(pts, 64);
})();

const faceGeo = new THREE.CircleGeometry(0.332, 64);
const outerRingGeo = new THREE.TorusGeometry(0.362, 0.018, 14, 64);
const innerRingGeo = new THREE.TorusGeometry(0.278, 0.007, 10, 48);
const faceCache = new Map<
  string,
  {
    map: THREE.CanvasTexture;
    normalMap: THREE.CanvasTexture;
    metalnessMap: THREE.CanvasTexture;
    goldMap: THREE.CanvasTexture;
  }
>();

let studioEnv: THREE.CanvasTexture | null = null;

function envMap(): THREE.CanvasTexture {
  if (studioEnv) return studioEnv;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "#1c1c1a");
  g.addColorStop(0.18, "#f4ecd4");
  g.addColorStop(0.38, "#3e3c36");
  g.addColorStop(0.58, "#d9c27a");
  g.addColorStop(0.78, "#2a3344");
  g.addColorStop(1, "#121214");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 128);
  const v = ctx.createLinearGradient(0, 0, 0, 128);
  v.addColorStop(0, "rgba(160,200,230,0.35)");
  v.addColorStop(0.45, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(30,40,20,0.4)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 128);
  studioEnv = new THREE.CanvasTexture(canvas);
  studioEnv.mapping = THREE.EquirectangularReflectionMapping;
  studioEnv.colorSpace = THREE.SRGBColorSpace;
  return studioEnv;
}

function drawGlyph(ctx: CanvasRenderingContext2D, glyph: string, color: string): void {
  ctx.fillStyle = color;
  ctx.font = '700 248px "Noto Serif SC", "Songti SC", "SimSun", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(glyph, SIZE / 2, SIZE / 2);
}

function heightField(glyph: string): Uint8ClampedArray {
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, SIZE, SIZE);
  ctx.filter = "blur(2.2px)";
  drawGlyph(ctx, glyph, "#000");
  ctx.filter = "none";
  drawGlyph(ctx, glyph, "#000");
  return ctx.getImageData(0, 0, SIZE, SIZE).data;
}

function heightAt(data: Uint8ClampedArray, x: number, y: number): number {
  const xx = Math.min(SIZE - 1, Math.max(0, x));
  const yy = Math.min(SIZE - 1, Math.max(0, y));
  return data[(yy * SIZE + xx) * 4] / 255;
}

function faceMaps(glyph: string, side: Side) {
  const key = `${side}-${glyph}`;
  const hit = faceCache.get(key);
  if (hit) return hit;

  const height = heightField(glyph);
  const mapCanvas = document.createElement("canvas");
  const nrmCanvas = document.createElement("canvas");
  const metCanvas = document.createElement("canvas");
  mapCanvas.width = nrmCanvas.width = metCanvas.width = SIZE;
  mapCanvas.height = nrmCanvas.height = metCanvas.height = SIZE;
  const mapCtx = mapCanvas.getContext("2d")!;
  const nrmCtx = nrmCanvas.getContext("2d")!;
  const metCtx = metCanvas.getContext("2d")!;
  const mapImg = mapCtx.createImageData(SIZE, SIZE);
  const nrmImg = nrmCtx.createImageData(SIZE, SIZE);
  const metImg = metCtx.createImageData(SIZE, SIZE);

  const lacquer = side === "red" ? [142, 26, 36] : [22, 18, 14];
  const goldHi = [255, 232, 168];
  const goldLo = [168, 118, 32];
  const strength = 7.2;

  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const h = heightAt(height, x, y);
      const carved = 1 - h;
      const gx = (heightAt(height, x - 1, y) - heightAt(height, x + 1, y)) * strength;
      const gy = (heightAt(height, x, y - 1) - heightAt(height, x, y + 1)) * strength;
      const inv = 1 / Math.hypot(gx, gy, 1);
      const nx = gx * inv;
      const ny = gy * inv;
      const nz = inv;
      const light = Math.max(0, nx * -0.45 + ny * 0.55 + nz * 0.7);

      if (carved > 0.035) {
        const fill = Math.min(1, carved * 1.15);
        const t = light * 0.65 + fill * 0.35;
        const r = goldLo[0] + (goldHi[0] - goldLo[0]) * t;
        const g = goldLo[1] + (goldHi[1] - goldLo[1]) * t;
        const b = goldLo[2] + (goldHi[2] - goldLo[2]) * t;
        const edge = carved < 0.22 ? 0.72 + carved * 1.2 : 1;
        mapImg.data[i] = Math.min(255, r * edge);
        mapImg.data[i + 1] = Math.min(255, g * edge);
        mapImg.data[i + 2] = Math.min(255, b * edge);
        metImg.data[i] = metImg.data[i + 1] = metImg.data[i + 2] = Math.floor(120 + 135 * fill);
      } else {
        mapImg.data[i] = lacquer[0] * (0.92 + light * 0.08);
        mapImg.data[i + 1] = lacquer[1] * (0.92 + light * 0.08);
        mapImg.data[i + 2] = lacquer[2] * (0.92 + light * 0.08);
        metImg.data[i] = metImg.data[i + 1] = metImg.data[i + 2] = 8;
      }
      mapImg.data[i + 3] = 255;
      nrmImg.data[i] = Math.floor((nx * 0.5 + 0.5) * 255);
      nrmImg.data[i + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
      nrmImg.data[i + 2] = Math.floor((nz * 0.5 + 0.5) * 255);
      nrmImg.data[i + 3] = 255;
      metImg.data[i + 3] = 255;
    }
  }

  metCtx.putImageData(metImg, 0, 0);

  const goldCanvas = document.createElement("canvas");
  goldCanvas.width = goldCanvas.height = SIZE;
  const goldCtx = goldCanvas.getContext("2d")!;
  goldCtx.clearRect(0, 0, SIZE, SIZE);
  const grad = goldCtx.createLinearGradient(SIZE / 2, 80, SIZE / 2, SIZE - 80);
  grad.addColorStop(0, "#fff4c8");
  grad.addColorStop(0.42, "#f0d060");
  grad.addColorStop(0.72, "#d4a828");
  grad.addColorStop(1, "#a87818");
  goldCtx.fillStyle = grad;
  drawGlyph(goldCtx, glyph, "#f0d060");
  goldCtx.globalCompositeOperation = "source-atop";
  goldCtx.fillStyle = "rgba(255,255,255,0.22)";
  goldCtx.fillRect(0, 0, SIZE, SIZE * 0.42);
  const goldMap = new THREE.CanvasTexture(goldCanvas);
  goldMap.colorSpace = THREE.SRGBColorSpace;
  goldMap.anisotropy = 8;

  mapCtx.putImageData(mapImg, 0, 0);
  nrmCtx.putImageData(nrmImg, 0, 0);
  metCtx.putImageData(metImg, 0, 0);

  const map = new THREE.CanvasTexture(mapCanvas);
  const normalMap = new THREE.CanvasTexture(nrmCanvas);
  const metalnessMap = new THREE.CanvasTexture(metCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;
  normalMap.colorSpace = THREE.NoColorSpace;
  metalnessMap.colorSpace = THREE.NoColorSpace;
  normalMap.anisotropy = 8;
  metalnessMap.anisotropy = 8;
  const maps = { map, normalMap, metalnessMap, goldMap };
  faceCache.set(key, maps);
  return maps;
}

function goldFillMaterial(map: THREE.CanvasTexture): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map,
    metalness: 1,
    roughness: 0.14,
    envMap: envMap(),
    envMapIntensity: 1.65,
    clearcoat: 0.7,
    clearcoatRoughness: 0.08,
    transparent: true,
    alphaTest: 0.12,
    depthWrite: false,
    emissive: 0x5a4010,
    emissiveIntensity: 0.08,
  });
}

function ringMaterial(): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf0d060,
    metalness: 1,
    roughness: 0.16,
    envMap: envMap(),
    envMapIntensity: 1.5,
    clearcoat: 0.6,
    clearcoatRoughness: 0.1,
    emissive: 0x3a2a08,
    emissiveIntensity: 0.1,
  });
}

function ring(geometry: THREE.TorusGeometry, material: THREE.Material, y: number): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export const traditional: PieceStyle = {
  id: "traditional",
  label: "传统",
  groundY: 0.09,
  selectLift: 0.06,
  hoverLift: 0.03,
  build(piece: Piece): PieceBuild {
    const maps = faceMaps(GLYPH[piece.side][piece.kind], piece.side);
    const body = new THREE.MeshPhysicalMaterial({
      color: piece.side === "red" ? 0x7a121c : 0x16110d,
      roughness: 0.42,
      metalness: 0.06,
      clearcoat: 0.45,
      clearcoatRoughness: 0.3,
    });
    const face = new THREE.MeshPhysicalMaterial({
      map: maps.map,
      normalMap: maps.normalMap,
      metalnessMap: maps.metalnessMap,
      metalness: 1,
      roughness: 0.28,
      clearcoat: 0.4,
      clearcoatRoughness: 0.22,
      envMap: envMap(),
      envMapIntensity: 1.1,
      normalScale: new THREE.Vector2(1.2, 1.2),
    });
    const goldFill = goldFillMaterial(maps.goldMap);
    const ringGold = ringMaterial();

    const root = new THREE.Group();
    const bodyMesh = new THREE.Mesh(bodyGeo, body);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    const faceMesh = new THREE.Mesh(faceGeo, face);
    faceMesh.rotation.x = -Math.PI / 2;
    faceMesh.position.y = 0.157;
    faceMesh.castShadow = true;
    const goldGlyph = new THREE.Mesh(faceGeo, goldFill);
    goldGlyph.rotation.x = -Math.PI / 2;
    goldGlyph.position.y = 0.1605;
    root.add(
      bodyMesh,
      faceMesh,
      goldGlyph,
      ring(outerRingGeo, ringGold, 0.158),
      ring(innerRingGeo, ringGold, 0.159),
    );
    if (piece.kind === "king") root.scale.setScalar(1.08);
    root.rotation.y = piece.side === "red" ? 0 : Math.PI;
    return { root, materials: [body, face, goldFill, ringGold] };
  },
};
