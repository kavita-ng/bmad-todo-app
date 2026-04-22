import Fastify, { type FastifyInstance } from 'fastify'
import corsPlugin from './plugins/cors.js'
import errorHandlerPlugin from './plugins/error-handler.js'
import { client } from './db/connection.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true })

  try {
    await client.execute('SELECT 1')
    app.log.info('Database connected successfully')
  } catch (err) {
    app.log.error({ err }, 'Failed to connect to database')
    throw err
  }

  await app.register(corsPlugin)
  await app.register(errorHandlerPlugin)

  app.get('/health', async () => ({ status: 'ok' }))

  return app
}
