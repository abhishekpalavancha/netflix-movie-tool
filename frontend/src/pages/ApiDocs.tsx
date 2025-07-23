import React, { useState } from 'react';
import { colors, typography, spacing, shadows, transitions, borderRadius } from '../utils/theme';

interface ApiEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  parameters?: Array<{
    name: string;
    type: string;
    required: boolean;
    description: string;
  }>;
  requestBody?: any;
  responseExample: any;
}

const ApiDocs: React.FC = () => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('get-movies');
  const baseUrl = 'http://localhost:8000';

  const endpoints: Record<string, ApiEndpoint> = {
    'get-movies': {
      method: 'GET',
      path: '/api/movies',
      description: 'Get a filtered list of movies with cursor-based pagination. The cursor contains the last movie\'s created_at timestamp and ID for efficient pagination.',
      parameters: [
        { name: 'genre', type: 'string', required: false, description: 'Filter by movie genre' },
        { name: 'min_rating', type: 'number', required: false, description: 'Minimum rating (0-10)' },
        { name: 'year', type: 'integer', required: false, description: 'Filter by release year' },
        { name: 'title', type: 'string', required: false, description: 'Search by title (partial match)' },
        { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor' },
        { name: 'limit', type: 'integer', required: false, description: 'Number of results per page (1-100, default: 10)' },
      ],
      responseExample: {
        movies: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            title: "The Shawshank Redemption",
            genre: "Drama",
            rating: 9.3,
            year: 1994,
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-15T10:30:00Z"
          }
        ],
        next_cursor: "eyJjcmVhdGVkX2F0IjogIjIwMjQtMDEtMTVUMTA6MzA6MDBaIiwgImlkIjogIjU1MGU4NDAwLWUyOWItNDFkNC1hNzE2LTQ0NjY1NTQ0MDAwMCJ9",
        has_more: true,
        limit: 10
      }
    },
    'get-top-rated': {
      method: 'GET',
      path: '/api/movies/top-rated',
      description: 'Get top-rated movies sorted by rating in descending order. Uses cursor-based pagination with rating and ID for consistent ordering.',
      parameters: [
        { name: 'cursor', type: 'string', required: false, description: 'Pagination cursor' },
        { name: 'limit', type: 'integer', required: false, description: 'Number of results per page (1-100, default: 10)' },
      ],
      responseExample: {
        movies: [
          {
            id: "550e8400-e29b-41d4-a716-446655440000",
            title: "The Godfather",
            genre: "Crime",
            rating: 9.2,
            year: 1972,
            created_at: "2024-01-15T10:30:00Z",
            updated_at: "2024-01-15T10:30:00Z"
          }
        ],
        next_cursor: null,
        has_more: false,
        limit: 10
      }
    },
    'get-movie-by-id': {
      method: 'GET',
      path: '/api/movies/{movie_id}',
      description: 'Get a single movie by its ID',
      parameters: [
        { name: 'movie_id', type: 'string', required: true, description: 'UUID of the movie' },
      ],
      responseExample: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "The Dark Knight",
        genre: "Action",
        rating: 9.0,
        year: 2008,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    },
    'create-movie': {
      method: 'POST',
      path: '/api/movies',
      description: 'Add a new movie to the database',
      requestBody: {
        title: "Inception",
        genre: "Sci-Fi",
        rating: 8.8,
        year: 2010,
        metadata: {
          director: "Christopher Nolan",
          runtime: 148
        }
      },
      responseExample: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        title: "Inception",
        genre: "Sci-Fi",
        rating: 8.8,
        year: 2010,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z"
      }
    },
    'get-summary-stats': {
      method: 'GET',
      path: '/api/stats/summary',
      description: 'Get dashboard summary statistics',
      responseExample: {
        totalMovies: 1250,
        averageRating: 7.2,
        totalGenres: 14,
        topGenres: [
          { name: "Drama", count: 350 },
          { name: "Action", count: 280 },
          { name: "Comedy", count: 220 },
          { name: "Thriller", count: 180 },
          { name: "Sci-Fi", count: 120 }
        ]
      }
    },
    'get-stats-by-year': {
      method: 'GET',
      path: '/api/stats/by-year',
      description: 'Get movie counts grouped by year',
      responseExample: [
        { year: 2023, count: 145 },
        { year: 2022, count: 187 },
        { year: 2021, count: 203 },
        { year: 2020, count: 156 }
      ]
    },
    'get-years': {
      method: 'GET',
      path: '/api/movies/years',
      description: 'Get all distinct years from movies in the database',
      responseExample: [
        2024,
        2023,
        2022,
        2021,
        2020,
        2019,
        2018,
        2017,
        2016,
        2015
      ]
    },
    'get-genres': {
      method: 'GET',
      path: '/api/movies/genres',
      description: 'Get all distinct genres from movies in the database',
      responseExample: [
        "Action",
        "Adventure",
        "Animation",
        "Comedy",
        "Crime",
        "Documentary",
        "Drama",
        "Fantasy",
        "Horror",
        "Mystery",
        "Romance",
        "Sci-Fi",
        "Thriller",
        "Western"
      ]
    },
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return '#61affe';
      case 'POST': return '#49cc90';
      case 'PUT': return '#fca130';
      case 'DELETE': return '#f93e3e';
      default: return colors.text.secondary;
    }
  };

  const currentEndpoint = endpoints[selectedEndpoint];

  return (
    <div style={{ marginLeft: `-${spacing.xl}`, marginRight: `-${spacing.xl}`, marginTop: `-${spacing.xl}` }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr 400px',
        height: 'calc(100vh - 80px)',
        backgroundColor: colors.background.primary,
      }}>
        {/* Left Panel - Navigation */}
        <div style={{
          backgroundColor: colors.background.secondary,
          borderRight: `1px solid ${colors.border.primary}`,
          padding: spacing.xl,
          overflowY: 'auto',
        }}>
          <h2 style={{
            margin: `0 0 ${spacing.xl} 0`,
            fontSize: typography.heading.h2.fontSize,
            fontWeight: typography.heading.h2.fontWeight,
            color: colors.text.primary,
          }}>
            API Reference
          </h2>
          
          <div>
            <h3 style={{
              margin: `0 0 ${spacing.md} 0`,
              fontSize: typography.label.fontSize,
              fontWeight: typography.label.fontWeight,
              textTransform: typography.label.textTransform,
              letterSpacing: typography.label.letterSpacing,
              color: colors.text.secondary,
            }}>
              Movies
            </h3>
            
            {Object.entries(endpoints).filter(([key]) => key.includes('movie')).map(([key, endpoint]) => (
              <div
                key={key}
                onClick={() => setSelectedEndpoint(key)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  marginBottom: spacing.xs,
                  borderRadius: borderRadius.sm,
                  cursor: 'pointer',
                  backgroundColor: selectedEndpoint === key ? colors.background.tertiary : 'transparent',
                  transition: `background-color ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
                onMouseEnter={(e) => {
                  if (selectedEndpoint !== key) {
                    e.currentTarget.style.backgroundColor = colors.background.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEndpoint !== key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  color: getMethodColor(endpoint.method),
                  fontSize: typography.body.small.fontSize,
                  fontWeight: 600,
                  minWidth: '50px',
                }}>
                  {endpoint.method}
                </span>
                <span style={{
                  color: selectedEndpoint === key ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.body.small.fontSize,
                }}>
                  {endpoint.path}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: spacing.xl }}>
            <h3 style={{
              margin: `0 0 ${spacing.md} 0`,
              fontSize: typography.label.fontSize,
              fontWeight: typography.label.fontWeight,
              textTransform: typography.label.textTransform,
              letterSpacing: typography.label.letterSpacing,
              color: colors.text.secondary,
            }}>
              Metadata
            </h3>
            
            {Object.entries(endpoints).filter(([key]) => key === 'get-years' || key === 'get-genres').map(([key, endpoint]) => (
              <div
                key={key}
                onClick={() => setSelectedEndpoint(key)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  marginBottom: spacing.xs,
                  borderRadius: borderRadius.sm,
                  cursor: 'pointer',
                  backgroundColor: selectedEndpoint === key ? colors.background.tertiary : 'transparent',
                  transition: `background-color ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
                onMouseEnter={(e) => {
                  if (selectedEndpoint !== key) {
                    e.currentTarget.style.backgroundColor = colors.background.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEndpoint !== key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  color: getMethodColor(endpoint.method),
                  fontSize: typography.body.small.fontSize,
                  fontWeight: 600,
                  minWidth: '50px',
                }}>
                  {endpoint.method}
                </span>
                <span style={{
                  color: selectedEndpoint === key ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.body.small.fontSize,
                }}>
                  {endpoint.path}
                </span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: spacing.xl }}>
            <h3 style={{
              margin: `0 0 ${spacing.md} 0`,
              fontSize: typography.label.fontSize,
              fontWeight: typography.label.fontWeight,
              textTransform: typography.label.textTransform,
              letterSpacing: typography.label.letterSpacing,
              color: colors.text.secondary,
            }}>
              Statistics
            </h3>
            
            {Object.entries(endpoints).filter(([key]) => key.includes('stats')).map(([key, endpoint]) => (
              <div
                key={key}
                onClick={() => setSelectedEndpoint(key)}
                style={{
                  padding: `${spacing.sm} ${spacing.md}`,
                  marginBottom: spacing.xs,
                  borderRadius: borderRadius.sm,
                  cursor: 'pointer',
                  backgroundColor: selectedEndpoint === key ? colors.background.tertiary : 'transparent',
                  transition: `background-color ${transitions.fast}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: spacing.sm,
                }}
                onMouseEnter={(e) => {
                  if (selectedEndpoint !== key) {
                    e.currentTarget.style.backgroundColor = colors.background.primary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedEndpoint !== key) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}
              >
                <span style={{
                  color: getMethodColor(endpoint.method),
                  fontSize: typography.body.small.fontSize,
                  fontWeight: 600,
                  minWidth: '50px',
                }}>
                  {endpoint.method}
                </span>
                <span style={{
                  color: selectedEndpoint === key ? colors.text.primary : colors.text.secondary,
                  fontSize: typography.body.small.fontSize,
                }}>
                  {endpoint.path}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel - Documentation */}
        <div style={{
          padding: spacing.xl,
          overflowY: 'auto',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: spacing.md,
            marginBottom: spacing.lg,
          }}>
            <span style={{
              backgroundColor: getMethodColor(currentEndpoint.method),
              color: '#ffffff',
              padding: `${spacing.xs} ${spacing.md}`,
              borderRadius: borderRadius.sm,
              fontSize: typography.body.small.fontSize,
              fontWeight: 600,
            }}>
              {currentEndpoint.method}
            </span>
            <h1 style={{
              margin: 0,
              fontSize: typography.heading.h2.fontSize,
              fontWeight: typography.heading.h2.fontWeight,
              color: colors.text.primary,
              fontFamily: 'monospace',
            }}>
              {currentEndpoint.path}
            </h1>
          </div>

          <p style={{
            fontSize: typography.body.regular.fontSize,
            color: colors.text.secondary,
            lineHeight: typography.body.regular.lineHeight,
            marginBottom: spacing.xl,
          }}>
            {currentEndpoint.description}
          </p>

          {currentEndpoint.parameters && currentEndpoint.parameters.length > 0 && (
            <div style={{ marginBottom: spacing.xl }}>
              <h2 style={{
                margin: `0 0 ${spacing.md} 0`,
                fontSize: typography.heading.h3.fontSize,
                fontWeight: typography.heading.h3.fontWeight,
                color: colors.text.primary,
              }}>
                Parameters
              </h2>
              
              <div style={{
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
              }}>
                {currentEndpoint.parameters.map((param, index) => (
                  <div
                    key={param.name}
                    style={{
                      paddingBottom: index < currentEndpoint.parameters!.length - 1 ? spacing.md : 0,
                      marginBottom: index < currentEndpoint.parameters!.length - 1 ? spacing.md : 0,
                      borderBottom: index < currentEndpoint.parameters!.length - 1 ? `1px solid ${colors.border.primary}` : 'none',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: spacing.sm,
                      marginBottom: spacing.xs,
                    }}>
                      <code style={{
                        backgroundColor: colors.background.tertiary,
                        color: colors.accent.primary,
                        padding: `2px ${spacing.sm}`,
                        borderRadius: borderRadius.sm,
                        fontSize: typography.body.small.fontSize,
                      }}>
                        {param.name}
                      </code>
                      <span style={{
                        color: colors.text.secondary,
                        fontSize: typography.body.small.fontSize,
                      }}>
                        {param.type}
                      </span>
                      {param.required && (
                        <span style={{
                          color: colors.critical.primary,
                          fontSize: typography.body.small.fontSize,
                          fontWeight: 500,
                        }}>
                          required
                        </span>
                      )}
                    </div>
                    <p style={{
                      margin: 0,
                      color: colors.text.secondary,
                      fontSize: typography.body.small.fontSize,
                    }}>
                      {param.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentEndpoint.requestBody && (
            <div style={{ marginBottom: spacing.xl }}>
              <h2 style={{
                margin: `0 0 ${spacing.md} 0`,
                fontSize: typography.heading.h3.fontSize,
                fontWeight: typography.heading.h3.fontWeight,
                color: colors.text.primary,
              }}>
                Request Body
              </h2>
              
              <pre style={{
                backgroundColor: colors.background.secondary,
                borderRadius: borderRadius.md,
                padding: spacing.lg,
                overflow: 'auto',
                margin: 0,
              }}>
                <code style={{
                  color: colors.text.primary,
                  fontSize: typography.body.small.fontSize,
                }}>
                  {JSON.stringify(currentEndpoint.requestBody, null, 2)}
                </code>
              </pre>
            </div>
          )}

          <div>
            <h2 style={{
              margin: `0 0 ${spacing.md} 0`,
              fontSize: typography.heading.h3.fontSize,
              fontWeight: typography.heading.h3.fontWeight,
              color: colors.text.primary,
            }}>
              Response Example
            </h2>
            
            <pre style={{
              backgroundColor: colors.background.secondary,
              borderRadius: borderRadius.md,
              padding: spacing.lg,
              overflow: 'auto',
              margin: 0,
            }}>
              <code style={{
                color: colors.text.primary,
                fontSize: typography.body.small.fontSize,
              }}>
                {JSON.stringify(currentEndpoint.responseExample, null, 2)}
              </code>
            </pre>
          </div>
        </div>

        {/* Right Panel - Code Examples */}
        <div style={{
          backgroundColor: colors.background.secondary,
          borderLeft: `1px solid ${colors.border.primary}`,
          padding: spacing.xl,
          overflowY: 'auto',
        }}>
          <h3 style={{
            margin: `0 0 ${spacing.md} 0`,
            fontSize: typography.heading.h3.fontSize,
            fontWeight: typography.heading.h3.fontWeight,
            color: colors.text.primary,
          }}>
            Code Examples
          </h3>
          
          <div style={{
            backgroundColor: colors.background.tertiary,
            borderRadius: borderRadius.sm,
            padding: spacing.md,
            marginBottom: spacing.lg,
            fontSize: typography.body.small.fontSize,
            color: colors.text.secondary
          }}>
            <strong>Base URL:</strong> <code>{baseUrl}</code>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <h4 style={{
              margin: `0 0 ${spacing.sm} 0`,
              color: colors.text.secondary,
              fontSize: typography.body.small.fontSize,
              fontWeight: 500,
            }}>
              cURL
            </h4>
            <pre style={{
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.sm,
              padding: spacing.md,
              overflow: 'auto',
              margin: 0,
              fontSize: typography.body.small.fontSize,
            }}>
              <code style={{ color: colors.text.primary }}>
{`curl -X ${currentEndpoint.method} \\
  {baseUrl}${currentEndpoint.path}${
  currentEndpoint.parameters?.filter(p => !p.required).length ? ' \\' : ''
}${
  currentEndpoint.parameters?.filter(p => !p.required).length 
    ? '\n  -d "limit=10"'
    : ''
}${
  currentEndpoint.requestBody 
    ? ` \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(currentEndpoint.requestBody)}'`
    : ''
}`}
              </code>
            </pre>
          </div>

          <div style={{ marginBottom: spacing.xl }}>
            <h4 style={{
              margin: `0 0 ${spacing.sm} 0`,
              color: colors.text.secondary,
              fontSize: typography.body.small.fontSize,
              fontWeight: 500,
            }}>
              JavaScript (Fetch)
            </h4>
            <pre style={{
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.sm,
              padding: spacing.md,
              overflow: 'auto',
              margin: 0,
              fontSize: typography.body.small.fontSize,
            }}>
              <code style={{ color: colors.text.primary }}>
{currentEndpoint.method === 'GET' 
  ? `const response = await fetch(
  '${baseUrl}${currentEndpoint.path}'
);
const data = await response.json();
console.log(data);`
  : `const response = await fetch(
  '${baseUrl}${currentEndpoint.path}',
  {
    method: '${currentEndpoint.method}',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(${JSON.stringify(currentEndpoint.requestBody, null, 2).split('\n').join('\n    ')}),
  }
);
const data = await response.json();
console.log(data);`}
              </code>
            </pre>
          </div>

          <div>
            <h4 style={{
              margin: `0 0 ${spacing.sm} 0`,
              color: colors.text.secondary,
              fontSize: typography.body.small.fontSize,
              fontWeight: 500,
            }}>
              Python (Requests)
            </h4>
            <pre style={{
              backgroundColor: colors.background.primary,
              borderRadius: borderRadius.sm,
              padding: spacing.md,
              overflow: 'auto',
              margin: 0,
              fontSize: typography.body.small.fontSize,
            }}>
              <code style={{ color: colors.text.primary }}>
{`import requests

${currentEndpoint.method === 'GET'
  ? `response = requests.get(
    '${baseUrl}${currentEndpoint.path}'
)`
  : `response = requests.${currentEndpoint.method.toLowerCase()}(
    '${baseUrl}${currentEndpoint.path}',
    json=${JSON.stringify(currentEndpoint.requestBody, null, 2).split('\n').join('\n    ')}
)`}
data = response.json()
print(data)`}
              </code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiDocs;