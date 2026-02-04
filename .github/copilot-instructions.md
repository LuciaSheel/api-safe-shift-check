# Copilot Instructions for api-safe-shift-check

> **CRITICAL FOR AI ASSISTANTS**: Before writing ANY code that references database tables, columns, fields, functions, or existing modules, you MUST first examine the actual source files to verify the correct names. NEVER guess or assume names based on conventions. Always use the `view` command or read the relevant files first.

---

## Table of Contents

1. AI Assistant Guidelines
2. Project Architecture
3. API Versioning
4. Database Layer (Prisma 7)
5. Business Logic Layer
6. Input Validation & Sanitization
7. Security Best Practices
8. File Uploads with Google Cloud Storage
9. Environment & Secrets Management
10. Date & Time Handling
11. Error Handling
12. Testing Standards
13. Code Style & Conventions
14. Configuration & Settings Management

---

## AI Assistant Guidelines

### Mandatory Verification Before Coding

**STOP AND VERIFY** before writing any code that references existing project elements:

```
✅ DO: Read schema.prisma before referencing any table or column
✅ DO: Examine existing service files before calling their methods
✅ DO: Check route files to understand existing endpoint patterns
✅ DO: Review type definitions before using interfaces or types
✅ DO: Look at existing validation schemas before creating new ones

❌ DON'T: Assume a column is named `userId` when it might be `user_id` or `UserId`
❌ DON'T: Guess function signatures without reading the source
❌ DON'T: Assume table names follow a particular convention
❌ DON'T: Create duplicate utilities that already exist in the codebase
```

### Before Each Task Checklist

1. **Database References**: Read `prisma/schema.prisma` to verify table and column names
2. **Service Methods**: Read the relevant `src/services/*.service.ts` files
3. **Existing Types**: Check `src/types/` directory for existing interfaces
4. **Utility Functions**: Review `src/utils/` before creating new helpers
5. **Validation Schemas**: Check `src/validators/` for existing schemas
6. **Constants**: Review `src/constants/` for existing enums and constants

### Verification Commands

```bash
# View database schema
cat prisma/schema.prisma

# List all service files
ls -la src/services/

# View specific service methods
cat src/services/user.service.ts

# Check existing types
cat src/types/index.ts

# View validation schemas
cat src/validators/user.validator.ts
```

---

## Project Architecture

### Directory Structure

```
src/
├── api/                          # API Layer (Controllers/Routes)
│   ├── v1/                       # Version 1 endpoints
│   │   ├── routes/
│   │   │   ├── index.ts          # Route aggregator for v1
│   │   │   ├── user.routes.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── file.routes.ts
│   │   ├── controllers/
│   │   │   ├── user.controller.ts
│   │   │   ├── auth.controller.ts
│   │   │   └── file.controller.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       └── validation.middleware.ts
│   ├── v2/                       # Version 2 endpoints (future)
│   │   └── ...
│   └── index.ts                  # API version router
│
├── services/                     # Business Logic Layer
│   ├── user.service.ts
│   ├── auth.service.ts
│   ├── file.service.ts
│   └── email.service.ts
│
├── repositories/                 # Database Access Layer
│   ├── base.repository.ts
│   ├── user.repository.ts
│   └── file.repository.ts
│
├── database/                     # Database Configuration
│   ├── prisma.ts                 # Prisma client singleton
│   └── migrations/               # Migration scripts (if needed beyond Prisma)
│
├── validators/                   # Input Validation Schemas
│   ├── user.validator.ts
│   ├── auth.validator.ts
│   └── common.validator.ts
│
├── types/                        # TypeScript Interfaces & Types
│   ├── index.ts
│   ├── user.types.ts
│   ├── api.types.ts
│   └── file.types.ts
│
├── utils/                        # Utility Functions
│   ├── date.utils.ts
│   ├── crypto.utils.ts
│   ├── response.utils.ts
│   └── storage.utils.ts
│
├── config/                       # Configuration
│   ├── index.ts                  # Main config aggregator
│   ├── database.config.ts
│   ├── storage.config.ts
│   └── secrets.config.ts
│
├── constants/                    # Application Constants
│   ├── index.ts
│   ├── error-codes.ts
│   └── enums.ts
│
├── middleware/                   # Global Middleware
│   ├── error-handler.middleware.ts
│   ├── request-logger.middleware.ts
│   └── rate-limiter.middleware.ts
│
└── app.ts                        # Application entry point

prisma/
├── schema.prisma                 # Database schema (SOURCE OF TRUTH)
├── migrations/                   # Prisma migrations
└── seed.ts                       # Database seeding

tests/
├── unit/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   └── repositories/
└── fixtures/
```

### Layer Responsibilities

#### API Layer (Controllers/Routes)

- HTTP request/response handling ONLY
- Request validation orchestration
- Authentication/authorization checks
- Response formatting
- NO business logic
- NO direct database access

#### Business Logic Layer (Services)

- All business rules and logic
- Orchestration of multiple repository calls
- Transaction management
- External API integrations
- NO HTTP concerns
- NO direct Prisma calls (use repositories)

#### Database Layer (Repositories)

- All Prisma/database operations
- Query building and optimization
- Data transformation to/from database
- NO business logic
- NO HTTP concerns

### Layer Communication Example

```typescript
// ❌ WRONG: Controller directly accessing database
// api/v1/controllers/user.controller.ts
export const getUser = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } })
  res.json(user)
}

// ✅ CORRECT: Proper layer separation
// api/v1/controllers/user.controller.ts
import { UserService } from '../../../services/user.service'

export const getUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await UserService.getUserById(req.params.id)
    res.json(formatResponse(user))
  } catch (error) {
    next(error)
  }
}

// services/user.service.ts
import { UserRepository } from '../repositories/user.repository'

export class UserService {
  static async getUserById(id: string): Promise<UserDTO> {
    const user = await UserRepository.findById(id)
    if (!user) {
      throw new NotFoundError('User not found')
    }
    return this.toDTO(user)
  }
}

// repositories/user.repository.ts
import { prisma } from '../database/prisma'

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
  }
}
```

---

## API Versioning

### Version Router Setup

```typescript
// src/api/index.ts
import { Router } from 'express'
import v1Routes from './v1/routes'
import v2Routes from './v2/routes'

const apiRouter = Router()

apiRouter.use('/v1', v1Routes)
apiRouter.use('/v2', v2Routes)

// Optional: Default to latest stable version
apiRouter.use('/', v1Routes)

export default apiRouter
```

### Version-Specific Routes

```typescript
// src/api/v1/routes/index.ts
import { Router } from 'express'
import userRoutes from './user.routes'
import authRoutes from './auth.routes'
import fileRoutes from './file.routes'

const v1Router = Router()

v1Router.use('/users', userRoutes)
v1Router.use('/auth', authRoutes)
v1Router.use('/files', fileRoutes)

export default v1Router
```

### Versioning Best Practices

```typescript
// URL Pattern: /api/v1/users, /api/v2/users
// Base URL in app.ts
app.use('/api', apiRouter)

// Version headers for additional context (optional)
app.use((req, res, next) => {
  res.setHeader('X-API-Version', req.path.match(/\/v(\d+)\//)?.[1] || '1')
  next()
})
```

### Deprecation Handling

