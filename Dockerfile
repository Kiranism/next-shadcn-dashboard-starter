# Use official Node.js image as the base
FROM node:16-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of your application code
COPY . .

# Build the Next.js app
RUN npm run build

# Expose port 3000 for the app
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]
