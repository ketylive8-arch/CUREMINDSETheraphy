#!/bin/sh
# Bind Apache to Render's $PORT, seed the DB (idempotent), then serve.
set -e
PORT="${PORT:-10000}"

sed -i "s/^Listen .*/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/APACHE_PORT/${PORT}/g" /etc/apache2/sites-available/000-default.conf

# Seed is idempotent: creates the schema + admin on first boot, and with a
# persistent Postgres it never overwrites real data afterwards. Never let a
# seed hiccup stop the site from serving.
php seed/seed.php || echo "seed step reported an issue (continuing to serve)"

# Apache serves as www-data; make sure it can write the SQLite file created by
# the (root) seed step during the interim before Postgres is wired. Harmless
# once DATABASE_URL points at Postgres (the data dir is then unused).
chmod -R 777 /app/data 2>/dev/null || true

# סוכני הלידים: טיימר ברקע שמריץ אותם פעם בשעה (מתחיל מחדש אם נפל).
( while true; do php docker/hunt-loop.php; echo "[hunter] הטיימר נעצר — מפעיל מחדש"; sleep 30; done ) &

exec apache2-foreground
