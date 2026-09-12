# 楚河漢界 · 3D 中國象棋

Browser-based 3D Chinese chess (Xiangqi) built with **Three.js**, **TypeScript**, and **Vite**.

## Prerequisites

- [Node.js](https://nodejs.org/) **18+** (LTS recommended)
- npm (included with Node.js)

## Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/sonicli/ChineseChess.git
   cd ChineseChess
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

   If esbuild postinstall scripts are blocked on your machine, approve them when prompted, or run:

   ```bash
   npm approve-scripts esbuild
   ```

3. **Start the development server**

   ```bash
   npm run dev
   ```

   Vite will start locally and open the game in your browser (default: [http://localhost:5173](http://localhost:5173)).

## Other commands

| Command           | Description                          |
| ----------------- | ------------------------------------ |
| `npm run build`   | Type-check and build for production  |
| `npm run preview` | Preview the production build locally |

After building, run `npm run preview` to serve the `dist/` folder.

## GitHub Pages

The site is deployed automatically on every push to `main` via GitHub Actions.

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source**, choose **GitHub Actions**.
2. Push these changes to `main` (or run the **Deploy to GitHub Pages** workflow manually under **Actions**).
3. When the workflow finishes, the game is at:

   [https://sonicli.github.io/ChineseChess/](https://sonicli.github.io/ChineseChess/)

Vite is configured with `base: "/ChineseChess/"` so asset paths work under that URL.

## Playing

- Use the top menu bar: **新局**, **悔棋**, **棋子樣式**, and the sun/moon control for **淺色 / 深色** mode.
- Click **新局** to open setup: **對弈電腦** / **雙人對弈**, **執紅** / **執黑**, and difficulty (**簡單** / **中等** / **困難**) when playing the AI.
- Drag to rotate the board; click a piece, then a highlighted square to move.
