# Error Handling Guide

Comprehensive guide to error handling in the MediMindPlus backend API.

## Overview

The backend uses a centralized error handling system that provides:
- **Consistent error responses** across all endpoints
- **Strong typing** with custom error classes
- **HIPAA compliance** with automatic PHI sanitization
- **Proper logging** with context and severity levels
- **Developer-friendly** stack traces in development mode
- **Production-ready** sanitized messages in production

## Error Response Format

All errors follow this standardized format:

```json
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "statusCode": 400,
    "path": "/api/endpoint",
    "method": "POST",
    "timestamp": "2026-02-07T14:30:00.000Z",
    "requestId": "optional-request-id"
  }
}
```

**Development Mode Only:**
```json
{
  "success": false,
  "error": {
    ...
    "stack": "Error stack trace",
    "details": {
      "field": "email",
      "constraint": "unique_violation"
    }
  }
}
```

## Custom Error Classes

Located in `src/middleware/errorHandler.ts`:

### Base Error Class

```typescript
import { AppError } from '../middleware/errorHandler';

throw new AppError('Error message', 500, true, 'ERROR_CODE', { details });
```

### Client Errors (4xx)

#### BadRequestError (400)
Use for invalid input or malformed requests:
```typescript
import { BadRequestError } from '../middleware/errorHandler';

throw new BadRequestError('Invalid email format');
throw new BadRequestError('Missing required fields', {
  fields: ['name', 'email']
});
```

#### UnauthorizedError (401)
Use when authentication is required but not provided:
```typescript
import { UnauthorizedError } from '../middleware/errorHandler';

throw new UnauthorizedError('Authentication token required');
throw new UnauthorizedError('Invalid credentials');
```

#### ForbiddenError (403)
Use when user is authenticated but lacks permission:
```typescript
import { ForbiddenError } from '../middleware/errorHandler';

throw new ForbiddenError('Insufficient permissions');
throw new ForbiddenError('Provider access required');
```

#### NotFoundError (404)
Use when a requested resource doesn't exist:
```typescript
import { NotFoundError } from '../middleware/errorHandler';

throw new NotFoundError('User not found');
throw new NotFoundError(`Consultation ${id} not found`);
```

#### ConflictError (409)
Use for conflicts like duplicate resources:
```typescript
import { ConflictError } from '../middleware/errorHandler';

throw new ConflictError('Email already exists');
throw new ConflictError('Appointment slot unavailable');
```

#### ValidationError (422)
Use for validation errors:
```typescript
import { ValidationError } from '../middleware/errorHandler';

throw new ValidationError('Validation failed', {
  errors: [
    { field: 'email', message: 'Invalid format' },
    { field: 'age', message: 'Must be positive' }
  ]
});
```

#### TooManyRequestsError (429)
Use for rate limiting:
```typescript
import { TooManyRequestsError } from '../middleware/errorHandler';

throw new TooManyRequestsError('Rate limit exceeded');
```

### Server Errors (5xx)

#### InternalServerError (500)
Use for unexpected server errors:
```typescript
import { InternalServerError } from '../middleware/errorHandler';

throw new InternalServerError('Unexpected error occurred');
```

#### DatabaseError (500)
Use for database-specific errors:
```typescript
import { DatabaseError } from '../middleware/errorHandler';

throw new DatabaseError('Database operation failed', {
  operation: 'INSERT',
  table: 'users'
});
```

#### BadGatewayError (502)
Use for external service failures:
```typescript
import { BadGatewayError } from '../middleware/errorHandler';

throw new BadGatewayError('Stripe API error');
```

#### ServiceUnavailableError (503)
Use when service is temporarily unavailable:
```typescript
import { ServiceUnavailableError } from '../middleware/errorHandler';

throw new ServiceUnavailableError('ML service unavailable');
```

#### GatewayTimeoutError (504)
Use for external service timeouts:
```typescript
import { GatewayTimeoutError } from '../middleware/errorHandler';

throw new GatewayTimeoutError('ML service timeout');
```

### Specialized Errors

