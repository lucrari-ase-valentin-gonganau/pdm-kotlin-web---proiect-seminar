FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare yarn@stable --activate

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src

RUN yarn build

# ---

FROM node:22-alpine AS runner

WORKDIR /app

RUN corepack enable && corepack prepare yarn@stable --activate

COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/dist ./dist
COPY src/views ./src/views
COPY public ./public

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
