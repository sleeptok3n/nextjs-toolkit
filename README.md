# nextjs-toolkit

Production-ready utilities, middleware, and patterns for Next.js applications. Authentication guards, API response helpers, caching strategies, security headers, rate limiting, and more.

[![npm version](https://img.shields.io/npm/v/nextjs-toolkit)](https://www.npmjs.com/package/nextjs-toolkit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)

## Why nextjs-toolkit?

Building production Next.js applications requires implementing the same patterns repeatedly: authentication middleware, error handling, rate limiting, security headers, caching strategies. **nextjs-toolkit** provides battle-tested implementations of these patterns so you can focus on your application logic.

- **Zero config** - Sensible defaults that follow Next.js best practices
- **Composable** - Mix and match middleware, combine with your existing code
- **Type-safe** - Full TypeScript support with strict types
- **Tree-shakeable** - Import only what you need
- **App Router native** - Built for the Next.js App Router and Server Components

## Installation

```bash
npm install nextjs-toolkit
```

```bash
pnpm add nextjs-toolkit
```

```bash
yarn add nextjs-toolkit
```

## Quick Start

```ts
// middleware.ts
import { createAuthMiddleware } from "nextjs-toolkit/middleware";

export default createAuthMiddleware({
  publicPaths: ["/login", "/register", "/api/health"],
  loginUrl: "/auth/signin",
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

```ts
// next.config.ts
import { createSecurityConfig } from "nextjs-toolkit/config";

const nextConfig = {
  ...createSecurityConfig(),
  // your other config
};

export default nextConfig;
```

## Modules

### Authentication Middleware

Protect routes and API handlers with session-based authentication.

```ts
import { withAuth, createAuthMiddleware, isAuthenticated } from "nextjs-toolkit/middleware";
```

#### `withAuth(handler, config?)`

Wraps a route handler with authentication. Returns 401 for unauthenticated requests.

```ts
// app/api/users/route.ts
import { withAuth } from "nextjs-toolkit/middleware";

export const GET = withAuth(async (req) => {
  const users = await db.users.findMany();
  return Response.json(users);
});

export const POST = withAuth(
  async (req) => {
    const body = await req.json();
    const user = await db.users.create(body);
    return Response.json(user, { status: 201 });
  },
  {
    sessionCookie: "auth-token",
    validateSession: async (token) => {
      const session = await redis.get(`session:${token}`);
      return !!session;
    },
  },
);
```

#### `createAuthMiddleware(config?)`

Creates a Next.js middleware function for route-level authentication.

```ts
// middleware.ts
import { createAuthMiddleware } from "nextjs-toolkit/middleware";

export default createAuthMiddleware({
  publicPaths: ["/login", "/register", "/forgot-password", "/api/health"],
  loginUrl: "/auth/signin",
  sessionCookie: "session",
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

#### `isAuthenticated(cookieStore, config?)`

Check authentication status in Server Components.

```ts
// app/page.tsx
import { isAuthenticated } from "nextjs-toolkit/middleware";
import { cookies } from "next/headers";

export default async function Page() {
  const authed = await isAuthenticated(cookies());
  return authed ? <Dashboard /> : <LoginPrompt />;
}
```

---

### Rate Limiting

Protect API routes from abuse with configurable rate limiting.

```ts
import { withRateLimit } from "nextjs-toolkit/middleware";
```

#### `withRateLimit(handler, config?)`

```ts
// app/api/search/route.ts
import { withRateLimit } from "nextjs-toolkit/middleware";

export const GET = withRateLimit(
  async (req) => {
    const query = req.nextUrl.searchParams.get("q");
    const results = await search(query);
    return Response.json(results);
  },
  {
    maxRequests: 30,
    windowSeconds: 60,
  },
);
```

Combine with authentication:

```ts
import { withAuth, withRateLimit } from "nextjs-toolkit/middleware";

export const POST = withAuth(
  withRateLimit(
    async (req) => {
      const data = await req.json();
      return Response.json(await processData(data));
    },
    { maxRequests: 10, windowSeconds: 60 },
  ),
);
```

---

### API Response Helpers

Standardized response builders for consistent API responses.

```ts
import { success, error, paginated, withErrorHandler, validateBody, getQueryParams } from "nextjs-toolkit/api";
```

#### Response Builders

```ts
import { success, error, paginated } from "nextjs-toolkit/api";

// Success response
export async function GET() {
  const users = await db.users.findMany();
  return success(users); // { data: [...], error: null, timestamp: ... }
}

// Error response
export async function DELETE() {
  return error("Not authorized", 403);
}

// Paginated response
export async function GET(req: NextRequest) {
  const page = Number(req.nextUrl.searchParams.get("page")) || 1;
  const { items, total } = await db.users.findWithCount({ page, limit: 20 });
  return paginated(items, { page, limit: 20, total });
}
```

#### `withErrorHandler(handler, config?)`

Wraps handlers with standardized error catching and reporting.

```ts
import { withErrorHandler } from "nextjs-toolkit/api";

export const GET = withErrorHandler(async (req) => {
  const data = await riskyOperation();
  return Response.json(data);
});
// Errors are caught, formatted, and reported automatically
```

#### `validateBody(req, validator)`

Validate and type request bodies.

```ts
import { validateBody, success, error } from "nextjs-toolkit/api";

export async function POST(req: NextRequest) {
  const body = await validateBody(req, (data: any) => {
    if (!data.name) throw new Error("Name is required");
    if (!data.email) throw new Error("Email is required");
    return data as { name: string; email: string };
  });

  if (body instanceof Response) return body;

  const user = await db.users.create(body);
  return success(user, 201);
}
```

#### `getQueryParams(req, schema)`

Type-safe query parameter extraction.

```ts
import { getQueryParams, paginated } from "nextjs-toolkit/api";

export async function GET(req: NextRequest) {
  const { page, limit, search, active } = getQueryParams(req, {
    page: { type: "number", default: 1 },
    limit: { type: "number", default: 20 },
    search: { type: "string", default: "" },
    active: { type: "boolean", default: true },
  });

  const results = await db.users.search({ page, limit, search, active });
  return paginated(results.items, { page, limit, total: results.total });
}
```

---

### Caching Utilities

Caching patterns for Next.js Server Components and Route Handlers.

```ts
import { cachedFetch, withSWR, warmCache, createTags } from "nextjs-toolkit/cache";
```

#### `cachedFetch(url, options?)`

Fetch with Next.js caching configuration.

```ts
// In a Server Component
const products = await cachedFetch<Product[]>("https://api.example.com/products", {
  revalidate: 3600, // Revalidate every hour
  tags: ["products"],
});
```

#### `withSWR(fetcher, options)`

Stale-while-revalidate wrapper for any async function.

```ts
const getProducts = withSWR(
  () => db.products.findMany(),
  { maxAge: 300, staleWhileRevalidate: 600 },
);

const products = await getProducts();
```

#### `warmCache(options)`

Pre-warm cache after deployments for optimal initial load times.

```ts
// In a post-deploy webhook or script
await warmCache({
  baseUrl: "https://myapp.vercel.app",
  paths: ["/", "/products", "/about", "/api/products"],
  concurrency: 5,
});
```

#### `createTags(resource, params?)`

Generate consistent cache tags for granular invalidation.

```ts
const tags = createTags("products", { id: "123", category: "electronics" });
// => ['products', 'products:123', 'products:category:electronics']
```

---

### Security Configuration

OWASP-compliant security headers and CSP configuration for Next.js.

```ts
import { securityHeaders, corsHeaders, createSecurityConfig } from "nextjs-toolkit/config";
```

#### `createSecurityConfig(config?)`

Returns a complete security configuration object for `next.config.ts`.

```ts
// next.config.ts
import type { NextConfig } from "next";
import { createSecurityConfig } from "nextjs-toolkit/config";

const nextConfig: NextConfig = {
  ...createSecurityConfig(),
  images: {
    remotePatterns: [{ hostname: "images.example.com" }],
  },
};

export default nextConfig;
```

#### `securityHeaders(config?)`

Returns an array of recommended security headers.

```ts
// next.config.ts
import { securityHeaders } from "nextjs-toolkit/config";

const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders({
          enableCSP: true,
          enableHSTS: true,
          enableMonitoring: true,
        }),
      },
    ];
  },
};
```

Headers included:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (restricts camera, microphone, geolocation)
- `Strict-Transport-Security` (HSTS with preload)
- `Content-Security-Policy` (configurable CSP)
- `Report-To` and `NEL` (security monitoring)

#### `corsHeaders(config?)`

CORS headers for API routes.

```ts
export async function OPTIONS() {
  return new Response(null, {
    headers: corsHeaders({ origins: ["https://myapp.com"] }),
  });
}
```

---

## Production Readiness Checklist

When deploying a Next.js application to production, ensure you have:

- [ ] **Authentication middleware** on all protected routes (`withAuth`)
- [ ] **Rate limiting** on all public API endpoints (`withRateLimit`)
- [ ] **Error handling** with reporting on all route handlers (`withErrorHandler`)
- [ ] **Security headers** configured in `next.config.ts` (`createSecurityConfig`)
- [ ] **Cache warming** in your deployment pipeline (`warmCache`)
- [ ] **Environment variables** set for monitoring endpoints

```bash
# Required production environment variables
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## Tree-Shakeable Imports

```ts
import { withAuth, withRateLimit } from "nextjs-toolkit/middleware";
import { success, error, withErrorHandler } from "nextjs-toolkit/api";
import { cachedFetch, warmCache } from "nextjs-toolkit/cache";
import { securityHeaders, createSecurityConfig } from "nextjs-toolkit/config";
```

## Requirements

- Next.js >= 13.0.0
- React >= 18.0.0
- Node.js >= 18.0.0

## Contributing

Contributions welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT - see [LICENSE](LICENSE).
