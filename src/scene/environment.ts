import * as THREE from "three";
import { grassTexture, skyTexture } from "./assets";
import type { ThemeMode } from "../theme";

export interface SceneEnvironment {
  applyTheme(theme: ThemeMode): void;
}

export function createEnvironment(scene: THREE.Scene): SceneEnvironment {
  const lightSkyMap = skyTexture("light");
  const darkSkyMap = skyTexture("dark");

  scene.background = new THREE.Color(0x7ec4ee);
  // Keep fog beyond the board so the far half doesn't pick up a cool tint.
  scene.fog = new THREE.Fog(0xb7d9f2, 36, 72);

  const skyMat = new THREE.MeshBasicMaterial({
    map: lightSkyMap,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
  const sky = new THREE.Mesh(new THREE.SphereGeometry(60, 32, 20), skyMat);
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xc8e4ff, 0x4d8a3e, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d0, 1.85);
  sun.position.set(10, 22, 8);
  sun.target.position.set(0, 0, 0);
  scene.add(sun.target);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  // Wide frustum so the whole board stays inside the shadow map (avoids a hard lit/dark cut).
  sun.shadow.camera.left = -22;
  sun.shadow.camera.right = 22;
  sun.shadow.camera.top = 22;
  sun.shadow.camera.bottom = -22;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xc8d8ee, 0.55);
  fill.position.set(-10, 8, -6);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xffe0b8, 0);
  rim.position.set(0, 10, 14);
  scene.add(rim);

  const floorMat = new THREE.MeshStandardMaterial({
    map: grassTexture(),
    roughness: 0.92,
    metalness: 0,
    color: 0x8fbf5a,
  });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(48, 72), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.78;
  floor.receiveShadow = true;
  scene.add(floor);

  return {
    applyTheme(theme: ThemeMode) {
      const dark = theme === "dark";
      skyMat.map = dark ? darkSkyMap : lightSkyMap;
      skyMat.needsUpdate = true;

      (scene.background as THREE.Color).set(dark ? 0x080c14 : 0x7ec4ee);
      if (scene.fog instanceof THREE.Fog) {
        scene.fog.color.set(dark ? 0x101828 : 0xb7d9f2);
        scene.fog.near = dark ? 32 : 36;
        scene.fog.far = dark ? 68 : 72;
      }

      hemi.color.set(dark ? 0x9aacc8 : 0xc8e4ff);
      hemi.groundColor.set(dark ? 0x2a3a28 : 0x4d8a3e);
      hemi.intensity = dark ? 0.95 : 1.15;

      sun.color.set(dark ? 0xffe6c8 : 0xfff3d0);
      sun.intensity = dark ? 1.45 : 1.85;
      sun.position.set(dark ? 8 : 10, dark ? 18 : 22, dark ? 10 : 8);

      fill.color.set(dark ? 0x7a90c8 : 0xc8d8ee);
      fill.intensity = dark ? 0.7 : 0.55;

      rim.color.set(dark ? 0xffd2a0 : 0xffe0b8);
      rim.intensity = dark ? 0.85 : 0;

      floorMat.color.set(dark ? 0x456838 : 0x8fbf5a);
    },
  };
}

export function createDust(): THREE.Points {
  const count = 140;
  const pos = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 22;
    pos[i * 3 + 1] = Math.random() * 7;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 22;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0xf4f7e8,
    size: 0.04,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  return new THREE.Points(geo, mat);
}

export function setDustTheme(dust: THREE.Points, theme: ThemeMode): void {
  const mat = dust.material as THREE.PointsMaterial;
  if (theme === "dark") {
    mat.color.set(0xc8d4ff);
    mat.opacity = 0.2;
  } else {
    mat.color.set(0xf4f7e8);
    mat.opacity = 0.28;
  }
}
