import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'

describe('CORS plugin', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('allows requests from the configured origin', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://localhost:5173' },
    })
    expect(response.statusCode).toBe(200)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })

  it('does not include CORS headers for disallowed origins', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
      headers: { origin: 'http://evil.example.com' },
    })
    expect(response.headers['access-control-allow-origin']).toBeUndefined()
  })

  it('responds to CORS preflight for allowed origin', async () => {
    const response = await app.inject({
      method: 'OPTIONS',
      url: '/health',
      headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'GET',
      },
    })
    expect(response.statusCode).toBe(204)
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173')
  })
})
