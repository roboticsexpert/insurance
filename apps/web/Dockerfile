# bimegold web — built from the repo root, like the API. See apps/api/Dockerfile.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/docs/package.json apps/docs/
RUN pnpm install --frozen-lockfile --filter @bimegold/web...

FROM deps AS build
# Vite inlines this at build time — it is not a runtime setting. Changing the API
# host means rebuilding the image, not editing a variable.
ARG VITE_API_URL=https://api.bimegold.com/api/v1
ENV VITE_API_URL=$VITE_API_URL
COPY apps/web apps/web
RUN pnpm --filter @bimegold/web build

FROM nginx:alpine AS runtime
ENV PORT=8080
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 8080
