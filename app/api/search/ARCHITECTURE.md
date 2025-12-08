# Search API Architecture

## System Overview

```
┌─────────────┐
│   Client    │
│ (Web/Mobile)│
└──────┬──────┘
       │ HTTP GET /api/search?q=...
       ▼
┌──────────────────────────────────────┐
│         Next.js API Route           │
│      /app/api/search/route.ts       │
│                                      │
│  ┌────────────────────────────┐    │
│  │  1. Request Validation     │    │
│  │     (Zod Schema)           │    │
│  └────────────┬───────────────┘    │
│               ▼                     │
│  ┌────────────────────────────┐    │
│  │  2. Build Query Filters    │    │
│  │     - Type filter          │    │
│  │     - Date filter          │    │
│  │     - Duration filter      │    │
│  │     - Resolution filter    │    │
│  └────────────┬───────────────┘    │
│               ▼                     │
│  ┌────────────────────────────┐    │
│  │  3. Execute Searches       │    │
│  │     ├─ Video Search        │    │
│  │     ├─ Channel Search      │    │
│  │     └─ Playlist Search     │    │
│  └────────────┬───────────────┘    │
│               ▼                     │
│  ┌────────────────────────────┐    │
│  │  4. Combine & Format       │    │
│  │     - Merge results        │    │
│  │     - Apply pagination     │    │
│  │     - Add metadata         │    │
│  └────────────┬───────────────┘    │
│               ▼                     │
│  ┌────────────────────────────┐    │
│  │  5. Return JSON Response   │    │
│  └────────────────────────────┘    │
└───────────────┬──────────────────────┘
                │
                ▼
        ┌──────────────┐
        │   Prisma ORM │
        └───────┬──────┘
                │
                ▼
        ┌──────────────┐
        │  PostgreSQL  │
        └──────────────┘
```

## Request Flow Diagram

```
User Input: "javascript tutorial"
    │
    ▼
┌────────────────────────────────────────┐
│ Query Parameters                        │
├────────────────────────────────────────┤
│ q: "javascript tutorial"                │
│ type: "video"                          │
│ uploadDate: "week"                     │
│ duration: "medium"                     │
│ sortBy: "views"                        │
│ page: 1                                │
│ limit: 20                              │
└────────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Zod Validation │
    └────────┬───────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Build Prisma WHERE Clause              │
├────────────────────────────────────────┤
│ {                                      │
│   AND: [                               │
│     {                                  │
│       OR: [                            │
│         { title: { contains: "..." } }│
│         { description: { ... } }      │
│         { tags: { has: "..." } }      │
│       ]                                │
│     },                                 │
│     { visibility: "PUBLIC" },          │
│     { processingStatus: "COMPLETED" }, │
│     { videoType: "STANDARD" },         │
│     { publishedAt: { gte: ... } },     │
│     { duration: { gte: 240, lte: 1200 }}│
│   ]                                    │
│ }                                      │
└────────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Execute Query  │
    │ with Sorting   │
    │ & Pagination   │
    └────────┬───────┘
             │
             ▼
┌────────────────────────────────────────┐
│ Results                                │
├────────────────────────────────────────┤
│ - Video 1 (150K views)                 │
│ - Video 2 (120K views)                 │
│ - Video 3 (95K views)                  │
│ - ...                                  │
└────────────┬───────────────────────────┘
             │
             ▼
    ┌────────────────┐
    │ Format Response│
    └────────┬───────┘
             │
             ▼
┌────────────────────────────────────────┐
│ JSON Response                          │
├────────────────────────────────────────┤
│ {                                      │
│   results: [...],                      │
│   pagination: {                        │
│     total: 150,                        │
│     page: 1,                           │
│     limit: 20,                         │
│     totalPages: 8                      │
│   },                                   │
│   filters: {...}                       │
│ }                                      │
└────────────┬───────────────────────────┘
             │
             ▼
          Client
```

## Database Query Flow

### Video Search Query

