const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const logger = require('../utils/logger');

const streams = new Map();

const generateTemporaryUrl = (streamId, expirationTime) => {
  const expires = Math.floor(Date.now() / 1000) + expirationTime;
  const stringToSign = `${streamId}${expires}`;
  
  const signature = crypto
    .createHmac('sha256', process.env.URL_SECRET_KEY)
    .update(stringToSign)
    .digest('hex');

  return `/live/${streamId}/index.m3u8?expires=${expires}&signature=${signature}`;
};

const startFFmpegStream = (deviceId, outputUrl) => {
  const stream = ffmpeg(`/dev/video${deviceId}`)
    .inputOptions('-f v4l2')
    .inputOptions('-framerate 30')
    .outputOptions('-c:v libx264')
    .outputOptions('-preset ultrafast')
    .outputOptions('-tune zerolatency')
    .outputOptions('-f flv')
    .output(outputUrl);

  stream.on('error', (err) => {
    logger.error('FFmpeg error:', { error: err.message });
  });

  stream.run();
  return stream;
};

const startStream = (deviceId) => {
  if (streams.has(deviceId)) {
    throw new Error('Stream already active for this device');
  }
  
  const rtmpUrl = `rtmp://localhost:1935/live/${process.env.STREAM_KEY}`;
  const stream = startFFmpegStream(deviceId, rtmpUrl);
  streams.set(deviceId, stream);
  logger.info('Stream started', { deviceId });
};

const stopStream = (deviceId) => {
  const stream = streams.get(deviceId);
  if (!stream) {
    throw new Error('No active stream for this device');
  }
  
  stream.kill('SIGINT');
  streams.delete(deviceId);
  logger.info('Stream stopped', { deviceId });
};

const getStreamUrl = () => {
  const tempUrl = generateTemporaryUrl(process.env.STREAM_KEY, 300); // URL valid for 5 minutes
  return tempUrl;
};

module.exports = { startStream, stopStream, getStreamUrl };