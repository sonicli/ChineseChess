import {
  type Move,
  type Piece,
  type PieceKind,
  type Side,
  cloneGrid,
  findKing,
  inBounds,
  inPalace,
  opposite,
} from "./types";

const ORTHO: [number, number][] = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
];

const DIAG: [number, number][] = [
  [1, 1],
  [1, -1],
  [-1, 1],
  [-1, -1],
];

const HORSE: [number, number, number, number][] = [
  [2, 1, 1, 0],
  [2, -1, 1, 0],
  [-2, 1, -1, 0],
  [-2, -1, -1, 0],
  [1, 2, 0, 1],
  [1, -2, 0, -1],
  [-1, 2, 0, 1],
  [-1, -2, 0, -1],
];

function occupant(
  grid: (Piece | null)[][],
  file: number,
  rank: number,
): Piece | null {
  if (!inBounds(file, rank)) return null;
  return grid[rank][file];
}

function countBetween(
  grid: (Piece | null)[][],
  f1: number,
  r1: number,
  f2: number,
  r2: number,
): number {
  let n = 0;
  if (f1 === f2) {
    const lo = Math.min(r1, r2);
    const hi = Math.max(r1, r2);
    for (let r = lo + 1; r < hi; r++) if (grid[r][f1]) n++;
  } else if (r1 === r2) {
    const lo = Math.min(f1, f2);
    const hi = Math.max(f1, f2);
    for (let f = lo + 1; f < hi; f++) if (grid[r1][f]) n++;
  }
  return n;
}

function tryLand(
  grid: (Piece | null)[][],
  piece: Piece,
  file: number,
  rank: number,
  moves: Move[],
): void {
  if (!inBounds(file, rank)) return;
  const dest = grid[rank][file];
  if (dest && dest.side === piece.side) return;
  moves.push({
    fromFile: piece.file,
    fromRank: piece.rank,
    toFile: file,
    toRank: rank,
  });
}

function slide(
  grid: (Piece | null)[][],
  piece: Piece,
  df: number,
  dr: number,
  moves: Move[],
): void {
  let f = piece.file + df;
  let r = piece.rank + dr;
  while (inBounds(f, r)) {
    const dest = grid[r][f];
    if (!dest) {
      moves.push({
        fromFile: piece.file,
        fromRank: piece.rank,
        toFile: f,
        toRank: r,
      });
    } else {
      if (dest.side !== piece.side) {
        moves.push({
          fromFile: piece.file,
          fromRank: piece.rank,
          toFile: f,
          toRank: r,
        });
      }
      break;
    }
    f += df;
    r += dr;
  }
}

function cannonMoves(grid: (Piece | null)[][], piece: Piece, moves: Move[]): void {
  for (const [df, dr] of ORTHO) {
    let f = piece.file + df;
    let r = piece.rank + dr;
    let jumped = false;
    while (inBounds(f, r)) {
      const dest = grid[r][f];
      if (!jumped) {
        if (!dest) {
          moves.push({
            fromFile: piece.file,
            fromRank: piece.rank,
            toFile: f,
            toRank: r,
          });
        } else {
          jumped = true;
        }
      } else if (dest) {
        if (dest.side !== piece.side) {
          moves.push({
            fromFile: piece.file,
            fromRank: piece.rank,
            toFile: f,
            toRank: r,
          });
        }
        break;
      }
      f += df;
      r += dr;
    }
  }
}

