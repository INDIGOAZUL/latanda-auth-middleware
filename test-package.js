/**
 * Test Suite for @latanda/auth-middleware
 * Run this to verify all functions work correctly before publishing
 */

const {
  generateToken,
  validateToken,
  decodeToken,
  isTokenExpiringSoon,
  refreshToken,
  hasPermission,
  hasRoleLevel,
  ROLES,
  isValidRole,
  canAccessResource
} = require('./lib/index.js');

console.log('🧪 Testing @latanda/auth-middleware\n');

const JWT_SECRET = 'test-secret-key-do-not-use-in-production';
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✅ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`❌ ${name}`);
    console.error(`   Error: ${error.message}`);
    testsFailed++;
  }
}

// Test user object
const testUser = {
  id: 'user_123',
  email: 'test@latanda.online',
  role: 'USER',
  permissions: []
};

const adminUser = {
  id: 'admin_001',
  email: 'admin@latanda.online',
  role: 'ADMIN',
  permissions: []
};

console.log('📦 JWT Token Functions\n');

// Test 1: Generate Token
let token;
test('generateToken() creates valid JWT', () => {
  token = generateToken(testUser, JWT_SECRET);
  if (!token || typeof token !== 'string') {
    throw new Error('Token is not a string');
  }
  if (token.split('.').length !== 3) {
    throw new Error('Token does not have 3 parts');
  }
});

// Test 2: Validate Token
let validation;
test('validateToken() validates correct token', () => {
  validation = validateToken(token, JWT_SECRET);
  if (!validation.valid) {
    throw new Error(`Validation failed: ${validation.error}`);
  }
  if (validation.user_id !== testUser.id) {
    throw new Error('User ID mismatch');
  }
});

// Test 3: Validate Invalid Token
test('validateToken() rejects invalid token', () => {
  const invalidToken = 'invalid.token.here';
  const result = validateToken(invalidToken, JWT_SECRET);
  if (result.valid) {
    throw new Error('Invalid token was accepted');
  }
});

// Test 4: Validate Expired Token (simulated)
test('validateToken() rejects wrong secret', () => {
  const result = validateToken(token, 'wrong-secret');
  if (result.valid) {
    throw new Error('Token validated with wrong secret');
  }
});

// Test 5: Decode Token
test('decodeToken() decodes without validation', () => {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.payload) {
    throw new Error('Token not decoded');
  }
  if (decoded.payload.user_id !== testUser.id) {
    throw new Error('Decoded user_id mismatch');
  }
});

// Test 6: Check Token Expiry
test('isTokenExpiringSoon() detects fresh token', () => {
  const expiringSoon = isTokenExpiringSoon(token, 15);
  if (expiringSoon) {
    throw new Error('Fresh token marked as expiring');
  }
});

// Test 7: Refresh Token
test('refreshToken() generates new token', () => {
  // Wait 1 second to ensure iat timestamp is different
  const start = Date.now();
  while (Date.now() - start < 1100) {} // Wait 1.1 seconds

  const result = refreshToken(token, JWT_SECRET);
  if (!result.success) {
    throw new Error(`Refresh failed: ${result.error}`);
  }
  if (!result.token) {
    throw new Error('No token returned');
  }
  // Decode both tokens to check they have different iat
  const oldDecoded = decodeToken(token);
  const newDecoded = decodeToken(result.token);
  if (oldDecoded.payload.iat === newDecoded.payload.iat) {
    throw new Error('New token has same iat timestamp');
  }
});

console.log('\n🔐 RBAC Functions\n');

// Test 8: Check ADMIN Permission
test('hasPermission() grants ADMIN all permissions', () => {
  if (!hasPermission('ADMIN', 'user_management')) {
    throw new Error('ADMIN does not have user_management');
  }
  if (!hasPermission('ADMIN', 'system_config')) {
    throw new Error('ADMIN does not have system_config');
  }
});

// Test 9: Check USER Permission
test('hasPermission() restricts USER permissions', () => {
  if (hasPermission('USER', 'user_management')) {
    throw new Error('USER has admin permission');
  }
  if (!hasPermission('USER', 'view_own_profile')) {
    throw new Error('USER does not have view_own_profile');
  }
});

