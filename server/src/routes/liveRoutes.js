const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const router = express.Router();

/**
 * Route handler for serving HLS stream files.
 */
router.get('/:streamKey/:fileName', (req, res) => {
  const { streamKey, fileName } = req.params;
  const { expires, signature } = req.query;

  // Validate the temporary URL
  if (!isValidTemporaryUrl(streamKey, expires, signature)) {
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
 * Validates the temporary URL by checking its expiration and signature.
 * 
 * @param {string} streamKey - The unique key for the stream.
 * @param {string} expires - The expiration timestamp of the URL.
 * @param {string} signature - The HMAC signature to validate.
 * @returns {boolean} - Returns true if the URL is valid, false otherwise.
 */
function isValidTemporaryUrl(streamKey, expires, signature) {
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Check if the URL has expired
  if (currentTimestamp > parseInt(expires)) return false;

  // Create the string to sign and calculate the expected signature
  const stringToSign = `${streamKey}${expires}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.URL_SECRET_KEY)
    .update(stringToSign)
    .digest('hex');

  // Compare the provided signature with the expected one
  return signature === expectedSignature;
}

module.exports = router;
