# The Duel server image (ADR 0016). Build from the repository root:
#   docker build -f apps/server/Dockerfile -t eternalus-duel .
# Run:
#   docker run --rm -p 8787:8787 eternalus-duel
# The WebSocket listens on 0.0.0.0:8787 inside the container (override with DUEL_PORT).
# TLS is the platform's job (a reverse proxy in front of the container terminates it).

# --- Build: bundle the server with its workspace packages (core, protocol) into one file.
FROM node:24-slim AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json tsconfig.json ./
COPY packages/core/package.json packages/core/package.json
COPY packages/protocol/package.json packages/protocol/package.json
COPY apps/server/package.json apps/server/package.json
RUN npm ci --workspace @eternalus/server --include-workspace-root --ignore-scripts
COPY packages packages
COPY apps/server apps/server
RUN npm run build -w @eternalus/server

# --- Run: the bundle plus the one runtime dependency it leaves external (ws, the version the
# lockfile pins: copied from the build stage's `npm ci`, nothing is fetched from the registry).
FROM node:24-slim
WORKDIR /app
COPY --from=build /repo/node_modules/ws ./node_modules/ws
COPY --from=build /repo/apps/server/dist/main.js ./main.js
ENV NODE_ENV=production \
    DUEL_HOST=0.0.0.0 \
    DUEL_PORT=8787
EXPOSE 8787
USER node
# /health listens on the container's own loopback (OPS_PORT, default 8788).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD node -e "fetch('http://127.0.0.1:8788/health').then(r=>process.exit(r.ok?0:1),()=>process.exit(1))"
CMD ["node", "main.js"]
