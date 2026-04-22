import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { buildApp } from '../app.js'

describe('GET /health', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    process.env.ALLOWED_ORIGIN = 'http://localhost:5173'
    app = await buildApp()
  })

  afterAll(async () => {
    await app.close()
  })

  it('returns HTTP 200', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.statusCode).toBe(200)
  })

  it('returns { status: "ok" }', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(JSON.parse(response.payload)).toEqual({ status: 'ok' })
  })

  it('returns JSON content-type', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' })
    expect(response.headers['content-type']).toMatch(/application\/json/)
  })
})
