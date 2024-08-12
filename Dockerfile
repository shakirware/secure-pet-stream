# Use an official Node runtime as a parent image
FROM node:20.2.0

# Set the working directory in the container
WORKDIR /usr/src/app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install npm dependencies manually
RUN npm install bcrypt@^5.1.1 \
    crypto-js@^4.2.0 \
    dotenv@^16.4.5 \
    express@^4.19.2 \
    express-rate-limit@^7.4.0 \
    fluent-ffmpeg@^2.1.3 \
    helmet@^7.1.0 \
    jsonwebtoken@^9.0.2 \
    mongoose@^8.5.2 \
    node-media-server@^2.7.0 \
    winston@^3.14.1

# Copy the rest of the application source code to the container
COPY server/ .

# List files to verify contents
RUN ls -la /usr/src/app

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD ["node", "server.js"]
