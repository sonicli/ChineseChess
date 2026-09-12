import "./style.css";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Game } from "./engine/game";
import { type Move, type Piece, type Side, opposite, findKing } from "./engine/types";
import { movesFrom, sameMove, searchAiMove, type AiDifficulty } from "./engine/rules";
import { tap } from "./audio";
import { squareToWorld } from "./scene/assets";
import { PIECE_STYLES, getPieceStyle, loadPieceStyleId, savePieceStyleId } from "./styles/registry";
import type { PieceStyle } from "./styles/types";
import { createBoard, createHitPoints } from "./scene/board";
import { createDust, createEnvironment, setDustTheme } from "./scene/environment";
import { MoveMarkers } from "./scene/markers";
import { PieceView } from "./scene/pieces";
import { applyDocumentTheme, loadTheme, saveTheme, type ThemeMode } from "./theme";

const canvas = document.querySelector<HTMLCanvasElement>("#scene")!;
const statusEl = document.querySelector<HTMLParagraphElement>("#status")!;
const modeLabelEl = document.querySelector<HTMLParagraphElement>("#mode-label")!;
const endgameEl = document.querySelector<HTMLDivElement>("#endgame")!;
const endTitleEl = document.querySelector<HTMLParagraphElement>("#end-title")!;
const styleBtn = document.querySelector<HTMLButtonElement>("#btn-style")!;
const styleMenu = document.querySelector<HTMLDivElement>("#style-menu")!;
const setupModal = document.querySelector<HTMLDivElement>("#setup-modal")!;
const setupOptions = document.querySelector<HTMLDivElement>("#setup-options")!;
const setupStartBtn = document.querySelector<HTMLButtonElement>("#setup-start")!;
const themeBtn = document.querySelector<HTMLButtonElement>("#btn-theme")!;

const game = new Game();
const views = new Map<string, PieceView>();
const markers = new MoveMarkers();

let currentStyle: PieceStyle = getPieceStyle(loadPieceStyleId());

type SetupMode = AiDifficulty | "pvp";

const MODE_LABEL: Record<SetupMode, string> = {
  easy: "難度‧簡單",
  medium: "難度‧中等",
  hard: "難度‧困難",
  pvp: "雙人對弈",
};

let vsAI = true;
let playerSide: Side = "red";
let aiDifficulty: AiDifficulty = "medium";
let pendingMode: SetupMode = "medium";
let busy = true;
let selected: Piece | null = null;
let hoverId: string | null = null;

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
renderer.outputColorSpace = THREE.SRGBColorSpace;

let theme: ThemeMode = loadTheme();
applyDocumentTheme(theme);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  42,
  window.innerWidth / window.innerHeight,
  0.1,
  80,
);
camera.position.set(0, 12.2, 15.8);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 0.2, 0);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 9;
controls.maxDistance = 22;
controls.minPolarAngle = 0.38;
controls.maxPolarAngle = 1.28;
controls.dampingFactor = 0.06;

const environment = createEnvironment(scene);
environment.applyTheme(theme);
const hits = createHitPoints();
scene.add(hits);
scene.add(markers.group);
const dust = createDust();
setDustTheme(dust, theme);
scene.add(dust);

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pieceRoot = new THREE.Group();
scene.add(pieceRoot);

interface Tween {
  view: PieceView;
  from: THREE.Vector3;
  to: THREE.Vector3;
  t: number;
  dur: number;
  captured?: PieceView;
  onDone?: () => void;
}

const tweens: Tween[] = [];

function spawnPieces(drop: boolean): void {
  tweens.length = 0;
  for (const view of views.values()) {
    view.dispose();
    pieceRoot.remove(view.group);
  }
  views.clear();
  for (const piece of game.pieces()) {
    const view = new PieceView(piece, currentStyle);
    views.set(piece.id, view);
    pieceRoot.add(view.group);
    if (drop) {
      const dest = squareToWorld(piece.file, piece.rank, currentStyle.groundY);
      view.group.position.y = 2.4 + piece.rank * 0.08;
      tweens.push({
        view,
        from: view.group.position.clone(),
        to: dest,
        t: -piece.rank * 0.04 - piece.file * 0.012,
        dur: 0.55,
        onDone: () => {
          if (tweens.every((tw) => tw.t >= tw.dur)) onBoardReady();
        },
      });
    }
  }
}

function currentMode(): SetupMode {
  return vsAI ? aiDifficulty : "pvp";
}

function syncModeLabel(): void {
  modeLabelEl.textContent = MODE_LABEL[currentMode()];
}

