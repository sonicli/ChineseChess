import type { Piece } from "../engine/types";
import * as THREE from "three";
import { createStauntonPiece } from "../scene/staunton";
import type { PieceBuild, PieceStyle } from "./types";

export const staunton: PieceStyle = {
  id: "staunton",
  label: "立体",
  groundY: 0.02,
  selectLift: 0.1,
  hoverLift: 0.07,
  build(piece: Piece): PieceBuild {
    const body = new THREE.MeshPhysicalMaterial({
      color: piece.side === "red" ? 0xa31d2c : 0x14110e,
      roughness: 0.32,
      metalness: 0.08,
      clearcoat: 0.55,
      clearcoatRoughness: 0.28,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: piece.side === "red" ? 0xd4b05c : 0xb7a57a,
      roughness: 0.36,
      metalness: 0.78,
    });
    const root = new THREE.Group();
    root.add(createStauntonPiece(piece.kind, body, accent));
    root.rotation.y = piece.side === "red" ? 0 : Math.PI;
    return { root, materials: [body, accent] };
  },
};
