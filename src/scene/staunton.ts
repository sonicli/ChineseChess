import * as THREE from "three";
import type { PieceKind } from "../engine/types";

const dummy = new THREE.MeshStandardMaterial();
const prototypes = new Map<PieceKind, THREE.Group>();

const FELT = new THREE.MeshStandardMaterial({
  color: 0x1e2c20,
  roughness: 0.95,
  metalness: 0,
});

function lathe(pts: [number, number][], segments = 64): THREE.LatheGeometry {
  return new THREE.LatheGeometry(
    pts.map(([x, y]) => new THREE.Vector2(x, y)),
    segments,
  );
}

function mesh(geometry: THREE.BufferGeometry, accent = false): THREE.Mesh {
  const m = new THREE.Mesh(geometry, dummy);
  m.userData.accent = accent;
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function felt(radius: number): THREE.Mesh {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, 0.018, 32),
    FELT,
  );
  m.userData.felt = true;
  m.position.y = 0.009;
  m.receiveShadow = true;
  return m;
}

function foot(s: number): THREE.Group {
  const g = new THREE.Group();
  g.add(felt(0.29 * s));
  g.add(
    mesh(
      lathe([
        [0, 0.01],
        [0.3 * s, 0.01],
        [0.3 * s, 0.048],
        [0.265 * s, 0.062],
        [0.255 * s, 0.09],
        [0.21 * s, 0.11],
        [0.205 * s, 0.138],
        [0.175 * s, 0.15],
      ]),
    ),
  );
  const ring = mesh(new THREE.TorusGeometry(0.168 * s, 0.024 * s, 12, 40), true);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.155;
  g.add(ring);
  return g;
}

function pawn(s = 0.92): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s));
  g.add(
    mesh(
      lathe([
        [0.12 * s, 0.17],
        [0.1 * s, 0.22],
        [0.085 * s, 0.38],
        [0.09 * s, 0.48],
        [0.12 * s, 0.54],
        [0.1 * s, 0.58],
      ]),
    ),
  );
  const head = mesh(new THREE.SphereGeometry(0.13 * s, 24, 18));
  head.position.y = 0.7 * s;
  g.add(head);
  return g;
}

function king(s = 1.12): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s));
  g.add(
    mesh(
      lathe([
        [0.13 * s, 0.17],
        [0.11 * s, 0.24],
        [0.095 * s, 0.52],
        [0.1 * s, 0.68],
        [0.155 * s, 0.78],
        [0.17 * s, 0.86],
        [0.15 * s, 0.94],
        [0.18 * s, 0.98],
        [0.12 * s, 1.02],
        [0.1 * s, 1.06],
        [0, 1.06],
      ]),
    ),
  );
  const cap = mesh(new THREE.TorusGeometry(0.11 * s, 0.02 * s, 10, 28), true);
  cap.rotation.x = Math.PI / 2;
  cap.position.y = 1.07;
  g.add(cap);
  const pole = mesh(new THREE.BoxGeometry(0.05 * s, 0.24 * s, 0.05 * s), true);
  pole.position.y = 1.18;
  g.add(pole);
  const bar = mesh(new THREE.BoxGeometry(0.18 * s, 0.05 * s, 0.05 * s), true);
  bar.position.y = 1.2;
  g.add(bar);
  return g;
}

function advisor(s = 1.06): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s));
  g.add(
    mesh(
      lathe([
        [0.125 * s, 0.17],
        [0.105 * s, 0.24],
        [0.09 * s, 0.5],
        [0.1 * s, 0.64],
        [0.15 * s, 0.74],
        [0.165 * s, 0.84],
        [0.14 * s, 0.92],
        [0.17 * s, 0.96],
        [0.11 * s, 1.0],
        [0.08 * s, 1.02],
        [0, 1.02],
      ]),
    ),
  );
  for (let i = 0; i < 8; i++) {
    const bead = mesh(new THREE.SphereGeometry(0.032 * s, 10, 8), true);
    const a = (i / 8) * Math.PI * 2;
    bead.position.set(Math.sin(a) * 0.12 * s, 1.03, Math.cos(a) * 0.12 * s);
    g.add(bead);
  }
  const berry = mesh(new THREE.SphereGeometry(0.05 * s, 14, 12), true);
  berry.position.y = 1.08;
  g.add(berry);
  return g;
}

function elephant(s = 1.02): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s));
  g.add(
    mesh(
      lathe([
        [0.12 * s, 0.17],
        [0.1 * s, 0.24],
        [0.085 * s, 0.48],
        [0.1 * s, 0.6],
        [0.145 * s, 0.72],
        [0.155 * s, 0.84],
        [0.12 * s, 0.94],
        [0.06 * s, 1.02],
        [0.028 * s, 1.08],
        [0, 1.1],
      ]),
    ),
  );
  const slit = mesh(new THREE.BoxGeometry(0.012 * s, 0.2 * s, 0.14 * s), true);
  slit.position.set(0, 0.92, 0.02);
  slit.rotation.x = -0.22;
  g.add(slit);
  const ring = mesh(new THREE.TorusGeometry(0.1 * s, 0.018 * s, 10, 28), true);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.62;
  g.add(ring);
  return g;
}

