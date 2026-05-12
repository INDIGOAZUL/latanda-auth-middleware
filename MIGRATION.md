# Migrating from @perks/auth-middleware to @latanda/auth-middleware

The package was renamed in v1.0.1 to align with the La Tanda project brand. No code changes are required other than updating the package name in your dependencies.

## Quick upgrade

```bash
npm uninstall @perks/auth-middleware
npm install @latanda/auth-middleware
```

## require() / import changes

```js
// Before
const auth = require('@perks/auth-middleware');
// After
const auth = require('@latanda/auth-middleware');
```

The exported API is identical between 1.0.0 and 1.0.1.

## Why the rename?

`@perks` was a personal npm scope. `@latanda` is the project scope used across the La Tanda ecosystem (whitepaper, platform, future packages like `@latanda/cv-refiner` and `@latanda/tanda-engine`). Aligning the package name with the brand prevents confusion and makes future ecosystem packages discoverable under one scope.

## Deprecation of @perks/auth-middleware

`@perks/auth-middleware@1.0.0` will remain on the registry but is deprecated with a message pointing to this package. Existing installs will continue to work; please migrate at your convenience.