function setStatus(): void {
  const outcome = game.outcome;
  statusEl.classList.remove("check", "over");
  if (outcome === "checkmate" || outcome === "stalemate") {
    const winner = opposite(game.side) === "red" ? "紅勝" : "黑勝";
    const how = outcome === "checkmate" ? "絕殺" : "困斃";
    statusEl.textContent = `${winner} · ${how}`;
    statusEl.classList.add("over");
    endTitleEl.textContent = `${winner} · ${how}`;
    endgameEl.hidden = false;
    return;
  }
  endgameEl.hidden = true;
  if (outcome === "check") {
    statusEl.classList.add("check");
    statusEl.textContent = game.side === "red" ? "紅方 · 被將軍" : "黑方 · 被將軍";
    return;
  }
  statusEl.textContent = game.side === "red" ? "紅方 · 行棋" : "黑方 · 行棋";
}

function clearSelection(): void {
  selected = null;
  markers.clear();
  for (const view of views.values()) view.setSelected(false);
}

function selectPiece(piece: Piece): void {
  selected = piece;
  for (const view of views.values()) view.setSelected(view.id === piece.id);
  markers.show(movesFrom(game.grid, piece.file, piece.rank), game.grid);
  tap(380, 0.04);
}

function animateMove(pieceId: string, move: Move, captured: Piece | null, then?: () => void): void {
  const view = views.get(pieceId);
  if (!view) {
    then?.();
    return;
  }
  const capView = captured ? views.get(captured.id) : undefined;
  const from = view.group.position.clone();
  const to = squareToWorld(move.toFile, move.toRank, currentStyle.groundY);
  busy = true;
  tweens.push({
    view,
    from,
    to,
    t: 0,
    dur: 0.32,
    captured: capView,
    onDone: () => {
      if (capView) {
        pieceRoot.remove(capView.group);
        capView.dispose();
        views.delete(capView.id);
      }
      view.place(move.toFile, move.toRank);
      then?.();
    },
  });
}

function isAITurn(): boolean {
  return vsAI && game.side !== playerSide;
}

function thinkingLabel(): string {
  return game.side === "red" ? "紅方 · 思考中" : "黑方 · 思考中";
}

function scheduleAI(): void {
  busy = true;
  statusEl.textContent = thinkingLabel();
  window.setTimeout(runAI, 80);
}

function onBoardReady(): void {
  const outcome = game.outcome;
  if (outcome === "checkmate" || outcome === "stalemate") {
    busy = false;
    return;
  }
  if (isAITurn()) {
    scheduleAI();
    return;
  }
  busy = false;
}

function canControl(piece: Piece): boolean {
  if (game.side !== piece.side) return false;
  return !vsAI || piece.side === playerSide;
}

function afterTurn(): void {
  clearSelection();
  setStatus();
  const outcome = game.outcome;
  if (outcome === "checkmate" || outcome === "stalemate") {
    busy = false;
    tap(180, 0.2);
    return;
  }
  if (isAITurn()) {
    scheduleAI();
    return;
  }
  busy = false;
}

function play(move: Move): void {
  const piece = game.grid[move.fromRank][move.fromFile];
  if (!piece) return;
  const id = piece.id;
  busy = true;
  clearSelection();
  const captured = game.play(move);
  tap(captured ? 220 : 460, captured ? 0.1 : 0.05);
  animateMove(id, move, captured, afterTurn);
}

function runAI(): void {
  if (!isAITurn()) {
    setStatus();
    busy = false;
    return;
  }
  const move = searchAiMove(game.grid, game.side, aiDifficulty);
  if (!move) {
    setStatus();
    busy = false;
    return;
  }
  play(move);
}

