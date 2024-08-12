const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { startStream, stopStream, getStreamUrl } = require('../services/streamService');

const router = express.Router();

router.post('/start', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.body;
    const streamKey = startStream(deviceId); // Generates and returns the consistent streamKey
    res.json({ message: 'Stream started successfully', streamKey });
  } catch (error) {
    next(error);
  }
});

router.post('/stop', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.body;
    stopStream(deviceId); // Uses the consistent streamKey generation based on deviceId
    res.json({ message: 'Stream stopped successfully' });
  } catch (error) {
    next(error);
  }
});

router.get('/url', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.query; // Use deviceId to generate the consistent streamKey
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    const url = getStreamUrl(deviceId); // Generate the URL using the consistent streamKey
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
