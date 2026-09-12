import type { Piece } from "../engine/types";
import * as THREE from "three";
import { createStauntonPiece } from "../scene/staunton";
import { getDocumentTheme } from "../theme";
import type { PieceBuild, PieceStyle } from "./types";

export const staunton: PieceStyle = {
  id: "staunton",
  label: "立體",
  groundY: 0.02,
  selectLift: 0.1,
  hoverLift: 0.07,
  build(piece: Piece): PieceBuild {
    const dark = getDocumentTheme() === "dark";
    const body = new THREE.MeshPhysicalMaterial({
      color: piece.side === "red"
        ? dark ? 0xd64552 : 0xa31d2c
        : dark ? 0x4a4238 : 0x14110e,
      roughness: dark ? 0.26 : 0.32,
      metalness: dark ? 0.12 : 0.08,
      clearcoat: dark ? 0.75 : 0.55,
      clearcoatRoughness: dark ? 0.2 : 0.28,
      emissive: piece.side === "red"
        ? dark ? 0x4a1218 : 0x000000
        : dark ? 0x2a241c : 0x000000,
      emissiveIntensity: dark ? 0.28 : 0,
    });
    const accent = new THREE.MeshStandardMaterial({
      color: piece.side === "red"
        ? dark ? 0xf0d070 : 0xd4b05c
        : dark ? 0xd4c49a : 0xb7a57a,
      roughness: dark ? 0.28 : 0.36,
      metalness: dark ? 0.88 : 0.78,
      emissive: dark ? 0x3a3010 : 0x000000,
      emissiveIntensity: dark ? 0.18 : 0,
    });
    const root = new THREE.Group();
    root.add(createStauntonPiece(piece.kind, body, accent));
    root.rotation.y = piece.side === "red" ? 0 : Math.PI;
    return { root, materials: [body, accent] };
  },
  drawPreview(canvas: HTMLCanvasElement): void {
    const size = canvas.width;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2;
    const s = size / 64;

    const body = ctx.createLinearGradient(cx - 12 * s, 0, cx + 12 * s, size);
    body.addColorStop(0, "#c43a3a");
    body.addColorStop(1, "#7a121c");
    ctx.fillStyle = body;

    ctx.beginPath();
    ctx.ellipse(cx, 54 * s, 16 * s, 4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(cx - 14 * s, 48 * s, 28 * s, 6 * s);

    ctx.beginPath();
    ctx.moveTo(cx - 5 * s, 48 * s);
    ctx.quadraticCurveTo(cx - 7 * s, 28 * s, cx - 4 * s, 18 * s);
    ctx.lineTo(cx + 4 * s, 18 * s);
    ctx.quadraticCurveTo(cx + 7 * s, 28 * s, cx + 5 * s, 48 * s);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#d4b05c";
    ctx.beginPath();
    ctx.ellipse(cx, 18 * s, 8 * s, 2.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e6c75a";
    ctx.fillRect(cx - 1.6 * s, 4 * s, 3.2 * s, 14 * s);
    ctx.fillRect(cx - 6 * s, 7 * s, 12 * s, 3 * s);
  },
};