function onPointer(ev: PointerEvent): void {
  pointer.x = (ev.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(ev.clientY / window.innerHeight) * 2 + 1;
}

function pick(): { piece?: Piece; file?: number; rank?: number } {
  raycaster.setFromCamera(pointer, camera);
  const pieceHits = raycaster.intersectObjects(pieceRoot.children, true);
  for (const hit of pieceHits) {
    const id = hit.object.userData.id as string | undefined;
    if (!id) continue;
    const piece = game.pieces().find((p) => p.id === id);
    if (piece) return { piece, file: piece.file, rank: piece.rank };
  }
  const pointHits = raycaster.intersectObjects(hits.children, false);
  if (pointHits[0]) {
    const { file, rank } = pointHits[0].object.userData as {
      file: number;
      rank: number;
    };
    return { file, rank };
  }
  return {};
}

const pointerDown = { x: 0, y: 0, active: false };

canvas.addEventListener("pointermove", (ev) => {
  onPointer(ev);
  if (busy) {
    canvas.style.cursor = "default";
    return;
  }
  const { piece } = pick();
  hoverId = piece?.id ?? null;
  canvas.style.cursor = piece && canControl(piece) ? "pointer" : "default";
});

canvas.addEventListener("pointerdown", (ev) => {
  if (ev.button !== 0) return;
  pointerDown.x = ev.clientX;
  pointerDown.y = ev.clientY;
  pointerDown.active = true;
});

canvas.addEventListener("pointerup", (ev) => {
  if (ev.button !== 0 || !pointerDown.active) return;
  pointerDown.active = false;
  if (Math.hypot(ev.clientX - pointerDown.x, ev.clientY - pointerDown.y) > 6) return;
  if (busy) return;
  onPointer(ev);
  const picked = pick();
  if (picked.piece && canControl(picked.piece)) {
    selectPiece(picked.piece);
    return;
  }
  if (selected && picked.file !== undefined && picked.rank !== undefined) {
    const legal = movesFrom(game.grid, selected.file, selected.rank);
    const move = legal.find((m) =>
      sameMove(m, {
        fromFile: selected!.file,
        fromRank: selected!.rank,
        toFile: picked.file!,
        toRank: picked.rank!,
      }),
    );
    if (move) {
      play(move);
      return;
    }
  }
  clearSelection();
});

function undo(): void {
  if (busy) return;
  if (!game.history.length) return;
  if (vsAI) {
    if (game.side === playerSide) game.undo();
    if (game.history.length) game.undo();
  } else {
    game.undo();
  }
  spawnPieces(false);
  clearSelection();
  setStatus();
  tap(300, 0.05);
  if (isAITurn()) scheduleAI();
}

function openSetupModal(): void {
  pendingMode = vsAI ? aiDifficulty : "pvp";
  syncSetupModal();
  setupModal.hidden = false;
}

function closeSetupModal(): void {
  setupModal.hidden = true;
}

function syncSetupModal(): void {
  for (const btn of setupOptions.querySelectorAll<HTMLButtonElement>("button[data-mode]")) {
    btn.setAttribute("aria-checked", String(btn.dataset.mode === pendingMode));
  }
}

function confirmSetup(): void {
  if (pendingMode === "pvp") {
    vsAI = false;
  } else {
    vsAI = true;
    aiDifficulty = pendingMode;
    playerSide = "red";
  }
  syncModeLabel();
  faceCamera(vsAI ? playerSide : "red");
  closeSetupModal();
  newGame();
}

function newGame(): void {
  game.reset();
  endgameEl.hidden = true;
  clearSelection();
  spawnPieces(true);
  setStatus();
  busy = true;
}

function syncThemeButton(): void {
  themeBtn.setAttribute("aria-label", theme === "dark" ? "切換為淺色模式" : "切換為深色模式");
  themeBtn.title = theme === "dark" ? "淺色模式" : "深色模式";
}

function setTheme(next: ThemeMode): void {
  theme = next;
  applyDocumentTheme(theme);
  saveTheme(theme);
  environment.applyTheme(theme);
  setDustTheme(dust, theme);
  renderer.toneMappingExposure = theme === "dark" ? 1.08 : 1.02;
  const living = new Map(game.pieces().map((piece) => [piece.id, piece]));
  for (const view of views.values()) {
    const piece = living.get(view.id);
    if (piece) view.rebuild(piece, currentStyle);
  }
  syncThemeButton();
  tap(360, 0.04);
}

syncThemeButton();
syncModeLabel();

themeBtn.addEventListener("click", () => {
  setTheme(theme === "dark" ? "light" : "dark");
});

document.querySelector("#btn-new")!.addEventListener("click", openSetupModal);
document.querySelector("#btn-again")!.addEventListener("click", openSetupModal);
document.querySelector("#btn-undo")!.addEventListener("click", undo);

setupOptions.addEventListener("click", (ev) => {
  const btn = (ev.target as HTMLElement).closest("button[data-mode]");
  if (!btn) return;
  pendingMode = btn.getAttribute("data-mode") as SetupMode;
  syncSetupModal();
});

setupStartBtn.addEventListener("click", confirmSetup);

setupModal.addEventListener("click", (ev) => {
  if (ev.target === setupModal) closeSetupModal();
});

function setStyleMenuOpen(open: boolean): void {
  styleMenu.hidden = !open;
  styleBtn.setAttribute("aria-expanded", String(open));
}

function renderStyleMenu(): void {
  styleMenu.replaceChildren();
  for (const style of PIECE_STYLES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.role = "menuitemradio";
    btn.setAttribute("aria-checked", String(style.id === currentStyle.id));
    btn.addEventListener("click", () => applyPieceStyle(style.id));

    const preview = document.createElement("canvas");
    preview.width = 64;
    preview.height = 64;
    preview.className = "style-preview";
    preview.setAttribute("aria-hidden", "true");
    style.drawPreview(preview);

    const label = document.createElement("span");
    label.className = "style-label";
    label.textContent = style.label;

    btn.append(preview, label);
    styleMenu.append(btn);
  }
}

function applyPieceStyle(id: string): void {
  currentStyle = getPieceStyle(id);
  savePieceStyleId(currentStyle.id);
  const living = new Map(game.pieces().map((piece) => [piece.id, piece]));
  for (const view of views.values()) {
    const piece = living.get(view.id);
    if (piece) view.rebuild(piece, currentStyle);
  }
  for (const tw of tweens) tw.to.y = currentStyle.groundY;
  renderStyleMenu();
  setStyleMenuOpen(false);
  tap(400, 0.04);
}

styleBtn.addEventListener("click", (ev) => {
  ev.stopPropagation();
  setStyleMenuOpen(styleMenu.hidden);
});

document.addEventListener("click", (ev) => {
  const target = ev.target as Node;
  if (!styleMenu.hidden && !styleBtn.contains(target) && !styleMenu.contains(target)) {
    setStyleMenuOpen(false);
  }
});

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

const camFrom = new THREE.Vector3(0, 16, 18);
const camTo = new THREE.Vector3(0, 9.4, 13.8);
const clock = new THREE.Clock();
const introCam = { t: 0 };

function faceCamera(side: Side): void {
  const sign = side === "red" ? 1 : -1;
  camFrom.set(0, 16, 18 * sign);
  camTo.set(0, 9.4, 13.8 * sign);
  if (introCam.t >= 1) camera.position.copy(camTo);
}

function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

function tick(): void {
  requestAnimationFrame(tick);
  const dt = clock.getDelta();
  controls.update();

  if (introCam.t < 1) {
    introCam.t = Math.min(1, introCam.t + dt * 0.45);
    const k = easeOut(introCam.t);
    camera.position.lerpVectors(camFrom, camTo, k);
  }

  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt;
    const u = Math.min(1, Math.max(0, tw.t / tw.dur));
    const k = easeOut(u);
    tw.view.group.position.lerpVectors(tw.from, tw.to, k);
    tw.view.group.position.y = THREE.MathUtils.lerp(tw.from.y, tw.to.y, k) + Math.sin(k * Math.PI) * 0.35;
    if (tw.captured) {
      tw.captured.group.scale.setScalar(1 - k);
      tw.captured.group.position.y = currentStyle.groundY - k * 0.2;
    }
    if (u >= 1) {
      tw.view.group.position.copy(tw.to);
      tw.onDone?.();
      tweens.splice(i, 1);
    }
  }

  const pos = dust.geometry.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i) + dt * 0.12;
    if (y > 6) y = 0.2;
    pos.setY(i, y);
  }
  pos.needsUpdate = true;

  if (hoverId && !busy) {
    const v = views.get(hoverId);
    if (v && !v.isSelected()) v.setHover(true);
  }
  for (const [id, view] of views) {
    if (id !== hoverId && !view.isSelected() && !tweens.some((t) => t.view === view)) {
      view.setHover(false);
    }
  }

  for (const side of ["red", "black"] as const) {
    const king = findKing(game.grid, side);
    const kv = king ? views.get(king.id) : undefined;
    if (!kv || kv.isSelected()) continue;
    if (game.outcome === "check" && game.side === side) {
      kv.pulse(0.28 + Math.sin(clock.elapsedTime * 7) * 0.22);
    } else {
      kv.pulse(0);
    }
  }

  renderer.render(scene, camera);
}

async function boot(): Promise<void> {
  try {
    await document.fonts.load('700 64px "Noto Serif TC"');
    await document.fonts.load('700 124px "Noto Serif TC"');
  } catch {
    /* local fallback fonts still render glyphs */
  }
  await document.fonts.ready;
  scene.add(createBoard());
  renderStyleMenu();
  faceCamera(playerSide);
  spawnPieces(true);
  setStatus();
  tick();
}

void boot();
