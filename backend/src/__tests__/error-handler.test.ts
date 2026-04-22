import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'

describe('Error handler plugin', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
    app = await buildApp()

    // Route that throws a generic 500
    app.get('/test-500', async () => {
      throw new Error('Something broke internally')
    })

    // Route that throws a 404
    app.get('/test-404', async () => {
      const err = new Error('Resource not found') as Error & { statusCode: number }
      err.statusCode = 404
      throw err
    })
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns { error: { code, message } } shape for 500 errors', async () => {
    const response = await app.inject({ method: 'GET', url: '/test-500' })
    expect(response.statusCode).toBe(500)
    const body = JSON.parse(response.payload)
    expect(body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    })
  })

  it('does not leak internal error message for 500 errors', async () => {
    const response = await app.inject({ method: 'GET', url: '/test-500' })
    expect(response.payload).not.toContain('Something broke internally')
  })

  it('returns NOT_FOUND code for 404 errors', async () => {
    const response = await app.inject({ method: 'GET', url: '/test-404' })
    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.payload)
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Resource not found',
      },
    })
  })

  it('returns correct shape for unknown routes (Fastify default 404)', async () => {
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' })
    expect(response.statusCode).toBe(404)
    const body = JSON.parse(response.payload)
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    })
  })
})
