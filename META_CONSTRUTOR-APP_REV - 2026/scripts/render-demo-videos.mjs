// Renderiza os vídeos demonstrativos (src/remotion/clips.ts) em public/videos/<id>.mp4 + pôster .jpg.
//
// Uso: node scripts/render-demo-videos.mjs [--poster-only] [id ...]
//   REMOTION_BROWSER=/caminho/chrome-headless-shell  (opcional; senão o Remotion baixa o próprio)
//   INTER_FONT_DIR=/caminho/com/inter-latin-{400,600,800}-normal.woff2  (opcional;
//     padrão node_modules/@fontsource/inter/files — sem a fonte, o vídeo usa a fonte do sistema)
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(".");
const clipsSource = readFileSync(resolve("src/remotion/clips.ts"), "utf8");
const allIds = [...clipsSource.matchAll(/^  '([a-z0-9-]+)': \{/gm)].map((match) => match[1]);
const args = process.argv.slice(2);
const posterOnly = args.includes("--poster-only");
const requested = args.filter((arg) => !arg.startsWith("--"));
const ids = requested.length ? requested : allIds;

// Public dir temporário: prints usados nos roteiros + fonte Inter.
const publicDir = mkdtempSync(join(tmpdir(), "mc-remotion-"));
mkdirSync(join(publicDir, "marketing"), { recursive: true });
for (const [, file] of clipsSource.matchAll(/shot\('([^']+)'\)/g)) {
  const name = `prd-prints-2026-06-04-${file}.webp`;
  cpSync(resolve("public/marketing", name), join(publicDir, "marketing", name));
}
const fontDir = process.env.INTER_FONT_DIR || resolve("node_modules/@fontsource/inter/files");
mkdirSync(join(publicDir, "fonts"), { recursive: true });
for (const weight of [400, 600, 800]) {
  const font = join(fontDir, `inter-latin-${weight}-normal.woff2`);
  if (existsSync(font)) cpSync(font, join(publicDir, "fonts", `inter-latin-${weight}-normal.woff2`));
}

mkdirSync(resolve("public/videos"), { recursive: true });
const browser = process.env.REMOTION_BROWSER ? [`--browser-executable=${process.env.REMOTION_BROWSER}`] : [];
const remotion = (args) =>
  execFileSync("npx", ["remotion", ...args, `--public-dir=${publicDir}`, ...browser, "--log=error"], { cwd: root, stdio: "inherit" });

try {
  for (const id of ids) {
    const video = `public/videos/${id}.mp4`;
    const poster = `public/videos/${id}.jpg`;
    if (!posterOnly) remotion(["render", "src/remotion/index.ts", id, video, "--codec=h264", "--crf=30", "--pixel-format=yuv420p"]);
    // Pôster: primeira tela já nítida (depois do título, quando houver) e antes de o zoom cortar o topo.
    const posterFrame = id === "tour-produto" ? 70 : 40;
    remotion(["still", "src/remotion/index.ts", id, poster, `--frame=${posterFrame}`, "--image-format=jpeg", "--jpeg-quality=82"]);
    const kb = (file) => Math.round(statSync(resolve(file)).size / 1024);
    console.log(`${id}: ${kb(video)} KB (mp4) · ${kb(poster)} KB (pôster)`);
  }
} finally {
  rmSync(publicDir, { recursive: true, force: true });
}
