FROM node:18-alpine

# Configure Node.js to use less memory
ENV NODE_OPTIONS="--max-old-space-size=1024" 
ENV NEXT_TELEMETRY_DISABLED=1

# Create app directory
WORKDIR /usr/src/app

# Copy package.json & pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# Install pnpm globally with a specific version to avoid bloat
RUN npm i -g pnpm@8 --no-fund


# Copy the rest of the source code
COPY . .

# Expose the Next.js dev port
EXPOSE 3000

# Run the dev server with pnpm and reduced workers
CMD ["pnpm", "dev"] 