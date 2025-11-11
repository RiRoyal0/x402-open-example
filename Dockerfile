FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install pnpm and dependencies
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.14.0 --activate \
    && pnpm install --frozen-lockfile

# Copy source
COPY . .

# Default command (overridden per service by docker-compose)
CMD ["node", "gateway.js"]


