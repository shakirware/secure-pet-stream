const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

// A map to hold active streams, keyed by device ID
const activeStreams = new Map();

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

  return `/live/${streamKey}/index.m3u8?expires=${expiresAt}&signature=${signature}`;
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

  stream.on('error', (err) => {
    logger.error('FFmpeg encountered an error:', { error: err.message });
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
    throw new Error('Stream is already active for this device');
  }
  
  const streamKey = `stream_${deviceId}_${Date.now()}`;
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
  const streamData = activeStreams.get(deviceId);
  if (!streamData) {
    throw new Error('No active stream found for this device');
  }
  
  const { stream, streamKey } = streamData;
  stream.kill('SIGINT');
  activeStreams.delete(deviceId);

  logger.info('Stream stopped successfully', { deviceId, streamKey });
};

/**
 * Retrieves the URL for accessing the stream, with an expiration time.
 * 
 * @param {string} streamKey - The unique key for the stream.
 * @param {number} [duration=300] - The duration in seconds for which the URL is valid. Defaults to 5 minutes.
 * @returns {string} - The expiring URL for the stream.
 */
const getStreamUrl = (streamKey, duration = 300) => {
  return generateExpiringStreamUrl(streamKey, duration);
};

module.exports = { startStream, stopStream, getStreamUrl };
