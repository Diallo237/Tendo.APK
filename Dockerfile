# Étape 1 — Build React
FROM node:22-alpine AS builder
WORKDIR /app
# VITE_API_URL figé au build (Vite fige les VITE_* dans le bundle).
# Défaut = /api (relatif → marche sur n'importe quel domaine, même origine que le front).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Étape 2 — Nginx sert le build ← NGINX DÉMARRE ICI 
FROM nginx:alpine
COPY nginx.frontend.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]