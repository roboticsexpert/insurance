# bime247 API — built from the repo root, not from apps/api.
# The pnpm lockfile and workspace manifest live at the root, so the build context
# must be the monorepo root: `docker build -f apps/api/Dockerfile .`
# Railway does this via the root railway.json, which sets dockerfilePath.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
# Prisma's query engine links against libssl; node:*-slim ships without it and
# Prisma degrades to a "failed to detect the libssl/openssl version" warning and
# then cannot connect.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

# ------------------------------------------------------------------ dependencies
# Manifests first so a source-only change does not re-resolve the dependency tree.
# All three workspace manifests are copied because pnpm reads pnpm-workspace.yaml
# before it applies the filter; a missing one makes the install fail.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/docs/package.json apps/docs/
RUN pnpm install --frozen-lockfile --filter @bime247/api...

# ----------------------------------------------------------------------- build
FROM deps AS build
COPY apps/api apps/api
RUN pnpm --filter @bime247/api exec prisma generate \
 && pnpm --filter @bime247/api build

# ---------------------------------------------------------------------- runtime
# node_modules is carried over whole rather than pruned: the start command runs
# `prisma migrate deploy`, so the Prisma CLI (a devDependency) has to survive, and
# the generated client lives inside node_modules/.prisma from the generate above.
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/prisma ./apps/api/prisma
COPY --from=build /app/apps/api/package.json ./apps/api/package.json
COPY package.json pnpm-workspace.yaml ./

WORKDIR /app/apps/api
EXPOSE 3000
# Migrations run on boot. Railway restarts the container on failure, and a failed
# migration must take the deploy down rather than serve against an old schema.
CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main.js"]
