const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

/**
 * Route handler for serving HLS stream files.
 */
router.get('/:streamKey/:fileName', (req, res) => {
  const { streamKey, fileName } = req.params;
  const { expires } = req.query;

  // Validate the temporary URL
  if (!isValidTemporaryUrl(expires)) {
    return res.status(403).send('Invalid or expired URL');
  }

  const filePath = path.join(__dirname, '..', 'streams', streamKey, fileName);

  // Check if the requested file exists
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Stream not found');
  }
});

/**
 * Validates the temporary URL by checking its expiration.
 * 
 * @param {string} expires - The expiration timestamp of the URL.
 * @returns {boolean} - Returns true if the URL is valid, false otherwise.
 */
function isValidTemporaryUrl(expires) {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Check if the URL has expired
  return currentTimestamp <= parseInt(expires);
}

module.exports = router;