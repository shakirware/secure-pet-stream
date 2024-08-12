# Use an official Node runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json from the server directory
COPY server/package*.json ./

# Install any needed packages
RUN npm install

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Bundle app source from the server directory
COPY server/ .

# Make port 3001 available to the world outside this container
EXPOSE 3001

# Run the app when the container launches
CMD ["node", "server.js"]