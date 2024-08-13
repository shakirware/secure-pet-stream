const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { startStream, stopStream, getStreamUrl } = require('../services/streamService');

const router = express.Router();

router.post('/start', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.body;
    const streamKey = startStream(deviceId);
    res.json({ message: 'Stream started successfully', streamKey });
  } catch (error) {
    next(error);
  }
});

router.post('/stop', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.body;
    stopStream(deviceId);
    res.json({ message: 'Stream stopped successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/url', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.query;
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    const url = getStreamUrl(deviceId);
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
