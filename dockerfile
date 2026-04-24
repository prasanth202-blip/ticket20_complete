# Build step
FROM node:24-alpine as builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build

# Runtime step
FROM node:24-alpine
WORKDIR /app

COPY --from=builder /app .

EXPOSE 5000
CMD ["npm", "start"]
