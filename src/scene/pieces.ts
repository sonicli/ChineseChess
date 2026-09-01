import * as THREE from "three";
import type { Piece } from "../engine/types";
import { squareToWorld } from "./assets";
import type { PieceStyle } from "../styles/types";

function tag(root: THREE.Object3D, id: string): void {
  root.userData = { ...root.userData, type: "piece", id };
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.userData = { ...obj.userData, type: "piece", id };
    }
  });
}

export class PieceView {
  readonly group = new THREE.Group();
  readonly id: string;
  private style: PieceStyle;
  private mats: THREE.MeshStandardMaterial[] = [];
  private selected = false;
  private visual: THREE.Group | null = null;

  constructor(piece: Piece, style: PieceStyle) {
    this.id = piece.id;
    this.style = style;
    this.group.userData = { type: "piece", id: piece.id };
    this.mount(piece, style);
    this.place(piece.file, piece.rank);
  }

  get groundY(): number {
    return this.style.groundY;
  }

  rebuild(piece: Piece, style: PieceStyle): void {
    const { x, z } = this.group.position;
    const wasSelected = this.selected;
    this.unmount();
    this.mount(piece, style);
    this.group.position.set(x, style.groundY, z);
    if (wasSelected) this.setSelected(true);
  }

  place(file: number, rank: number, y = this.style.groundY): void {
    this.group.position.copy(squareToWorld(file, rank, y));
  }

  setSelected(on: boolean): void {
    this.selected = on;
    for (const mat of this.mats) {
      mat.emissive.setHex(on ? 0x5a3a10 : 0x000000);
      mat.emissiveIntensity = on ? 0.45 : 0;
    }
    this.group.position.y = this.style.groundY + (on ? this.style.selectLift : 0);
  }

  setHover(on: boolean): void {
    if (this.selected) return;
    this.group.position.y = this.style.groundY + (on ? this.style.hoverLift : 0);
  }

  pulse(amount: number): void {
    if (this.selected) return;
    for (const mat of this.mats) {
      mat.emissive.setHex(0x9a2218);
      mat.emissiveIntensity = amount;
    }
  }

  isSelected(): boolean {
    return this.selected;
  }

  dispose(): void {
    this.unmount();
  }

  private mount(piece: Piece, style: PieceStyle): void {
    this.style = style;
    const built = style.build(piece);
    this.visual = built.root;
    this.mats = built.materials;
    this.group.add(built.root);
    tag(this.group, piece.id);
  }

  private unmount(): void {
    if (this.visual) {
      this.group.remove(this.visual);
      this.visual = null;
    }
    for (const mat of this.mats) {
      mat.dispose();
    }
    this.mats = [];
  }
}
