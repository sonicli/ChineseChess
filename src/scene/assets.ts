import * as THREE from "three";

export const CELL = 1.16;
export const PIECE_Y = 0.02;

export function squareToWorld(
  file: number,
  rank: number,
  y = PIECE_Y,
): THREE.Vector3 {
  return new THREE.Vector3((file - 4) * CELL, y, (4.5 - rank) * CELL);
}

export function woodTexture(
  width: number,
  height: number,
  dark: string,
  light: string,
): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, width, height);
  for (let i = 0; i < 90; i++) {
    const x = (i / 90) * width + Math.sin(i * 1.7) * 8;
    ctx.strokeStyle = i % 3 === 0 ? light : `${light}55`;
    ctx.globalAlpha = 0.08 + (i % 5) * 0.015;
    ctx.lineWidth = 1 + (i % 4);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= height; y += 8) {
      ctx.lineTo(x + Math.sin(y * 0.04 + i) * 6, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Light natural oak grain for the playing surface. */
export function boardWoodTexture(): THREE.CanvasTexture {
  const w = 1024;
  const h = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;

  const base = ctx.createLinearGradient(0, 0, w, w);
  base.addColorStop(0, "#f6ead6");
  base.addColorStop(0.45, "#efe2c8");
  base.addColorStop(1, "#e8d4b4");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 48; i++) {
    const y = (i / 48) * h + Math.sin(i * 2.1) * 6;
    ctx.strokeStyle = `rgba(180, 140, 96, ${0.06 + (i % 4) * 0.02})`;
    ctx.lineWidth = 2 + (i % 3);
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 24) {
      ctx.lineTo(x, y + Math.sin(x * 0.018 + i) * 5);
    }
    ctx.stroke();
  }

  for (let i = 0; i < 110; i++) {
    const x = (i / 110) * w + Math.sin(i * 1.4) * 10;
    ctx.strokeStyle = i % 4 === 0 ? "rgba(168, 128, 82, 0.14)" : "rgba(200, 168, 120, 0.09)";
    ctx.globalAlpha = 0.55 + (i % 5) * 0.08;
    ctx.lineWidth = 0.8 + (i % 3) * 0.4;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= h; y += 10) {
      ctx.lineTo(x + Math.sin(y * 0.035 + i * 0.7) * 7, y);
    }
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  for (let i = 0; i < 2200; i++) {
    ctx.fillStyle = `rgba(140, 108, 72, ${Math.random() * 0.04})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1.6, 1.6);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function grassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3a8a38";
  ctx.fillRect(0, 0, 1024, 1024);

  for (let i = 0; i < 80; i++) {
    ctx.fillStyle = i % 2 === 0 ? "rgba(46, 120, 42, 0.35)" : "rgba(90, 160, 55, 0.28)";
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 1024,
      Math.random() * 1024,
      40 + Math.random() * 90,
      28 + Math.random() * 70,
      Math.random() * Math.PI,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }

  for (let i = 0; i < 9000; i++) {
    const x = Math.random() * 1024;
    const y = Math.random() * 1024;
    const h = 4 + Math.random() * 10;
    ctx.strokeStyle =
      Math.random() > 0.55
        ? "rgba(28, 90, 32, 0.45)"
        : "rgba(170, 210, 80, 0.35)";
    ctx.lineWidth = 0.8 + Math.random();
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 3, y - h);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(14, 14);
  tex.anisotropy = 8;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function skyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#3e8fd9");
  g.addColorStop(0.38, "#6bb7ea");
  g.addColorStop(0.68, "#a8d8f5");
  g.addColorStop(0.88, "#d7eefc");
  g.addColorStop(1, "#c8e6b8");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 1024, 512);

  const cloud = (cx: number, cy: number, scale: number, alpha: number) => {
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    for (let i = 0; i < 7; i++) {
      const dx = (i - 3) * 28 * scale;
      const dy = Math.sin(i * 1.4) * 12 * scale;
      const r = (22 + (i % 3) * 10) * scale;
      ctx.beginPath();
      ctx.ellipse(cx + dx, cy + dy, r * 1.6, r, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };
  cloud(180, 150, 1.15, 0.55);
  cloud(520, 110, 0.9, 0.42);
  cloud(820, 175, 1.25, 0.5);
  cloud(360, 210, 0.7, 0.32);
  cloud(680, 230, 0.85, 0.28);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function riverLabel(text: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 256, 128);
  ctx.fillStyle = "#6b4a28";
  ctx.font = '64px "Ma Shan Zheng", "Noto Serif SC", "Songti SC", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