```typescript
// middleware/deprecation.middleware.ts
export const deprecationWarning = (sunsetDate: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Deprecation', 'true')
    res.setHeader('Sunset', sunsetDate)
    res.setHeader('Link', '</api/v2>; rel="successor-version"')
    next()
  }
}

// Usage in v1 routes when v2 is available
v1Router.use(
  '/legacy-endpoint',
  deprecationWarning('2025-12-31'),
  legacyController,
)
```

---

## Database Layer (Prisma 7)

> **IMPORTANT**: This project uses **Prisma 7** with the **adapter pattern**. Prisma 7 requires using `@prisma/adapter-pg` with a `pg` connection pool instead of the direct driver.

### Docker PostgreSQL Setup

The project uses PostgreSQL 15 running in Docker:

```bash
# Create and start the PostgreSQL container
# Replace placeholders with your project-specific values
docker run --name {project}-postgres \
  -e POSTGRES_USER={db_user} \
  -e POSTGRES_PASSWORD={db_password} \
  -e POSTGRES_DB={db_name} \
  -p 5433:5432 \
  -d postgres:15

# Start existing container
docker start {project}-postgres

# Stop container
docker stop {project}-postgres
```

### Database Schema Changes & Migrations

> **CRITICAL**: Due to Prisma 7's config file setup (`prisma/prisma.config.ts`), the standard `prisma migrate dev` command does NOT work in this project. Always use `prisma db push` instead.

**To apply schema changes to the database:**

```bash
# ✅ CORRECT: Use db push with explicit URL (DATABASE_URL from the .env file)
npx prisma db push --url "{DATABASE_URL}"

# ✅ CORRECT: Then regenerate the Prisma client
npx prisma generate

# ❌ WRONG: Do NOT use migrate dev - it will fail with config errors
npx prisma migrate dev  # This will NOT work!
```

**Workflow for schema changes:**

1. Edit `prisma/schema.prisma` with your changes
2. Run `npx prisma db push --url "DATABASE_URL"`
3. Run `npx prisma generate` to update the client
4. Restart the backend server

**To view the database in Prisma Studio:**

```bash
npm run db:studio
# Or directly:
npx prisma studio --url "{DATABASE_URL}"
```

### Prisma Client Singleton (Prisma 7 Adapter Pattern)

```typescript
// src/database/prisma.ts
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pool: Pool | undefined
}

// Create connection pool
const pool =
  globalForPrisma.pool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  })

// Create Prisma adapter
const adapter = new PrismaPg(pool)

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
  globalForPrisma.pool = pool
}

// Graceful shutdown - must close both prisma and pool
process.on('beforeExit', async () => {
  await prisma.$disconnect()
  await pool.end()
})
```

### Repository Pattern

```typescript
// src/repositories/base.repository.ts
import { prisma } from '../database/prisma'

export abstract class BaseRepository<T> {
  protected prisma = prisma
  protected abstract modelName: string

  // Common operations can be defined here
  // But prefer explicit methods in child repositories
}

// src/repositories/user.repository.ts
import { prisma } from '../database/prisma'
import { Prisma, User } from '@prisma/client'

export class UserRepository {
  /**
   * Find user by ID
   * @param id - User's unique identifier
   * @returns User with profile or null
   */
  static async findById(id: string): Promise<User | null> {
    // ALWAYS verify column names exist in schema.prisma before writing queries
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    })
  }

  /**
   * Find user by email
   * @param email - User's email address
   */
  static async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    })
  }

  /**
   * Create new user with transaction support
   */
  static async createWithProfile(
    userData: Prisma.UserCreateInput,
    profileData: Prisma.ProfileCreateWithoutUserInput,
  ): Promise<User> {
    return prisma.user.create({
      data: {
        ...userData,
        profile: {
          create: profileData,
        },
      },
      include: { profile: true },
    })
  }

  /**
   * Paginated user list
   */
  static async findMany(params: {
    skip?: number
    take?: number
    where?: Prisma.UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
  }) {
    const { skip = 0, take = 20, where, orderBy } = params

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({ skip, take, where, orderBy }),
      prisma.user.count({ where }),
    ])

    return { users, total, skip, take }
  }
}
```

### CRITICAL: No Inline SQL

```typescript
// ❌ NEVER DO THIS - SQL Injection vulnerability
const users = await prisma.$queryRawUnsafe(
  `SELECT * FROM users WHERE email = '${email}'`,
)

// ❌ NEVER DO THIS - Even with template literals
const query = `SELECT * FROM users WHERE id = ${userId}`
await prisma.$queryRawUnsafe(query)

// ✅ CORRECT: Use Prisma's query builder
const users = await prisma.user.findMany({
  where: { email },
})

// ✅ CORRECT: If raw SQL is absolutely necessary, use parameterized queries
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${email}
`

// ✅ CORRECT: For dynamic queries, use Prisma.sql
import { Prisma } from '@prisma/client'

const columns = ['id', 'email', 'name']
const safeColumns = columns.map((c) => Prisma.sql([c]))
const result = await prisma.$queryRaw`
  SELECT ${Prisma.join(safeColumns)} FROM users WHERE id = ${userId}
`
```

### Transaction Handling

```typescript
// src/services/order.service.ts
import { prisma } from '../database/prisma'

export class OrderService {
  static async createOrderWithItems(orderData: CreateOrderDTO) {
    // Use interactive transactions for complex operations
    return prisma.$transaction(
      async (tx) => {
        // Create order
        const order = await tx.order.create({
          data: {
            userId: orderData.userId,
            status: 'PENDING',
            totalAmount: orderData.totalAmount,
          },
        })

        // Create order items
        await tx.orderItem.createMany({
          data: orderData.items.map((item) => ({
            orderId: order.id,
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        })

        // Update inventory
        for (const item of orderData.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          })
        }

        return order
      },
      {
        maxWait: 5000, // Max time to wait for transaction slot
        timeout: 10000, // Max time for transaction to complete
      },
    )
  }
}
```

---

## Business Logic Layer

### Service Structure

```typescript
// src/services/user.service.ts
import { UserRepository } from '../repositories/user.repository'
import {
  CreateUserDTO,
  UpdateUserDTO,
  UserResponseDTO,
} from '../types/user.types'
import { BadRequestError, NotFoundError, ConflictError } from '../utils/errors'
import { hashPassword, verifyPassword } from '../utils/crypto.utils'

export class UserService {
  /**
   * Get user by ID
   * @throws NotFoundError if user doesn't exist
   */
  static async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await UserRepository.findById(id)

    if (!user) {
      throw new NotFoundError(`User with ID ${id} not found`)
    }

    return this.toResponseDTO(user)
  }

  /**
   * Create new user
   * @throws ConflictError if email already exists
   */
  static async createUser(data: CreateUserDTO): Promise<UserResponseDTO> {
    // Business rule: Check for existing email
    const existing = await UserRepository.findByEmail(data.email)
    if (existing) {
      throw new ConflictError('Email already registered')
    }

    // Business rule: Hash password before storage
    const hashedPassword = await hashPassword(data.password)

    const user = await UserRepository.create({
      ...data,
      password: hashedPassword,
    })

    return this.toResponseDTO(user)
  }

  /**
   * Transform database entity to response DTO
   * Removes sensitive fields like password
   */
  private static toResponseDTO(user: User): UserResponseDTO {
    const { password, ...safeUser } = user
    return {
      ...safeUser,
      createdAt: formatDateISO(safeUser.createdAt),
      updatedAt: formatDateISO(safeUser.updatedAt),
    }
  }
}
```

### Service Best Practices

```typescript
// ✅ Services should:
// 1. Contain all business logic
// 2. Validate business rules (not input format - that's validators)
// 3. Orchestrate multiple repository calls
// 4. Handle transactions when needed
// 5. Transform data between layers
// 6. Throw domain-specific errors

