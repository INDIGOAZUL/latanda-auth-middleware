# Changelog

## 1.0.1 - 2026-05-12

- Renamed scope: `@perks/auth-middleware` → `@latanda/auth-middleware`. The old package is deprecated with a redirect message.
- **Fixed broken `main` field**: 1.0.0 pointed at `lib/index.js` which was never built or committed (`lib/` is gitignored). Changed to `src/index.js` so `require("@latanda/auth-middleware")` actually works. The old `@perks` 1.0.0 was effectively unusable due to this bug.
- Added explicit `files` field to package.json for predictable npm tarballs.
- Removed stale `types` field (it pointed at the same nonexistent `lib/index.d.ts`).
- Fixed author email metadata (was a placeholder).
- Added npm version, downloads, license, and node badges to README.
- No API changes.

## 1.0.0 - 2025-10-22

- Initial release. JWT auth, RBAC, PostgreSQL integration, Nginx-friendly. Battle-tested at latanda.online.
