#!/bin/sh
# מהדר מראש את קבצי ה-JSX של האתר הציבורי ל-dist/*.js, כדי שהדפדפן לא יצטרך
# לטעון את Babel (מעל 3MB) ולהדר בכל כניסה. להריץ אחרי כל שינוי ב-app.js,
# workshops.js, resilienceDashboard.js, memberArea.js או main.js, ולעשות commit ל-dist/.
# שימוש: sh scripts/build-jsx.sh
set -e
cd "$(dirname "$0")/.."
T="${TMPDIR:-/tmp}/cm-babel"
mkdir -p "$T"
[ -d "$T/node_modules/@babel/core" ] || (cd "$T" && npm init -y >/dev/null && npm i @babel/core@7 @babel/preset-react@7 >/dev/null)
node scripts/build-jsx.mjs "$T"
