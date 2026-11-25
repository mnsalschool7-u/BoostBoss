// Package only public Pequod assets. Never copy server files or environment files.
const fs = require("node:fs");
const path = require("node:path");
const out = path.resolve(__dirname, "../dist");
fs.mkdirSync(out, { recursive: true });
for (const file of ["index.html", "styles.css", "design.css", "script.js"]) {
  fs.copyFileSync(path.resolve(__dirname, "..", file), path.join(out, file));
}
for (const dir of ["shipsmart", "assets", "demo/llamaparse", "team", "login"]) {
  fs.cpSync(path.resolve(__dirname, "..", dir), path.join(out, dir), {
    recursive: true,
  });
}
console.log("Pequod static site built in dist.");
