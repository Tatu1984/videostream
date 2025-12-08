# Search API Documentation

## Endpoint
`GET /api/search`

## Description
Comprehensive search API that allows searching across videos, channels, and playlists with advanced filtering and sorting capabilities.

## Query Parameters

### Required Parameters
- `q` (string): Search query (minimum 1 character)

### Optional Parameters

#### Content Type Filter
- `type` (enum): Type of content to search
  - `all` (default): Search all content types
  - `video`: Search only standard videos
  - `channel`: Search only channels
  - `playlist`: Search only playlists
  - `short`: Search only short videos
  - `live`: Search only live videos

#### Upload Date Filter
- `uploadDate` (enum): Filter by upload/publish date
  - `all` (default): All time
  - `hour`: Last hour
  - `today`: Today
  - `week`: Last week
  - `month`: Last month
  - `year`: Last year

#### Duration Filter (Videos only)
- `duration` (enum): Filter by video duration
  - `all` (default): Any duration
  - `short`: Less than 4 minutes
  - `medium`: 4-20 minutes
  - `long`: More than 20 minutes

#### Sort Options
- `sortBy` (enum): Sort order for results
  - `relevance` (default): Sort by relevance (view count for videos, subscriber count for channels)
  - `uploadDate`: Sort by publish/creation date (newest first)
  - `views`: Sort by view count (highest first, videos only)
  - `rating`: Sort by like count (highest first, videos only)

#### Pagination
- `page` (number): Page number (default: 1, must be positive integer)
- `limit` (number): Results per page (default: 20, max: 50)

#### Resolution Filter (Videos only)
- `resolution` (enum): Filter by video resolution
  - `all` (default): Any resolution
  - `4k`: 4K and 8K (2160p, 4320p)
  - `hd`: HD quality (720p, 1080p, 1440p)
  - `sd`: Standard definition (144p, 240p, 360p, 480p)

#### Features Filter (Videos only)
- `features` (comma-separated string): Filter by video features
  - `cc`: Closed captions/subtitles available
  - `4k`: 4K resolution available
  - `live`: Live videos
  - `hdr`: HDR support (future)
  - `360`: 360-degree videos (future)
  - `vr180`: VR180 videos (future)
  - `3d`: 3D videos (future)
  - `location`: Videos with location data (future)

## Example Requests

### Basic Search
```
GET /api/search?q=cooking
```

### Search Videos Only
```
GET /api/search?q=javascript&type=video
```

### Search with Filters
```
GET /api/search?q=tutorial&type=video&uploadDate=week&duration=medium&sortBy=views
```

### Search with Resolution Filter
```
GET /api/search?q=nature&type=video&resolution=4k
```

### Search with CC Filter
```
GET /api/search?q=documentary&type=video&features=cc
```

### Search with Pagination
```
GET /api/search?q=music&page=2&limit=30
```

### Search Channels
```
GET /api/search?q=tech&type=channel&sortBy=relevance
```

### Search Playlists
```
GET /api/search?q=workout&type=playlist
```

### Complex Search
```
GET /api/search?q=web+development&type=video&uploadDate=month&duration=long&sortBy=views&resolution=hd&features=cc&page=1&limit=20
```

## Response Format

### Success Response (200 OK)

```json
{
  "results": [
    {
      "type": "video",
      "id": "video_id_123",
      "data": {
        "id": "video_id_123",
        "title": "Video Title",
        "description": "Video description...",
        "thumbnailUrl": "https://...",
        "duration": 600,
        "viewCount": "150000",
        "likeCount": 5000,
        "publishedAt": "2024-01-01T00:00:00.000Z",
        "videoType": "STANDARD",
        "channel": {
          "id": "channel_id_456",
          "name": "Channel Name",
          "handle": "@channelhandle",
          "avatar": "https://...",
          "verified": true,
          "subscriberCount": 100000
        },
        "hasCC": true,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    },
    {
      "type": "channel",
      "id": "channel_id_789",
      "data": {
        "id": "channel_id_789",
        "name": "Another Channel",
        "handle": "@anotherchannel",
        "description": "Channel description...",
        "avatar": "https://...",
        "banner": "https://...",
        "verified": false,
        "subscriberCount": 50000,
        "videoCount": 120,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    },
    {
      "type": "playlist",
      "id": "playlist_id_012",
      "data": {
        "id": "playlist_id_012",
        "title": "Playlist Title",
        "description": "Playlist description...",
        "visibility": "PUBLIC",
        "videoCount": 25,
        "creator": {
          "id": "user_id_345",
          "name": "Creator Name",
          "username": "creator_username",
          "image": "https://..."
        },
        "previewVideos": [
          {
            "id": "video_id_678",
            "title": "First Video",
            "thumbnailUrl": "https://...",
            "duration": 300
          }
        ],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "updatedAt": "2024-01-15T00:00:00.000Z"
      }
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  },
  "filters": {
    "query": "cooking",
    "type": "all",
    "uploadDate": "all",
    "duration": "all",
    "sortBy": "relevance",
    "resolution": "all",
    "features": []
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Parameters
```json
{
  "error": "Invalid search parameters",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Search query is required",
      "path": ["q"]
    }
  ]
}
```

#### 500 Internal Server Error
```json
{
  "error": "Failed to perform search"
}
```

## Search Behavior

### Video Search
- Searches in: title, description, tags
- Only returns: PUBLIC videos with COMPLETED processing status
- Filters: upload date, duration, resolution, features
- Sort options: relevance, uploadDate, views, rating

### Channel Search
- Searches in: name, handle, description
- Only returns: ACTIVE channels
- Sort options: relevance (subscriber count), uploadDate (creation date)

### Playlist Search
- Searches in: title, description
- Only returns: PUBLIC playlists
- Includes: first 3 videos as preview
- Sort options: relevance, uploadDate (creation date)

### Mixed Search (type="all")
- Combines results from all content types
- Distributes results: ~60% videos, ~20% channels, ~20% playlists
- Mixes content types in results
- Total count includes all matching content

## Implementation Details

### Search Strategy
1. Case-insensitive search using Prisma `contains` with `mode: "insensitive"`
2. Tag matching uses exact lowercase match for videos
3. Multiple OR conditions for different fields (title, description, etc.)

### Performance Considerations
- Results are limited to 50 per page maximum
- Separate counts are performed for each content type
- Efficient database queries with proper indexing on:
  - Video: channelId, visibility, videoType, publishedAt
  - Channel: handle
  - Playlist: userId

### Future Enhancements
- Full-text search using PostgreSQL's full-text search capabilities
- Search result highlighting
- Advanced relevance scoring
- Search suggestions/autocomplete
- Search analytics tracking
- Support for boolean operators (AND, OR, NOT)
- Phrase matching with quotes
- Wildcard search support
- Search history for logged-in users
- Trending searches

## Related Endpoints
- `GET /api/videos` - List/filter videos
- `GET /api/videos/[videoId]` - Get video details
- `GET /api/channels/[channelId]` - Get channel details (to be created)
- `GET /api/playlists` - List playlists
- `GET /api/playlists/[playlistId]` - Get playlist details (to be created)
