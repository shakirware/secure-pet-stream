const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const logger = require('../utils/logger');

/**
 * Generates access and refresh tokens for a given user.
 * 
 * @param {Object} user - The user object containing user information.
 * @returns {Object} - An object containing the accessToken and refreshToken.
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

/**
 * Registers a new user with the given username and password.
 * 
 * @param {string} username - The username for the new user.
 * @param {string} password - The password for the new user.
 * @returns {Object} - The newly created user object.
 * @throws {Error} - Throws an error if the registration fails.
 */
const registerUser = async (username, password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    logger.info('User registered successfully', { username });
    return user;
  } catch (error) {
    logger.error('Error registering user', { error: error.message });
    throw error;
  }
};

/**
 * Logs in a user by verifying their credentials and issuing tokens.
 * 
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {Object} - An object containing the accessToken and refreshToken.
 * @throws {Error} - Throws an error if the login fails.
 */
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

/**
 * Refreshes the user's access and refresh tokens using the provided refresh token.
 * 
 * @param {string} token - The current refresh token.
 * @returns {Object} - An object containing the new accessToken and refreshToken.
 * @throws {Error} - Throws an error if the refresh token is invalid or the operation fails.
 */
const refreshUserToken = async (token) => {
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

module.exports = { registerUser, loginUser, refreshUserToken };
