# MeTube - Comprehensive Video Sharing Platform

A full-featured video sharing platform built with Next.js 14, TypeScript, Prisma, and PostgreSQL. This project implements all the features of a modern video platform including user authentication, video uploads, creator studio, admin moderation, copyright management, and more.

## Features Overview

### User Features
- **Authentication & Onboarding**
  - Email/password registration and login
  - Social authentication (Google, Facebook, Apple)
  - Multi-device session handling
  - 2FA support
  - Password reset functionality
  - Interest-based onboarding flow

- **Video Discovery**
  - Personalized home feed
  - Trending videos
  - Category-based browsing
  - Advanced search with filters
  - Shorts feed (vertical videos)
  - Subscriptions feed

- **Video Watching**
  - Custom video player with controls
  - Adaptive quality selection
  - Speed controls
  - Picture-in-picture support
  - Chapter navigation
  - Auto-play next video

- **Engagement**
  - Like/dislike videos
  - Comment system with replies
  - Subscribe to channels
  - Share videos
  - Save to playlists
  - Watch later queue
  - Watch history

- **Playlists & Library**
  - Create and manage playlists (public/private/unlisted)
  - Watch later
  - Liked videos
  - Watch history
  - Downloaded videos (offline mode)

### Creator Features
- **Channel Management**
  - Create and customize channel
  - Upload and manage videos
  - Live streaming support
  - Community posts
  - Analytics dashboard

- **Video Upload**
  - Multi-format video upload
  - Title, description, and tags
  - Thumbnail selection/upload
  - Visibility controls (public/private/unlisted/scheduled)
  - Audience selection (kids/not for kids)
  - Monetization settings
  - Subtitle upload

- **Content Moderation**
  - View flags on videos
  - Manage comments
  - Copyright claim management
  - Strike system

- **Analytics**
  - Views, watch time, subscribers
  - Traffic sources
  - Audience demographics
  - Revenue tracking

### Admin Features
- **Platform Management**
  - User management (view, suspend, ban)
  - Channel management and verification
  - Content moderation dashboard
  - Platform-wide analytics

- **Flagging & Moderation**
  - Review flagged content (videos, comments, live chat)
  - Apply moderation actions (warn, restrict, remove)
  - Strike management
  - Appeal workflow

- **Copyright Management**
  - Rights holder verification
  - Reference asset library (Content ID)
  - Automated copyright matching
  - Manual claim submission
  - Counter-notice workflow
  - DMCA takedown management

- **Monetization Control**
  - Ad management
  - Revenue share configuration
  - Payout dashboard
  - Transaction tracking

## Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **UI Components:** Custom components with class-variance-authority
- **Forms:** React Hook Form + Zod validation
- **State Management:** Zustand
- **Data Fetching:** TanStack Query

### Backend
- **Runtime:** Node.js
- **Framework:** Next.js API Routes
- **Authentication:** NextAuth.js v5
- **Database ORM:** Prisma
- **Database:** PostgreSQL

### Additional Services (Required for Production)
- **Video Storage:** AWS S3 / CloudFlare R2
- **CDN:** CloudFront / CloudFlare
- **Video Processing:** FFmpeg workers
- **Search:** Elasticsearch / OpenSearch
- **Cache:** Redis
- **Email:** SendGrid / AWS SES

## Database Schema

The application uses a comprehensive database schema with the following main entities:

### Core Models
- **User** - User accounts with authentication
- **Account** - OAuth provider accounts
- **Session** - User sessions
- **Channel** - Creator channels
- **Video** - Video content
- **VideoAsset** - Transcoded video files and variants
- **VideoChapter** - Video chapter markers
- **VideoAnalytics** - View and engagement metrics

### Engagement Models
- **Comment** - Video comments and replies
- **Like** - Video likes/dislikes
- **Subscription** - Channel subscriptions
- **Playlist** - User-created playlists
- **WatchHistory** - Viewing history
- **WatchLater** - Saved for later

### Moderation Models
- **Flag** - User-reported content
- **Strike** - Community guidelines violations
- **ModerationAction** - Admin moderation logs

### Copyright Models
- **RightsHolder** - Verified copyright owners
- **ReferenceAsset** - Copyright reference library
- **CopyrightMatch** - Automated match results
- **CopyrightClaim** - Manual copyright claims

### Monetization Models
- **Transaction** - Payment transactions
- **ChannelMembership** - Channel memberships

### Admin Models
- **AdminUser** - Admin accounts
- **AuditLog** - Admin action logs
- **CommunityPost** - Channel community posts

## Project Structure

