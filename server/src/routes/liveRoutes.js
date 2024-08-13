const express = require('express');
const path = require('path');
const fs = require('fs');
const { verifyAccessToken } = require('../services/streamService');
const router = express.Router();

/**
 * Route handler for serving HLS stream files.
 */
router.get('/:streamKey/:fileName', (req, res) => {
  const { streamKey, fileName } = req.params;
  const { token } = req.query;

  try {
    // Verify token
    verifyAccessToken(token);

    const filePath = path.join(__dirname, '..', 'streams', streamKey, fileName);

    // Check if the requested file exists
    if (fs.existsSync(filePath)) {
      res.sendFile(filePath);
    } else {
      res.status(404).send('Stream not found');
    }
  } catch (error) {
    res.status(403).send('Access denied');
  }
});

module.exports = router;
