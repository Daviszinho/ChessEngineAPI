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
RUN chmod +x ./engines/fruit

ENV NODE_ENV=production
ENV PORT=3000
ENV FRUIT_PATH=/app/engines/fruit

EXPOSE 3000

CMD ["npm", "start"]
