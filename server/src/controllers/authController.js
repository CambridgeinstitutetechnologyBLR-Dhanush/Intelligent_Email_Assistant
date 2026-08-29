const authService = require('../services/authService');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register({ name, email, password });
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  // For JWT-based auth, logout is handled client-side by discarding the token.
  // Server acknowledges the request.
  res.json({ message: 'Logged out successfully' });
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.userId);
    res.json({ user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, logout, getMe };
