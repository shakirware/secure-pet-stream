# Use an official Node runtime as a parent image
FROM node:20.2.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install npm dependencies manually
RUN npm install bcrypt \
    crypto-js \
    express \
    express-rate-limit \
    fluent-ffmpeg \
    helmet \
    jsonwebtoken \
    mongoose \
    node-media-server \
	morgan \
    winston

# Copy the rest of the application source code to the container
COPY server/ .

# List files to verify contents
RUN ls -la /usr/src/app

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD ["node", "server.js"]
