'use strict';

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Cannot ${req.method} ${req.originalUrl}`,
    errorCode: 'NOT_FOUND',
  });
}

module.exports = notFound;
