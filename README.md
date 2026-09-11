# User Backend - Express + Prisma + PostgreSQL + JWT

JWT authentication with bcrypt password hashing, Prisma migration/seed, CRUD, and soft delete.

## Setup
```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Seed login: `admin` / `Admin@12345` (change this for real deployments).

## Auth
`POST /api/auth/login`
```json
{"username":"admin","password":"Admin@12345"}
```
Returns a JWT. Protected requests use `Authorization: Bearer <token>`.

`GET /api/auth/me` requires JWT.

## Users (JWT required)
GET `/api/users`
GET `/api/users/:id`
POST `/api/users`
PUT `/api/users/:id`
DELETE `/api/users/:id` (soft delete)

## Render
Build: `npm install && npx prisma generate`
Start: `npm start`
Environment: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`, `PORT`.
Use the Render PostgreSQL Internal Database URL as `DATABASE_URL`.
Run `npx prisma migrate deploy` during deployment before the server starts.
