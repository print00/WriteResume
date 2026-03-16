FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends libreoffice \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY shared ./shared
COPY server ./server
COPY tsconfig.base.json ./

RUN npm install
RUN npm run build -w shared
RUN npm run build -w server

WORKDIR /app/server

ENV NODE_ENV=production

EXPOSE 3001

CMD ["npm", "run", "start"]
