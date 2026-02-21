# Use Node.js base image
FROM node:20-slim

# Install system dependencies
# ffmpeg: for video processing
# python3 & curl: for yt-dlp
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy source code
COPY . .

# Expose port (Render/HuggingFace use 10000 or 7860 by default, but we'll use PORT env)
EXPOSE 3001

# Command to run the application
CMD ["node", "src/server.js"]
