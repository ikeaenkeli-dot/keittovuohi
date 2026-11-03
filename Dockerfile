FROM node:22-bookworm-slim

# Fonts for /kuvaaja chart texts, timezone data for Finnish times
RUN apt-get update \
    && apt-get install -y --no-install-recommends fonts-dejavu-core tzdata \
    && rm -rf /var/lib/apt/lists/*
ENV TZ=Europe/Helsinki
ENV NODE_ENV=production

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . .

USER node
CMD ["node", "index.js"]
