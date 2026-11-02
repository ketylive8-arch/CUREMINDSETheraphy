// מהדר את קבצי ה-JSX (runtime קלאסי: React.createElement) ל-dist/*.js.
// מקבל כארגומנט את התיקייה שבה מותקנים @babel/core ו-@babel/preset-react.
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const dir = process.argv[2];
const require = createRequire(dir.replace(/\/?$/, "/") + "x.js");
const babel = require("@babel/core");
const preset = require.resolve("@babel/preset-react");
mkdirSync("dist", { recursive: true });
for (const f of ["app", "workshops", "resilienceDashboard", "memberArea", "main"]) {
  const out = babel.transformSync(readFileSync(f + ".js", "utf8"), {
    filename: f + ".js", babelrc: false, configFile: false, compact: false,
    presets: [[preset, { runtime: "classic" }]],
  });
  writeFileSync("dist/" + f + ".js", out.code + "\n");
  console.log("dist/" + f + ".js", out.code.length);
}
