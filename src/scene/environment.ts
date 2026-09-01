import * as THREE from "three";
import { grassTexture, skyTexture } from "./assets";

export function createEnvironment(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x7ec4ee);
  scene.fog = new THREE.Fog(0xb7d9f2, 22, 58);

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(60, 32, 20),
    new THREE.MeshBasicMaterial({
      map: skyTexture(),
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    }),
  );
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xc8e4ff, 0x4d8a3e, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff3d0, 1.85);
  sun.position.set(10, 22, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2;
  sun.shadow.camera.far = 48;
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.bias = -0.0004;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xa8ccee, 0.35);
  fill.position.set(-10, 8, -6);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(48, 72),
    new THREE.MeshStandardMaterial({
      map: grassTexture(),
      roughness: 0.92,
      metalness: 0,
      color: 0x8fbf5a,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.78;
  floor.receiveShadow = true;
  scene.add(floor);
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
