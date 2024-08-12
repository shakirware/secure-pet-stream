const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const logger = require('../utils/logger');

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

const registerUser = async (username, password) => {
  try {
    const user = new User({ username, password });
    await user.save();
    logger.info('User registered successfully', { username });
    return user;
  } catch (error) {
    logger.error('Error registering user', { error: error.message });
    throw error;
  }
};

const loginUser = async (username, password) => {
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error('Invalid credentials');
    }
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    logger.info('User logged in successfully', { username });
    return tokens;
  } catch (error) {
    logger.error('Error logging in user', { error: error.message });
    throw error;
  }
};

const refreshToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      throw new Error('Invalid refresh token');
    }
    const tokens = generateTokens(user);
    user.refreshToken = tokens.refreshToken;
    await user.save();
    return tokens;
  } catch (error) {
    logger.error('Error refreshing token', { error: error.message });
    throw error;
  }
};

module.exports = { registerUser, loginUser, refreshToken };