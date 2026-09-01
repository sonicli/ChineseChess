import type { PieceStyle } from "./types";
import { traditional } from "./traditional";
import { staunton } from "./staunton";

const STORAGE_KEY = "xiangqi.pieceStyle";

/** Add a style by implementing PieceStyle and pushing it here. */
export const PIECE_STYLES: PieceStyle[] = [traditional, staunton];

export function getPieceStyle(id: string): PieceStyle {
  return PIECE_STYLES.find((style) => style.id === id) ?? PIECE_STYLES[0];
}

export function loadPieceStyleId(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && PIECE_STYLES.some((style) => style.id === saved)) return saved;
  } catch {
    /* private mode */
  }
  return "staunton";
}

export function savePieceStyleId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    /* private mode */
  }
}
