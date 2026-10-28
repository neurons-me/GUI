#!/usr/bin/env node

/**
 * This.GUI CLI (ESM version)
 *
 * Usage:
 *   npx this.gui my-app
 *   npx this.gui --html
 */

import fsExtra from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`This.GUI CLI

Usage:
  npx this.gui <project-name>
  npx this.gui <dir> --html
  npx this.gui --html

Flags:
  --html   Generate a plain HTML runtime with GUI.mount() (no Vite)

What you get (default):
  - Vite + React app pre-wired with this.gui and this.me
  - AppShell — declare your app in .me, project it in GUI
  - Left rail (nav, Theme, .me, Dev Tools) and a top bar with your position

Docs:
  https://neurons-me.github.io/GUI/

Examples:
  npx this.gui my-app
  npx this.gui fulltrailer
`);
  process.exit(0);
}

// ─── Determine app name ────────────────────────────────────────────────────────
const appName = args.find((arg) => !arg.startsWith("-")) || "my-app";
const wantsHtml = args.includes("--html");

// ─── HTML mode ────────────────────────────────────────────────────────────────
const firstArg = args[0];
const htmlDirName = firstArg && !firstArg.startsWith("-") ? firstArg : ".";
const htmlTargetDir = path.resolve(process.cwd(), htmlDirName);
const htmlOutPath = path.join(htmlTargetDir, "index.html");
const htmlTemplate = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>this.GUI — Minimal Mount</title>
  </head>
  <body>
    <div id="root"></div>
    <script src="https://cdn.jsdelivr.net/npm/react@18/umd/react.production.min.js" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/react-dom@18/umd/react-dom.production.min.js" crossorigin="anonymous"></script>
    <script>
      window.process = window.process || { env: { NODE_ENV: 'production' } };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/this.gui@latest/dist/this.gui.umd.js" crossorigin="anonymous"></script>
    <script>
      (function () {
        const GUI = window.GUI;
        if (!GUI) {
          document.body.innerHTML = '<pre style="padding:16px">Missing window.GUI (this.gui.umd.js not loaded)</pre>';
          return;
        }
        if (typeof GUI.mount !== 'function') {
          document.body.innerHTML = '<pre style="padding:16px">window.GUI.mount is not available in this build</pre>';
          return;
        }
        const spec = { type: 'Home', props: {} };
        const ctx = {};
        GUI.mount(spec, '#root', { ctx });
        console.log('[this.GUI] mounted via GUI.mount');
      })();
    </script>
  </body>
</html>
`;

// ─── Template selection ────────────────────────────────────────────────────────
const distTemplateDir = path.resolve(__dirname, "../../npx/template");
const srcTemplateDir  = path.resolve(__dirname, "../npx/template");
const templateDir = fsExtra.existsSync(distTemplateDir) ? distTemplateDir : srcTemplateDir;

const targetDir = path.resolve(process.cwd(), appName);

// ─── Banner ────────────────────────────────────────────────────────────────────
console.log(`
      ▗▄▄▖▗▖ ▗▖▗▄▄▄▖
     ▐▌   ▐▌ ▐▌  █
     ▐▌▝▜▌▐▌ ▐▌  █
this.▝▚▄▞▘▝▚▄▞▘▗▄█▄▖
${wantsHtml ? `🧩 Creating HTML runtime (${htmlDirName})` : `🧩 Creating: ${appName}`}`);

// ─── Token replacement helper (for child template) ────────────────────────────
/**
 * Replace app-name tokens in all text files
 * under targetDir after copying the template.
 */
function applyTokens(dir: string, kebab: string): void {
  const title = kebab
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");

  const TEXT_EXTS = new Set([
    ".ts", ".tsx", ".js", ".jsx", ".json", ".md",
    ".html", ".css", ".gitignore",
  ]);

  function walk(current: string) {
    for (const entry of fsExtra.readdirSync(current)) {
      const full = path.join(current, entry);
      if (fsExtra.statSync(full).isDirectory()) {
        walk(full);
      } else if (TEXT_EXTS.has(path.extname(full)) || entry.startsWith(".")) {
        try {
          const content = fsExtra.readFileSync(full, "utf8");
          if (content.includes("__APP_ID__") || content.includes("__APP_TITLE__")) {
            fsExtra.writeFileSync(
              full,
              content.replace(/__APP_TITLE__/g, title).replace(/__APP_ID__/g, kebab),
              "utf8"
            );
          }
        } catch { /* skip binary */ }
      }
    }
  }

  walk(dir);
}

// ─── Execute ────────────────────────────────────────────────────────────────────
try {
  if (wantsHtml) {
    fsExtra.ensureDirSync(htmlTargetDir);
    fsExtra.writeFileSync(htmlOutPath, htmlTemplate, "utf8");
    console.log(`\n🧩 this.GUI HTML runtime created:`);
    console.log(`📄 ${htmlOutPath}\n`);
    console.log(`Next steps:\n  - Open index.html in a browser (or serve the folder)\n  - Edit the spec in the script tag to build your GUI tree\n`);
    process.exit(0);
  }

  if (!fsExtra.existsSync(templateDir)) {
    throw new Error(`Template directory not found: ${templateDir}`);
  }

  fsExtra.copySync(templateDir, targetDir);

  applyTokens(targetDir, appName);

  console.log(`📁 Project @ ${targetDir}`);
  console.log(`\n✅ Done!\n`);
  console.log(`Next steps:\n  cd ${appName}\n  npm install\n  npm run dev\n\nDocs:\n  https://neurons-me.github.io/GUI/\n`);
} catch (error) {
  console.error("❌ Error creating project:", error);
  process.exit(1);
}