#### ExternalServiceError (502)
Use for third-party service failures:
```typescript
import { ExternalServiceError } from '../middleware/errorHandler';

throw new ExternalServiceError('Stripe', 'Payment processing failed');
throw new ExternalServiceError('Twilio', 'Video room creation failed', {
  code: 20001
});
```

#### HIPAAComplianceError (403)
Use for HIPAA-specific violations:
```typescript
import { HIPAAComplianceError } from '../middleware/errorHandler';

throw new HIPAAComplianceError('Unauthorized PHI access attempt');
```

## Usage in Route Handlers

### Option 1: Using asyncHandler (Recommended)

The `asyncHandler` wrapper eliminates repetitive try-catch blocks:

```typescript
import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';

const router = Router();

router.get('/users/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!isValidUUID(id)) {
    throw new ValidationError('Invalid user ID format');
  }

  const user = await userService.findById(id);

  if (!user) {
    throw new NotFoundError(`User ${id} not found`);
  }

  res.json({
    success: true,
    data: user
  });
}));
```

### Option 2: Using try-catch

For more complex error handling:

```typescript
router.post('/users', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    const existingUser = await userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    const user = await userService.create({ email, password });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error); // Pass to error handling middleware
  }
});
```

## Error Handling Utilities

### Database Error Handler

Converts PostgreSQL errors to AppErrors:

```typescript
import { handleDatabaseError } from '../middleware/errorHandler';

try {
  await db.query('INSERT INTO users ...');
} catch (error) {
  throw handleDatabaseError(error);
}
```

Handles:
- `23505`: Unique violation → ConflictError
- `23503`: Foreign key violation → ValidationError
- `23502`: Not null violation → ValidationError
- `ECONNREFUSED`: Connection refused → ServiceUnavailableError
- `ETIMEDOUT`: Timeout → GatewayTimeoutError

### Validation Error Handler

For express-validator errors:

```typescript
import { validationResult } from 'express-validator';
import { validationErrorHandler } from '../middleware/errorHandler';

const errors = validationResult(req);
if (!errors.isEmpty()) {
  throw validationErrorHandler(errors.array());
}
```

### Rate Limit Error Handler

For rate limiting responses:

```typescript
import { handleRateLimitError } from '../middleware/errorHandler';

app.use('/api', rateLimiter, (req, res, next) => {
  if (req.rateLimit.exceeded) {
    return handleRateLimitError(req, res);
  }
  next();
});
```

## HIPAA Compliance

The error handler automatically sanitizes sensitive information:

### Redacted Patterns

- `password` → `[REDACTED]`
- `token` → `[REDACTED]`
- `secret` → `[REDACTED]`
- `api_key` → `[REDACTED]`
- `ssn` → `[REDACTED]`
- `credit_card` → `[REDACTED]`
- SSN patterns: `XXX-XX-XXXX` → `[REDACTED]`
- Credit card patterns → `[REDACTED]`

### Example

```typescript
// Input error
throw new BadRequestError('Invalid password: weak123');

// Response (sanitized)
{
  "error": {
    "message": "Invalid [REDACTED]: weak123",
    ...
  }
}
```

## Logging

Errors are logged with appropriate severity levels:

### Server Errors (5xx)
```typescript
logger.error('Server Error', {
  error: sanitizedError,
  requestId,
  userId,
  method,
  path,
  ip,
  userAgent
});
```

### Client Errors (4xx)
```typescript
logger.warn('Client Error', {
  error: sanitizedError,
  requestId,
  userId,
  method,
  path,
  ip
});
```

### Security Errors (401, 403, 429)
```typescript
logger.warn('Security Error', {
  statusCode,
  code,
  path,
  ip,
  userId,
  type: 'security'
});
```

## Best Practices

### ✅ Do

1. **Use specific error classes:**
   ```typescript
   throw new NotFoundError('User not found');
   ```

2. **Provide context in details:**
   ```typescript
   throw new ValidationError('Invalid input', {
     fields: ['email', 'password'],
     constraints: ['unique', 'min_length']
   });
   ```

3. **Use asyncHandler for clean code:**
   ```typescript
   router.get('/users', asyncHandler(async (req, res) => {
     const users = await userService.findAll();
     res.json({ success: true, data: users });
   }));
   ```

