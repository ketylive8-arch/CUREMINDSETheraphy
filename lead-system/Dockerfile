# Segev MKG · Lead System — container for Render (PHP 8.3 + SQLite)
FROM php:8.3-cli

# SQLite PDO driver
RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev \
    && docker-php-ext-install pdo_sqlite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

# Writable data dir for the SQLite file
RUN mkdir -p /app/data && chmod -R 777 /app/data

# Render provides $PORT. Seed on boot (idempotent) then serve the app.
CMD ["sh", "-c", "php seed/seed.php; php -S 0.0.0.0:${PORT:-10000} api/router.php"]