// ❌ Services should NOT:
// 1. Access request/response objects
// 2. Make direct Prisma calls (use repositories)
// 3. Handle HTTP status codes
// 4. Perform input validation (use validators)
```

---

## Input Validation & Sanitization

### Validation Schema Setup (Using Zod)

```typescript
// src/validators/user.validator.ts
import { z } from 'zod'

// Reusable schemas
const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be less than 255 characters')
  .transform((val) => val.toLowerCase().trim())

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be less than 128 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    'Password must contain uppercase, lowercase, number, and special character',
  )

const uuidSchema = z.string().uuid('Invalid ID format')

// Request schemas
export const createUserSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: passwordSchema,
    firstName: z.string().min(1).max(100).trim(),
    lastName: z.string().min(1).max(100).trim(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
  }),
})

export const updateUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
  body: z.object({
    firstName: z.string().min(1).max(100).trim().optional(),
    lastName: z.string().min(1).max(100).trim().optional(),
    phone: z
      .string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional()
      .nullable(),
  }),
})

export const getUserSchema = z.object({
  params: z.object({
    id: uuidSchema,
  }),
})

export const listUsersSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().max(100).optional(),
    sortBy: z.enum(['createdAt', 'email', 'firstName']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
})

// Type inference
export type CreateUserInput = z.infer<typeof createUserSchema>['body']
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body']
export type ListUsersQuery = z.infer<typeof listUsersSchema>['query']
```

### Validation Middleware

```typescript
// src/middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { BadRequestError } from '../utils/errors'

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      // Replace with validated & transformed data
      req.body = validated.body
      req.query = validated.query as any
      req.params = validated.params as any

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        next(new BadRequestError('Validation failed', errors))
      } else {
        next(error)
      }
    }
  }
}
```

### Route with Validation

```typescript
// src/api/v1/routes/user.routes.ts
import { Router } from 'express'
import { validate } from '../../../middleware/validation.middleware'
import { authenticate } from '../middleware/auth.middleware'
import * as userValidator from '../../../validators/user.validator'
import * as userController from '../controllers/user.controller'

const router = Router()

router.post(
  '/',
  validate(userValidator.createUserSchema),
  userController.createUser,
)

router.get(
  '/',
  authenticate,
  validate(userValidator.listUsersSchema),
  userController.listUsers,
)

router.get(
  '/:id',
  authenticate,
  validate(userValidator.getUserSchema),
  userController.getUser,
)

router.patch(
  '/:id',
  authenticate,
  validate(userValidator.updateUserSchema),
  userController.updateUser,
)

export default router
```

### Additional Sanitization

```typescript
// src/utils/sanitize.utils.ts
import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitize HTML content to prevent XSS
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
  })
}

/**
 * Sanitize string for safe logging (remove sensitive patterns)
 */
export function sanitizeForLog(str: string): string {
  return str
    .replace(/password["\s:=]+["']?[^"'\s,}]+/gi, 'password=***')
    .replace(/token["\s:=]+["']?[^"'\s,}]+/gi, 'token=***')
    .replace(/authorization["\s:=]+["']?[^"'\s,}]+/gi, 'authorization=***')
}

/**
 * Strip null bytes and other dangerous characters
 */
export function sanitizeInput(str: string): string {
  return str
    .replace(/\0/g, '') // Null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Control characters
}
```

---

## Security Best Practices

### Authentication Middleware

```typescript
// src/api/v1/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { UnauthorizedError, ForbiddenError } from '../../../utils/errors'
import { config } from '../../../config'

export interface AuthenticatedRequest extends Request {
  user: {
    id: string
    email: string
    role: string
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided')
    }

    const token = authHeader.slice(7)

    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string
      email: string
      role: string
    }

    ;(req as AuthenticatedRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    }

    next()
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'))
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'))
    } else {
      next(error)
    }
  }
}

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthenticatedRequest).user

    if (!user) {
      return next(new UnauthorizedError('Not authenticated'))
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new ForbiddenError('Insufficient permissions'))
    }

    next()
  }
}
```

### Rate Limiting

```typescript
// src/middleware/rate-limiter.middleware.ts
import rateLimit from 'express-rate-limit'
import RedisStore from 'rate-limit-redis'
import { redis } from '../config/redis.config'

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later',
  },
  store: new RedisStore({
    sendCommand: (...args: string[]) => redis.sendCommand(args),
  }),
})

// Strict limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  skipSuccessfulRequests: true,
  message: {
    error: 'Too many authentication attempts, please try again later',
  },
})

// File upload limit
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    error: 'Upload limit reached, please try again later',
  },
})
```

### Security Headers

```typescript
// src/middleware/security.middleware.ts
import helmet from 'helmet'
import cors from 'cors'
import { config } from '../config'

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://storage.googleapis.com'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: 'same-site' },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
  }),

  cors({
    origin: config.cors.allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Limit'],
    credentials: true,
    maxAge: 86400, // 24 hours
  }),
]
```

### Password Handling

```typescript
// src/utils/crypto.utils.ts
import bcrypt from 'bcrypt'
import crypto from 'crypto'

const SALT_ROUNDS = 12

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

export function generateApiKey(): string {
  const prefix = 'sk_'
  const key = crypto.randomBytes(32).toString('base64url')
  return `${prefix}${key}`
}
```

---

## File Uploads with Google Cloud Storage

### Storage Configuration

```typescript
// src/config/storage.config.ts
import { Storage } from '@google-cloud/storage'
import { config } from './index'

let storage: Storage

if (config.env === 'development') {
  // Use service account key file in development
  storage = new Storage({
    projectId: config.gcp.projectId,
    keyFilename: config.gcp.keyFilename,
  })
} else {
  // Use default credentials in GCP environments (Cloud Run, GKE, etc.)
  storage = new Storage({
    projectId: config.gcp.projectId,
  })
}

export const bucket = storage.bucket(config.gcp.storageBucket)
export { storage }
```

### File Service with Signed URLs

```typescript
// src/services/file.service.ts
import { bucket } from '../config/storage.config'
import { FileRepository } from '../repositories/file.repository'
import { generateSecureToken } from '../utils/crypto.utils'
import { BadRequestError, NotFoundError } from '../utils/errors'
import path from 'path'

// Allowed MIME types
const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

interface UploadConfig {
  folder: string
  allowedTypes: string[]
  maxSize?: number
}