4. **Log before throwing (if needed):**
   ```typescript
   logger.warn('Invalid login attempt', { email, ip });
   throw new UnauthorizedError('Invalid credentials');
   ```

5. **Use meaningful error messages:**
   ```typescript
   throw new BadRequestError('Consultation start date cannot be in the past');
   ```

### ❌ Don't

1. **Don't use generic errors:**
   ```typescript
   // Bad
   throw new Error('Something went wrong');

   // Good
   throw new InternalServerError('Database connection failed');
   ```

2. **Don't expose sensitive data:**
   ```typescript
   // Bad
   throw new Error(`User password: ${password} is invalid`);

   // Good
   throw new BadRequestError('Password does not meet requirements');
   ```

3. **Don't use hardcoded status codes:**
   ```typescript
   // Bad
   res.status(500).json({ error: 'Error' });

   // Good
   throw new InternalServerError('Error occurred');
   ```

4. **Don't catch and swallow errors:**
   ```typescript
   // Bad
   try {
     await service.doSomething();
   } catch (error) {
     console.log(error); // Lost!
   }

   // Good
   try {
     await service.doSomething();
   } catch (error) {
     throw new DatabaseError('Operation failed', {
       originalError: error.message
     });
   }
   ```

5. **Don't return raw error objects:**
   ```typescript
   // Bad
   res.status(500).json({ error: error });

   // Good
   throw new InternalServerError(error.message);
   ```

## Testing Error Handling

### Unit Tests

```typescript
import { NotFoundError, ValidationError } from '../../../src/middleware/errorHandler';

describe('UserService', () => {
  it('should throw NotFoundError when user not found', async () => {
    await expect(userService.findById('invalid-id'))
      .rejects
      .toThrow(NotFoundError);
  });

  it('should throw ValidationError for invalid email', async () => {
    await expect(userService.create({ email: 'invalid' }))
      .rejects
      .toThrow(ValidationError);
  });
});
```

### Integration Tests

```typescript
describe('GET /api/users/:id', () => {
  it('should return 404 for non-existent user', async () => {
    const response = await request(app)
      .get('/api/users/00000000-0000-0000-0000-000000000000')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(response.body.error.message).toMatch(/not found/i);
  });

  it('should return 422 for invalid UUID', async () => {
    const response = await request(app)
      .get('/api/users/invalid-uuid')
      .expect(422);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

## Migration from Old Code

### Before (Repetitive)

```typescript
router.get('/users/:id', async (req, res) => {
  try {
    const user = await userService.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error: any) {
    logger.error('Error finding user:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to find user'
    });
  }
});
```

### After (Clean)

```typescript
import { asyncHandler } from '../middleware/errorHandler';
import { NotFoundError } from '../middleware/errorHandler';

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.findById(req.params.id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    data: user
  });
}));
```

## Troubleshooting

### Error Not Being Caught

**Problem:** Error thrown but not reaching error handler
**Solution:** Ensure async functions use `asyncHandler` or `.catch(next)`

```typescript
// Problem
router.get('/users', async (req, res) => {
  throw new Error('Oops'); // Not caught!
});

// Solution 1: asyncHandler
router.get('/users', asyncHandler(async (req, res) => {
  throw new Error('Oops'); // Caught!
}));

// Solution 2: Manual catch
router.get('/users', async (req, res, next) => {
  try {
    throw new Error('Oops');
  } catch (error) {
    next(error); // Caught!
  }
});
```

### Stack Traces Not Showing

**Problem:** Stack traces missing in development
**Solution:** Check `NODE_ENV` is set to `development`

```bash
NODE_ENV=development npm run dev
```

### Error Details Not Showing

**Problem:** `details` object not in response
**Solution:** Only available in development mode and must be passed to error constructor

```typescript
throw new ValidationError('Invalid input', {
  fields: ['email', 'password']
});
```

## Additional Resources

- [Express Error Handling](https://expressjs.com/en/guide/error-handling.html)
- [HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [Winston Logger](https://github.com/winstonjs/winston)
