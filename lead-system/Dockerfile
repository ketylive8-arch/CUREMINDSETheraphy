# Segev MKG · Lead System — production container for Render
# Apache + mod_php (multi-process, handles real concurrent traffic) +
# PDO Postgres (persistent DB) with SQLite kept for local development.
FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libsqlite3-dev libpq-dev \
    && docker-php-ext-install pdo_sqlite pdo_pgsql \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . /app

# Writable data dir (SQLite fallback for local dev) + Apache vhost + start script.
RUN mkdir -p /app/data && chmod -R 777 /app/data \
    && cp docker/000-default.conf /etc/apache2/sites-available/000-default.conf \
    && chmod +x docker/start.sh

# Render provides $PORT. The start script binds Apache to it, seeds (idempotent),
# then serves in the foreground.
CMD ["sh", "docker/start.sh"]
