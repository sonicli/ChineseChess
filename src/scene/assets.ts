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

  // Even base tone — avoid large gradients (they read as “two boards”).
  ctx.fillStyle = "#efe2c8";
  ctx.fillRect(0, 0, w, h);

  // Soft grain via periodic functions (seamless if we ever tile again).
  const img = ctx.getImageData(0, 0, w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const u = (x / w) * Math.PI * 2;
      const v = (y / h) * Math.PI * 2;
      const grain =
        Math.sin(u * 22 + Math.sin(v * 2.5) * 1.2) * 0.55 +
        Math.sin(u * 48 + v * 1.8) * 0.22 +
        Math.sin(v * 9 + u * 0.6) * 0.1;
      const n = grain * 9;
      const i = (y * w + x) * 4;
      data[i] = Math.min(255, Math.max(0, data[i] + n * 0.85));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n * 0.7));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n * 0.45));
    }
  }
  ctx.putImageData(img, 0, 0);

  const tex = new THREE.CanvasTexture(canvas);
  // One tile across the whole top — mid-board RepeatWrapping seams sat on the river line.
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(1, 1);
  tex.generateMipmaps = false;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
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

export function skyTexture(mode: "light" | "dark" = "light"): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 512);

  if (mode === "dark") {
    g.addColorStop(0, "#050810");
    g.addColorStop(0.35, "#0c1428");
    g.addColorStop(0.65, "#1a2744");
    g.addColorStop(0.88, "#243552");
    g.addColorStop(1, "#1a2a1c");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 180; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 280;
      const a = 0.35 + Math.random() * 0.55;
      ctx.fillStyle = `rgba(220,230,255,${a})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.random() * 1.4 + 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
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
  }

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
  ctx.font = '64px "Noto Serif TC", "Noto Serif SC", "Songti TC", serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 8;
  ctx.fillText(text, 128, 68);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
