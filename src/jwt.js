/**
 * JWT Token Generation and Validation
 * Extracted from La Tanda production system (latanda.online)
 * Battle-tested with 30+ users, 16+ groups
 */

const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token with user data and claims
 * @param {Object} user - User object from database
 * @param {string} secret - JWT secret key
 * @param {Object} options - Additional options
 * @returns {string} JWT token
 */
function generateToken(user, secret, options = {}) {
  const {
    expiresIn = '8h',
    issuer = 'latanda.online',
    audience = 'latanda-web-app'
  } = options;

  // Build JWT payload with required claims
  const payload = {
    user_id: user.id || user.user_id,
    email: user.email,
    role: user.role || 'USER',
    permissions: user.permissions || []
  };

  // Sign token with HS256 algorithm
  // iss, aud, iat, exp are added automatically by jwt.sign()
  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    expiresIn,
    issuer,
    audience
  });
}

/**
 * Validate JWT token with comprehensive checks
 * @param {string} token - JWT token to validate
 * @param {string} secret - JWT secret key
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with decoded token or error
 */
function validateToken(token, secret, options = {}) {
  const {
    issuer = 'latanda.online',
    audience = 'latanda-web-app'
  } = options;

  try {
    // 1. Check token format (must have 3 parts)
    if (!token || typeof token !== 'string') {
      return { valid: false, error: 'Invalid token format' };
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }

    // 2. Decode and verify token
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer,
      audience
    });

    // 3. Validate required claims
    const requiredClaims = ['user_id', 'email', 'role', 'iss', 'aud', 'exp', 'iat'];
    for (const claim of requiredClaims) {
      if (!decoded[claim]) {
        return { valid: false, error: `Missing required claim: ${claim}` };
      }
    }

    // 4. Check expiration (already done by jwt.verify, but double-check)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp <= now) {
      return { valid: false, error: 'Token expired' };
    }

    // 5. Validate issuer and audience
    if (decoded.iss !== issuer) {
      return { valid: false, error: 'Invalid issuer' };
    }
    if (decoded.aud !== audience) {
      return { valid: false, error: 'Invalid audience' };
    }

    return {
      valid: true,
      decoded,
      user_id: decoded.user_id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || []
    };

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired', expired: true };
    }
    if (error.name === 'JsonWebTokenError') {
      return { valid: false, error: 'Invalid token signature' };
    }
    return { valid: false, error: error.message };
  }
}

/**
 * Decode JWT token without verification (for inspection only)
 * @param {string} token - JWT token to decode
 * @returns {Object|null} Decoded token or null if invalid
 */
function decodeToken(token) {
  try {
    return jwt.decode(token, { complete: true });
  } catch (error) {
    return null;
  }
}

/**
 * Check if token is expiring soon (within threshold)
 * @param {string} token - JWT token to check
 * @param {number} thresholdMinutes - Minutes before expiration to consider "expiring soon"
 * @returns {boolean} True if token expires within threshold
 */
function isTokenExpiringSoon(token, thresholdMinutes = 15) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.payload || !decoded.payload.exp) {
    return true; // Treat invalid tokens as expiring
  }

  const now = Math.floor(Date.now() / 1000);
  const exp = decoded.payload.exp;
  const thresholdSeconds = thresholdMinutes * 60;

  return (exp - now) <= thresholdSeconds;
}

/**
 * Refresh a token (generate new token with same user data)
 * @param {string} oldToken - Current token to refresh
 * @param {string} secret - JWT secret key
 * @param {Object} options - Refresh options
 * @returns {Object} Result with new token or error
 */
function refreshToken(oldToken, secret, options = {}) {
  const validation = validateToken(oldToken, secret, options);

  if (!validation.valid && !validation.expired) {
    return { success: false, error: 'Invalid token cannot be refreshed' };
  }

  // Extract user data from old token
  const decoded = validation.decoded || decodeToken(oldToken).payload;
  const user = {
    id: decoded.user_id,
    email: decoded.email,
    role: decoded.role,
    permissions: decoded.permissions
  };

  // Generate new token
  const newToken = generateToken(user, secret, options);

  return {
    success: true,
    token: newToken,
    user_id: user.id,
    expires_in: options.expiresIn || '8h'
  };
}

module.exports = {
  generateToken,
  validateToken,
  decodeToken,
  isTokenExpiringSoon,
  refreshToken
};
