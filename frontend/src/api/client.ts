export class ApiError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string, statusCode: number) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = 'ApiError';
    // Required so `instanceof ApiError` works correctly after TypeScript transpilation
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Treat empty string the same as unset — avoids silent localhost fallback in staging builds
const API_BASE = ((import.meta.env.VITE_API_URL as string) || '').trim() || 'http://localhost:3000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Guard against callers omitting the leading slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const url = `${API_BASE}${normalizedEndpoint}`

  // Normalize caller headers — Headers instance spread yields {}, losing all entries
  const callerHeaders =
    options.headers instanceof Headers
      ? Object.fromEntries(options.headers)
      : (options.headers ?? {})

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...callerHeaders,
      },
    })
  } catch (err) {
    // Network-level failure (DNS, connection refused, offline, etc.)
    throw new ApiError(err instanceof Error ? err.message : 'Network error', 'NETWORK_ERROR', 0)
  }

  if (!response.ok) {
    let errorData = { error: { code: 'UNKNOWN_ERROR', message: 'An unknown error occurred' } }
    try {
      errorData = await response.json()
    } catch {
      // Revert to fallback if not JSON
    }
    throw new ApiError(
      errorData.error?.message || 'Unknown error',
      errorData.error?.code || 'UNKNOWN_ERROR',
      response.status,
    )
  }

  // Not all 204/2xx responses have bodies (e.g. DELETE)
  if (response.status === 204) return {} as T
  try {
    return await response.json()
  } catch {
    throw new ApiError('Invalid JSON in response body', 'PARSE_ERROR', response.status)
  }
}
