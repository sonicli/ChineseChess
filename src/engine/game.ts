import {
  type Move,
  type Outcome,
  type Piece,
  type Side,
  cloneGrid,
  initialGrid,
  opposite,
} from "./types";
import {
  applyMove,
  generateLegalMoves,
  isInCheck,
  revertMove,
} from "./rules";

export interface Snapshot {
  move: Move;
  captured: Piece | null;
}

export class Game {
  grid = initialGrid();
  side: Side = "red";
  history: Snapshot[] = [];
  private cached: Outcome | null = null;

  get outcome(): Outcome {
    if (this.cached) return this.cached;
    const moves = generateLegalMoves(this.grid, this.side);
    const check = isInCheck(this.grid, this.side);
    this.cached = !moves.length
      ? check
        ? "checkmate"
        : "stalemate"
      : check
        ? "check"
        : "playing";
    return this.cached;
  }

  pieces(): Piece[] {
    const list: Piece[] = [];
    for (const row of this.grid) {
      for (const cell of row) if (cell) list.push(cell);
    }
    return list;
  }

  play(move: Move): Piece | null {
    const captured = applyMove(this.grid, move);
    this.history.push({ move, captured });
    this.side = opposite(this.side);
    this.cached = null;
    return captured;
  }

  undo(): Snapshot | null {
    const snap = this.history.pop();
    if (!snap) return null;
    this.side = opposite(this.side);
    revertMove(this.grid, snap.move, snap.captured);
    this.cached = null;
    return snap;
  }

  reset(): void {
    this.grid = initialGrid();
    this.side = "red";
    this.history = [];
    this.cached = null;
  }

  legal(): Move[] {
    return generateLegalMoves(this.grid, this.side);
  }

  cloneGrid() {
    return cloneGrid(this.grid);
  }
}
