import * as THREE from "three";
import { squareToWorld, boardWoodTexture, riverLabel } from "./assets";

function rail(
  a: THREE.Vector3,
  b: THREE.Vector3,
  y: number,
  material: THREE.Material,
  thick = 0.028,
): THREE.Mesh {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const len = Math.hypot(dx, dz);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(thick, 0.02, len + thick), material);
  mesh.position.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
  mesh.rotation.y = Math.atan2(dx, dz);
  // Grid rails sit on the surface — casting shadows caused blotchy mid-board darkening.
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  return mesh;
}

function star(file: number, rank: number, y: number, mat: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  const p = squareToWorld(file, rank, y);
  const arm = 0.14;
  const a = p.clone();
  a.x -= arm;
  const b = p.clone();
  b.x += arm;
  const c = p.clone();
  c.z -= arm;
  const d = p.clone();
  d.z += arm;
  g.add(rail(a, b, y, mat, 0.02));
  g.add(rail(c, d, y, mat, 0.02));
  return g;
}

export function createBoard(): THREE.Group {
  const root = new THREE.Group();
  const wood = boardWoodTexture();

  // Same map + tint so top/sides read as one piece of wood (sides only differ by lighting).
  const woodColor = 0xe6d2b0;
  const topMat = new THREE.MeshStandardMaterial({
    map: wood,
    roughness: 0.96,
    metalness: 0,
    color: woodColor,
  });
  const sideMat = new THREE.MeshStandardMaterial({
    map: wood,
    roughness: 0.98,
    metalness: 0,
    color: woodColor,
  });
  const ink = new THREE.MeshBasicMaterial({
    color: 0x3a2818,
  });

  const slab = new THREE.Mesh(new THREE.BoxGeometry(11.2, 0.42, 12.4), [
    sideMat,
    sideMat,
    topMat,
    sideMat,
    sideMat,
    sideMat,
  ]);
  slab.position.y = -0.21;
  // Avoid self-shadow on the playing surface.
  slab.castShadow = false;
  slab.receiveShadow = true;
  root.add(slab);

  const lip = new THREE.Mesh(
    new THREE.BoxGeometry(11.6, 0.16, 12.8),
    new THREE.MeshStandardMaterial({
      map: wood,
      color: woodColor,
      roughness: 0.98,
      metalness: 0,
    }),
  );
  lip.position.y = -0.48;
  lip.castShadow = true;
  lip.receiveShadow = true;
  root.add(lip);

  for (const [x, z] of [
    [-5.1, -5.7],
    [5.1, -5.7],
    [-5.1, 5.7],
    [5.1, 5.7],
  ]) {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 1.35, 0.42),
      sideMat,
    );
    leg.position.set(x, -1.1, z);
    leg.castShadow = true;
    root.add(leg);
  }

  const y = 0.012;
  for (let rank = 0; rank < 10; rank++) {
    const a = squareToWorld(0, rank, y);
    const b = squareToWorld(8, rank, y);
    root.add(rail(a, b, y, ink));
  }
  for (let file = 0; file < 9; file++) {
    const a = squareToWorld(file, 0, y);
    const b = squareToWorld(file, 4, y);
    const c = squareToWorld(file, 5, y);
    const d = squareToWorld(file, 9, y);
    root.add(rail(a, b, y, ink));
    root.add(rail(c, d, y, ink));
  }

  root.add(rail(squareToWorld(3, 0, y), squareToWorld(5, 2, y), y, ink, 0.022));
  root.add(rail(squareToWorld(5, 0, y), squareToWorld(3, 2, y), y, ink, 0.022));
  root.add(rail(squareToWorld(3, 9, y), squareToWorld(5, 7, y), y, ink, 0.022));
  root.add(rail(squareToWorld(5, 9, y), squareToWorld(3, 7, y), y, ink, 0.022));

  const stars: [number, number][] = [
    [1, 2],
    [7, 2],
    [1, 7],
    [7, 7],
    [0, 3],
    [2, 3],
    [4, 3],
    [6, 3],
    [8, 3],
    [0, 6],
    [2, 6],
    [4, 6],
    [6, 6],
    [8, 6],
  ];
  for (const [f, r] of stars) root.add(star(f, r, y + 0.001, ink));

  const chu = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.7),
    new THREE.MeshBasicMaterial({
      map: riverLabel("楚 河"),
      transparent: true,
      depthWrite: false,
    }),
  );
  chu.rotation.x = -Math.PI / 2;
  chu.position.set(-2.15, 0.02, 0);
  root.add(chu);

  const han = new THREE.Mesh(
    new THREE.PlaneGeometry(2.1, 0.7),
    new THREE.MeshBasicMaterial({
      map: riverLabel("漢 界"),
      transparent: true,
      depthWrite: false,
    }),
  );
  han.rotation.x = -Math.PI / 2;
  han.position.set(2.15, 0.02, 0);
  root.add(han);

  return root;
}

export function createHitPoints(): THREE.Group {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(0.38, 10, 10);
  const mat = new THREE.MeshBasicMaterial({
    visible: false,
  });
  for (let rank = 0; rank < 10; rank++) {
    for (let file = 0; file < 9; file++) {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(squareToWorld(file, rank, 0.08));
      mesh.userData = { type: "point", file, rank };
      group.add(mesh);
    }
  }
  return group;
}
