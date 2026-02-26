# Changelog

## [2.1.0] - 2025-01-20

### Added
- `getQueryParams` utility for type-safe query parameter extraction
- `createTags` helper for generating consistent cache invalidation tags
- `corsHeaders` convenience function for CORS configuration
- `isAuthenticated` helper for checking auth status in Server Components

### Changed
- Improved TypeScript types for `validateBody` return type
- `withRateLimit` now adds standard rate limit headers to all responses

## [2.0.0] - 2024-12-15

### Breaking Changes
- Renamed `protectRoute` to `withAuth` for consistency
- `createSecurityConfig` now returns a config object instead of a function
- Removed deprecated `withCSRF` middleware (use Next.js built-in)

### Added
- `createAuthMiddleware` for root-level middleware authentication
- `withErrorHandler` with integrated error reporting
- `warmCache` for post-deployment cache warming
- `withSWR` stale-while-revalidate caching wrapper
- Security monitoring via `Report-To` and `NEL` headers

### Changed
- Migrated to Next.js 15 App Router patterns
- All middleware now uses `NextRequest`/`NextResponse`

## [1.3.0] - 2024-11-01

### Added
- `withRateLimit` middleware with configurable windows
- `paginated` response builder with pagination metadata
- `validateBody` request validation helper

### Fixed
- `withAuth` now correctly handles preflight OPTIONS requests
- Security headers CSP directive ordering

## [1.2.0] - 2024-09-20

### Added
- `cachedFetch` wrapper with Next.js cache configuration
- Cache tag utilities
- `createSecurityConfig` convenience function

### Changed
- Improved CSP default directives

## [1.1.0] - 2024-08-10

### Added
- CORS headers helper
- `Permissions-Policy` header to security defaults
- Support for custom session validation functions

## [1.0.0] - 2024-07-01

### Added
- Initial release
- Authentication middleware (`withAuth`, `protectRoute`)
- API response helpers (`success`, `error`)
- Security headers configuration (`securityHeaders`)
- Full TypeScript support
- Tree-shakeable ESM/CJS exports
