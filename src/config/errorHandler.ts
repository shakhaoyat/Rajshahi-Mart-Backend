## Phase 7: Backend Hardening

### Task 7.1 — Implement Pagination on All List Endpoints

Update all list endpoints to support pagination:

- `GET /api/products` - Add `?page=1&limit=12` parameters
- `GET /api/orders/mine` - Add pagination
- `GET /api/orders/sales` - Add pagination
- `GET /api/admin/products` - Add pagination
- `GET /api/admin/orders` - Add pagination

### Task 7.2 — Implement Centralized Error Handling

Create a centralized error handler middleware:

- File: `backend/src/middleware/errorHandler.ts`
- Handle all uncaught exceptions
- Return consistent error responses
- Log errors for monitoring

### Task 7.3 — Add Rate Limiting

Implement rate limiting for:
- Authentication endpoints
- Payment/webhook endpoints
- High-traffic API endpoints

### Task 7.4 — Implement Comprehensive Logging

Add structured logging throughout the application:
- Log all incoming requests with method, path, and response status
- Log errors with stack traces
- Include correlation IDs for tracing requests