# MeTube - Video Sharing Platform

A comprehensive video sharing platform built with Next.js 14, featuring all the capabilities of modern video platforms like YouTube.

## Features

### User Features
- Authentication (Email, Google, Facebook, Apple)
- Video discovery with personalized feeds
- Advanced search with filters
- Video player with quality controls
- Comments, likes, subscriptions
- Playlists and library management
- Shorts (vertical video feed)
- Watch history and watch later

### Creator Features
- Channel management
- Video upload with metadata
- Creator Studio dashboard
- Analytics and insights
- Content moderation tools
- Copyright management

### Admin Features
- Platform-wide dashboard
- Content moderation system
- Flagging and reporting
- Copyright claim management
- User and channel management
- Audit logging

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL with Prisma ORM
- **Authentication:** NextAuth.js v5
- **Forms:** React Hook Form + Zod
- **State Management:** Zustand

## Quick Start

1. Install dependencies:
```bash
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- OAuth credentials (optional)

3. Initialize database:
```bash
pnpm prisma generate
pnpm prisma db push
```

4. Run development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
app/
├── (user)/          # User-facing pages
├── (creator)/       # Creator Studio
├── (admin)/         # Admin Portal
├── auth/            # Authentication
├── api/             # API routes
components/          # React components
lib/                 # Utilities and config
prisma/             # Database schema
```

## Documentation

See [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for comprehensive documentation including:
- Complete feature list
- Database schema details
- API endpoint reference
- Deployment guide
- Security considerations

See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for:
- What's been implemented
- What needs to be completed
- Production deployment checklist
- Development roadmap

## Key Routes

### User Routes
- `/` - Home feed
- `/shorts` - Shorts feed
- `/search` - Search results
- `/watch/[id]` - Video player
- `/library` - User library

### Creator Routes
- `/studio` - Creator dashboard
- `/studio/upload` - Upload video
- `/studio/videos` - Manage videos
- `/studio/analytics` - Analytics

### Admin Routes
- `/admin` - Admin dashboard
- `/admin/moderation/flags` - Content moderation
- `/admin/copyright/claims` - Copyright management

### Auth Routes
- `/auth/signin` - Sign in
- `/auth/signup` - Sign up
- `/onboarding` - User onboarding

## Development

Run the development server:
```bash
pnpm dev
```

Build for production:
```bash
pnpm build
pnpm start
```

## Database Management

Create migration:
```bash
pnpm prisma migrate dev --name migration_name
```

View database:
```bash
pnpm prisma studio
```

## Environment Variables

Required variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - Secret for JWT signing

Optional (for full functionality):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET`
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` - For video storage
- `REDIS_URL` - For caching

## What's Included

This is a fully-structured video platform with:
- Complete authentication system
- User, creator, and admin interfaces
- Comprehensive database schema
- API endpoints for all major features
- Moderation and copyright systems
- Video player and upload UI

## What Needs Implementation

For a production-ready application, you'll need to add:
- Video storage (S3/CloudFlare R2)
- Video transcoding pipeline (FFmpeg)
- Real-time notifications
- Advanced search (Elasticsearch)
- Caching layer (Redis)
- Email service integration

See [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for detailed next steps.

## License

This project is for educational purposes.

---

For detailed documentation, see [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md)
