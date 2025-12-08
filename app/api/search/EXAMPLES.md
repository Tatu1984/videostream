# Search API Integration Examples

## Frontend Integration Examples

### React/Next.js Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

interface SearchResult {
  type: 'video' | 'channel' | 'playlist'
  id: string
  data: any
}

interface SearchResponse {
  results: SearchResult[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
  filters: {
    query: string
    type: string
    uploadDate: string
    duration: string
    sortBy: string
    resolution: string
    features: string[]
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState<any>(null)

  const query = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'all'
  const page = searchParams.get('page') || '1'

  useEffect(() => {
    if (!query) return

    const searchVideos = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({
          q: query,
          type,
          page,
          limit: '20',
        })

        const response = await fetch(`/api/search?${params}`)
        const data: SearchResponse = await response.json()

        setResults(data.results)
        setPagination(data.pagination)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    searchVideos()
  }, [query, type, page])

  if (loading) return <div>Loading...</div>

  return (
    <div className="search-results">
      <h1>Search Results for: {query}</h1>

      {results.map((result) => (
        <div key={`${result.type}-${result.id}`}>
          {result.type === 'video' && <VideoCard data={result.data} />}
          {result.type === 'channel' && <ChannelCard data={result.data} />}
          {result.type === 'playlist' && <PlaylistCard data={result.data} />}
        </div>
      ))}

      {pagination && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
        />
      )}
    </div>
  )
}
```

### Advanced Search with Filters

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdvancedSearch() {
  const router = useRouter()
  const [filters, setFilters] = useState({
    query: '',
    type: 'all',
    uploadDate: 'all',
    duration: 'all',
    sortBy: 'relevance',
    resolution: 'all',
    features: [] as string[],
  })

  const handleSearch = async () => {
    const params = new URLSearchParams()

    params.append('q', filters.query)
    if (filters.type !== 'all') params.append('type', filters.type)
    if (filters.uploadDate !== 'all') params.append('uploadDate', filters.uploadDate)
    if (filters.duration !== 'all') params.append('duration', filters.duration)
    if (filters.sortBy !== 'relevance') params.append('sortBy', filters.sortBy)
    if (filters.resolution !== 'all') params.append('resolution', filters.resolution)
    if (filters.features.length > 0) params.append('features', filters.features.join(','))

    router.push(`/search?${params.toString()}`)
  }

  return (
    <div className="advanced-search">
      <input
        type="text"
        placeholder="Search..."
        value={filters.query}
        onChange={(e) => setFilters({ ...filters, query: e.target.value })}
      />

      <div className="filters">
        <select
          value={filters.type}
          onChange={(e) => setFilters({ ...filters, type: e.target.value })}
        >
          <option value="all">All</option>
          <option value="video">Videos</option>
          <option value="channel">Channels</option>
          <option value="playlist">Playlists</option>
          <option value="short">Shorts</option>
          <option value="live">Live</option>
        </select>

        <select
          value={filters.uploadDate}
          onChange={(e) => setFilters({ ...filters, uploadDate: e.target.value })}
        >
          <option value="all">Any time</option>
          <option value="hour">Last hour</option>
          <option value="today">Today</option>
          <option value="week">This week</option>
          <option value="month">This month</option>
          <option value="year">This year</option>
        </select>

        <select
          value={filters.duration}
          onChange={(e) => setFilters({ ...filters, duration: e.target.value })}
        >
          <option value="all">Any duration</option>
          <option value="short">Under 4 minutes</option>
          <option value="medium">4-20 minutes</option>
          <option value="long">Over 20 minutes</option>
        </select>

        <select
          value={filters.sortBy}
          onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
        >
          <option value="relevance">Relevance</option>
          <option value="uploadDate">Upload date</option>
          <option value="views">View count</option>
          <option value="rating">Rating</option>
        </select>

        <select
          value={filters.resolution}
          onChange={(e) => setFilters({ ...filters, resolution: e.target.value })}
        >
          <option value="all">Any quality</option>
          <option value="4k">4K</option>
          <option value="hd">HD</option>
          <option value="sd">SD</option>
        </select>

        <div className="feature-checkboxes">
          <label>
            <input
              type="checkbox"
              checked={filters.features.includes('cc')}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilters({ ...filters, features: [...filters.features, 'cc'] })
                } else {
                  setFilters({ ...filters, features: filters.features.filter(f => f !== 'cc') })
                }
              }}
            />
            CC (Closed Captions)
          </label>

          <label>
            <input
              type="checkbox"
              checked={filters.features.includes('4k')}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilters({ ...filters, features: [...filters.features, '4k'] })
                } else {
                  setFilters({ ...filters, features: filters.features.filter(f => f !== '4k') })
                }
              }}
            />
            4K
          </label>

          <label>
            <input
              type="checkbox"
              checked={filters.features.includes('live')}
              onChange={(e) => {
                if (e.target.checked) {
                  setFilters({ ...filters, features: [...filters.features, 'live'] })
                } else {
                  setFilters({ ...filters, features: filters.features.filter(f => f !== 'live') })
                }
              }}
            />
            Live
          </label>
        </div>
      </div>

      <button onClick={handleSearch}>Search</button>
    </div>
  )
}
```

### Custom Hook for Search

```typescript
import { useState, useEffect } from 'react'

interface UseSearchOptions {
  query: string
  type?: string
  uploadDate?: string
  duration?: string
  sortBy?: string
  page?: number
  limit?: number
  resolution?: string
  features?: string[]
}

export function useSearch(options: UseSearchOptions) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    if (!options.query) return

    const fetchResults = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          q: options.query,
          type: options.type || 'all',
          uploadDate: options.uploadDate || 'all',
          duration: options.duration || 'all',
          sortBy: options.sortBy || 'relevance',
          page: String(options.page || 1),
          limit: String(options.limit || 20),
          resolution: options.resolution || 'all',
        })

        if (options.features && options.features.length > 0) {
          params.append('features', options.features.join(','))
        }

        const response = await fetch(`/api/search?${params}`)

        if (!response.ok) {
          throw new Error('Search failed')
        }

        const data = await response.json()
        setResults(data.results)
        setPagination(data.pagination)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [
    options.query,
    options.type,
    options.uploadDate,
    options.duration,
    options.sortBy,
    options.page,
    options.limit,
    options.resolution,
    options.features?.join(','),
  ])

  return { results, loading, error, pagination }
}

// Usage
function SearchComponent() {
  const { results, loading, error, pagination } = useSearch({
    query: 'javascript',
    type: 'video',
    uploadDate: 'week',
    sortBy: 'views',
  })

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {results.map((result) => (
        <div key={result.id}>{/* Render result */}</div>
      ))}
    </div>
  )
}
```

### Autocomplete Search

```typescript
'use client'

import { useState, useCallback } from 'react'
import { debounce } from 'lodash'

export default function SearchAutocomplete() {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchSuggestions = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery) {
        setSuggestions([])
        return
      }

      setLoading(true)
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(searchQuery)}&limit=5`
        )
        const data = await response.json()
        setSuggestions(data.results)
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    fetchSuggestions(value)
  }

  return (
    <div className="autocomplete">
      <input
        type="text"
        value={query}
        onChange={handleInputChange}
        placeholder="Search..."
      />

      {loading && <div>Loading suggestions...</div>}

      {suggestions.length > 0 && (
        <ul className="suggestions">
          {suggestions.map((suggestion) => (
            <li key={suggestion.id}>
              {suggestion.type === 'video' && suggestion.data.title}
              {suggestion.type === 'channel' && suggestion.data.name}
              {suggestion.type === 'playlist' && suggestion.data.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

## Server-Side Usage

### API Route Handler

```typescript
// app/api/recommendations/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Use search API internally to get recommendations
  const searchUrl = new URL('/api/search', req.url)
  searchUrl.searchParams.set('q', 'trending')
  searchUrl.searchParams.set('type', 'video')
  searchUrl.searchParams.set('sortBy', 'views')
  searchUrl.searchParams.set('uploadDate', 'week')
  searchUrl.searchParams.set('limit', '10')

  const response = await fetch(searchUrl)
  const data = await response.json()

  return NextResponse.json({
    recommendations: data.results.map((r: any) => r.data)
  })
}
```

### Server Component

```typescript
// app/search/page.tsx
import { Suspense } from 'react'

async function getSearchResults(query: string) {
  const url = new URL('/api/search', process.env.NEXT_PUBLIC_API_URL)
  url.searchParams.set('q', query)

  const response = await fetch(url, {
    cache: 'no-store', // or use revalidate for ISR
  })

  if (!response.ok) {
    throw new Error('Failed to fetch search results')
  }

  return response.json()
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q: string }
}) {
  const data = await getSearchResults(searchParams.q)

  return (
    <div>
      <h1>Search Results</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchResults results={data.results} />
      </Suspense>
    </div>
  )
}
```

## Mobile App Integration (React Native)

```typescript
import { useState, useEffect } from 'react'
import { View, TextInput, FlatList, ActivityIndicator } from 'react-native'

const API_BASE_URL = 'https://api.metube.com'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery) return

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        type: 'all',
        limit: '20',
      })

      const response = await fetch(`${API_BASE_URL}/api/search?${params}`)
      const data = await response.json()
      setResults(data.results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={() => handleSearch(query)}
        placeholder="Search..."
      />

      {loading && <ActivityIndicator />}

      <FlatList
        data={results}
        renderItem={({ item }) => (
          <SearchResultItem item={item} />
        )}
        keyExtractor={(item) => `${item.type}-${item.id}`}
      />
    </View>
  )
}
```

## Analytics Integration

```typescript
// Track search analytics
async function trackSearch(query: string, resultsCount: number) {
  await fetch('/api/analytics/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      resultsCount,
      timestamp: new Date().toISOString(),
    }),
  })
}

// Usage
const handleSearch = async (query: string) => {
  const response = await fetch(`/api/search?q=${query}`)
  const data = await response.json()

  // Track the search
  await trackSearch(query, data.pagination.total)

  return data
}
```

## Error Handling

```typescript
async function searchWithErrorHandling(query: string) {
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)

    if (!response.ok) {
      const error = await response.json()

      switch (response.status) {
        case 400:
          throw new Error(`Invalid search: ${error.error}`)
        case 500:
          throw new Error('Server error. Please try again later.')
        default:
          throw new Error('An unexpected error occurred')
      }
    }

    return await response.json()
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error. Please check your connection.')
    }
    throw error
  }
}
```

## Caching Strategy

```typescript
// Using SWR for client-side caching
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export function useSearchWithCache(query: string, options: any = {}) {
  const params = new URLSearchParams({ q: query, ...options })
  const { data, error, isLoading } = useSWR(
    query ? `/api/search?${params}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // 1 minute
    }
  )

  return {
    results: data?.results || [],
    pagination: data?.pagination,
    isLoading,
    error,
  }
}
```
