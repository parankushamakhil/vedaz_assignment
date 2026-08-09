const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === 'production'
      ? 'An internal server error occurred'
      : err.message || 'An internal server error occurred';

  // Log the error in development
  if (process.env.NODE_ENV !== 'production') {
    console.error(`[Error] ${err.message}`);
    if (err.stack) {
      console.error(err.stack);
    }
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