function pieceMoves(grid: (Piece | null)[][], piece: Piece, moves: Move[]): void {
  switch (piece.kind) {
    case "king":
      for (const [df, dr] of ORTHO) {
        const f = piece.file + df;
        const r = piece.rank + dr;
        if (inPalace(f, r, piece.side)) tryLand(grid, piece, f, r, moves);
      }
      break;
    case "advisor":
      for (const [df, dr] of DIAG) {
        const f = piece.file + df;
        const r = piece.rank + dr;
        if (inPalace(f, r, piece.side)) tryLand(grid, piece, f, r, moves);
      }
      break;
    case "elephant": {
      const home = piece.side === "red";
      for (const [df, dr] of DIAG) {
        const eye = occupant(grid, piece.file + df, piece.rank + dr);
        if (eye) continue;
        const f = piece.file + df * 2;
        const r = piece.rank + dr * 2;
        if (!inBounds(f, r)) continue;
        if (home && r > 4) continue;
        if (!home && r < 5) continue;
        tryLand(grid, piece, f, r, moves);
      }
      break;
    }
    case "horse":
      for (const [df, dr, lf, lr] of HORSE) {
        if (occupant(grid, piece.file + lf, piece.rank + lr)) continue;
        tryLand(grid, piece, piece.file + df, piece.rank + dr, moves);
      }
      break;
    case "chariot":
      for (const [df, dr] of ORTHO) slide(grid, piece, df, dr, moves);
      break;
    case "cannon":
      cannonMoves(grid, piece, moves);
      break;
    case "soldier": {
      const fwd = piece.side === "red" ? 1 : -1;
      tryLand(grid, piece, piece.file, piece.rank + fwd, moves);
      const crossed = piece.side === "red" ? piece.rank >= 5 : piece.rank <= 4;
      if (crossed) {
        tryLand(grid, piece, piece.file - 1, piece.rank, moves);
        tryLand(grid, piece, piece.file + 1, piece.rank, moves);
      }
      break;
    }
  }
}

export function generatePseudoMoves(
  grid: (Piece | null)[][],
  side: Side,
): Move[] {
  const moves: Move[] = [];
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell.side === side) pieceMoves(grid, cell, moves);
    }
  }
  return moves;
}

function kingsFace(grid: (Piece | null)[][]): boolean {
  const red = findKing(grid, "red");
  const black = findKing(grid, "black");
  if (!red || !black || red.file !== black.file) return false;
  return countBetween(grid, red.file, red.rank, black.file, black.rank) === 0;
}

function pieceAttacks(
  grid: (Piece | null)[][],
  piece: Piece,
  file: number,
  rank: number,
): boolean {
  const df = file - piece.file;
  const dr = rank - piece.rank;
  switch (piece.kind) {
    case "king":
      return inPalace(file, rank, piece.side) && Math.abs(df) + Math.abs(dr) === 1;
    case "advisor":
      return inPalace(file, rank, piece.side) && Math.abs(df) === 1 && Math.abs(dr) === 1;
    case "elephant": {
      if (Math.abs(df) !== 2 || Math.abs(dr) !== 2) return false;
      if (piece.side === "red" && rank > 4) return false;
      if (piece.side === "black" && rank < 5) return false;
      return !occupant(grid, piece.file + df / 2, piece.rank + dr / 2);
    }
    case "horse":
      for (const [hf, hr, lf, lr] of HORSE) {
        if (hf === df && hr === dr) {
          return !occupant(grid, piece.file + lf, piece.rank + lr);
        }
      }
      return false;
    case "chariot":
      if (df !== 0 && dr !== 0) return false;
      return countBetween(grid, piece.file, piece.rank, file, rank) === 0;
    case "cannon":
      if (df !== 0 && dr !== 0) return false;
      return countBetween(grid, piece.file, piece.rank, file, rank) === 1;
    case "soldier": {
      const fwd = piece.side === "red" ? 1 : -1;
      if (df === 0 && dr === fwd) return true;
      const crossed = piece.side === "red" ? piece.rank >= 5 : piece.rank <= 4;
      return crossed && dr === 0 && Math.abs(df) === 1;
    }
  }
}

export function isInCheck(grid: (Piece | null)[][], side: Side): boolean {
  const king = findKing(grid, side);
  if (!king) return true;
  if (kingsFace(grid)) return true;
  const foe = opposite(side);
  for (const row of grid) {
    for (const cell of row) {
      if (cell && cell.side === foe && pieceAttacks(grid, cell, king.file, king.rank)) {
        return true;
      }
    }
  }
  return false;
}

