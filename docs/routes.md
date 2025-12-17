# API Routes

## API Version 2

All API endpoints use version 2 with base URL: **`/api/v2`**

**Base URL Format**: `{host}/api/v2/{endpoint}`

- Local: `http://localhost:8080/api/v2/`
- Production: `https://jaip-backend.apps.prod.cirrostratus.org/api/v2/`
- Test: `https://jaip-backend.apps.test.cirrostratus.org/api/v2/`

## Structure

Routes are organized in `./routes/` with consistent structure:

- `schemas.ts` - Request/response schemas
- `routes.ts` - Route definitions
- `handlers.ts` - Business logic
- `options.ts` - Route configuration
- Tests in `route.test.ts` or `__tests__/`

**API Documentation**: `/documentation` (Swagger UI)
