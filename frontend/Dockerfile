FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
ARG BUILD_CONFIGURATION=local
RUN npx ng build -c ${BUILD_CONFIGURATION}

FROM nginx:1.27-alpine

ENV BACKEND_URL=http://capitally-backend:8080
ENV PORT=80

COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/frontend /usr/share/nginx/html

EXPOSE 80
