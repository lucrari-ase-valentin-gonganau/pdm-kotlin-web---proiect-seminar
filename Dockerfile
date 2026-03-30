FROM node:lts-alpine AS builder
WORKDIR /usr/src/app
COPY --chown=node:node package.json yarn.lock tsconfig.json ./
COPY --chown=node:node src ./src
RUN corepack enable && yarn install --frozen-lockfile
RUN yarn build

FROM node:lts-alpine AS runner
WORKDIR /usr/src/app
COPY --chown=node:node package.json yarn.lock ./
RUN corepack enable && yarn install --frozen-lockfile --production
COPY --from=builder /usr/src/app/dist ./dist
COPY --chown=node:node src/views ./src/views
COPY --chown=node:node public ./public
USER node
EXPOSE 3000
ENTRYPOINT ["node", "./dist/index.js"]