```
┌─────────────────────────────────────────┐
│ Step 1: Count Query                     │
├─────────────────────────────────────────┤
│ SELECT COUNT(*) FROM videos             │
│ WHERE (                                 │
│   title ILIKE '%search%' OR            │
│   description ILIKE '%search%' OR      │
│   'search' = ANY(tags)                 │
│ )                                       │
│ AND visibility = 'PUBLIC'               │
│ AND processingStatus = 'COMPLETED'      │
│ AND publishedAt >= '...'                │
│ AND duration >= 240 AND duration <= 1200│
└─────────────────────────────────────────┘
              │
              ▼
        Total: 150
              │
              ▼
┌─────────────────────────────────────────┐
│ Step 2: Data Query                      │
├─────────────────────────────────────────┤
│ SELECT v.*, c.*                         │
│ FROM videos v                           │
│ JOIN channels c ON v.channelId = c.id   │
│ LEFT JOIN video_assets va               │
│   ON v.id = va.videoId                  │
│ WHERE [same conditions]                 │
│ ORDER BY viewCount DESC                 │
│ LIMIT 20 OFFSET 0                       │
└─────────────────────────────────────────┘
              │
              ▼
        Results: 20 videos
```

## Component Architecture

```
┌──────────────────────────────────────────────────┐
│                  route.ts                        │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  searchParamsSchema (Zod)              │    │
│  │  - Validates all query parameters      │    │
│  │  - Sets default values                 │    │
│  │  - Type coercion                       │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  GET Handler                           │    │
│  │  ┌──────────────────────────────────┐  │    │
│  │  │ Video Search Logic               │  │    │
│  │  │ - Build WHERE clause             │  │    │
│  │  │ - Apply filters                  │  │    │
│  │  │ - Execute query                  │  │    │
│  │  │ - Format results                 │  │    │
│  │  └──────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────┐  │    │
│  │  │ Channel Search Logic             │  │    │
│  │  │ - Build WHERE clause             │  │    │
│  │  │ - Execute query                  │  │    │
│  │  │ - Format results                 │  │    │
│  │  └──────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────┐  │    │
│  │  │ Playlist Search Logic            │  │    │
│  │  │ - Build WHERE clause             │  │    │
│  │  │ - Execute query                  │  │    │
│  │  │ - Format results                 │  │    │
│  │  └──────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────┐  │    │
│  │  │ Result Combination               │  │    │
│  │  │ - Merge results                  │  │    │
│  │  │ - Apply pagination               │  │    │
│  │  │ - Add metadata                   │  │    │
│  │  └──────────────────────────────────┘  │    │
│  └────────────────────────────────────────┘    │
│                                                  │
│  ┌────────────────────────────────────────┐    │
│  │  Error Handling                        │    │
│  │  - Zod validation errors (400)         │    │
│  │  - Server errors (500)                 │    │
│  └────────────────────────────────────────┘    │
│                                                  │
└──────────────────────────────────────────────────┘
```

## Data Flow by Search Type

### Type: "all" (Mixed Search)

```
┌──────────┐  ┌───────────┐  ┌───────────┐
│  Video   │  │  Channel  │  │ Playlist  │
│  Search  │  │  Search   │  │  Search   │
└────┬─────┘  └─────┬─────┘  └─────┬─────┘
     │              │              │
     │ 12 videos    │ 4 channels   │ 4 playlists
     │              │              │
     └──────┬───────┴──────┬───────┘
            │              │
            ▼              ▼
        ┌────────────────────┐
        │  Combine Results   │
        │  (20 total)        │
        └──────────┬─────────┘
                   │
                   ▼
            ┌─────────────┐
            │   Response  │
            └─────────────┘
```

### Type: "video" (Video-Only Search)

```
┌─────────────────┐
│  Video Search   │
└────────┬────────┘
         │
         │ Apply filters:
         │ - Upload date
         │ - Duration
         │ - Resolution
         │ - Features
         │
         ▼
┌─────────────────┐
│  Sort Results   │
│  - Relevance    │
│  - Date         │
│  - Views        │
│  - Rating       │
└────────┬────────┘
         │
         │ 20 videos
         │
         ▼
┌─────────────────┐
│   Response      │
└─────────────────┘
```

## Performance Optimization Strategy

