FROM node:20-bookworm-slim

# Install required engines plus optional ones when available.
RUN set -eux; \
    export DEBIAN_FRONTEND=noninteractive; \
    apt-get update; \
    apt-get install -y --no-install-recommends \
      stockfish \
      toga2 \
      phalanx \
      glaurung \
      gnuchess; \
    for pkg in crafty fruit; do \
      if apt-get install -y --no-install-recommends "$pkg"; then \
        echo "Installed optional package: $pkg"; \
      else \
        echo "Skipping unavailable optional package: $pkg"; \
      fi; \
    done; \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "start"]
