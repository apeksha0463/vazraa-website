# Vazraa Mobility — Backend API

> Centralized Node.js / Express.js backend for the Vazraa Mobility cab booking platform.  
> Serves both the existing React-style HTML frontend and the AI Sensy WhatsApp chatbot.

---

## Quick Start

### Prerequisites
- **Node.js** v18 or later
- **MongoDB** running locally on `mongodb://localhost:27017` (or a MongoDB Atlas URI)

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Configure environment
```bash
# Copy the example and edit values if needed
copy .env.example .env
```
The `.env` file is pre-filled with development defaults. The only value you **must** change for production is `JWT_SECRET`.

### 3. Start the server
```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

### 4. Verify
Open your browser and visit:
- **Health check** → http://localhost:5000/health
- **Swagger docs** → http://localhost:5000/api-docs

---

## Default Admin Account
On first startup the server seeds a default admin account:

| Field | Value |
|-------|-------|
| Email | admin@vazraa.com |
| Password | Admin@1234 |

Change these in `.env` before going to production.

---

## API Overview

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Customer registration |
| POST | `/api/auth/login` | None | Customer login |
| POST | `/api/drivers/register` | None | Driver registration |
| POST | `/api/drivers/login` | None | Driver login |
| POST | `/api/admin/login` | None | Admin login |
| GET | `/api/profile` | Customer JWT | Get profile |
| PUT | `/api/profile` | Customer JWT | Update profile |
| POST | `/api/bookings` | Customer JWT | Create booking |
| GET | `/api/bookings/history` | Customer JWT | Booking history |
| GET | `/api/bookings/:id` | Customer JWT | Get booking |
| GET | `/api/bookings/:id/track` | Customer JWT | Track ride (mock) |
| PUT | `/api/bookings/cancel` | Customer JWT | Cancel booking |
| GET | `/api/driver/bookings` | Driver JWT | Assigned rides |
| PUT | `/api/driver/availability` | Driver JWT | Toggle availability |
| PUT | `/api/driver/accept/:id` | Driver JWT | Accept ride |
| PUT | `/api/driver/start/:id` | Driver JWT | Start ride (OTP) |
| PUT | `/api/driver/complete/:id` | Driver JWT | Complete ride |
| GET | `/api/vehicles` | None | Vehicle list |
| GET | `/api/admin/dashboard` | Admin JWT | Dashboard stats |
| GET | `/api/admin/users` | Admin JWT | All customers |
| GET | `/api/admin/drivers` | Admin JWT | All drivers |
| GET | `/api/admin/bookings` | Admin JWT | All bookings |
| POST | `/api/webhooks/aisensy` | None | AI Sensy webhook |
| GET | `/api/settings` | None | App config |
| GET | `/api-docs` | None | Swagger UI |

---

## Standard Response Format

```json
// Success
{ "success": true, "message": "...", "data": {} }

// Error
{ "success": false, "message": "...", "errorCode": "SNAKE_CASE_CODE" }
```

---

## Project Structure

```
backend/
└── src/
    ├── config/        database.js, swagger.js
    ├── constants/     index.js  (all enums)
    ├── controllers/   one per domain
    ├── middleware/    auth.js, validate.js, errorHandler.js, notFound.js
    ├── models/        User, Driver, Vehicle, Booking, ChatSession, Notification
    ├── repositories/  one per model (DB access only)
    ├── routes/        one per domain (with Swagger JSDoc)
    ├── services/      business logic (AuthService, BookingService, etc.)
    ├── utils/         response.js, bookingNumber.js, logger.js
    ├── validators/    express-validator rule arrays
    ├── logs/          app.log (auto-created)
    ├── app.js         Express app factory
    └── server.js      Entry point (connect DB → seed → listen)
```

---

## WhatsApp Chatbot States

```
MENU → AWAITING_PICKUP → AWAITING_DROP → AWAITING_VEHICLE_SELECTION → AWAITING_CONFIRMATION → RIDE_ACTIVE
```

Global commands (always handled, regardless of state): `hi`, `hello`, `menu`, `start`, `track`, `cancel`, `fare`, `sos`

---

## Mock Services (v1)

| Service | Status | Future |
|---------|--------|--------|
| Google Maps | Mock (12 km fixed) | Distance Matrix API |
| Cashfree Payment | Mock (placeholder) | Cashfree SDK |
| Live Driver Tracking | Mock (hardcoded coords) | GPS integration |
| WhatsApp Outbound | Mock if no API key | AI Sensy API key |

---

## Frontend Integration

The frontend HTML files (`login.html`, `signup.html`, `book-ride.html`, `*-onboarding.html`) have been wired to call the backend. All use `api.config.js` to resolve the base URL:

```js
// files/api.config.js  — change this for production
const API_CONFIG = { BASE_URL: 'http://localhost:5000' };
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 5000 | HTTP server port |
| `MONGODB_URI` | mongodb://localhost:27017/vazraa | MongoDB connection string |
| `JWT_SECRET` | (placeholder) | **Change this in production** |
| `JWT_EXPIRES_IN` | 7d | Token expiry |
| `CORS_ORIGIN` | * | Allowed origins |
| `AISENSY_API_KEY` | (placeholder) | AI Sensy key — mock mode if blank |
| `ADMIN_EMAIL` | admin@vazraa.com | Seeded admin email |
| `ADMIN_PASSWORD` | Admin@1234 | Seeded admin password |
| `SESSION_TIMEOUT_MINUTES` | 30 | Chatbot session idle timeout |
