FROM node:lts-alpine

WORKDIR /app
COPY . .

ENV PORT=3000
ENV REACT_APP_IS_SERVED=true

RUN npm install

RUN npm run build

RUN cd client && npm install && npm run build

RUN rm -rf client/node_modules

EXPOSE 3000
