#!/bin/bash
set -e

echo "=========================================="
echo " Buku Tamu Digital -- Backend Entrypoint"
echo "=========================================="

# ─── Tulis ulang .env dari env vars Docker ────────────────────────────────────
# Ini penting! Kalau tidak, Laravel akan baca .env lokal yang punya DB_HOST=127.0.0.1
echo "[1/6] Menulis .env dari Docker environment..."
cat > /var/www/html/.env << EOF
APP_NAME=BukuTamu
APP_ENV=${APP_ENV:-local}
APP_KEY=${APP_KEY:-}
APP_DEBUG=${APP_DEBUG:-true}
APP_URL=${APP_URL:-http://localhost:8000}

LOG_CHANNEL=stack
LOG_LEVEL=debug

DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-mysql}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-buku_tamu_digital}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-admin123}

SESSION_DRIVER=${SESSION_DRIVER:-database}
SESSION_LIFETIME=120
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=null

BROADCAST_CONNECTION=log
FILESYSTEM_DISK=local
QUEUE_CONNECTION=${QUEUE_CONNECTION:-database}

CACHE_STORE=${CACHE_STORE:-database}
EOF
echo "    .env berhasil ditulis!"

# ─── Generate App Key jika belum ada ─────────────────────────────────────────
echo "[2/6] Mengecek APP_KEY..."
if grep -q "APP_KEY=$" /var/www/html/.env; then
    php artisan key:generate --no-interaction
    echo "    APP_KEY berhasil digenerate!"
else
    echo "    APP_KEY sudah ada, skip."
fi

# ─── Tunggu MySQL siap ────────────────────────────────────────────────────────
echo "[3/6] Menunggu MySQL siap di host '${DB_HOST}'..."
MAX_TRIES=30
COUNT=0
until php -r "
    try {
        \$pdo = new PDO(
            'mysql:host=${DB_HOST};port=${DB_PORT:-3306};dbname=${DB_DATABASE}',
            '${DB_USERNAME}',
            '${DB_PASSWORD}',
            [PDO::ATTR_TIMEOUT => 3]
        );
        exit(0);
    } catch (Exception \$e) {
        exit(1);
    }
" 2>/dev/null; do
    COUNT=$((COUNT + 1))
    if [ $COUNT -ge $MAX_TRIES ]; then
        echo "    ERROR: MySQL tidak merespon setelah ${MAX_TRIES} percobaan. Cek konfigurasi!"
        exit 1
    fi
    echo "    MySQL belum siap (percobaan ${COUNT}/${MAX_TRIES}), coba lagi..."
    sleep 3
done
echo "    MySQL siap!"

# ─── Run Migrations & Seeder ────────────────────────────────────────────────────
echo "[4/6] Menjalankan migrations..."
php artisan migrate --force --no-interaction
echo "    Migrations selesai!"

echo "[4.5/6] Menjalankan seeder..."
php artisan db:seed --force --no-interaction
echo "    Seeder selesai!"

# ─────────────────────────────────────────────────────────────────────────────
# CATATAN SEEDER:
#   Seeder tidak dijalankan otomatis. Untuk seed manual:
#
#   docker exec buku_tamu_backend php artisan db:seed
#   docker exec buku_tamu_backend php artisan db:seed --class=NamaSeedernya
# ─────────────────────────────────────────────────────────────────────────────

# ─── Storage Link ─────────────────────────────────────────────────────────────
echo "[5/6] Membuat storage link..."
php artisan storage:link --no-interaction 2>/dev/null || true

# ─── Cache Config & Routes ────────────────────────────────────────────────────
echo "[6/6] Caching config & routes..."
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction

echo "=========================================="
echo " Setup selesai! Menjalankan Apache..."
echo "=========================================="

# Fix agresif untuk Railway: Hapus semua file load MPM lalu aktifkan prefork
rm -f /etc/apache2/mods-enabled/mpm_*.load
rm -f /etc/apache2/mods-enabled/mpm_*.conf
a2enmod mpm_prefork

# Fix Port untuk Railway: Apache harus mendengarkan di port yang diberikan Railway
PORT=${PORT:-80}
sed -i "s/Listen 80/Listen ${PORT}/g" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost \*:${PORT}>/g" /etc/apache2/sites-available/000-default.conf

exec apache2-foreground
