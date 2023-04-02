#Stage 1
#######################################
FROM node:16 AS builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . ./

RUN npm run build

#Stage 2
#######################################

FROM node:16-alpine

WORKDIR /app

COPY /server/package.json /app/server/package.json

RUN cd server && npm install

COPY server/ /app/server

RUN cd server &&  npm run build

ENV ENV=production

EXPOSE 3000

COPY --from=builder /app/dist dist

WORKDIR /app/server

CMD ["npm", "run", "start"]