```
┌────────────────────────────────────────┐
│         Request Received               │
└───────────────┬────────────────────────┘
                │
                ▼
        ┌──────────────┐
        │ Redis Cache? │ ───Yes───► Return cached results
        └───────┬──────┘
                │ No
                ▼
┌───────────────────────────────────────┐
│    Database Query Optimization        │
├───────────────────────────────────────┤
│ 1. Use indexed columns                │
│    - visibility                       │
│    - videoType                        │
│    - publishedAt                      │
│    - channelId                        │
│                                       │
│ 2. Limit result set                   │
│    - MAX 50 per page                  │
│    - Skip already viewed rows         │
│                                       │
│ 3. Select only needed columns         │
│    - Avoid SELECT *                   │
│    - Use Prisma select/include        │
│                                       │
│ 4. Parallel queries                   │
│    - Videos, Channels, Playlists      │
│    - Use Promise.all()                │
└───────────────┬───────────────────────┘
                │
                ▼
        ┌──────────────┐
        │ Cache Result │
        └──────┬───────┘
                │
                ▼
        ┌──────────────┐
        │   Response   │
        └──────────────┘
```

## Error Handling Flow

```
┌──────────────┐
│   Request    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│ Zod Validation   │
└──────┬───────────┘
       │
       ├─ Invalid ──► 400 Bad Request
       │              { error: "...", details: [...] }
       │
       ▼ Valid
┌──────────────────┐
│ Database Query   │
└──────┬───────────┘
       │
       ├─ Error ───► 500 Internal Server Error
       │              { error: "Failed to perform search" }
       │
       ▼ Success
┌──────────────────┐
│ Format Response  │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ 200 OK Response  │
│ { results: [...] }│
└──────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│ API Node │  │ API Node │  │ API Node │
│    #1    │  │    #2    │  │    #3    │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │            │            │
     └────────────┴────────────┘
                  │
         ┌────────▼────────┐
         │  Load Balancer  │
         └────────┬────────┘
                  │
     ┌────────────┴────────────┐
     │                         │
     ▼                         ▼
┌──────────┐            ┌──────────┐
│  Redis   │            │PostgreSQL│
│  Cache   │            │ (Primary)│
└──────────┘            └────┬─────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
              ┌──────────┐      ┌──────────┐
              │PostgreSQL│      │PostgreSQL│
              │(Replica1)│      │(Replica2)│
              └──────────┘      └──────────┘
```

### Caching Strategy

```
Level 1: Browser Cache (5 minutes)
         │
         ▼
Level 2: CDN Cache (1 minute)
         │
         ▼
Level 3: Redis Cache (30 seconds)
         │
         ▼
Level 4: PostgreSQL Query
```

## Integration Points

```
┌─────────────────────────────────────────┐
│            Search API                   │
└───────────┬─────────────────────────────┘
            │
    ┌───────┼───────┐
    │       │       │
    ▼       ▼       ▼
┌───────┐ ┌────┐ ┌──────┐
│Videos │ │Chan│ │Playl.│
│  API  │ │nel │ │ API  │
│       │ │API │ │      │
└───────┘ └────┘ └──────┘
```

## Future Enhancements Architecture

```
┌──────────────────────────────────────┐
│       Phase 2: Enhanced Search       │
├──────────────────────────────────────┤
│ • Elasticsearch Integration          │
│ • AI-Powered Relevance Ranking       │
│ • Search Analytics Pipeline          │
│ • Autocomplete Service               │
└──────────────────────────────────────┘
            │
            ▼
┌──────────────────────────────────────┐
│       Phase 3: Advanced Features     │
├──────────────────────────────────────┤
│ • Semantic Search (Vector DB)        │
│ • Multi-language Support             │
│ • Voice Search Integration           │
│ • Personalized Recommendations       │
└──────────────────────────────────────┘
```

## Security Architecture

```
┌──────────────┐
│    Client    │
└──────┬───────┘
       │ HTTPS
       ▼
┌──────────────────┐
│  Rate Limiter    │
│  (100 req/min)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Input Sanitizer │
│  (Zod Validation)│
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  SQL Injection   │
│  Prevention      │
│  (Prisma ORM)    │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│  Privacy Filter  │
│  (PUBLIC only)   │
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│   Database       │
└──────────────────┘
```

---

This architecture supports:
- ✅ High availability
- ✅ Horizontal scaling
- ✅ Performance optimization
- ✅ Security best practices
- ✅ Future extensibility
