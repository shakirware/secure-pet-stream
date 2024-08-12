# Use an official Node runtime as a parent image
FROM node:20.2.0

RUN npm install -g npm@latest

# Set the working directory in the container
WORKDIR /usr/src/app

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy package.json and package-lock.json before other files to leverage Docker's cache
COPY server/package*.json ./

# Install any needed packages
RUN npm install

RUN npm install --save dotenv

# Bundle app source from the server directory
COPY server/ .

RUN pwd && ls -la

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD ["node", "server.js"]
