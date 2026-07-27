## Phase 7: Backend Hardening

### Task 7.1 — Implement Pagination on All List Endpoints

Update all list endpoints to support pagination:

- `GET /api/products` - Add `?page=1&limit=12` query parameters
- `GET /api/orders/mine` - Add pagination
- `GET /api/orders/sales` - Add pagination
- `GET /api/admin/products` - Add pagination
- `GET /api/admin/orders` - Add pagination

### Task 7.2 — Implement Centralized Error Handling

Create a centralized error handling middleware:

- File: `backend/src/middleware/errorHandler.ts`
- Handle all exceptions uniformly
- Return consistent error responses with proper HTTP status codes
- Log errors for debugging

### Task 7.3 — Implement Comprehensive Input Validation

- Use Zod schemas for all POST/PUT/PATCH routes
- Validate input data before processing
- Return consistent error responses

### Task 7.4 — Add Rate Limiting

- Implement rate limiting for authentication and payment routes
- Prevent abuse and DDoS attacks
- Use Redis or in-memory storage for tracking

### Task 7.4 — Add Comprehensive Logging

- Implement structured logging for all API endpoints
- Include request IDs for tracing
- Log all errors and critical events
- Use structured logging (JSON format)