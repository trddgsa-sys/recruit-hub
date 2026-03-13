FROM node:20-alpine
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY . .
RUN npm install --legacy-peer-deps
RUN npx prisma generate
RUN npx next build
EXPOSE 3000
ENV PORT=3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx next start"]
