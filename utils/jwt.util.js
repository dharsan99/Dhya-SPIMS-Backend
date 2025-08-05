const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

// Regular auth token (7 days)
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

// Invitation or temporary token (default 72 hours)
function generateSignedToken(payload, expiresIn = '72h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Verify token safely
function verifySignedToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Token verification failed:', err.message);
    return null;
  }
}

module.exports = {
  generateToken,
  generateSignedToken,
  verifySignedToken,
};
