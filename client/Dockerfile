#Stage 1
#######################################
FROM node:16 AS builder

WORKDIR /app

COPY package.json ./

RUN npm install

COPY . ./

RUN echo "export const env = { SERVER_URL: '',}" > env.ts

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

RUN wget https://s3.amazonaws.com/rds-downloads/rds-combined-ca-bundle.pem

CMD ["npm", "run", "start"]
