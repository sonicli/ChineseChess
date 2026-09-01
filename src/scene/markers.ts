import * as THREE from "three";
import type { Move, Piece } from "../engine/types";
import { squareToWorld } from "./assets";

export class MoveMarkers {
  readonly group = new THREE.Group();
  private pool: THREE.Mesh[] = [];

  show(moves: Move[], grid: (Piece | null)[][]): void {
    this.clear();
    for (const move of moves) {
      const capture = Boolean(grid[move.toRank][move.toFile]);
      const mesh = this.next();
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.color.setHex(capture ? 0xc43a2a : 0xe6d5a5);
      mat.opacity = capture ? 0.9 : 0.75;
      const inner = capture ? 0.2 : 0.1;
      const outer = capture ? 0.28 : 0.18;
      mesh.geometry.dispose();
      mesh.geometry = new THREE.RingGeometry(inner, outer, 32);
      mesh.position.copy(squareToWorld(move.toFile, move.toRank, 0.03));
      mesh.visible = true;
    }
  }

  clear(): void {
    for (const mesh of this.pool) mesh.visible = false;
  }

  private next(): THREE.Mesh {
    const hidden = this.pool.find((m) => !m.visible);
    if (hidden) return hidden;
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.18, 32),
      new THREE.MeshBasicMaterial({
        color: 0xe6d5a5,
        transparent: true,
        opacity: 0.75,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    this.pool.push(mesh);
    this.group.add(mesh);
    return mesh;
  }
}
