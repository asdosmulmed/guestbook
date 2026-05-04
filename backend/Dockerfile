FROM php:8.2-apache

# ─── System Dependencies ───────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y \
    git \
    curl \
    zip \
    unzip \
    libzip-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install \
        pdo_mysql \
        mysqli \
        mbstring \
        exif \
        pcntl \
        bcmath \
        gd \
        zip \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# ─── Apache Config (enable mod_rewrite untuk Laravel routing) ──────────────────
RUN a2enmod rewrite \
    && a2dismod mpm_event mpm_worker || true \
    && a2enmod mpm_prefork || true

COPY ./apache.conf /etc/apache2/sites-available/000-default.conf

# ─── Install Composer ──────────────────────────────────────────────────────────
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# ─── Setup Working Directory ───────────────────────────────────────────────────
WORKDIR /var/www/html

# ─── Copy & Install Dependencies ──────────────────────────────────────────────
COPY composer.json composer.lock ./
RUN composer install --no-scripts --no-autoloader --no-interaction

COPY . .

RUN composer dump-autoload --optimize

# ─── Fix Permissions ──────────────────────────────────────────────────────────
RUN chown -R www-data:www-data /var/www/html/storage /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache

# ─── Entrypoint ───────────────────────────────────────────────────────────────
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
# Fix Windows CRLF line endings agar script bisa dijalankan di Linux
RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
    && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
