# Changelog

## [1.0.4] - 2026-05-20

### Changed
- **Deps:** Batched Dependabot updates — bcrypt 6.0, jest 30, typescript 6.0, @types/* major bumps, actions/checkout@v6, actions/setup-node@v6. Smoke-tested publish workflow with setup-node@v6 + Trusted Publishing OIDC.


## 1.0.3 - 2026-05-20

### Fixed
- **CI:** Upgrade npm CLI to >=11.5.1 in publish workflow so Trusted Publishing OIDC token-exchange completes. Without this, publish step fails with E404 (npm CLI v10.x ships with Node 20 and does not know about OIDC token exchange). v1.0.2 tag/release exist but were never published to npm registry due to this.


## 1.0.2 - 2026-05-20

### Changed
- **CI:** Migrated publish workflow to npm Trusted Publishing (OIDC). Removes dependency on long-lived `NPM_TOKEN_2` secret. No API changes.
- **CI:** Retired `deprecate-perks.yml` workflow; `@perks/auth-middleware` deprecation handled via interactive `npm deprecate` instead.


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
