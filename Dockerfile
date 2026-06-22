#############################
# 0) Shared PHP base
#############################
FROM serversideup/php:8.4-fpm-nginx-alpine AS php-base

USER root

WORKDIR /var/www/html

RUN install-php-extensions gd


#############################
# 1) Composer dependencies
#############################
FROM php-base AS vendor

USER root

WORKDIR /app

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

COPY composer.json composer.lock ./

RUN --mount=type=cache,target=/tmp/composer-cache \
    COMPOSER_CACHE_DIR=/tmp/composer-cache \
    composer install \
    --no-dev \
    --no-interaction \
    --prefer-dist \
    --optimize-autoloader \
    --classmap-authoritative \
    --no-scripts


#############################
# 2) Frontend assets
#############################
FROM node:20-alpine AS frontend

WORKDIR /app

COPY package.json package-lock.json ./

RUN --mount=type=cache,target=/root/.npm \
    npm ci \
    --no-audit \
    --no-fund

COPY resources ./resources
COPY public ./public
COPY bootstrap ./bootstrap
COPY tsconfig.json ./
COPY vite.config.* ./

# Tambahkan file lain jika ada dan dibutuhkan Vite
COPY components.json ./

RUN npm run build


#############################
# 3) Application runtime
#############################
FROM php-base AS app-runtime

USER root

WORKDIR /var/www/html

COPY . .

COPY --from=vendor /app/vendor ./vendor
COPY --from=frontend /app/public/build ./public/build

RUN mkdir -p \
    storage/app/public \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache \
    && ln -sfn \
    /var/www/html/storage/app/public \
    /var/www/html/public/storage \
    && chown -R www-data:www-data \
    storage \
    bootstrap/cache \
    && chown -h www-data:www-data \
    public/storage \
    && rm -f /usr/local/bin/composer /usr/bin/composer

USER www-data

EXPOSE 8080