export class FileService {
  /**
   * Generate a signed URL for uploading a file directly to GCS
   */
  static async generateUploadUrl(
    userId: string,
    filename: string,
    contentType: string,
    config: UploadConfig,
  ): Promise<{ uploadUrl: string; fileId: string; publicPath: string }> {
    // Validate content type
    if (!config.allowedTypes.includes(contentType)) {
      throw new BadRequestError(
        `Invalid file type. Allowed: ${config.allowedTypes.join(', ')}`,
      )
    }

    // Generate secure filename
    const ext = path.extname(filename).toLowerCase()
    const secureFilename = `${generateSecureToken(16)}${ext}`
    const filePath = `${config.folder}/${userId}/${secureFilename}`

    // Create file record in database
    const fileRecord = await FileRepository.create({
      userId,
      originalFilename: filename,
      storagePath: filePath,
      contentType,
      status: 'PENDING',
    })

    // Generate signed upload URL
    const [uploadUrl] = await bucket.file(filePath).getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      contentType,
      extensionHeaders: {
        'x-goog-content-length-range': `0,${config.maxSize || MAX_FILE_SIZE}`,
      },
    })

    return {
      uploadUrl,
      fileId: fileRecord.id,
      publicPath: filePath,
    }
  }

  /**
   * Confirm upload completion and update file record
   */
  static async confirmUpload(fileId: string, userId: string): Promise<void> {
    const file = await FileRepository.findById(fileId)

    if (!file || file.userId !== userId) {
      throw new NotFoundError('File not found')
    }

    // Verify file exists in GCS
    const [exists] = await bucket.file(file.storagePath).exists()
    if (!exists) {
      throw new BadRequestError('File not uploaded')
    }

    // Get file metadata
    const [metadata] = await bucket.file(file.storagePath).getMetadata()

    await FileRepository.update(fileId, {
      status: 'COMPLETED',
      size: Number(metadata.size),
      uploadedAt: new Date(),
    })
  }

  /**
   * Generate a signed URL for downloading a file
   */
  static async generateDownloadUrl(
    fileId: string,
    userId: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    const file = await FileRepository.findById(fileId)

    if (!file) {
      throw new NotFoundError('File not found')
    }

    // Check access permission (extend this based on your access control needs)
    if (file.userId !== userId && !file.isPublic) {
      throw new NotFoundError('File not found')
    }

    const [downloadUrl] = await bucket.file(file.storagePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      responseDisposition: `attachment; filename="${file.originalFilename}"`,
    })

    return downloadUrl
  }

  /**
   * Generate a signed URL for viewing a file (inline)
   */
  static async generateViewUrl(
    fileId: string,
    userId: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    const file = await FileRepository.findById(fileId)

    if (!file) {
      throw new NotFoundError('File not found')
    }

    if (file.userId !== userId && !file.isPublic) {
      throw new NotFoundError('File not found')
    }

    const [viewUrl] = await bucket.file(file.storagePath).getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
      responseDisposition: 'inline',
      responseType: file.contentType,
    })

    return viewUrl
  }

  /**
   * Delete a file from storage and database
   */
  static async deleteFile(fileId: string, userId: string): Promise<void> {
    const file = await FileRepository.findById(fileId)

    if (!file || file.userId !== userId) {
      throw new NotFoundError('File not found')
    }

    // Delete from GCS
    await bucket.file(file.storagePath).delete({ ignoreNotFound: true })

    // Delete from database
    await FileRepository.delete(fileId)
  }
}
```

### File Upload Controller

```typescript
// src/api/v1/controllers/file.controller.ts
import { Request, Response, NextFunction } from 'express'
import { FileService } from '../../../services/file.service'
import { AuthenticatedRequest } from '../middleware/auth.middleware'

export const getUploadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = req as AuthenticatedRequest
    const { filename, contentType, folder } = req.body

    const config = {
      folder: folder || 'uploads',
      allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      maxSize: 10 * 1024 * 1024,
    }

    const result = await FileService.generateUploadUrl(
      user.id,
      filename,
      contentType,
      config,
    )

    res.json({
      success: true,
      data: result,
    })
  } catch (error) {
    next(error)
  }
}

export const confirmUpload = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = req as AuthenticatedRequest
    const { fileId } = req.params

    await FileService.confirmUpload(fileId, user.id)

    res.json({
      success: true,
      message: 'Upload confirmed',
    })
  } catch (error) {
    next(error)
  }
}

export const getDownloadUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { user } = req as AuthenticatedRequest
    const { fileId } = req.params

    const downloadUrl = await FileService.generateDownloadUrl(fileId, user.id)

    res.json({
      success: true,
      data: { downloadUrl },
    })
  } catch (error) {
    next(error)
  }
}
```

### File Upload Flow (Frontend Reference)

```typescript
// Example frontend implementation (for reference)
async function uploadFile(file: File) {
  // 1. Get signed upload URL from your API
  const { uploadUrl, fileId } = await api.post('/files/upload-url', {
    filename: file.name,
    contentType: file.type,
  })

  // 2. Upload directly to GCS using signed URL
  await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  })

  // 3. Confirm upload to your API
  await api.post(`/files/${fileId}/confirm`)

  return fileId
}
```

---

## Environment & Secrets Management

### Environment Configuration

```typescript
// src/config/index.ts
import { loadSecrets } from './secrets.config'

// Load secrets based on environment
let secrets: Record<string, string> = {}

export async function initializeConfig() {
  if (process.env.NODE_ENV === 'development') {
    // Development: Use .env file
    require('dotenv').config()
    secrets = process.env as Record<string, string>
  } else {
    // Staging/Production: Use Google Secret Manager
    secrets = await loadSecrets()
  }
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(secrets.PORT || '3000', 10),

  database: {
    url: secrets.DATABASE_URL,
  },

  jwt: {
    secret: secrets.JWT_SECRET,
    expiresIn: secrets.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: secrets.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  gcp: {
    projectId: secrets.GCP_PROJECT_ID,
    storageBucket: secrets.GCS_BUCKET_NAME,
    keyFilename: secrets.GCP_KEY_FILENAME, // Only used in development
  },

  cors: {
    allowedOrigins: (secrets.CORS_ORIGINS || '').split(',').filter(Boolean),
  },

  redis: {
    url: secrets.REDIS_URL,
  },
}
```

### Google Secret Manager Integration

```typescript
// src/config/secrets.config.ts
import { SecretManagerServiceClient } from '@google-cloud/secret-manager'

const client = new SecretManagerServiceClient()

// Define which secrets to load
const SECRET_NAMES = [
  'DATABASE_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GCP_PROJECT_ID',
  'GCS_BUCKET_NAME',
  'REDIS_URL',
  'CORS_ORIGINS',
]

export async function loadSecrets(): Promise<Record<string, string>> {
  const projectId = process.env.GCP_PROJECT_ID

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID environment variable is required')
  }

  const secrets: Record<string, string> = {}

  await Promise.all(
    SECRET_NAMES.map(async (secretName) => {
      try {
        const name = `projects/${projectId}/secrets/${secretName}/versions/latest`
        const [version] = await client.accessSecretVersion({ name })
        const payload = version.payload?.data?.toString()

        if (payload) {
          secrets[secretName] = payload
        }
      } catch (error) {
        console.error(`Failed to load secret ${secretName}:`, error)
        // Optionally throw or continue based on whether secret is required
      }
    }),
  )

  return secrets
}

/**
 * Get a specific secret at runtime
 */
export async function getSecret(secretName: string): Promise<string | null> {
  const projectId = process.env.GCP_PROJECT_ID

  if (!projectId) {
    throw new Error('GCP_PROJECT_ID is required')
  }

  try {
    const name = `projects/${projectId}/secrets/${secretName}/versions/latest`
    const [version] = await client.accessSecretVersion({ name })
    return version.payload?.data?.toString() || null
  } catch (error) {
    console.error(`Failed to get secret ${secretName}:`, error)
    return null
  }
}
```

### Development .env File Template

```bash
# .env.example - Copy to .env for local development

# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/myapp?schema=public"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES_IN=7d

# Google Cloud Platform
GCP_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCP_KEY_FILENAME=./service-account-key.json

