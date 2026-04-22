import fp from 'fastify-plugin'
import type { FastifyInstance } from 'fastify'
import fastifyCors from '@fastify/cors'

async function corsPlugin(app: FastifyInstance) {
  const allowedOrigin = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173'
  await app.register(fastifyCors, {
    origin: (origin, cb) => {
      // Allow same-origin requests (no Origin header) and the configured origin
      if (!origin || origin === allowedOrigin) {
        cb(null, true)
      } else {
        cb(null, false)
      }
    },
  })
}

export default fp(corsPlugin)
