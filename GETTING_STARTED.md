# Getting Started with MeTube

This guide will help you set up the MeTube video platform on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18 or higher ([Download](https://nodejs.org/))
- **pnpm** package manager ([Install](https://pnpm.io/installation))
- **PostgreSQL** database ([Download](https://www.postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

## Step-by-Step Setup

### 1. Clone the Repository

```bash
cd ~/Desktop/projects
# If you haven't already, the project is at:
cd metube
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and more.

### 3. Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

1. Start PostgreSQL service:
```bash
# macOS
brew services start postgresql@14

# Linux
sudo systemctl start postgresql

# Windows
# Use pgAdmin or Services app
```

2. Create a database:
```bash
createdb metube_dev
```

#### Option B: Use Supabase (Recommended for beginners)

1. Go to [Supabase](https://supabase.com/)
2. Create a new project
3. Copy the connection string from Settings > Database

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` with your favorite editor:
```bash
# Using nano
nano .env

# Using VS Code
code .env
```

3. Update the following variables:

```env
# Database (Required)
DATABASE_URL="postgresql://user:password@localhost:5432/metube_dev"

# NextAuth (Required)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-here"  # Generate with: openssl rand -base64 32

# OAuth Providers (Optional - for social login)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
FACEBOOK_CLIENT_ID=""
FACEBOOK_CLIENT_SECRET=""
```

#### Generate NextAuth Secret

Run this command to generate a secure secret:
```bash
openssl rand -base64 32
```

Copy the output and paste it as your `NEXTAUTH_SECRET`.

### 5. Initialize the Database

1. Generate Prisma client:
```bash
pnpm prisma generate
```

2. Push the schema to your database:
```bash
pnpm prisma db push
```

3. (Optional) Open Prisma Studio to view your database:
```bash
pnpm prisma studio
```

### 6. Run the Development Server

```bash
pnpm dev
```

The application will be available at:
- **Main app:** http://localhost:3000
- **API:** http://localhost:3000/api

### 7. Create Your First User

1. Open http://localhost:3000
2. Click "Sign up" or navigate to http://localhost:3000/auth/signup
3. Fill in your details:
   - Name: Your Name
   - Email: your@email.com
   - Username: yourusername (optional)
   - Password: minimum 6 characters

4. After signup, you'll be redirected to the onboarding page
5. Select your interests and click "Continue"

### 8. Explore the Platform

#### As a User:
- **Home Feed:** Browse videos
- **Search:** Try searching for content
- **Shorts:** Check out the shorts feed
- **Library:** Manage your playlists and watch later

#### As a Creator:
1. Go to http://localhost:3000/studio
2. You'll need to create a channel first
3. Once you have a channel, you can upload videos

#### As an Admin:
To access admin features, you need to update your user role in the database:

```bash
pnpm prisma studio
```

1. Open the User table
2. Find your user
3. Change `role` from `USER` to `ADMIN`
4. Save changes
5. Refresh your browser and go to http://localhost:3000/admin

## Common Issues and Solutions

### Issue: Database connection failed

**Solution:**
- Verify PostgreSQL is running: `psql -U postgres`
- Check your DATABASE_URL in `.env`
- Ensure the database exists: `createdb metube_dev`

### Issue: "Module not found" errors

**Solution:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Issue: Prisma Client errors

**Solution:**
```bash
# Regenerate Prisma Client
pnpm prisma generate
```

### Issue: Port 3000 already in use

**Solution:**
```bash
# Kill the process using port 3000
# macOS/Linux:
lsof -ti:3000 | xargs kill -9

# Or run on a different port:
PORT=3001 pnpm dev
```

### Issue: NextAuth configuration errors

**Solution:**
- Ensure NEXTAUTH_URL matches your development URL
- Verify NEXTAUTH_SECRET is set and is a valid base64 string
- Check that environment variables are loaded (restart dev server)

## Optional: Set Up OAuth Providers

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth credentials:
   - Authorized JavaScript origins: `http://localhost:3000`
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. Copy Client ID and Secret to `.env`

### Facebook OAuth

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure:
   - Valid OAuth Redirect URIs: `http://localhost:3000/api/auth/callback/facebook`
5. Copy App ID and Secret to `.env`

## Development Workflow

### Making Database Changes

1. Update `prisma/schema.prisma`
2. Create migration:
```bash
pnpm prisma migrate dev --name your_change_description
```

### Viewing Database

```bash
pnpm prisma studio
```

### Resetting Database

```bash
pnpm prisma migrate reset
```

⚠️ This will delete all data!

### Running Type Checks

```bash
pnpm type-check
```

### Running Linter

```bash
pnpm lint
```

## Project Structure Overview

```
metube/
├── app/                      # Next.js App Router
│   ├── (user)/              # User-facing pages
│   ├── (creator)/           # Creator Studio
│   ├── (admin)/             # Admin Portal
│   ├── auth/                # Auth pages
│   ├── api/                 # API routes
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── auth/               # Auth components
│   ├── user/               # User components
│   ├── creator/            # Creator components
│   ├── admin/              # Admin components
│   └── shared/             # Shared components
├── lib/                     # Utilities
│   ├── auth/               # Auth config
│   ├── db/                 # Database client
│   └── utils/              # Helper functions
├── prisma/                  # Database
│   └── schema.prisma       # Schema definition
├── public/                  # Static files
└── types/                   # TypeScript types
```

## Next Steps

Once you have the app running:

1. **Read the Documentation**
   - [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - Complete feature overview
   - [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) - What's next

2. **Explore the Code**
   - Check out the API routes in `app/api/`
   - Review components in `components/`
   - Understand the database schema in `prisma/schema.prisma`

3. **Add Features**
   - See IMPLEMENTATION_NOTES.md for what needs to be built
   - Start with video upload implementation
   - Add channel creation functionality

4. **Deploy to Production**
   - See PROJECT_DOCUMENTATION.md deployment section
   - Set up production database
   - Configure video storage (S3/R2)

## Getting Help

- Check [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) for detailed info
- Review [IMPLEMENTATION_NOTES.md](./IMPLEMENTATION_NOTES.md) for current status
- Search for similar issues online
- Check Next.js, Prisma, and NextAuth documentation

## Useful Commands

```bash
# Development
pnpm dev                          # Start dev server
pnpm build                        # Build for production
pnpm start                        # Start production server

# Database
pnpm prisma studio                # Database GUI
pnpm prisma generate              # Generate client
pnpm prisma migrate dev           # Create migration
pnpm prisma db push               # Push schema (no migration)
pnpm prisma migrate reset         # Reset database

# Code Quality
pnpm lint                         # Run ESLint
pnpm type-check                   # TypeScript check
```

Happy coding! 🚀
