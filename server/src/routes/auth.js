const express = require('express');
const { registerUser, loginUser, refreshToken } = require('../services/authService');
const localHostOnly = require('../middleware/localHostOnly');

const router = express.Router();

router.post('/register', localHostOnly, async (req, res, next) => {
  try {
    const { username, password } = req.body;
    await registerUser(username, password);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    const tokens = await loginUser(username, password);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

router.post('/refresh-token', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await refreshToken(refreshToken);
    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

module.exports = router;