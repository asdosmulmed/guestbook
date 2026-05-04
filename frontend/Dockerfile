# FROM node:20-alpine

# WORKDIR /app

# # ─── Install Dependencies ─────────────────────────────────────────────────────
# # Copy package files dulu agar layer ini di-cache kalau src belum berubah
# COPY package.json package-lock.json ./
# RUN npm install

# # ─── Copy Source ──────────────────────────────────────────────────────────────
# COPY . .

# EXPOSE 5173

# # --host 0.0.0.0 agar Vite bisa diakses dari luar container
# CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]


# ========================================
# === PRODUCTION RAILWAY ===
# ========================================
# ─── Stage 1: Build React App ─────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

# VITE_API_URL di-inject saat build
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ─── Stage 2: Serve static files ──────────────────────────────────────────────
FROM node:20-alpine

RUN npm install -g serve

WORKDIR /app

COPY --from=builder /app/dist ./dist

# Railway inject $PORT otomatis, default 3000
EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]

