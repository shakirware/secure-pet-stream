const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { startStream, stopStream, getStreamUrl } = require('../services/streamService');

const router = express.Router();

router.post('/start', verifyToken, (req, res, next) => {
  try {
    const { deviceId = 0 } = req.body;
    startStream(deviceId);
    res.json({ message: 'Stream started successfully' });
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

router.get('/url', verifyToken, (req, res) => {
  const url = getStreamUrl();
  res.json({ url });
});

module.exports = router;
