const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');
const { AppError } = require('../middleware/errorHandler');

const register = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError('Email already registered', 409, 'VALIDATION_ERROR');
  }

  const user = new User({ name, email, passwordHash: password });
  await user.save();

  const token = generateToken(user._id);
  return { user: user.toJSON(), token };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
  }

  user.lastLogin = new Date();
  await user.save();

  const token = generateToken(user._id);
  return { user: user.toJSON(), token };
};

const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'UNAUTHORIZED');
  }
  return user;
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
};

module.exports = { register, login, getProfile };
