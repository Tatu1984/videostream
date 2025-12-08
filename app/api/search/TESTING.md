# Search API Testing Guide

## Testing with cURL

### Basic Tests

#### 1. Basic Search (All Content)
```bash
curl "http://localhost:3000/api/search?q=test"
```

#### 2. Search Videos Only
```bash
curl "http://localhost:3000/api/search?q=tutorial&type=video"
```

#### 3. Search Channels Only
```bash
curl "http://localhost:3000/api/search?q=tech&type=channel"
```

#### 4. Search Playlists Only
```bash
curl "http://localhost:3000/api/search?q=music&type=playlist"
```

### Filter Tests

#### 5. Filter by Upload Date
```bash
# Last hour
curl "http://localhost:3000/api/search?q=news&uploadDate=hour"

# Today
curl "http://localhost:3000/api/search?q=news&uploadDate=today"

# Last week
curl "http://localhost:3000/api/search?q=tutorial&uploadDate=week"

# Last month
curl "http://localhost:3000/api/search?q=review&uploadDate=month"

# Last year
curl "http://localhost:3000/api/search?q=2024&uploadDate=year"
```

#### 6. Filter by Duration
```bash
# Short videos (< 4 minutes)
curl "http://localhost:3000/api/search?q=shorts&type=short&duration=short"

# Medium videos (4-20 minutes)
curl "http://localhost:3000/api/search?q=tutorial&duration=medium"

# Long videos (> 20 minutes)
curl "http://localhost:3000/api/search?q=documentary&duration=long"
```

#### 7. Filter by Resolution
```bash
# 4K videos
curl "http://localhost:3000/api/search?q=nature&resolution=4k"

# HD videos
curl "http://localhost:3000/api/search?q=gaming&resolution=hd"

# SD videos
curl "http://localhost:3000/api/search?q=classic&resolution=sd"
```

#### 8. Filter by Features
```bash
# Videos with closed captions
curl "http://localhost:3000/api/search?q=lecture&features=cc"

# 4K videos
curl "http://localhost:3000/api/search?q=travel&features=4k"

# Multiple features
curl "http://localhost:3000/api/search?q=documentary&features=cc,4k"
```

### Sort Tests

#### 9. Sort by Relevance (Default)
```bash
curl "http://localhost:3000/api/search?q=javascript&sortBy=relevance"
```

#### 10. Sort by Upload Date
```bash
curl "http://localhost:3000/api/search?q=news&sortBy=uploadDate"
```

#### 11. Sort by Views
```bash
curl "http://localhost:3000/api/search?q=viral&sortBy=views"
```

#### 12. Sort by Rating
```bash
curl "http://localhost:3000/api/search?q=best&sortBy=rating"
```

### Pagination Tests

#### 13. First Page
```bash
curl "http://localhost:3000/api/search?q=cooking&page=1&limit=10"
```

#### 14. Second Page
```bash
curl "http://localhost:3000/api/search?q=cooking&page=2&limit=10"
```

#### 15. Custom Limit
```bash
curl "http://localhost:3000/api/search?q=music&limit=50"
```

### Complex Tests

#### 16. Combined Filters
```bash
curl "http://localhost:3000/api/search?q=web+development&type=video&uploadDate=week&duration=medium&sortBy=views&resolution=hd&features=cc&page=1&limit=20"
```

#### 17. Search Shorts with Filters
```bash
curl "http://localhost:3000/api/search?q=funny&type=short&uploadDate=today&sortBy=views"
```

#### 18. Search Live Videos
```bash
curl "http://localhost:3000/api/search?q=stream&type=live&sortBy=views"
```

### Error Tests

#### 19. Missing Query Parameter
```bash
curl "http://localhost:3000/api/search"
# Expected: 400 Bad Request
```

#### 20. Invalid Type
```bash
curl "http://localhost:3000/api/search?q=test&type=invalid"
# Expected: 400 Bad Request
```

#### 21. Invalid Page Number
```bash
curl "http://localhost:3000/api/search?q=test&page=0"
# Expected: 400 Bad Request
```

#### 22. Limit Too High
```bash
curl "http://localhost:3000/api/search?q=test&limit=100"
# Expected: 400 Bad Request (max is 50)
```

## Testing with Postman/Thunder Client

### Collection Setup

Create a new collection with the following environment variables:
```json
{
  "BASE_URL": "http://localhost:3000",
  "SEARCH_QUERY": "test"
}
```

### Test Cases

1. **GET Basic Search**
   - URL: `{{BASE_URL}}/api/search?q={{SEARCH_QUERY}}`
   - Expected: 200 OK with results array

2. **GET Video Search with Filters**
   - URL: `{{BASE_URL}}/api/search?q=tutorial&type=video&duration=medium&sortBy=views`
   - Expected: 200 OK with video results

3. **GET Channel Search**
   - URL: `{{BASE_URL}}/api/search?q=tech&type=channel`
   - Expected: 200 OK with channel results

