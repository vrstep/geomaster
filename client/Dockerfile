# Development 
FROM node:22-alpine AS dev

# Define working directory in container
WORKDIR /app

# Copy package.json and package-lock.json to container
COPY client/package*.json ./

# Install dependencies
RUN npm install

# Copy all files to container
COPY client/ .

# Expose port
EXPOSE 3000

# Start the frontend with PORT=3000
CMD ["sh", "-c", "PORT=3000 npm run dev"]