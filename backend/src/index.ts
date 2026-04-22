import 'dotenv/config'
import { buildApp } from './app.js'

const parsedPort = parseInt(process.env.PORT || '3000', 10)
const PORT = Number.isNaN(parsedPort) ? 3000 : parsedPort

async function start() {
  try {
    const app = await buildApp()
    await app.listen({ port: PORT, host: '127.0.0.1' })
  } catch (err) {
    console.error('Fatal output from start:', err)
    process.exit(1)
  }
}

start()
