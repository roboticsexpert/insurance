# سایت بازاریابی بیمه گلد — از ریشه مخزن بیلد می‌شود، نه از apps/site.
# lockfile و مانیفست ورک‌اسپیس در ریشه‌اند، پس کانتکست بیلد باید ریشه مونوریپو باشد:
#   docker build -f apps/site/Dockerfile .
# Railway این کار را با متغیر RAILWAY_DOCKERFILE_PATH روی همین سرویس انجام می‌دهد.

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ------------------------------------------------------------------ وابستگی‌ها
# اول مانیفست‌ها تا یک تغییر صرفاً در سورس، درخت وابستگی را دوباره حل نکند.
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/site/package.json apps/site/
RUN pnpm install --frozen-lockfile --filter @bimegold/site...

# ----------------------------------------------------------------------- بیلد
FROM deps AS build
COPY apps/site apps/site
# در زمان بیلد به دیتابیس وصل نمی‌شویم؛ این مقدار فقط برای اینکه ماژول‌های
# کانفیگ در حین prerender بالا بیایند لازم است.
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV PAYLOAD_SECRET=build-only-not-a-real-secret
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @bimegold/site build

# --------------------------------------------------------------------- اجرا
# خروجی standalone خودِ سرور و فقط همان وابستگی‌هایی را دارد که واقعاً import
# شده‌اند (~۱۱۰ مگابایت به‌جای یک node_modules چند گیگابایتی). مهاجرت‌ها از راه
# `prodMigrations` در payload.config داخل همین باندل‌اند و هنگام بالا آمدن اجرا
# می‌شوند، پس نه payload CLI لازم است نه یک نصب کامل.
FROM base AS runtime
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=build /app/apps/site/.next/standalone ./
COPY --from=build /app/apps/site/.next/static ./apps/site/.next/static
COPY --from=build /app/apps/site/public ./apps/site/public

# آپلودهای پیشخان روی دیسک می‌نشینند و دیسک کانتینر با هر استقرار پاک می‌شود.
# روی Railway یک volume دقیقاً روی همین مسیر سوار است — بدون آن، هر عکسی که
# ویراستار بالا داده با استقرار بعدی ناپدید می‌شود.
RUN mkdir -p ./apps/site/public/media

WORKDIR /app/apps/site
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
