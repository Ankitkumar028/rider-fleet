# Rider Fleet Backend (K8s)
FROM node:18-alpine
WORKDIR /app
# Install only prod deps
COPY package.json ./
RUN npm install --only=production
# Copy source
COPY src ./src
ENV PORT=4000
EXPOSE 4000
CMD ["npm","start"]