# Redis (optional for development)
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Timezone
DEFAULT_TIMEZONE=America/Edmonton
```

### Application Bootstrap

```typescript
// src/app.ts
import express from 'express'
import { initializeConfig, config } from './config'
import { prisma } from './database/prisma'
import apiRouter from './api'
import { securityMiddleware } from './middleware/security.middleware'
import { errorHandler } from './middleware/error-handler.middleware'
import { requestLogger } from './middleware/request-logger.middleware'
import { apiLimiter } from './middleware/rate-limiter.middleware'

async function bootstrap() {
  // Initialize configuration (loads secrets)
  await initializeConfig()

  const app = express()

  // Trust proxy for correct IP detection behind load balancer
  app.set('trust proxy', 1)

  // Security middleware
  app.use(securityMiddleware)

  // Request parsing
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))

  // Request logging
  app.use(requestLogger)

  // Rate limiting
  app.use('/api', apiLimiter)

  // API routes
  app.use('/api', apiRouter)

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() })
  })

  // Error handling (must be last)
  app.use(errorHandler)

  // Start server
  const server = app.listen(config.port, () => {
    console.log(`Server running on port ${config.port}`)
  })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('Shutting down gracefully...')
    server.close(async () => {
      await prisma.$disconnect()
      process.exit(0)
    })
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)
}

bootstrap().catch((error) => {
  console.error('Failed to start application:', error)
  process.exit(1)
})
```

---

## Date & Time Handling

### Date Utilities

```typescript
// src/utils/date.utils.ts
import { format, parseISO, isValid } from 'date-fns'
import { formatInTimeZone, toZonedTime } from 'date-fns-tz'

// Default timezone - should match your primary user base
const DEFAULT_TIMEZONE = process.env.DEFAULT_TIMEZONE || 'America/Edmonton'

/**
 * Format a date to ISO format (YYYY-MM-DD) in the specified timezone
 * This is the REQUIRED format for all date responses to the frontend
 */
export function formatDateISO(
  date: Date | string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): string | null {
  if (!date) return null

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return null

  return formatInTimeZone(dateObj, timezone, 'yyyy-MM-dd')
}

/**
 * Format a datetime to ISO format (YYYY-MM-DDTHH:mm:ss) in the specified timezone
 */
export function formatDateTimeISO(
  date: Date | string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): string | null {
  if (!date) return null

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return null

  return formatInTimeZone(dateObj, timezone, "yyyy-MM-dd'T'HH:mm:ss")
}

/**
 * Format a datetime with timezone offset
 */
export function formatDateTimeWithOffset(
  date: Date | string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE,
): string | null {
  if (!date) return null

  const dateObj = typeof date === 'string' ? parseISO(date) : date

  if (!isValid(dateObj)) return null

  return formatInTimeZone(dateObj, timezone, "yyyy-MM-dd'T'HH:mm:ssXXX")
}

/**
 * Parse an ISO date string to a Date object
 */
export function parseDate(dateString: string): Date | null {
  const parsed = parseISO(dateString)
  return isValid(parsed) ? parsed : null
}

/**
 * Get current date in ISO format for specified timezone
 */
export function getCurrentDateISO(timezone: string = DEFAULT_TIMEZONE): string {
  return formatInTimeZone(new Date(), timezone, 'yyyy-MM-dd')
}

/**
 * Get current datetime in ISO format for specified timezone
 */
export function getCurrentDateTimeISO(
  timezone: string = DEFAULT_TIMEZONE,
): string {
  return formatInTimeZone(new Date(), timezone, "yyyy-MM-dd'T'HH:mm:ss")
}

/**
 * Convert a date to the start of day in specified timezone
 */
export function startOfDayInTimezone(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  zonedDate.setHours(0, 0, 0, 0)
  return zonedDate
}

/**
 * Convert a date to the end of day in specified timezone
 */
export function endOfDayInTimezone(
  date: Date | string,
  timezone: string = DEFAULT_TIMEZONE,
): Date {
  const dateObj = typeof date === 'string' ? parseISO(date) : date
  const zonedDate = toZonedTime(dateObj, timezone)
  zonedDate.setHours(23, 59, 59, 999)
  return zonedDate
}
```

### Response Formatter with Date Handling

```typescript
// src/utils/response.utils.ts
import { formatDateISO, formatDateTimeISO } from './date.utils'

/**
 * Standard API response format
 */
interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: unknown
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
    totalPages?: number
  }
}

/**
 * Transform dates in an object to ISO format strings
 */
export function transformDates<T extends Record<string, any>>(
  obj: T,
  timezone?: string,
): T {
  const result = { ...obj }

  for (const key in result) {
    const value = result[key]

    if (value instanceof Date) {
      // Determine if this is a date-only or datetime field based on naming convention
      if (
        key.toLowerCase().includes('date') &&
        !key.toLowerCase().includes('time')
      ) {
        ;(result as any)[key] = formatDateISO(value, timezone)
      } else {
        ;(result as any)[key] = formatDateTimeISO(value, timezone)
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      ;(result as any)[key] = transformDates(value, timezone)
    } else if (Array.isArray(value)) {
      ;(result as any)[key] = value.map((item) =>
        item && typeof item === 'object'
          ? transformDates(item, timezone)
          : item,
      )
    }
  }

  return result
}

/**
 * Format successful response with date transformation
 */
export function formatResponse<T>(data: T, timezone?: string): ApiResponse<T> {
  const transformedData =
    data && typeof data === 'object'
      ? (transformDates(data as Record<string, any>, timezone) as T)
      : data

  return {
    success: true,
    data: transformedData,
  }
}

/**
 * Format paginated response
 */
export function formatPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  timezone?: string,
): ApiResponse<T[]> {
  return {
    success: true,
    data: data.map((item) =>
      item && typeof item === 'object'
        ? (transformDates(item as Record<string, any>, timezone) as T)
        : item,
    ),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}
```

### Date Validation Schemas

```typescript
// src/validators/common.validator.ts
import { z } from 'zod'

/**
 * ISO date string validation (YYYY-MM-DD)
 */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
  .refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, 'Invalid date')

/**
 * ISO datetime string validation (YYYY-MM-DDTHH:mm:ss)
 */
export const isoDateTimeSchema = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{3})?(Z|[+-]\d{2}:\d{2})?$/,
    'DateTime must be in ISO 8601 format',
  )
  .refine((date) => {
    const parsed = new Date(date)
    return !isNaN(parsed.getTime())
  }, 'Invalid datetime')

/**
 * Timezone validation
 */
export const timezoneSchema = z.string().refine((tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz })
    return true
  } catch {
    return false
  }
}, 'Invalid timezone')

/**
 * Date range validation
 */
export const dateRangeSchema = z
  .object({
    startDate: isoDateSchema,
    endDate: isoDateSchema,
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: 'Start date must be before or equal to end date',
  })
```

---

## Error Handling

### Custom Error Classes

```typescript
// src/utils/errors.ts

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code: string
  public readonly isOperational: boolean
  public readonly details?: unknown

  constructor(
    message: string,
    statusCode: number,
    code: string,
    isOperational = true,
    details?: unknown,
  ) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = isOperational
    this.details = details

    Error.captureStackTrace(this, this.constructor)
  }
}

