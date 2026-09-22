FROM node:22-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend ./
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM node:22-alpine AS backend-build
WORKDIR /backend
COPY backend/package*.json ./
RUN npm ci
COPY backend/prisma7.config.ts backend/tsconfig.json ./
COPY backend/prisma ./prisma
COPY backend/src ./src
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package*.json ./
RUN npm ci
COPY --from=backend-build /backend/dist ./dist
COPY --from=backend-build /backend/prisma ./prisma
COPY --from=backend-build /backend/prisma7.config.ts ./prisma7.config.ts
COPY --from=frontend-build /frontend/dist ./public
EXPOSE 3333
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
