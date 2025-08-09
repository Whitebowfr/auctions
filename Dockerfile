FROM node:24-alpine
USER node

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

COPY --chown=node:node . .

WORKDIR /home/node/app/backend
RUN npm install
EXPOSE 8080

CMD [ "node", "server.js" ]