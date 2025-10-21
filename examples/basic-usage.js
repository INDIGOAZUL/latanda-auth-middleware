/**
 * Basic Usage Example for @latanda/auth-middleware
 *
 * This example shows how to set up a simple Express server
 * with JWT authentication in under 50 lines of code.
 */

const express = require('express');
const {
  createAuthMiddleware,
  generateToken,
  requireRole
} = require('@latanda/auth-middleware');

const app = express();
app.use(express.json());

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

// ===== PUBLIC ROUTES =====

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', authenticated: false });
});

// Login endpoint (generates JWT token)
app.post('/auth/login', (req, res) => {
  const { email, password } = req.body;

  // TODO: Validate credentials against database
  // For demo purposes, we'll accept any email/password
  const user = {
    id: '123',
    email,
    role: 'USER',
    permissions: []
  };

  // Generate JWT token
  const token = generateToken(user, JWT_SECRET, {
    expiresIn: '8h'
  });

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});

// ===== PROTECTED ROUTES =====

// Apply authentication middleware to all /api/* routes
app.use('/api/*', createAuthMiddleware({
  jwtSecret: JWT_SECRET
}));

// Protected profile route (any authenticated user)
app.get('/api/profile', (req, res) => {
  res.json({
    success: true,
    user: req.user // Automatically populated by middleware
  });
});

// Protected route for ADMIN only
app.get('/api/admin/users', requireRole('ADMIN'), (req, res) => {
  res.json({
    success: true,
    message: 'Admin access granted',
    users: [] // TODO: Fetch from database
  });
});

// ===== START SERVER =====

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`\n📝 Try these commands:\n`);
  console.log(`# 1. Login to get token`);
  console.log(`curl -X POST http://localhost:${PORT}/auth/login \\`);
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{"email":"test@example.com","password":"test123"}'\n`);
  console.log(`# 2. Use token to access protected route`);
  console.log(`curl http://localhost:${PORT}/api/profile \\`);
  console.log(`  -H "Authorization: Bearer <TOKEN_FROM_STEP_1>"\n`);
});
