FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 4000
# The seed migrates, upserts templates, and only seeds events if none exist,
# so it's safe on every start.
CMD ["sh", "-c", "npm run seed && npm start"]