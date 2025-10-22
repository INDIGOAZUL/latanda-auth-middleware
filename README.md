# @perks/auth-middleware

**Production-ready JWT authentication middleware for Node.js + PostgreSQL + Nginx**

Battle-tested with 30+ users at [latanda.online](https://latanda.online) ✨

## Features

- ✅ **JWT Token Generation & Validation** - Secure HS256 tokens with comprehensive claim validation
- ✅ **Role-Based Access Control (RBAC)** - Pre-configured roles: ADMIN, MIT, IT, USER
- ✅ **Express Middleware** - Drop-in authentication for Express.js apps
- ✅ **PostgreSQL Integration** - Production-ready database schema included
- ✅ **Nginx Compatible** - Works seamlessly with Nginx reverse proxy
- ✅ **Token Refresh** - Automatic token refresh with expiration detection
- ✅ **Permission System** - Granular permission checks beyond roles
- ✅ **Resource Ownership** - Enforce users can only access their own resources
- ✅ **Audit Logging** - Track authentication events for security monitoring
- ✅ **Zero Dependencies** - Only requires `jsonwebtoken`, `bcrypt`, and `pg`

## Quick Start (5 minutes to secure auth)

### Installation

```bash
npm install @perks/auth-middleware jsonwebtoken bcrypt pg
```

### 1. Set up PostgreSQL

```bash
# Run the schema migration
psql -U your_user -d your_database -f node_modules/@perks/auth-middleware/sql/schema.sql
```

### 2. Add to your Express app

```javascript
const express = require('express');
const { createAuthMiddleware, requireRole } = require('@perks/auth-middleware');

const app = express();

// Protect all API routes
app.use('/api/*', createAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET // Store this in .env file!
}));

// Require ADMIN role for admin routes
app.use('/api/admin/*', requireRole('ADMIN'));

// Your protected routes
app.get('/api/profile', (req, res) => {
  // req.user is automatically populated with authenticated user
  res.json({
    success: true,
    user: req.user // { id, email, role, permissions }
  });
});

app.listen(3000, () => console.log('Secure API running on port 3000'));
```

### 3. Generate tokens on login

```javascript
const { generateToken } = require('@perks/auth-middleware');
const bcrypt = require('bcrypt');

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Get user from database
  const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

  if (!user || !await bcrypt.compare(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Generate JWT token
  const token = generateToken(user, process.env.JWT_SECRET);

  res.json({
    success: true,
    token,
    user: { id: user.id, email: user.email, role: user.role }
  });
});
```

**That's it!** Your API is now secured with production-ready JWT authentication.

## Case Study: La Tanda

[La Tanda](https://latanda.online) is a Web3 tanda (rotating savings and credit association) platform serving 30+ users across 16+ groups with real financial transactions.

**What we use this middleware for:**

- ✅ **Secure user authentication** - JWT tokens with 8-hour expiration
- ✅ **Role-based access** - ADMIN (platform management), MIT (group coordinators), USER (members)
- ✅ **API protection** - All 85+ API endpoints secured
- ✅ **Transaction security** - Ensure users can only access their own transactions
- ✅ **Admin panel** - Restricted to ADMIN role with full audit logging

**Results:**
- 🔒 Zero authentication-related security incidents
- ⚡ Sub-100ms JWT validation performance
- 📊 Complete audit trail of all auth events
- 🚀 Seamless integration with Nginx reverse proxy

## Full Documentation

### API Reference

#### JWT Functions

```javascript
const { generateToken, validateToken, refreshToken } = require('@latanda/auth-middleware');

// Generate a token
const token = generateToken(user, jwtSecret, {
  expiresIn: '8h', // Default: 8 hours
  issuer: 'your-app.com',
  audience: 'your-app'
});

// Validate a token
const validation = validateToken(token, jwtSecret);
if (validation.valid) {
  console.log('User:', validation.user_id, validation.email, validation.role);
} else {
  console.error('Invalid token:', validation.error);
}

// Refresh a token (if expiring soon)
const refreshResult = refreshToken(oldToken, jwtSecret);
if (refreshResult.success) {
  console.log('New token:', refreshResult.token);
}
```

#### RBAC Functions

```javascript
const { hasPermission, hasRoleLevel, ROLES } = require('@latanda/auth-middleware');

// Check if user has permission
if (hasPermission('ADMIN', 'user_management')) {
  // User has permission
}

// Check if role meets minimum level
if (hasRoleLevel('MIT', 'USER')) { // true - MIT is higher than USER
  // Access granted
}

// View all roles and permissions
console.log(ROLES);
/*
{
  ADMIN: { level: 100, permissions: [...] },
  MIT: { level: 50, permissions: [...] },
  IT: { level: 75, permissions: [...] },
  USER: { level: 10, permissions: [...] }
}
*/
```

#### Middleware

```javascript
const {
  createAuthMiddleware,
  requirePermission,
  requireRole,
  requireOwnership,
  optionalAuth
} = require('@latanda/auth-middleware');

// Basic authentication (required)
app.use('/api/*', createAuthMiddleware({ jwtSecret: process.env.JWT_SECRET }));

// Require specific permission
app.post('/api/users', requirePermission('user_management'), (req, res) => {
  // Only users with 'user_management' permission can access
});

// Require specific role or higher
app.use('/api/admin/*', requireRole('ADMIN'));
app.use('/api/groups/create', requireRole('MIT')); // MIT or ADMIN

// Enforce resource ownership
app.get('/api/transactions/:userId', requireOwnership(req => req.params.userId), (req, res) => {
  // Users can only view their own transactions (unless ADMIN)
});

// Optional authentication (works with or without token)
app.get('/api/public/stats', optionalAuth({ jwtSecret: process.env.JWT_SECRET }), (req, res) => {
  if (req.user) {
    // Show personalized stats
  } else {
    // Show public stats
  }
});
```

### Roles and Permissions

#### Pre-configured Roles

| Role | Level | Permissions |
|------|-------|-------------|
| **ADMIN** | 100 | `full_access`, `user_management`, `system_config`, `approve_deposits`, `manage_groups`, `view_analytics`, `manage_roles`, `delete_users`, `system_settings` |
| **IT** | 75 | `view_system_logs`, `debug_access`, `api_access`, `view_analytics`, `technical_support` |
| **MIT** | 50 | `create_groups`, `manage_own_groups`, `approve_members`, `view_group_analytics`, `edit_group_settings` |
| **USER** | 10 | `view_own_profile`, `edit_own_profile`, `join_groups`, `make_payments`, `view_own_transactions` |

#### Custom Permissions

You can add custom permissions to the database:

```sql
INSERT INTO user_permissions (user_id, permission, granted_by)
VALUES (123, 'beta_access', 1);
```

Then check in your code:

```javascript
if (req.user.permissions.includes('beta_access')) {
  // Show beta features
}
```

### Database Schema

The included PostgreSQL schema provides:

- ✅ **users** table - User accounts with bcrypt password hashes
- ✅ **sessions** table - Active JWT token tracking (optional, for revocation)
- ✅ **user_permissions** table - Custom per-user permissions
- ✅ **auth_audit_log** table - Authentication event audit trail

See `sql/schema.sql` for full details.

### Nginx Integration

This middleware works seamlessly with Nginx reverse proxy:

```nginx
# /etc/nginx/sites-available/your-app
location /api/ {
    proxy_pass http://localhost:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # CORS headers for JWT
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

    if ($request_method = OPTIONS) {
        return 204;
    }
}
```

Then your frontend can make authenticated requests:

```javascript
fetch('https://your-app.com/api/profile', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

## Advanced Usage

### Custom Unauthorized Handler

```javascript
app.use('/api/*', createAuthMiddleware({
  jwtSecret: process.env.JWT_SECRET,
  onUnauthorized: (req, res, error) => {
    // Custom error handling
    console.error('Auth failed:', error);
    res.status(401).json({
      success: false,
      error: 'Custom error message',
      code: error.code
    });
  }
}));
```

### Token Refresh Strategy

```javascript
const { isTokenExpiringSoon, refreshToken } = require('@latanda/auth-middleware');

app.post('/api/refresh-token', (req, res) => {
  const token = req.headers.authorization?.substring(7);

  if (isTokenExpiringSoon(token, 15)) { // Refresh if expires within 15 min
    const result = refreshToken(token, process.env.JWT_SECRET);
    if (result.success) {
      return res.json({ success: true, token: result.token });
    }
  }

  res.json({ success: false, error: 'Token not eligible for refresh' });
});
```

### Group Ownership Example (La Tanda use case)

```javascript
const { canPerformGroupAction } = require('@latanda/auth-middleware');

app.post('/api/groups/:groupId/approve-member', async (req, res) => {
  const group = await db.query('SELECT * FROM groups WHERE id = $1', [req.params.groupId]);

  // Check if user can approve members in this group
  if (!canPerformGroupAction(req.user.id, group, req.user.role, 'approve_members')) {
    return res.status(403).json({ error: 'Not authorized to approve members' });
  }

  // Approve member...
});
```

## Examples

See the `examples/` directory for complete working examples:

- **basic-usage.js** - Simple Express app with JWT auth
- **role-based-routing.js** - Different routes for different roles
- **refresh-token-flow.js** - Automatic token refresh implementation
- **nginx-integration/** - Complete Nginx + Express + PostgreSQL setup

## Testing

```bash
npm test
```

## Security Considerations

🔒 **Always use HTTPS in production** - JWT tokens are bearer tokens and should be transmitted securely

🔒 **Store JWT_SECRET securely** - Use environment variables, never commit secrets

🔒 **Set appropriate token expiration** - Balance security (shorter) vs user experience (longer)

🔒 **Implement token refresh** - Allow users to stay logged in without re-authentication

🔒 **Monitor audit logs** - Watch for suspicious authentication patterns

🔒 **Use bcrypt for passwords** - Never store plain-text passwords

## 💰 Support This Project

If this package saves you time and helps secure your application, consider supporting its development!

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Buy%20me%20a%20coffee-ff5e5b?logo=ko-fi&logoColor=white)](https://ko-fi.com/ebanks)
[![PayPal](https://img.shields.io/badge/PayPal-Donate-00457C?logo=paypal&logoColor=white)](https://paypal.me/narjell)
[![Open Collective](https://img.shields.io/badge/Open%20Collective-Support-7fadf2?logo=opencollective&logoColor=white)](https://opencollective.com/latanda-auth-middleware)

**Why support?**
- ✅ Ongoing maintenance and security updates
- ✅ New features based on community feedback
- ✅ Comprehensive documentation and examples
- ✅ Priority support for sponsors

**Other ways to help:**
- ⭐ Star this repo on GitHub
- 🐛 Report bugs and suggest features
- 📝 Improve documentation
- 🔀 Submit pull requests

### 💼 Need Help?

**Professional services available:**
- 📧 Implementation consulting
- 🔧 Custom feature development
- 🏢 Enterprise support contracts

Contact: ebanksnigel@gmail.com

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md)

## License

MIT © Narjell Ebanks

## Support

- 📖 [Full Documentation](https://github.com/INDIGOAZUL/latanda-auth-middleware/wiki)
- 🐛 [Report Issues](https://github.com/INDIGOAZUL/latanda-auth-middleware/issues)
- 💬 [Discussions](https://github.com/INDIGOAZUL/latanda-auth-middleware/discussions)
- ⭐ [Star on GitHub](https://github.com/INDIGOAZUL/latanda-auth-middleware)

## Acknowledgments

Extracted from the [La Tanda](https://latanda.online) Web3 platform - a production tanda (ROSCA) system serving real users with real money.

Special thanks to the La Tanda community for battle-testing this authentication system!

---

**Built with ❤️ by the La Tanda team**

[GitHub](https://github.com/INDIGOAZUL/latanda-auth-middleware) • [npm](https://www.npmjs.com/package/@perks/auth-middleware) • [La Tanda Platform](https://latanda.online)
