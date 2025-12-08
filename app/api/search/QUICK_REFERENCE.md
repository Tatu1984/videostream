# Search API Quick Reference Card

## Endpoint
```
GET /api/search
```

## Required Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string | Search query (min 1 char) |

## Optional Parameters

### Content Type
```
type=all|video|channel|playlist|short|live
```
Default: `all`

### Filters
```
uploadDate=all|hour|today|week|month|year
duration=all|short|medium|long
resolution=all|4k|hd|sd
features=cc,4k,live (comma-separated)
```

### Sorting
```
sortBy=relevance|uploadDate|views|rating
```
Default: `relevance`

### Pagination
```
page=1 (positive integer)
limit=20 (max 50)
```

## Quick Examples

### Search Everything
```bash
curl "/api/search?q=javascript"
```

### Search Videos Only
```bash
curl "/api/search?q=tutorial&type=video"
```

### Search with Filters
```bash
curl "/api/search?q=react&type=video&uploadDate=week&duration=medium&sortBy=views"
```

### Search 4K Videos with CC
```bash
curl "/api/search?q=nature&resolution=4k&features=cc"
```

### Search Channels
```bash
curl "/api/search?q=tech&type=channel&sortBy=relevance"
```

### Paginated Results
```bash
curl "/api/search?q=music&page=2&limit=30"
```

## Response Structure

```json
{
  "results": [
    {
      "type": "video|channel|playlist",
      "id": "string",
      "data": { /* type-specific */ }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "filters": { /* applied filters */ }
}
```

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Invalid parameters |
| 500 | Server error |

## Duration Values

| Value | Time Range |
|-------|------------|
| `short` | < 4 minutes |
| `medium` | 4-20 minutes |
| `long` | > 20 minutes |

## Resolution Values

| Value | Includes |
|-------|----------|
| `4k` | 2160p, 4320p |
| `hd` | 720p, 1080p, 1440p |
| `sd` | 144p, 240p, 360p, 480p |

## Features

| Feature | Description |
|---------|-------------|
| `cc` | Closed captions available |
| `4k` | 4K resolution available |
| `live` | Live videos |
| `hdr` | HDR support (future) |
| `360` | 360-degree (future) |
| `vr180` | VR180 (future) |
| `3d` | 3D videos (future) |
| `location` | Has location data (future) |

## Common Use Cases

### Latest Videos
```
?q=trending&type=video&sortBy=uploadDate&uploadDate=today
```

### Popular Channels
```
?q=tech&type=channel&sortBy=relevance
```

### HD Tutorials
```
?q=tutorial&type=video&resolution=hd&duration=medium
```

### Short Videos Today
```
?q=funny&type=short&uploadDate=today&sortBy=views
```

### Live Streams
```
?q=gaming&type=live&sortBy=views
```

### Educational with CC
```
?q=education&type=video&features=cc&duration=long
```

## JavaScript Fetch Example

```javascript
const params = new URLSearchParams({
  q: 'javascript',
  type: 'video',
  uploadDate: 'week',
  sortBy: 'views',
  page: '1',
  limit: '20'
})

const response = await fetch(`/api/search?${params}`)
const data = await response.json()
```

## TypeScript Interface

```typescript
interface SearchParams {
  q: string
  type?: 'all' | 'video' | 'channel' | 'playlist' | 'short' | 'live'
  uploadDate?: 'all' | 'hour' | 'today' | 'week' | 'month' | 'year'
  duration?: 'all' | 'short' | 'medium' | 'long'
  sortBy?: 'relevance' | 'uploadDate' | 'views' | 'rating'
  page?: number
  limit?: number
  resolution?: 'all' | '4k' | 'hd' | 'sd'
  features?: string[]
}
```

## Performance Tips

1. Use specific `type` instead of `all` when possible
2. Keep `limit` reasonable (default 20 is good)
3. Cache results on the client side
4. Use pagination instead of large limits
5. Combine filters to narrow results

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 400 Error | Check parameter spelling and values |
| No results | Try broader search terms or remove filters |
| Slow response | Reduce limit or narrow search with filters |
| Missing data | Ensure database has public content |

## Rate Limiting (Recommended)

```
100 requests per minute per IP
1000 requests per hour per IP
```

## Related Endpoints

- `GET /api/videos` - List videos
- `GET /api/videos/[id]` - Video details
- `GET /api/channels/[id]` - Channel details
- `GET /api/playlists` - List playlists

---

**Quick Start**: `/api/search?q=YOUR_QUERY`

**Full Docs**: See [README.md](./README.md)