```
metube/
├── app/
│   ├── (user)/              # User-facing pages
│   │   ├── page.tsx         # Home feed
│   │   ├── shorts/          # Shorts feed
│   │   ├── search/          # Search results
│   │   ├── watch/[id]/      # Video watch page
│   │   ├── library/         # User library
│   │   └── layout.tsx       # User layout with navigation
│   ├── (creator)/           # Creator studio
│   │   └── studio/
│   │       ├── page.tsx     # Dashboard
│   │       ├── upload/      # Video upload
│   │       ├── videos/      # Video management
│   │       └── analytics/   # Creator analytics
│   ├── (admin)/             # Admin portal
│   │   └── admin/
│   │       ├── page.tsx     # Admin dashboard
│   │       ├── moderation/  # Moderation tools
│   │       ├── copyright/   # Copyright management
│   │       └── users/       # User management
│   ├── auth/                # Authentication pages
│   │   ├── signin/
│   │   └── signup/
│   ├── onboarding/          # User onboarding
│   ├── api/                 # API routes
│   │   ├── auth/
│   │   ├── videos/
│   │   ├── playlists/
│   │   └── admin/
│   ├── layout.tsx           # Root layout
│   └── globals.css          # Global styles
├── components/
│   ├── auth/                # Auth components
│   ├── user/                # User components
│   ├── creator/             # Creator components
│   ├── admin/               # Admin components
│   └── shared/              # Shared components
│       ├── ui/              # UI primitives
│       ├── video/           # Video player
│       └── navigation/      # Navigation components
├── lib/
│   ├── auth/                # Auth configuration
│   ├── db/                  # Database client
│   └── utils/               # Utility functions
├── prisma/
│   └── schema.prisma        # Database schema
├── types/                   # TypeScript types
└── public/                  # Static assets
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd metube
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
- OAuth provider credentials (optional)

4. Initialize the database:
```bash
pnpm prisma generate
pnpm prisma db push
```

5. Run the development server:
```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Migrations

To create migrations:
```bash
pnpm prisma migrate dev --name your_migration_name
```

To apply migrations in production:
```bash
pnpm prisma migrate deploy
```

## API Routes

### Authentication
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Videos
- `GET /api/videos` - List videos (with filters)
- `POST /api/videos` - Create video record
- `GET /api/videos/[id]` - Get video details
- `PATCH /api/videos/[id]` - Update video
- `DELETE /api/videos/[id]` - Delete video
- `POST /api/videos/[id]/like` - Like/dislike video
- `GET /api/videos/[id]/comments` - Get comments
- `POST /api/videos/[id]/comments` - Add comment
- `POST /api/videos/[id]/flag` - Report video

### Playlists
- `GET /api/playlists` - List user playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/[id]` - Get playlist
- `PATCH /api/playlists/[id]` - Update playlist
- `DELETE /api/playlists/[id]` - Delete playlist

### Admin
- `GET /api/admin/flags` - Get flagged content
- `POST /api/admin/flags/[id]/resolve` - Resolve flag
- `GET /api/admin/copyright/reference-assets` - Manage reference assets
- `POST /api/admin/copyright/reference-assets` - Add reference asset

## Key Features Implementation

### Video Upload Flow
1. User selects video file and fills metadata
2. File is uploaded to cloud storage (S3/R2)
3. Video record created in database with PENDING status
4. Background job triggers transcoding (FFmpeg)
5. Multiple resolutions generated (144p-4K)
6. Video status updated to COMPLETED
7. CDN distribution for optimal delivery

### Content Moderation
1. Users can flag inappropriate content
2. Flags are queued for admin review
3. Admins review flagged content with context
4. Actions: dismiss, warn, age-restrict, remove, strike
5. Strike system escalates to suspension/ban
6. Audit log tracks all moderation actions

### Copyright System
1. **Automated (Content ID-like)**
   - Rights holders upload reference assets
   - Video fingerprinting on upload
   - Automatic matching against reference library
   - Policy applied (block/monetize/track)

2. **Manual Claims**
   - Rights holders submit manual claims
   - Uploader can file counter-notice
   - Admin reviews and makes decision
   - Appeal workflow available

## Deployment

### Environment Setup
1. Set up PostgreSQL database (AWS RDS, Supabase, etc.)
2. Configure S3/R2 for video storage
3. Set up CloudFront/CloudFlare CDN
4. Configure Redis for caching
5. Set up email service

### Build and Deploy
```bash
pnpm build
pnpm start
```

Recommended platforms:
- Vercel (easiest for Next.js)
- AWS (full control)
- Railway
- Render

### Production Considerations
- Enable CDN caching
- Set up video transcoding pipeline
- Configure rate limiting
- Implement proper error tracking (Sentry)
- Set up monitoring (Datadog, New Relic)
- Configure backup strategy
- Implement DDoS protection

## Security Considerations

- All user inputs validated with Zod
- SQL injection prevented by Prisma ORM
- XSS protection via React
- CSRF protection in forms
- Rate limiting on API endpoints
- Secure password hashing with bcrypt
- JWT-based session management
- Role-based access control (RBAC)
- Content Security Policy headers
- HTTPS enforced in production

## Performance Optimizations

- Database indexing on frequently queried fields
- Redis caching for hot data
- CDN for static assets and videos
- Image optimization with Next.js Image
- Lazy loading of components
- Infinite scroll for feeds
- Server-side rendering for SEO
- ISR for static pages

## Future Enhancements

- [ ] Live streaming with WebRTC
- [ ] Real-time chat for live streams
- [ ] Advanced analytics with charts
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Email notifications
- [ ] AI-powered recommendations
- [ ] Automated content moderation (AI)
- [ ] Multi-language support (i18n)
- [ ] Dark mode
- [ ] Accessibility improvements (WCAG)
- [ ] Video editor in-browser
- [ ] Community polls
- [ ] Channel memberships/subscriptions
- [ ] Merch store integration
- [ ] Podcast mode
- [ ] YouTube Kids mode

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

## License

This project is for educational purposes.

## Support

For issues and questions:
- Open an issue on GitHub
- Contact: support@metube.example

---

Built with ❤️ using Next.js, TypeScript, and Prisma
