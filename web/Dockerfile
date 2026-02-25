FROM node:20-alpine

WORKDIR /app

COPY web/package.json web/package-lock.json ./
RUN npm install --legacy-peer-deps

COPY web/server.js ./
COPY web/out/ ./out/

EXPOSE 3000

CMD ["node", "server.js"]
