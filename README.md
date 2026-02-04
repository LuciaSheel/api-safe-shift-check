# Safe Shift Check API

A comprehensive REST API server for the Safe Shift Check worker safety application. Built with Node.js, Express.js, and TypeScript.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication
- 👥 **Role-Based Access Control** - Worker, BackupContact, Manager, Administrator roles
- 📍 **Location Management** - Track and manage work locations
- ⏰ **Shift Management** - Create, start, end, and monitor shifts
- ✅ **Check-In System** - Scheduled check-ins with confirmation tracking
- 🚨 **Alert System** - Automated alerts for missed check-ins and emergencies
- 🔔 **Notifications** - In-app notification system
- 👥 **Team Management** - Organize workers into teams
- 📊 **Reports & Analytics** - Dashboard metrics and compliance reports
- ⚙️ **System Settings** - Configurable check-in intervals and escalation rules

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: express-validator
- **Security**: helmet, cors

## Project Structure

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic layer
├── repositories/    # Data access layer
├── routes/          # API route definitions
├── middleware/      # Auth, validation, error handling
├── types/           # TypeScript interfaces and types
├── data/            # In-memory data store
└── index.ts         # Application entry point
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The server will start on `http://localhost:3001`

### Available Scripts

```bash
npm run dev      # Start development server with hot reload
npm run build    # Build for production
npm start        # Run production build
npm run lint     # Run ESLint
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/refresh-token` | Refresh JWT token |
| POST | `/api/auth/change-password` | Change password |
| GET | `/api/auth/me` | Get current user profile |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/:id` | Get user by ID |
| POST | `/api/users` | Create user |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |
| GET | `/api/users/workers` | Get all workers |
| GET | `/api/users/backup-contacts` | Get all backup contacts |

### Locations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/locations` | List all locations |
| GET | `/api/locations/:id` | Get location by ID |
| POST | `/api/locations` | Create location |
| PUT | `/api/locations/:id` | Update location |
| DELETE | `/api/locations/:id` | Delete location |
| GET | `/api/locations/active` | Get active locations |
| GET | `/api/locations/nearby` | Find nearby locations |

### Shifts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shifts` | List all shifts |
| GET | `/api/shifts/:id` | Get shift by ID |
| POST | `/api/shifts` | Create shift |
| POST | `/api/shifts/start` | Start a new shift |
| POST | `/api/shifts/:id/end` | End a shift |
| POST | `/api/shifts/:id/cancel` | Cancel a shift |
| GET | `/api/shifts/active` | Get active shifts |
| GET | `/api/shifts/today` | Get today's shifts |

### Check-Ins
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/check-ins` | List all check-ins |
| GET | `/api/check-ins/:id` | Get check-in by ID |
| POST | `/api/check-ins/:id/confirm` | Confirm a check-in |
| POST | `/api/check-ins/:id/missed` | Mark check-in as missed |
| GET | `/api/check-ins/pending` | Get pending check-ins |

### Alerts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/alerts` | List all alerts |
| GET | `/api/alerts/:id` | Get alert by ID |
| POST | `/api/alerts/:id/acknowledge` | Acknowledge alert |
| POST | `/api/alerts/:id/resolve` | Resolve alert |
| POST | `/api/alerts/emergency` | Create emergency alert |
| GET | `/api/alerts/active` | Get active alerts |

### Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/:id/read` | Mark as read |
| POST | `/api/notifications/read-all` | Mark all as read |
| GET | `/api/notifications/count` | Get unread count |

### Teams
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| GET | `/api/teams/:id` | Get team by ID |
| POST | `/api/teams` | Create team |
| PUT | `/api/teams/:id` | Update team |
| POST | `/api/teams/:id/members` | Add team member |
| DELETE | `/api/teams/:id/members/:memberId` | Remove member |

### Reports
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/dashboard` | Dashboard metrics |
| GET | `/api/reports/time-tracking` | Time tracking records |
| GET | `/api/reports/compliance` | Compliance records |
| GET | `/api/reports/export/time-tracking` | Export CSV |

### Settings
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get system settings |
| PUT | `/api/settings` | Update settings |
| POST | `/api/settings/reset` | Reset to defaults |

## Authentication

All endpoints (except login/register) require a JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Worker | sarah.johnson@example.com | demo123 |
| BackupContact | david.taylor@example.com | demo123 |
| Manager | robert.anderson@example.com | demo123 |
| Administrator | admin@safealone.com | admin123 |

## Example Usage

### Login
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"Email": "sarah.johnson@example.com", "Password": "demo123"}'
```

### Get Shifts (authenticated)
```bash
curl http://localhost:3001/api/shifts \
  -H "Authorization: Bearer <your-token>"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 3001 |
| JWT_SECRET | JWT signing secret | (dev default) |
| JWT_EXPIRES_IN | Token expiration | 7d |
| CORS_ORIGIN | Allowed CORS origin | http://localhost:5173 |
| NODE_ENV | Environment | development |

## License

MIT
