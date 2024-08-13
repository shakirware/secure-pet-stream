const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const logger = require('../utils/logger');
const jwt = require('jsonwebtoken');

const activeStreams = new Map();
const SECRET_KEY = process.env.SECRET_KEY || 'your_secret_key';

// Generate a consistent stream key
const generateStreamKey = (deviceId) => {
  const timestamp = new Date().toISOString().split('T')[0];
  return `stream_${deviceId}_${timestamp}`;
};

// Create a JWT token for URL access
const generateAccessToken = (streamKey, expirationDuration) => {
  const payload = { streamKey };
  const options = { expiresIn: expirationDuration };
  return jwt.sign(payload, SECRET_KEY, options);
};

// Verify JWT token
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, SECRET_KEY);
  } catch (err) {
    throw new Error('Invalid or expired token');
  }
};

// Initialize FFmpeg stream
const initializeFFmpegStream = (deviceId, outputDir) => {
  const stream = ffmpeg(`/dev/video${deviceId}`)
    .inputOptions('-f v4l2')
    .inputOptions('-framerate 30')
    .outputOptions('-c:v libx264')
    .outputOptions('-preset ultrafast')
    .outputOptions('-tune zerolatency')
    .outputOptions('-f hls')
    .outputOptions('-hls_time 2')
    .outputOptions('-hls_list_size 5')
    .outputOptions('-hls_flags delete_segments')
    .output(path.join(outputDir, 'index.m3u8'));

  stream.on('start', (commandLine) => {
    logger.info('FFmpeg process started', { deviceId, commandLine });
  });

  stream.on('error', (err) => {
    logger.error('FFmpeg encountered an error', { deviceId, error: err.message });
  });

  stream.on('end', () => {
    logger.info('FFmpeg process ended', { deviceId });
  });

  stream.run();
  return stream;
};

// Start stream
const startStream = (deviceId) => {
  if (activeStreams.has(deviceId)) {
    logger.warn('Attempted to start a stream that is already active', { deviceId });
    throw new Error('Stream is already active for this device');
  }

  const streamKey = generateStreamKey(deviceId);
  const outputDir = path.join(__dirname, '..', 'streams', streamKey);
  fs.mkdirSync(outputDir, { recursive: true });
  const stream = initializeFFmpegStream(deviceId, outputDir);
  activeStreams.set(deviceId, { stream, streamKey });
  logger.info('Stream started successfully', { deviceId, streamKey });
  return streamKey;
};

// Stop stream
const stopStream = (deviceId) => {
  const streamData = activeStreams.get(deviceId);

  if (!streamData) {
    logger.warn('Attempted to stop a stream that is not active', { deviceId });
    throw new Error('No active stream found for this device');
  }

  const { stream, streamKey } = streamData;
  stream.kill('SIGINT');
  activeStreams.delete(deviceId);
  logger.info('Stream stopped successfully', { deviceId, streamKey });
};

// Get stream URL
const getStreamUrl = (deviceId, duration = 300) => {
  const streamKey = generateStreamKey(deviceId);
  const token = generateAccessToken(streamKey, duration);
  const url = `/live/${streamKey}/index.m3u8?token=${token}`;
  logger.info('Retrieved stream URL', { deviceId, streamKey, duration, url });
  return url;
};

module.exports = { startStream, stopStream, getStreamUrl, verifyAccessToken };