// Test 10: Check MIT Permission
test('hasPermission() grants MIT group permissions', () => {
  if (!hasPermission('MIT', 'create_groups')) {
    throw new Error('MIT cannot create groups');
  }
  if (!hasPermission('MIT', 'manage_own_groups')) {
    throw new Error('MIT cannot manage own groups');
  }
});

// Test 11: Role Level Check
test('hasRoleLevel() compares role levels', () => {
  if (!hasRoleLevel('ADMIN', 'USER')) {
    throw new Error('ADMIN not higher than USER');
  }
  if (!hasRoleLevel('MIT', 'USER')) {
    throw new Error('MIT not higher than USER');
  }
  if (hasRoleLevel('USER', 'ADMIN')) {
    throw new Error('USER higher than ADMIN');
  }
});

// Test 12: Valid Role Check
test('isValidRole() validates roles', () => {
  if (!isValidRole('ADMIN')) {
    throw new Error('ADMIN not valid role');
  }
  if (!isValidRole('USER')) {
    throw new Error('USER not valid role');
  }
  if (isValidRole('INVALID_ROLE')) {
    throw new Error('Invalid role accepted');
  }
});

// Test 13: Resource Access
test('canAccessResource() enforces ownership', () => {
  // User can access own resource
  if (!canAccessResource('user_123', 'user_123', 'USER')) {
    throw new Error('User cannot access own resource');
  }
  // User cannot access other's resource
  if (canAccessResource('user_123', 'user_456', 'USER')) {
    throw new Error('User can access other user resource');
  }
  // ADMIN can access any resource
  if (!canAccessResource('admin_001', 'user_123', 'ADMIN')) {
    throw new Error('ADMIN cannot access user resource');
  }
});

// Test 14: ROLES Object Structure
test('ROLES contains all expected roles', () => {
  const expectedRoles = ['ADMIN', 'MIT', 'IT', 'USER'];
  for (const role of expectedRoles) {
    if (!ROLES[role]) {
      throw new Error(`Missing role: ${role}`);
    }
    if (typeof ROLES[role].level !== 'number') {
      throw new Error(`${role} missing level`);
    }
    if (!Array.isArray(ROLES[role].permissions)) {
      throw new Error(`${role} missing permissions array`);
    }
  }
});

console.log('\n🎯 Express Middleware Functions\n');

const { createAuthMiddleware, requireRole, requirePermission } = require('./lib/middleware.js');

// Test 15: Create Auth Middleware
test('createAuthMiddleware() creates function', () => {
  const middleware = createAuthMiddleware({ jwtSecret: JWT_SECRET });
  if (typeof middleware !== 'function') {
    throw new Error('Middleware is not a function');
  }
});

// Test 16: Middleware Requires Secret
test('createAuthMiddleware() requires jwtSecret', () => {
  try {
    createAuthMiddleware({});
    throw new Error('Should have thrown error');
  } catch (error) {
    if (!error.message.includes('jwtSecret')) {
      throw new Error('Wrong error message');
    }
  }
});

// Test 17: requireRole Middleware
test('requireRole() creates function', () => {
  const middleware = requireRole('ADMIN');
  if (typeof middleware !== 'function') {
    throw new Error('requireRole middleware is not a function');
  }
});

// Test 18: requireRole Validates Role
test('requireRole() rejects invalid role', () => {
  try {
    requireRole('INVALID_ROLE');
    throw new Error('Should have thrown error for invalid role');
  } catch (error) {
    if (!error.message.includes('Invalid role')) {
      throw new Error('Wrong error message');
    }
  }
});

// Test 19: requirePermission Middleware
test('requirePermission() creates function', () => {
  const middleware = requirePermission('user_management');
  if (typeof middleware !== 'function') {
    throw new Error('requirePermission middleware is not a function');
  }
});

console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results:\n`);
console.log(`   ✅ Passed: ${testsPassed}`);
console.log(`   ❌ Failed: ${testsFailed}`);
console.log(`   📈 Success Rate: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
  console.log(`\n🎉 All tests passed! Package is ready to publish.\n`);
  process.exit(0);
} else {
  console.log(`\n⚠️  Some tests failed. Fix issues before publishing.\n`);
  process.exit(1);
}