export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: unknown) {
    super(message, 400, 'BAD_REQUEST', true, details)
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED', true)
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN', true)
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404, 'NOT_FOUND', true)
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict') {
    super(message, 409, 'CONFLICT', true)
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: unknown) {
    super(message, 422, 'VALIDATION_ERROR', true, details)
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(message, 429, 'TOO_MANY_REQUESTS', true)
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(message, 500, 'INTERNAL_SERVER_ERROR', false)
  }
}
```

### Global Error Handler

```typescript
// src/middleware/error-handler.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/errors'
import { Prisma } from '@prisma/client'
import { ZodError } from 'zod'
import { config } from '../config'

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Log error for debugging
  console.error('Error:', {
    message: error.message,
    stack: config.env === 'development' ? error.stack : undefined,
    path: req.path,
    method: req.method,
  })

  // Handle known operational errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    })
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      },
    })
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res)
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'DATABASE_VALIDATION_ERROR',
        message: 'Invalid data provided',
      },
    })
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    })
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    })
  }

  // Unknown error - don't leak details
  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message:
        config.env === 'development'
          ? error.message
          : 'An unexpected error occurred',
    },
  })
}

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  res: Response,
) {
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field'
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `A record with this ${field} already exists`,
        },
      })

    case 'P2025': // Record not found
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
      })

    case 'P2003': // Foreign key constraint violation
      return res.status(400).json({
        success: false,
        error: {
          code: 'FOREIGN_KEY_ERROR',
          message: 'Referenced record does not exist',
        },
      })

    default:
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'A database error occurred',
        },
      })
  }
}
```

---

## Testing Standards

### Test Structure

```typescript
// tests/unit/services/user.service.test.ts
import { UserService } from '../../../src/services/user.service'
import { UserRepository } from '../../../src/repositories/user.repository'
import { NotFoundError, ConflictError } from '../../../src/utils/errors'

// Mock the repository
jest.mock('../../../src/repositories/user.repository')

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      ;(UserRepository.findById as jest.Mock).mockResolvedValue(mockUser)

      const result = await UserService.getUserById('123')

      expect(UserRepository.findById).toHaveBeenCalledWith('123')
      expect(result.email).toBe('test@example.com')
    })

    it('should throw NotFoundError when user not found', async () => {
      ;(UserRepository.findById as jest.Mock).mockResolvedValue(null)

      await expect(UserService.getUserById('invalid')).rejects.toThrow(
        NotFoundError,
      )
    })
  })

  describe('createUser', () => {
    it('should create user successfully', async () => {
      ;(UserRepository.findByEmail as jest.Mock).mockResolvedValue(null)
      ;(UserRepository.create as jest.Mock).mockResolvedValue({
        id: '123',
        email: 'new@example.com',
      })

      const result = await UserService.createUser({
        email: 'new@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User',
      })

      expect(result.email).toBe('new@example.com')
    })

    it('should throw ConflictError for duplicate email', async () => {
      ;(UserRepository.findByEmail as jest.Mock).mockResolvedValue({
        id: 'existing',
        email: 'existing@example.com',
      })

      await expect(
        UserService.createUser({
          email: 'existing@example.com',
          password: 'SecurePass123!',
          firstName: 'Test',
          lastName: 'User',
        }),
      ).rejects.toThrow(ConflictError)
    })
  })
})
```

### Integration Test Example

```typescript
// tests/integration/api/user.routes.test.ts
import request from 'supertest'
import { app } from '../../../src/app'
import { prisma } from '../../../src/database/prisma'
import { generateTestToken } from '../../helpers/auth'

