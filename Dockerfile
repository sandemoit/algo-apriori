# syntax=docker/dockerfile:1.7

#############################
# 0) Shared PHP base
#############################
FROM serversideup/php:8.4-fpm-nginx-alpine AS php-base

USER root

WORKDIR /var/www/html

# Hapus jika aplikasi tidak benar-benar memakai GD.
RUN install-php-extensions gd


#############################
# 1) Composer dependencies
#############################
FROM php-base AS vendor

USER root

WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

# Dependency di-cache berdasarkan composer.json dan composer.lock.
# Autoloader dibuat nanti setelah source code tersedia.
RUN --mount=type=cache,target=/tmp/composer-cache \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --no-progress \
    --no-scripts \
    --no-autoloader


#############################
# 2) Frontend assets
#############################
FROM php-base AS frontend

USER root

WORKDIR /app

RUN apk add --no-cache nodejs npm \
    && node --version \
    && npm --version

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY package.json package-lock.json ./

# Aktifkan jika .npmrc hanya berisi konfigurasi.
# Jangan COPY jika berisi registry token.
# COPY .npmrc ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
    --include=dev \
    --no-audit \
    --no-fund

COPY --from=vendor /app/vendor ./vendor

# Source Laravel yang diperlukan Composer, Artisan dan Wayfinder.
COPY artisan composer.json composer.lock ./

COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY public ./public
COPY resources ./resources
COPY routes ./routes

COPY tsconfig.json components.json vite.config.ts ./

RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache

# Source code sudah tersedia, jadi autoloader App dapat dibuat dengan benar.
RUN composer dump-autoload \
    --no-dev \
    --optimize \
    --no-scripts \
    && php artisan package:discover --ansi \
    && npm run build


#############################
# 3) Application runtime
#############################
FROM php-base AS app-runtime

USER root

WORKDIR /var/www/html

# Copy hanya file yang dibutuhkan runtime.
# Jangan memakai COPY . .
COPY artisan composer.json composer.lock ./

COPY app ./app
COPY bootstrap ./bootstrap
COPY config ./config
COPY database ./database
COPY public ./public
COPY resources ./resources
COPY routes ./routes

COPY --from=frontend /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && rm -rf public/storage \
    && ln -s ../storage/app/public public/storage \
    && php artisan package:discover --ansi \
    && chown -R www-data:www-data \
    storage \
    bootstrap/cache \
    && chown -h www-data:www-data public/storage \
    && rm -f \
    /usr/local/bin/composer \
    /usr/bin/composer

USER www-data

EXPOSE 8080