# Development 
FROM node:22-alpine AS dev

# Define working directory in container
WORKDIR /app

# Copy package.json and package-lock.json to container
COPY server/package*.json ./

# Install dependencies
RUN npm install

# Copy all files to container
COPY server/ .

# Expose port
EXPOSE 4000

# Start the backend - run seed first, then start dev server
CMD ["sh", "-c", "npm run seed && npm run dev"]