describe('User API', () => {
  let authToken: string

  beforeAll(async () => {
    authToken = await generateTestToken({ role: 'ADMIN' })
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  describe('GET /api/v1/users/:id', () => {
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/v1/users/123').expect(401)

      expect(response.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return user data with valid token', async () => {
      // Create test user first
      const testUser = await prisma.user.create({
        data: {
          email: 'test@example.com',
          password: 'hashed',
          firstName: 'Test',
          lastName: 'User',
        },
      })

      const response = await request(app)
        .get(`/api/v1/users/${testUser.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.email).toBe('test@example.com')

      // Verify date format
      expect(response.body.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/)

      // Cleanup
      await prisma.user.delete({ where: { id: testUser.id } })
    })
  })
})
```

---

## Code Style & Conventions

### Naming Conventions

```typescript
// Files: kebab-case
// user.service.ts, auth.middleware.ts, date.utils.ts

// Classes: PascalCase
class UserService {}
class FileRepository {}

// Interfaces/Types: PascalCase with descriptive suffixes
interface UserDTO {}
interface CreateUserInput {}
interface UserResponseDTO {}

// Functions/Methods: camelCase
function getUserById() {}
async function createUser() {}

// Constants: SCREAMING_SNAKE_CASE
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_PAGE_SIZE = 20;

// Environment variables: SCREAMING_SNAKE_CASE
process.env.DATABASE_URL
process.env.JWT_SECRET

// Database tables (Prisma): PascalCase in schema, maps to snake_case in DB
model UserProfile {
  @@map("user_profiles")
}

// Database columns: camelCase in Prisma, snake_case in DB
model User {
  firstName String @map("first_name")
  createdAt DateTime @map("created_at")
}
```

### Import Organization

```typescript
// 1. Node.js built-in modules
import path from 'path'
import crypto from 'crypto'

// 2. External dependencies
import express from 'express'
import { z } from 'zod'

// 3. Internal modules - absolute paths
import { config } from '../config'
import { prisma } from '../database/prisma'

// 4. Internal modules - relative paths (same feature)
import { UserRepository } from './user.repository'

// 5. Types (if separate)
import type { User } from '@prisma/client'
import type { CreateUserDTO } from '../types/user.types'
```

### JSDoc Comments

```typescript
/**
 * Creates a new user account
 *
 * @param data - User registration data
 * @returns Created user without sensitive fields
 * @throws {ConflictError} If email already registered
 * @throws {ValidationError} If data validation fails
 *
 * @example
 * const user = await UserService.createUser({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!',
 *   firstName: 'John',
 *   lastName: 'Doe'
 * });
 */
static async createUser(data: CreateUserDTO): Promise<UserResponseDTO> {
  // Implementation
}
```

### Async/Await Patterns

```typescript
// ✅ CORRECT: Always use try/catch in controllers
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.json(formatResponse(user));
  } catch (error) {
    next(error);
  }
};

// ✅ CORRECT: Let errors propagate in services
export class UserService {
  static async getUserById(id: string): Promise<UserResponseDTO> {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return this.toResponseDTO(user);
  }
}

// ❌ WRONG: Catching and re-throwing without adding value
static async getUserById(id: string) {
  try {
    const user = await UserRepository.findById(id);
    return user;
  } catch (error) {
    throw error; // Pointless
  }
}
```

---

## Configuration & Settings Management

### CRITICAL: Never Hard-Code Values

**All configurable values must come from one of two sources:**

1. **Environment Variables** — For values that differ between environments (dev/staging/prod) but rarely change at runtime
2. **Database Settings** — For values that may be changed by administrators or need to change without redeployment

### Decision Framework

| Change Frequency                | Examples                               | Storage Method       |
| ------------------------------- | -------------------------------------- | -------------------- |
| Per environment, rarely changes | API keys, database URLs, feature flags | Environment variable |
| Occasionally by admins          | Business rules, limits, thresholds     | Database settings    |
| Frequently or by users          | User preferences, tenant configs       | Database settings    |

### Environment Variables (via Config Module)

```typescript
// src/config/index.ts

// ❌ NEVER DO THIS
const MAX_UPLOAD_SIZE = 10485760 // Hard-coded 10MB
const SESSION_TIMEOUT = 3600 // Hard-coded 1 hour
const SUPPORT_EMAIL = 'support@company.com'

// ✅ ALWAYS DO THIS
export const config = {
  // File uploads
  uploads: {
    maxFileSize: parseInt(process.env.MAX_UPLOAD_SIZE || '10485760', 10),
    allowedMimeTypes: (
      process.env.ALLOWED_MIME_TYPES || 'image/jpeg,image/png,application/pdf'
    ).split(','),
    maxFilesPerRequest: parseInt(process.env.MAX_FILES_PER_REQUEST || '5', 10),
  },

  // Session & Auth
  session: {
    timeout: parseInt(process.env.SESSION_TIMEOUT || '3600', 10),
    refreshThreshold: parseInt(
      process.env.SESSION_REFRESH_THRESHOLD || '300',
      10,
    ),
  },

  // Business settings
  business: {
    supportEmail: process.env.SUPPORT_EMAIL || 'support@example.com',
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10),
    lockoutDuration: parseInt(process.env.LOCKOUT_DURATION_MINUTES || '30', 10),
  },

  // Pagination defaults
  pagination: {
    defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE || '20', 10),
    maxPageSize: parseInt(process.env.MAX_PAGE_SIZE || '100', 10),
  },

  // Rate limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },

  // External services
  services: {
    emailProvider: process.env.EMAIL_PROVIDER || 'sendgrid',
    storageProvider: process.env.STORAGE_PROVIDER || 'gcs',
  },
}
```

### Database Settings (for Admin-Configurable Values)

```typescript
// prisma/schema.prisma
model SystemSetting {
  id          String   @id @default(uuid())
  key         String   @unique
  value       String
  type        SettingType @default(STRING)
  category    String
  description String?
  isPublic    Boolean  @default(false)  // Can be exposed to frontend
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}

enum SettingType {
  STRING
  NUMBER
  BOOLEAN
  JSON
}

// src/repositories/settings.repository.ts
import { prisma } from '../database/prisma';
import { SettingType } from '@prisma/client';

export class SettingsRepository {
  private static cache: Map<string, { value: any; expiresAt: number }> = new Map();
  private static CACHE_TTL = 60 * 1000; // 1 minute

  static async get<T>(key: string, defaultValue: T): Promise<T> {
    // Check cache first
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as T;
    }

    const setting = await prisma.systemSetting.findUnique({
      where: { key }
    });

    if (!setting) {
      return defaultValue;
    }

    const value = this.parseValue(setting.value, setting.type);

    // Update cache
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.CACHE_TTL
    });

    return value as T;
  }

  static async set(
    key: string,
    value: any,
    options?: {
      type?: SettingType;
      category?: string;
      description?: string;
      isPublic?: boolean;
    }
  ): Promise<void> {
    const stringValue = typeof value === 'object'
      ? JSON.stringify(value)
      : String(value);

    await prisma.systemSetting.upsert({
      where: { key },
      update: {
        value: stringValue,
        updatedAt: new Date()
      },
      create: {
        key,
        value: stringValue,
        type: options?.type || this.inferType(value),
        category: options?.category || 'general',
        description: options?.description,
        isPublic: options?.isPublic || false
      }
    });

    // Invalidate cache
    this.cache.delete(key);
  }

  static async getByCategory(category: string): Promise<Record<string, any>> {
    const settings = await prisma.systemSetting.findMany({
      where: { category }
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = this.parseValue(setting.value, setting.type);
      return acc;
    }, {} as Record<string, any>);
  }

  static async getPublicSettings(): Promise<Record<string, any>> {
    const settings = await prisma.systemSetting.findMany({
      where: { isPublic: true }
    });

    return settings.reduce((acc, setting) => {
      acc[setting.key] = this.parseValue(setting.value, setting.type);
      return acc;
    }, {} as Record<string, any>);
  }

  static invalidateCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  private static parseValue(value: string, type: SettingType): any {
    switch (type) {
      case 'NUMBER':
        return parseFloat(value);
      case 'BOOLEAN':
        return value.toLowerCase() === 'true';
      case 'JSON':
        return JSON.parse(value);
      default:
        return value;
    }
  }

  private static inferType(value: any): SettingType {
    if (typeof value === 'number') return 'NUMBER';
    if (typeof value === 'boolean') return 'BOOLEAN';
    if (typeof value === 'object') return 'JSON';
    return 'STRING';
  }
}
```

### Settings Service Layer

```typescript
// src/services/settings.service.ts
import { SettingsRepository } from '../repositories/settings.repository'
import { config } from '../config'

// Define all setting keys as constants to prevent typos
export const SETTINGS = {
  // Business rules
  MAX_ITEMS_PER_ORDER: 'business.max_items_per_order',
  MIN_ORDER_AMOUNT: 'business.min_order_amount',
  TAX_RATE: 'business.tax_rate',

  // Feature toggles (admin-controlled)
  ENABLE_REGISTRATION: 'features.enable_registration',
  ENABLE_GUEST_CHECKOUT: 'features.enable_guest_checkout',
  MAINTENANCE_MODE: 'features.maintenance_mode',

  // Notifications
  ADMIN_NOTIFICATION_EMAIL: 'notifications.admin_email',
  ALERT_THRESHOLD: 'notifications.alert_threshold',

  // Display settings
  ITEMS_PER_PAGE: 'display.items_per_page',
  DATE_FORMAT: 'display.date_format',
  CURRENCY: 'display.currency',
} as const

export class SettingsService {
  /**
   * Get a setting with fallback to environment variable then default
   */
  static async get<T>(key: string, defaultValue: T): Promise<T> {
    return SettingsRepository.get(key, defaultValue)
  }

  /**
   * Get business rules settings
   */
  static async getBusinessRules() {
    return {
      maxItemsPerOrder: await this.get(SETTINGS.MAX_ITEMS_PER_ORDER, 50),
      minOrderAmount: await this.get(SETTINGS.MIN_ORDER_AMOUNT, 10.0),
      taxRate: await this.get(SETTINGS.TAX_RATE, 0.05),
    }
  }

  /**
   * Get feature flags
   */
  static async getFeatureFlags() {
    return {
      registrationEnabled: await this.get(SETTINGS.ENABLE_REGISTRATION, true),
      guestCheckoutEnabled: await this.get(
        SETTINGS.ENABLE_GUEST_CHECKOUT,
        true,
      ),
      maintenanceMode: await this.get(SETTINGS.MAINTENANCE_MODE, false),
    }
  }

  /**
   * Check if a feature is enabled
   */
  static async isFeatureEnabled(featureKey: string): Promise<boolean> {
    return this.get(featureKey, false)
  }

  /**
   * Update a setting (admin only)
   */
  static async update(key: string, value: any): Promise<void> {
    await SettingsRepository.set(key, value)
  }

  /**
   * Get settings safe for frontend exposure
   */
  static async getPublicSettings() {
    return SettingsRepository.getPublicSettings()
  }
}
```

### Using Settings in Services

```typescript
// src/services/order.service.ts
import { SettingsService, SETTINGS } from './settings.service'
import { BadRequestError } from '../utils/errors'

export class OrderService {
  static async createOrder(data: CreateOrderDTO) {
    // ❌ NEVER hard-code business rules
    // if (data.items.length > 50) { ... }

    // ✅ Always fetch from settings
    const maxItems = await SettingsService.get(SETTINGS.MAX_ITEMS_PER_ORDER, 50)
    if (data.items.length > maxItems) {
      throw new BadRequestError(
        `Orders cannot contain more than ${maxItems} items`,
      )
    }

    const minAmount = await SettingsService.get(SETTINGS.MIN_ORDER_AMOUNT, 10.0)
    if (data.totalAmount < minAmount) {
      throw new BadRequestError(`Minimum order amount is $${minAmount}`)
    }

    const taxRate = await SettingsService.get(SETTINGS.TAX_RATE, 0.05)
    const taxAmount = data.subtotal * taxRate

    // ... rest of order creation
  }
}
```

### Middleware Using Settings

```typescript
// src/middleware/maintenance.middleware.ts
import { Request, Response, NextFunction } from 'express'
import { SettingsService, SETTINGS } from '../services/settings.service'

export const maintenanceCheck = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Allow health checks even in maintenance mode
  if (req.path === '/health') {
    return next()
  }

  const maintenanceMode = await SettingsService.get(
    SETTINGS.MAINTENANCE_MODE,
    false,
  )

  if (maintenanceMode) {
    return res.status(503).json({
      success: false,
      error: {
        code: 'MAINTENANCE_MODE',
        message:
          'System is currently under maintenance. Please try again later.',
      },
    })
  }

  next()
}
```

### Admin Settings Controller

```typescript
// src/api/v1/controllers/admin/settings.controller.ts
import { Request, Response, NextFunction } from 'express'
import { SettingsService } from '../../../../services/settings.service'
import { SettingsRepository } from '../../../../repositories/settings.repository'

export const getSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { category } = req.query

    const settings = category
      ? await SettingsRepository.getByCategory(category as string)
      : await SettingsRepository.getByCategory('general')

    res.json({ success: true, data: settings })
  } catch (error) {
    next(error)
  }
}

export const updateSetting = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { key } = req.params
    const { value } = req.body

    await SettingsService.update(key, value)

    res.json({
      success: true,
      message: 'Setting updated successfully',
    })
  } catch (error) {
    next(error)
  }
}

export const bulkUpdateSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { settings } = req.body // Array of { key, value }

    await Promise.all(
      settings.map(({ key, value }: { key: string; value: any }) =>
        SettingsService.update(key, value),
      ),
    )

    // Clear entire cache after bulk update
    SettingsRepository.invalidateCache()

    res.json({
      success: true,
      message: 'Settings updated successfully',
    })
  } catch (error) {
    next(error)
  }
}
```

### Common Settings Categories

```typescript
// Recommended .env variables (environment-specific, rarely change)
DATABASE_URL=
JWT_SECRET=
GCP_PROJECT_ID=
GCS_BUCKET_NAME=
REDIS_URL=
CORS_ORIGINS=
LOG_LEVEL=
NODE_ENV=

// Recommended database settings (admin-configurable)
// Business Rules
business.max_items_per_order = 50
business.min_order_amount = 10.00
business.tax_rate = 0.05
business.free_shipping_threshold = 100.00

// Feature Flags
features.enable_registration = true
features.enable_guest_checkout = true
features.maintenance_mode = false
features.enable_dark_mode = true

// Notifications
notifications.admin_email = admin@company.com
notifications.low_stock_threshold = 10
notifications.order_confirmation_template = default

// Display/UI
display.items_per_page = 20
display.date_format = YYYY-MM-DD
display.currency = USD
display.timezone = America/Edmonton

// Limits
limits.max_upload_size_mb = 10
limits.max_api_requests_per_hour = 1000
limits.session_timeout_minutes = 60
```

### Hard-Coded Values Audit Checklist

When reviewing code, flag any hard-coded:

- [ ] Numeric limits (max items, file sizes, timeouts)
- [ ] Email addresses
- [ ] URLs (API endpoints, webhook URLs)
- [ ] Feature flags or toggles
- [ ] Business rules (tax rates, shipping thresholds, discounts)
- [ ] Display settings (page sizes, date formats)
- [ ] Error messages that might need localization
- [ ] Scheduled job intervals
- [ ] Cache TTL values
- [ ] Retry counts and delays

---

## Quick Reference Checklist

### Before Writing Code

- [ ] Read `prisma/schema.prisma` for table/column names
- [ ] Check existing services for similar functionality
- [ ] Review existing validators for patterns
- [ ] Check types directory for existing interfaces
- [ ] Look for utility functions that already exist

### Code Review Checklist

- [ ] No hard-coded values — all configurable via env vars or database settings
- [ ] No inline SQL - all queries use Prisma client
- [ ] All inputs validated with Zod schemas
- [ ] Dates formatted as ISO strings (YYYY-MM-DD)
- [ ] Passwords hashed before storage
- [ ] Sensitive data excluded from responses
- [ ] Proper error handling with custom error classes
- [ ] Layer separation maintained (API → Service → Repository)
- [ ] File uploads use signed URLs
- [ ] Environment variables properly managed
- [ ] No hardcoded secrets in code

### Security Checklist

- [ ] Authentication required for protected routes
- [ ] Authorization checks for resource access
- [ ] Rate limiting applied to sensitive endpoints
- [ ] Input sanitization for user-provided content
- [ ] CORS properly configured
- [ ] Security headers set via Helmet
- [ ] No sensitive data in logs
- [ ] Parameterized queries only

---

## Common Mistakes to Avoid

```typescript
// ❌ Hard-coding configurable values
const MAX_UPLOAD_SIZE = 10 * 1024 * 1024;
const TAX_RATE = 0.07;
const SUPPORT_EMAIL = 'help@company.com';
const SESSION_TIMEOUT = 3600;
// ✅ Use environment variables or database settings
const maxUploadSize = config.uploads.maxFileSize;
const taxRate = await SettingsService.get(SETTINGS.TAX_RATE, 0.05);
const supportEmail = await SettingsService.get(SETTINGS.SUPPORT_EMAIL, 'support@example.com');

// ❌ Guessing column names
prisma.user.findUnique({ where: { user_id: id } }); // Wrong!
// ✅ Verify in schema.prisma first
prisma.user.findUnique({ where: { id } }); // Correct (after verification)

// ❌ Inline SQL
prisma.$queryRawUnsafe(`SELECT * FROM users WHERE email = '${email}'`);
// ✅ Parameterized queries
prisma.user.findUnique({ where: { email } });

// ❌ Business logic in controller
router.post('/users', async (req, res) => {
  if (await prisma.user.findUnique({ where: { email: req.body.email } })) {
    return res.status(409).json({ error: 'Email exists' });
  }
  // ...
});
// ✅ Business logic in service
router.post('/users', async (req, res, next) => {
  try {
    const user = await UserService.createUser(req.body);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// ❌ Returning dates as Date objects
res.json({ createdAt: user.createdAt }); // Returns ISO string with time
// ✅ Format dates explicitly
res.json({ createdAt: formatDateISO(user.createdAt, timezone) }); // YYYY-MM-DD

// ❌ Direct file access in controller
const file = fs.readFileSync(req.file.path);
bucket.upload(file);
// ✅ Use signed URLs for direct upload
const { uploadUrl } = await FileService.generateUploadUrl(...);

// ❌ Mixing environment config sources
const secret = process.env.JWT_SECRET || config.jwt.secret;
// ✅ Single source of truth
const secret = config.jwt.secret; // Config handles env vs secrets manager
```

---

_Last updated: Generic template for Node.js API with Prisma, following industry best practices for security, architecture, and maintainability._