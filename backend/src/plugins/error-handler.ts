import fp from 'fastify-plugin'
import type { FastifyInstance, FastifyError } from "fastify";

async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, _request, reply) => {
    app.log.error(error);

    // Fastify validation errors (JSON Schema failures)
    if (error.validation) {
      return reply.status(400).send({
        error: {
          code: "VALIDATION_ERROR",
          message: error.message,
        },
      });
    }

    const rawStatusCode = error.statusCode ?? 500;
    const statusCode =
      Number.isInteger(rawStatusCode) &&
      rawStatusCode >= 100 &&
      rawStatusCode < 600
        ? rawStatusCode
        : 500;

    return reply.status(statusCode).send({
      error: {
        code: statusCode === 404 ? "NOT_FOUND" : "INTERNAL_SERVER_ERROR",
        message:
          statusCode < 500
            ? (error.message ?? "An unexpected error occurred")
            : "An unexpected error occurred",
      },
    });
  });

  // Handle unknown routes (Fastify's 404 bypasses setErrorHandler)
  app.setNotFoundHandler((_request, reply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: 'Route not found',
      },
    })
  })
}

export default fp(errorHandlerPlugin)
