FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

RUN ls -la && echo "Listed contents successfully"

# Build the application
RUN npm run webpack:build:prod

# Expose port
EXPOSE 3000

# Command to run the application
CMD ["npm", "run", "start:prod"]