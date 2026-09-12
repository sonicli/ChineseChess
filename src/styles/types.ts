import type { Piece } from "../engine/types";
import type * as THREE from "three";

export interface PieceBuild {
  root: THREE.Group;
  materials: THREE.MeshStandardMaterial[];
}

export interface PieceStyle {
  id: string;
  label: string;
  groundY: number;
  selectLift: number;
  hoverLift: number;
  build(piece: Piece): PieceBuild;
  /** Draw a small menu thumbnail onto the canvas (square). */
  drawPreview(canvas: HTMLCanvasElement): void;
}