4. **GET Playlist Search**
   - URL: `{{BASE_URL}}/api/search?q=music&type=playlist`
   - Expected: 200 OK with playlist results

5. **GET Pagination Test**
   - URL: `{{BASE_URL}}/api/search?q=test&page=2&limit=10`
   - Expected: 200 OK with pagination metadata

6. **GET Error Test - Missing Query**
   - URL: `{{BASE_URL}}/api/search`
   - Expected: 400 Bad Request

## Automated Testing with Jest/Vitest

```typescript
import { GET } from './route'
import { NextRequest } from 'next/server'

describe('Search API', () => {
  it('should return results for valid search query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results).toBeDefined()
    expect(data.pagination).toBeDefined()
    expect(data.filters).toBeDefined()
  })

  it('should filter by video type', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&type=video')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.results.every(r => r.type === 'video')).toBe(true)
  })

  it('should return 400 for missing query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search')
    const response = await GET(request)

    expect(response.status).toBe(400)
  })

  it('should paginate results correctly', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&page=1&limit=10')
    const response = await GET(request)
    const data = await response.json()

    expect(data.pagination.page).toBe(1)
    expect(data.pagination.limit).toBe(10)
    expect(data.results.length).toBeLessThanOrEqual(10)
  })

  it('should filter by upload date', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&uploadDate=week')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filters.uploadDate).toBe('week')
  })

  it('should filter by duration', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&duration=medium')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filters.duration).toBe('medium')
  })

  it('should sort by views', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&sortBy=views')
    const response = await GET(request)
    const data = await response.json()

    expect(data.filters.sortBy).toBe('views')
    // Verify results are sorted by view count in descending order
    const videos = data.results.filter(r => r.type === 'video')
    for (let i = 0; i < videos.length - 1; i++) {
      expect(Number(videos[i].data.viewCount)).toBeGreaterThanOrEqual(Number(videos[i + 1].data.viewCount))
    }
  })

  it('should filter by resolution', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&resolution=4k')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filters.resolution).toBe('4k')
  })

  it('should filter by features', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&features=cc,4k')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.filters.features).toContain('cc')
    expect(data.filters.features).toContain('4k')
  })

  it('should search channels only', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&type=channel')
    const response = await GET(request)
    const data = await response.json()

    expect(data.results.every(r => r.type === 'channel')).toBe(true)
  })

  it('should search playlists only', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=test&type=playlist')
    const response = await GET(request)
    const data = await response.json()

    expect(data.results.every(r => r.type === 'playlist')).toBe(true)
  })
})
```

## Performance Testing

### Load Test with Apache Bench
```bash
# 1000 requests with 10 concurrent connections
ab -n 1000 -c 10 "http://localhost:3000/api/search?q=test"
```

### Load Test with Artillery
```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "Search API Load Test"
    flow:
      - get:
          url: "/api/search?q=test&type=video"
      - get:
          url: "/api/search?q=tutorial&type=channel"
      - get:
          url: "/api/search?q=music&type=playlist"
```

Run with:
```bash
artillery run load-test.yml
```

## Database Seeding for Testing

Before testing, ensure your database has sample data:

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Create test channels
  const channel = await prisma.channel.create({
    data: {
      name: 'Test Channel',
      handle: '@testchannel',
      description: 'A test channel for search testing',
      owner: {
        create: {
          email: 'test@example.com',
          name: 'Test User',
        }
      }
    }
  })

  // Create test videos
  await prisma.video.createMany({
    data: [
      {
        title: 'JavaScript Tutorial for Beginners',
        description: 'Learn JavaScript from scratch',
        channelId: channel.id,
        visibility: 'PUBLIC',
        processingStatus: 'COMPLETED',
        duration: 600,
        viewCount: 10000,
        likeCount: 500,
        tags: ['javascript', 'tutorial', 'programming'],
        publishedAt: new Date(),
      },
      // Add more test videos...
    ]
  })

  // Create test playlists
  await prisma.playlist.create({
    data: {
      title: 'Web Development Course',
      description: 'Complete web development course',
      userId: channel.ownerId,
      visibility: 'PUBLIC',
      videoCount: 10,
    }
  })
}

main()
```

Run seed:
```bash
npx prisma db seed
```

## Expected Results Summary

| Test Case | Expected Status | Expected Result |
|-----------|----------------|-----------------|
| Basic search | 200 | Mixed results (videos, channels, playlists) |
| Video search | 200 | Video results only |
| Channel search | 200 | Channel results only |
| Playlist search | 200 | Playlist results only |
| Filter by date | 200 | Results within date range |
| Filter by duration | 200 | Videos within duration range |
| Filter by resolution | 200 | Videos with specified resolution |
| Sort by views | 200 | Results sorted by view count |
| Pagination | 200 | Correct page of results |
| Missing query | 400 | Error message |
| Invalid type | 400 | Validation error |
| Invalid page | 400 | Validation error |
