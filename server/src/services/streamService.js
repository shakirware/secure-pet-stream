const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// A map to hold active streams, keyed by device ID
const activeStreams = new Map();

/**
 * Generates a consistent stream key using device ID and the current date.
 * 
 * @param {number} deviceId - The ID of the video device.
 * @returns {string} - The generated stream key.
 */
const generateStreamKey = (deviceId) => {
  const timestamp = new Date().toISOString().split('T')[0]; // Use date for consistency within a day
  return `stream_${deviceId}_${timestamp}`;
};

/**
 * Generates a temporary URL for accessing the stream.
 * 
 * @param {string} streamKey - The unique key for the stream.
 * @param {number} expirationDuration - The duration in seconds for which the URL is valid.
 * @returns {string} - The temporary URL for accessing the stream.
 */
const generateExpiringStreamUrl = (streamKey, expirationDuration) => {
  const expiresAt = Math.floor(Date.now() / 1000) + expirationDuration;
  const dataToSign = `${streamKey}${expiresAt}`;
  
  const signature = crypto
    .createHmac('sha256', process.env.URL_SECRET_KEY)
    .update(dataToSign)
    .digest('hex');

  const url = `/live/${streamKey}/index.m3u8?expires=${expiresAt}&signature=${signature}`;
  
  logger.info('Generated expiring stream URL', { streamKey, expiresAt, url });
  
  return url;
};

/**
 * Starts an FFmpeg process to stream video from a device.
 * 
 * @param {number} deviceId - The ID of the video device.
 * @param {string} outputDir - The directory where the stream files will be saved.
 * @returns {object} - The FFmpeg process instance.
 */
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

/**
 * Starts a stream for a given video device.
 * 
 * @param {number} deviceId - The ID of the video device to stream from.
 * @returns {string} - The unique key for the started stream.
 */
const startStream = (deviceId) => {
  if (activeStreams.has(deviceId)) {
    logger.warn('Attempted to start a stream that is already active', { deviceId });
    throw new Error('Stream is already active for this device');
  }
  
  const streamKey = generateStreamKey(deviceId); // Use the consistent stream key generator
  const outputDir = path.join(__dirname, '..', 'streams', streamKey);
  
  // Ensure the output directory exists
  fs.mkdirSync(outputDir, { recursive: true });
  
  const stream = initializeFFmpegStream(deviceId, outputDir);
  activeStreams.set(deviceId, { stream, streamKey });
  
  logger.info('Stream started successfully', { deviceId, streamKey });
  
  return streamKey;
};

/**
 * Stops an active stream for a given video device.
 * 
 * @param {number} deviceId - The ID of the video device whose stream should be stopped.
 */
const stopStream = (deviceId) => {
  const streamKey = generateStreamKey(deviceId); // Ensure consistent stream key usage
  const streamData = activeStreams.get(deviceId);

  if (!streamData) {
    logger.warn('Attempted to stop a stream that is not active', { deviceId });
    throw new Error('No active stream found for this device');
  }
  
  const { stream } = streamData;
  stream.kill('SIGINT');
  activeStreams.delete(deviceId);

  logger.info('Stream stopped successfully', { deviceId, streamKey });
};

/**
 * Retrieves the URL for accessing the stream, with an expiration time.
 * 
 * @param {number} deviceId - The ID of the video device.
 * @param {number} [duration=300] - The duration in seconds for which the URL is valid. Defaults to 5 minutes.
 * @returns {string} - The expiring URL for the stream.
 */
const getStreamUrl = (deviceId, duration = 300) => {
  const streamKey = generateStreamKey(deviceId); // Use the consistent stream key generator
  const url = generateExpiringStreamUrl(streamKey, duration);
  logger.info('Retrieved stream URL', { deviceId, streamKey, duration, url });
  return url;
};

module.exports = { startStream, stopStream, getStreamUrl };
