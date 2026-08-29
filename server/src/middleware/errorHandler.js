const errorHandler = (err, req, res, _next) => {
  console.error(`[Error] ${err.message}`, {
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: messages.join(', ') });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({ error: 'VALIDATION_ERROR', message: 'Duplicate entry' });
  }

  // Custom application errors
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: err.errorCode || 'INTERNAL_ERROR',
      message: err.message,
    });
  }

  // Generic fallback — never expose stack trace to the client
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' });
};

// Helper to create application errors
class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

module.exports = { errorHandler, AppError };
