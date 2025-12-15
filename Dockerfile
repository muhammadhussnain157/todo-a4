# ===========================================
# Dockerfile for Docker Compose Deployment
# ===========================================
# This Dockerfile is for local development and Docker Compose
# Build: docker-compose up --build
# ===========================================

# Use Node.js 18 Alpine as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for better layer caching)
COPY package*.json ./

# Install dependencies
RUN npm ci && npm cache clean --force

# Copy application source code
COPY . .

# Set build-time environment variable for Docker Compose
ARG MONGODB_URI=mongodb://admin:todoapp123@todo-part1-db:27017/tododb?authSource=admin
ENV MONGODB_URI=$MONGODB_URI

# Build the Next.js application
RUN npm run build

# Set environment to production
ENV NODE_ENV=production

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