function chariot(s = 0.98): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s));
  g.add(
    mesh(
      lathe([
        [0.125 * s, 0.17],
        [0.11 * s, 0.24],
        [0.115 * s, 0.58],
        [0.17 * s, 0.64],
        [0.18 * s, 0.78],
        [0.16 * s, 0.8],
        [0, 0.8],
      ]),
    ),
  );
  for (let i = 0; i < 4; i++) {
    const merlon = mesh(new THREE.BoxGeometry(0.11 * s, 0.12 * s, 0.08 * s));
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    merlon.position.set(Math.sin(a) * 0.13 * s, 0.86, Math.cos(a) * 0.13 * s);
    merlon.rotation.y = a;
    g.add(merlon);
  }
  const well = mesh(new THREE.CylinderGeometry(0.08 * s, 0.08 * s, 0.04, 20), true);
  well.position.y = 0.8;
  g.add(well);
  return g;
}

function cannon(s = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s));
  g.add(
    mesh(
      lathe([
        [0.12 * s, 0.17],
        [0.105 * s, 0.24],
        [0.1 * s, 0.42],
        [0.13 * s, 0.5],
        [0.14 * s, 0.56],
        [0, 0.56],
      ]),
    ),
  );
  const breech = mesh(new THREE.SphereGeometry(0.11 * s, 20, 16));
  breech.position.set(0, 0.62, 0.08);
  g.add(breech);
  const barrel = mesh(new THREE.CylinderGeometry(0.055 * s, 0.07 * s, 0.42 * s, 20));
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(0, 0.64, -0.16);
  g.add(barrel);
  const muzzle = mesh(new THREE.CylinderGeometry(0.08 * s, 0.06 * s, 0.08 * s, 20), true);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, 0.64, -0.38);
  g.add(muzzle);
  const band = mesh(new THREE.TorusGeometry(0.072 * s, 0.016 * s, 8, 20), true);
  band.position.set(0, 0.64, -0.08);
  g.add(band);
  for (const dir of [-1, 1]) {
    const wheel = mesh(new THREE.CylinderGeometry(0.09 * s, 0.09 * s, 0.04 * s, 16), true);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(dir * 0.14 * s, 0.52, 0.02);
    g.add(wheel);
  }
  return g;
}

function horse(s = 1): THREE.Group {
  const g = new THREE.Group();
  g.add(foot(s * 0.96));
  g.add(
    mesh(
      lathe([
        [0.12 * s, 0.17],
        [0.11 * s, 0.22],
        [0.12 * s, 0.3],
        [0, 0.3],
      ]),
    ),
  );

  const chest = mesh(new THREE.SphereGeometry(0.155 * s, 20, 16));
  chest.scale.set(0.82, 1.05, 0.92);
  chest.position.set(0, 0.42, 0.05);
  g.add(chest);

  const neck = mesh(new THREE.CylinderGeometry(0.065 * s, 0.11 * s, 0.34 * s, 16));
  neck.position.set(0, 0.56, -0.02);
  neck.rotation.x = -0.62;
  g.add(neck);

  const head = mesh(new THREE.SphereGeometry(0.12 * s, 20, 16));
  head.scale.set(0.76, 0.92, 1.38);
  head.position.set(0, 0.74, -0.14);
  g.add(head);

  const muzzle = mesh(new THREE.CylinderGeometry(0.042 * s, 0.072 * s, 0.2 * s, 14));
  muzzle.rotation.x = Math.PI / 2 + 0.18;
  muzzle.position.set(0, 0.68, -0.3);
  g.add(muzzle);

  const nose = mesh(new THREE.SphereGeometry(0.046 * s, 12, 10));
  nose.scale.set(0.9, 0.8, 1.05);
  nose.position.set(0, 0.66, -0.4);
  g.add(nose);

  const jaw = mesh(new THREE.BoxGeometry(0.078 * s, 0.038 * s, 0.15 * s));
  jaw.position.set(0, 0.6, -0.28);
  jaw.rotation.x = 0.22;
  g.add(jaw);

  for (const dir of [-1, 1]) {
    const ear = mesh(new THREE.ConeGeometry(0.03 * s, 0.11 * s, 8));
    ear.position.set(dir * 0.052 * s, 0.86, -0.1);
    ear.rotation.z = dir * 0.3;
    ear.rotation.x = -0.5;
    g.add(ear);
  }

  const mane = mesh(new THREE.CapsuleGeometry(0.028 * s, 0.22 * s, 4, 8), true);
  mane.position.set(0, 0.68, 0.02);
  mane.rotation.x = 0.7;
  g.add(mane);
  return g;
}

const builders: Record<PieceKind, () => THREE.Group> = {
  king,
  advisor,
  elephant,
  horse,
  chariot,
  cannon,
  soldier: () => pawn(),
};

function prototype(kind: PieceKind): THREE.Group {
  let proto = prototypes.get(kind);
  if (!proto) {
    proto = builders[kind]();
    prototypes.set(kind, proto);
  }
  return proto;
}

export function createStauntonPiece(
  kind: PieceKind,
  body: THREE.Material,
  accent: THREE.Material,
): THREE.Group {
  const group = prototype(kind).clone(true);
  group.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    if (obj.userData.felt) {
      obj.material = FELT;
      return;
    }
    obj.material = obj.userData.accent ? accent : body;
    obj.castShadow = true;
    obj.receiveShadow = true;
  });
  return group;
}
