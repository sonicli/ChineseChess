export type Side = "red" | "black";

export type PieceKind =
  | "king"
  | "advisor"
  | "elephant"
  | "horse"
  | "chariot"
  | "cannon"
  | "soldier";

export interface Piece {
  id: string;
  kind: PieceKind;
  side: Side;
  file: number;
  rank: number;
}

export interface Square {
  file: number;
  rank: number;
}

export interface Move {
  fromFile: number;
  fromRank: number;
  toFile: number;
  toRank: number;
}

export type Outcome = "playing" | "check" | "checkmate" | "stalemate";

export const FILES = 9;
export const RANKS = 10;

export const GLYPH: Record<Side, Record<PieceKind, string>> = {
  red: {
    king: "帥",
    advisor: "仕",
    elephant: "相",
    horse: "馬",
    chariot: "車",
    cannon: "炮",
    soldier: "兵",
  },
  black: {
    king: "將",
    advisor: "士",
    elephant: "象",
    horse: "馬",
    chariot: "車",
    cannon: "砲",
    soldier: "卒",
  },
};

export function opposite(side: Side): Side {
  return side === "red" ? "black" : "red";
}

export function inBounds(file: number, rank: number): boolean {
  return file >= 0 && file < FILES && rank >= 0 && rank < RANKS;
}

export function inPalace(file: number, rank: number, side: Side): boolean {
  if (file < 3 || file > 5) return false;
  return side === "red" ? rank <= 2 : rank >= 7;
}

export function crossedRiver(rank: number, side: Side): boolean {
  return side === "red" ? rank >= 5 : rank <= 4;
}

export function emptyGrid(): (Piece | null)[][] {
  return Array.from({ length: RANKS }, () => Array<Piece | null>(FILES).fill(null));
}

export function place(grid: (Piece | null)[][], piece: Piece): void {
  grid[piece.rank][piece.file] = piece;
}

export function cloneGrid(grid: (Piece | null)[][]): (Piece | null)[][] {
  return grid.map((row) => row.map((cell) => (cell ? { ...cell } : null)));
}

export function findKing(grid: (Piece | null)[][], side: Side): Piece | null {
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell.kind === "king" && cell.side === side) return cell;
    }
  }
  return null;
}

export function initialGrid(): (Piece | null)[][] {
  const grid = emptyGrid();
  let n = 0;
  const add = (kind: PieceKind, side: Side, file: number, rank: number) => {
    place(grid, { id: `${side}-${kind}-${n++}`, kind, side, file, rank });
  };

  const back: PieceKind[] = [
    "chariot",
    "horse",
    "elephant",
    "advisor",
    "king",
    "advisor",
    "elephant",
    "horse",
    "chariot",
  ];
  back.forEach((kind, file) => add(kind, "red", file, 0));
  back.forEach((kind, file) => add(kind, "black", file, 9));
  add("cannon", "red", 1, 2);
  add("cannon", "red", 7, 2);
  add("cannon", "black", 1, 7);
  add("cannon", "black", 7, 7);
  for (const file of [0, 2, 4, 6, 8]) {
    add("soldier", "red", file, 3);
    add("soldier", "black", file, 6);
  }
  return grid;
}
