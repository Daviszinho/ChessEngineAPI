FROM node:20-bookworm-slim

# Enable non-free repos (needed for some chess engines such as crafty on Debian).
RUN set -eux; \
    sed -i 's/^Components: .*/Components: main contrib non-free non-free-firmware/' /etc/apt/sources.list.d/debian.sources; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      curl \
      ca-certificates \
      stockfish \
      toga2 \
      phalanx \
      glaurung \
      gnuchess \
      crafty; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY engines ./engines
RUN find ./engines -maxdepth 1 -type f -exec chmod +x {} \;

ENV NODE_ENV=production
ENV PORT=3000
ENV FRUIT_PATH=/app/engines/fruit
ENV RECKLESS_PATH=/app/engines/reckless-linux-generic
ENV TORCH2_PATH=/app/engines/torch-2
ENV PLENTYCHESS_PATH=/app/engines/PlentyChess-7.0.0-linux-generic
ENV CRITTER_PATH=/app/engines/critter-16a
ENV KOMODO3_PATH=/app/engines/komodo3sse42

EXPOSE 3000

CMD ["npm", "start"]