export function applyMove(
  grid: (Piece | null)[][],
  move: Move,
): Piece | null {
  const piece = grid[move.fromRank][move.fromFile];
  if (!piece) return null;
  const captured = grid[move.toRank][move.toFile];
  grid[move.fromRank][move.fromFile] = null;
  grid[move.toRank][move.toFile] = {
    ...piece,
    file: move.toFile,
    rank: move.toRank,
  };
  return captured;
}

export function revertMove(
  grid: (Piece | null)[][],
  move: Move,
  captured: Piece | null,
): void {
  const piece = grid[move.toRank][move.toFile];
  if (!piece) return;
  grid[move.toRank][move.toFile] = captured;
  grid[move.fromRank][move.fromFile] = {
    ...piece,
    file: move.fromFile,
    rank: move.fromRank,
  };
}

export function generateLegalMoves(
  grid: (Piece | null)[][],
  side: Side,
): Move[] {
  const legal: Move[] = [];
  for (const move of generatePseudoMoves(grid, side)) {
    const captured = applyMove(grid, move);
    const safe = !isInCheck(grid, side);
    revertMove(grid, move, captured);
    if (safe) legal.push(move);
  }
  return legal;
}

export function movesFrom(
  grid: (Piece | null)[][],
  file: number,
  rank: number,
): Move[] {
  const piece = grid[rank][file];
  if (!piece) return [];
  return generateLegalMoves(grid, piece.side).filter(
    (m) => m.fromFile === file && m.fromRank === rank,
  );
}

export function sameMove(a: Move, b: Move): boolean {
  return (
    a.fromFile === b.fromFile &&
    a.fromRank === b.fromRank &&
    a.toFile === b.toFile &&
    a.toRank === b.toRank
  );
}

const VALUE: Record<PieceKind, number> = {
  king: 10000,
  chariot: 90,
  cannon: 45,
  horse: 40,
  elephant: 20,
  advisor: 20,
  soldier: 10,
};

export function evaluate(grid: (Piece | null)[][], side: Side): number {
  let score = 0;
  for (const row of grid) {
    for (const cell of row) {
      if (!cell) continue;
      let v = VALUE[cell.kind];
      if (cell.kind === "soldier") {
        if (cell.side === "red" && cell.rank >= 5) v += 8 + cell.rank;
        if (cell.side === "black" && cell.rank <= 4) v += 8 + (9 - cell.rank);
      }
      if (cell.kind === "horse" || cell.kind === "cannon") {
        v += 1.2 * (4 - Math.abs(cell.file - 4));
      }
      score += cell.side === side ? v : -v;
    }
  }
  return score;
}

export function searchBestMove(
  grid: (Piece | null)[][],
  side: Side,
  depth: number,
): Move | null {
  const root = cloneGrid(grid);
  const moves = generateLegalMoves(root, side);
  if (!moves.length) return null;

  moves.sort((a, b) => {
    const capB = root[b.toRank][b.toFile] ? 1 : 0;
    const capA = root[a.toRank][a.toFile] ? 1 : 0;
    return capB - capA;
  });

  let best = moves[0];
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of moves) {
    const captured = applyMove(root, move);
    const score = -negamax(root, depth - 1, -beta, -alpha, opposite(side));
    revertMove(root, move, captured);
    if (score > bestScore) {
      bestScore = score;
      best = move;
    }
    if (score > alpha) alpha = score;
  }
  return best;
}

function negamax(
  grid: (Piece | null)[][],
  depth: number,
  alpha: number,
  beta: number,
  side: Side,
): number {
  if (depth === 0) return evaluate(grid, side);
  const moves = generateLegalMoves(grid, side);
  if (!moves.length) {
    return isInCheck(grid, side) ? -12000 - depth : -11000 - depth;
  }

  moves.sort((a, b) => {
    const capB = grid[b.toRank][b.toFile] ? 1 : 0;
    const capA = grid[a.toRank][a.toFile] ? 1 : 0;
    return capB - capA;
  });

  let best = -Infinity;
  for (const move of moves) {
    const captured = applyMove(grid, move);
    const score = -negamax(grid, depth - 1, -beta, -alpha, opposite(side));
    revertMove(grid, move, captured);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }
  return best;
}
