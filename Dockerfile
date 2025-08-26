FROM node:18-alpine

# Install poppler-utils for PDF processing
RUN apk add --no-cache poppler-utils

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create necessary directories
RUN mkdir -p uploads output

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]

