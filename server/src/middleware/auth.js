const jwt = require('jsonwebtoken');
const config = require('../config');
const { AppError } = require('../utils/errors');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Please log in to continue.'));
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    return next();
  } catch {
    return next(new AppError(401, 'Your session has expired. Please log in again.'));
  }
}

module.exports = { requireAuth };
